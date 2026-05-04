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

export type SupabaseUserRole = {
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  suspended_until?: string | null;
};

const DEFAULT_USER_ROLE: SupabaseUserRole = {
  role: 'user',
  status: 'active',
  suspended_until: null,
};

// Sync user to Supabase after Firebase auth
export const syncUserToSupabase = async (
  firebaseUser: FirebaseAuthUser
): Promise<SupabaseUserRole & { id: string }> => {
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
export const getUserRole = async (uid: string): Promise<SupabaseUserRole | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('role, status, suspended_until')
    .eq('id', uid)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getDefaultUserRole = () => DEFAULT_USER_ROLE;

const MAX_STORAGE_SIZES = {
  avatar: 5 * 1024 * 1024,
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
};

const fetchStorageBlob = async (uri: string) => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('We could not read that file. Please try another one.');
  }
  return response.blob();
};

// Upload avatar to Supabase Storage
export const uploadAvatar = async (userId: string, imageUri: string): Promise<string> => {
  const blob = await fetchStorageBlob(imageUri);

  if (blob.size > MAX_STORAGE_SIZES.avatar) {
    throw new Error('Please choose an image under 5 MB.');
  }

  const filePath = `${userId}/profile.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(filePath, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
};

// Upload chat media to Supabase Storage
export const uploadChatMedia = async (
  circleId: string,
  messageId: string,
  mediaUri: string,
  type: 'image' | 'video' | 'audio'
): Promise<string> => {
  const blob = await fetchStorageBlob(mediaUri);

  if (blob.size > MAX_STORAGE_SIZES[type]) {
    throw new Error(`${type} file is too large.`);
  }

  const extension = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'm4a';
  const contentType = type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/m4a';
  const folder = type === 'image' ? 'images' : `${type}s`;
  const filePath = `${circleId}/${folder}/${messageId}.${extension}`;

  const { error } = await supabase.storage.from('chat-media').upload(filePath, blob, {
    contentType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
  return data.publicUrl;
};
