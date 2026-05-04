import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type FirebaseAuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

// Sync user to Supabase after Firebase auth
export const syncUserToSupabase = async (firebaseUser: FirebaseAuthUser) => {
  const { uid, email, displayName, photoURL } = firebaseUser;

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id, role, status, suspended_until')
    .eq('id', uid)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) return existing;

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: uid,
      email: email ?? '',
      display_name: displayName,
      photo_url: photoURL,
      role: 'user',
      status: 'active',
    })
    .select('id, role, status, suspended_until')
    .single();

  if (error) throw error;
  return data;
};

// Get user role from Supabase
export const getUserRole = async (uid: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('role, status, suspended_until')
    .eq('id', uid)
    .single();

  if (error) throw error;
  return data;
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
