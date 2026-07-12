import { Message } from "../types";
import { translateActiveResource as tx } from "./TranslationService";

export interface MessageRow {
  id: string;
  circle_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  poll_id?: string | null;
  media_url: string | null;
  media_urls?: string[] | null;
  media_type?: "image" | "video" | "audio" | null;
  reply_to_message_id?: string | null;
  reply_to_sender_name?: string | null;
  reply_to_text?: string | null;
  reply_to_media_type?: "image" | "video" | "audio" | null;
  created_at: string;
}

export interface MessageReplyInput {
  messageId: string;
  senderName: string;
  text: string;
  mediaType?: "image" | "video" | "audio" | null;
}

export const inferMediaType = (
  mediaUrl: string | null | undefined,
): "image" | "video" | "audio" | null => {
  if (!mediaUrl) return null;
  const normalized = mediaUrl.toLowerCase();
  if (
    normalized.includes("/videos/") ||
    normalized.endsWith(".mp4") ||
    normalized.endsWith(".mov")
  ) {
    return "video";
  }
  if (
    normalized.includes("/audios/") ||
    normalized.endsWith(".m4a") ||
    normalized.endsWith(".mp3") ||
    normalized.endsWith(".aac")
  ) {
    return "audio";
  }
  if (
    normalized.includes("/images/") ||
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".webp")
  ) {
    return "image";
  }
  return null;
};

export const rowToMessage = (row: MessageRow): Message => ({
  id: row.id,
  circleId: row.circle_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  text: row.text,
  pollId: row.poll_id ?? null,
  mediaUrl: row.media_url,
  mediaUrls: row.media_urls?.length
    ? row.media_urls
    : row.media_url
      ? [row.media_url]
      : [],
  mediaType: row.media_type ?? inferMediaType(row.media_url),
  replyTo: row.reply_to_message_id
    ? {
        messageId: row.reply_to_message_id,
        senderName: row.reply_to_sender_name ?? tx("common.someone"),
        text: row.reply_to_text ?? "",
        mediaType: row.reply_to_media_type ?? null,
      }
    : null,
  timestamp: new Date(row.created_at),
});

export const getMessageNotificationBody = (
  senderName: string,
  text: string,
  mediaType?: "image" | "video" | "audio",
  pollId?: string,
) => {
  if (pollId || text.startsWith("__poll__:")) {
    return tx("messageNotification.poll", { senderName });
  }

  const trimmedText = text.trim();
  if (trimmedText) {
    return trimmedText.length > 82
      ? `${trimmedText.slice(0, 79)}...`
      : trimmedText;
  }

  if (mediaType === "audio") return tx("messageNotification.voice", { senderName });
  if (mediaType === "video") return tx("messageNotification.video", { senderName });
  if (mediaType === "image") return tx("messageNotification.photo", { senderName });

  return tx("messageNotification.message", { senderName });
};
