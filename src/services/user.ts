import { supabase } from './supabase';
import { User } from '../types';

const mapUserToDbUpdates = (updates: Partial<User>): Record<string, unknown> => {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.name !== undefined) dbUpdates.display_name = updates.name;
  if (updates.age !== undefined) dbUpdates.age = updates.age;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
  if (updates.traits !== undefined) dbUpdates.traits = updates.traits;
  if (updates.media !== undefined) dbUpdates.media = updates.media;
  if (updates.education !== undefined) dbUpdates.education = updates.education;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.photoURL !== undefined) dbUpdates.photo_url = updates.photoURL;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled;
  if (updates.locationEnabled !== undefined) dbUpdates.location_enabled = updates.locationEnabled;
  if (updates.profileComplete !== undefined) dbUpdates.profile_complete = updates.profileComplete;

  return dbUpdates;
};

export const createUserProfile = async (
  userId: string,
  profileData: Omit<User, 'uid' | 'createdAt'>,
  email?: string | null,
) => {
  try {
    const dbUpdates = mapUserToDbUpdates(profileData);
    const payload = {
      id: userId,
      email: email ?? '',
      ...dbUpdates,
    };

    if (__DEV__) {
      console.log('Supabase users upsert payload:', payload);
    }

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    if (data) {
      return {
        uid: data.id,
        id: data.id,
        name: data.display_name ?? '',
        age: data.age ?? 0,
        gender: data.gender ?? 'Prefer not to say',
        interests: data.interests ?? [],
        traits: data.traits ?? [],
        media: data.media ?? [],
        education: data.education ?? '',
        location: data.location ?? undefined,
        photoURL: data.photo_url ?? '',
        bio: data.bio ?? '',
        notificationsEnabled: data.notifications_enabled ?? true,
        locationEnabled: data.location_enabled ?? true,
        profileComplete: data.profile_complete ?? false,
        createdAt: new Date(data.created_at),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const dbUpdates = mapUserToDbUpdates(updates);

    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const syncUserOnboarding = async (
  uid: string,
  draft: {
    name?: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
    education?: string;
    interests?: string[];
    traits?: string[];
    bio?: string;
  }
): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {
      display_name: draft.name,
      age: draft.age,
      gender: draft.gender,
      education: draft.education,
      interests: draft.interests,
      traits: draft.traits,
      bio: draft.bio,
      profile_complete: true,
    };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', uid);

    if (error) throw error;
  } catch (error) {
    console.error('Error syncing user onboarding:', error);
    throw error;
  }
};
