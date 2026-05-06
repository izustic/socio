import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AppNotification {
  id: string;
  userId: string;
  type: 'circle_invite' | 'circle_accepted' | 'circle_complete' | 'message' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

const rowToNotification = (row: NotificationRow): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as AppNotification['type'],
  title: row.title,
  body: row.body,
  data: row.data ?? undefined,
  read: row.read,
  createdAt: row.created_at,
});

export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data?.map((row) => rowToNotification(row as NotificationRow)) ?? [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const createNotification = async (
  userId: string,
  type: AppNotification['type'],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> => {
  try {
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data: data ?? null,
        read: false,
      })
      .select('id')
      .single();

    if (error) throw error;

    return result.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (payload: { new: NotificationRow; eventType: string }) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          new: payload.new as NotificationRow,
          eventType: payload.eventType,
        });
      }
    )
    .subscribe();

  return channel;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};