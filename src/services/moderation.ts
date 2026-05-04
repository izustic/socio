import { supabase } from './supabase';

// Report a user or content
export const reportUser = async (reporterId: string, reportedId: string, reason: string) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error reporting user:', error);
    throw error;
  }
};

// Get all reports for moderators
export const getReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
};

// Suspend a user
export const suspendUser = async (userId: string, suspendedUntil: string, reason: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        suspended_until: suspendedUntil,
      })
      .eq('uid', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

// Ban a user permanently
export const banUser = async (userId: string, reason: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'banned',
        suspended_until: null,
      })
      .eq('uid', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};
