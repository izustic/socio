import { supabase } from './supabase';
import { Message } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface MessageRow {
  id: string;
  circle_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  media_url: string | null;
  media_urls?: string[] | null;
  media_type?: 'image' | 'video' | null;
  reply_to_message_id?: string | null;
  reply_to_sender_name?: string | null;
  reply_to_text?: string | null;
  reply_to_media_type?: 'image' | 'video' | null;
  created_at: string;
}

export interface MessageReplyInput {
  messageId: string;
  senderName: string;
  text: string;
  mediaType?: 'image' | 'video' | null;
}

const inferMediaType = (mediaUrl: string | null | undefined): 'image' | 'video' | null => {
  if (!mediaUrl) return null;
  const normalized = mediaUrl.toLowerCase();
  if (normalized.includes('/videos/') || normalized.endsWith('.mp4') || normalized.endsWith('.mov')) {
    return 'video';
  }
  if (normalized.includes('/images/') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg') || normalized.endsWith('.png') || normalized.endsWith('.webp')) {
    return 'image';
  }
  return null;
};

const rowToMessage = (row: MessageRow): Message => ({
  id: row.id,
  circleId: row.circle_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  text: row.text,
  mediaUrl: row.media_url,
  mediaUrls: row.media_urls?.length ? row.media_urls : row.media_url ? [row.media_url] : [],
  mediaType: row.media_type ?? inferMediaType(row.media_url),
  replyTo: row.reply_to_message_id
    ? {
        messageId: row.reply_to_message_id,
        senderName: row.reply_to_sender_name ?? 'Someone',
        text: row.reply_to_text ?? '',
        mediaType: row.reply_to_media_type ?? null,
      }
    : null,
  timestamp: new Date(row.created_at),
});

export const sendMessage = async (
  circleId: string,
  senderId: string,
  senderName: string,
  text: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  mediaUrls?: string[],
  replyTo?: MessageReplyInput | null
): Promise<Message> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== senderId) {
      throw new Error('Not authenticated as message sender');
    }

    const messagePayload: Record<string, unknown> = {
      circle_id: circleId,
      sender_id: senderId,
      sender_name: senderName,
      text,
      media_url: mediaUrl ?? null,
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
      .from('messages')
      .insert(messagePayload)
      .select('*')
      .single();

    if (error) throw error;

    return rowToMessage(data as MessageRow);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (circleId: string, limit?: number): Promise<Message[]> => {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map((row) => rowToMessage(row as MessageRow)) ?? [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const subscribeToMessages = (
  circleId: string,
  callback: (payload: { new: MessageRow; eventType: string }) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`messages:${circleId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `circle_id=eq.${circleId}`,
      },
      (payload) => {
        callback({
          new: payload.new as MessageRow,
          eventType: payload.eventType,
        });
      }
    )
    .subscribe();

  return channel;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};
