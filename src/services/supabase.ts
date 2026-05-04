import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sync user to Supabase after Firebase auth
export const syncUserToSupabase = async (firebaseUser: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || '',
        photo_url: firebaseUser.photoURL || '',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    throw error;
  }
};

// Get user role from Supabase
export const getUserRole = async (uid: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, status, suspended_until')
      .eq('uid', uid)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

// Upload avatar to Supabase Storage
export const uploadAvatar = async (userId: string, imageUri: string) => {
  try {
    // TODO: Implement avatar upload logic
    // This will be implemented in Phase 2
    throw new Error('Avatar upload not implemented yet');
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Upload chat media to Supabase Storage
export const uploadChatMedia = async (
  circleId: string,
  messageId: string,
  mediaUri: string,
  type: 'image' | 'video' | 'audio'
) => {
  try {
    // TODO: Implement chat media upload logic
    // This will be implemented in Phase 6
    throw new Error('Chat media upload not implemented yet');
  } catch (error) {
    console.error('Error uploading chat media:', error);
    throw error;
  }
};
