import type { RealtimeChannel } from "@supabase/supabase-js";
import { Message } from "../types";
import {
  getMessageNotificationBody,
  MessageReplyInput,
  MessageRow,
  rowToMessage,
} from "./messages.helpers";
import { createNotifications } from "./notifications";
import { LocalizationService } from "./LocalizationService";
import { supabase } from "./supabase";

const notifyCircleMembersOfMessage = async (
  circleId: string,
  senderId: string,
  senderName: string,
  message: Message,
) => {
  try {
    const { data: circle, error } = await supabase
      .from("circles")
      .select("name, members")
      .eq("id", circleId)
      .maybeSingle();

    if (error) throw error;

    const recipients = ((circle?.members as string[] | undefined) ?? [])
      .map((memberId) => String(memberId))
      .filter((memberId) => memberId !== senderId);

    const body = getMessageNotificationBody(
      senderName,
      message.text,
      message.mediaType ?? undefined,
      message.pollId ?? undefined,
    );

    await createNotifications(
      recipients,
      "message",
      LocalizationService.translate("en", "notification.message.title", { senderName }),
      LocalizationService.translate("en", "notification.message.body", { message: body }),
      {
        action: "open_chat",
        circleId,
        circleName: circle?.name,
        messageId: message.id,
        senderId,
        i18n: {
          titleKey: "notification.message.title",
          bodyKey: "notification.message.body",
          params: { senderName, message: body },
        },
      },
    );
  } catch (error) {
    console.error("Error creating message notifications:", error);
  }
};

export const sendMessage = async (
  circleId: string,
  senderId: string,
  senderName: string,
  text: string,
  mediaUrl?: string,
  mediaType?: "image" | "video" | "audio",
  mediaUrls?: string[],
  replyTo?: MessageReplyInput | null,
  pollId?: string,
): Promise<Message> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== senderId) {
      throw new Error("Not authenticated as message sender");
    }

    const messagePayload: Record<string, unknown> = {
      circle_id: circleId,
      sender_id: senderId,
      sender_name: senderName,
      text,
      media_url: mediaUrl ?? null,
      poll_id: pollId ?? null,
    };

    if (mediaType) {
      messagePayload.media_type = mediaType;
    }

    if (mediaUrls && mediaUrls.length > 0) {
      messagePayload.media_urls = mediaUrls;
    }

    if (replyTo) {
      messagePayload.reply_to_message_id = replyTo.messageId;
      messagePayload.reply_to_sender_name = replyTo.senderName;
      messagePayload.reply_to_text = replyTo.text;
      messagePayload.reply_to_media_type = replyTo.mediaType ?? null;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(messagePayload)
      .select("*")
      .single();

    if (error) throw error;

    const message = rowToMessage(data as MessageRow);
    await notifyCircleMembersOfMessage(circleId, senderId, senderName, message);

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getMessages = async (
  circleId: string,
  limit?: number,
): Promise<Message[]> => {
  try {
    let query = supabase
      .from("messages")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map((row) => rowToMessage(row as MessageRow)) ?? [];
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
};

export const subscribeToMessages = (
  circleId: string,
  callback: (payload: { new: MessageRow; eventType: string }) => void,
): RealtimeChannel => {
  const channel = supabase
    .channel(
      `messages:${circleId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `circle_id=eq.${circleId}`,
      },
      (payload) => {
        callback({
          new: payload.new as MessageRow,
          eventType: payload.eventType,
        });
      },
    )
    .subscribe();

  return channel;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};
