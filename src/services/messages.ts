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
  media_type: 'image' | 'video' | null;
  created_at: string;
}

const rowToMessage = (row: MessageRow): Message => ({
  id: row.id,
  circleId: row.circle_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  text: row.text,
  mediaUrl: row.media_url,
  mediaType: row.media_type,
  timestamp: new Date(row.created_at),
});

export const sendMessage = async (
  circleId: string,
  senderId: string,
  senderName: string,
  text: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video'
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        circle_id: circleId,
        sender_id: senderId,
        sender_name: senderName,
        text,
        media_url: mediaUrl ?? null,
        media_type: mediaType ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log('Message sent:', data.id);
    return data.id;
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
