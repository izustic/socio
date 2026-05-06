import { supabase } from './supabase';
import { Circle, Interest } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CreateCircleInput {
  name: string;
  creatorId: string;
  size: number;
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
  meetupGoal?: string;
}

interface CircleFilters {
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
}

interface CircleRow {
  id: string;
  name: string;
  creator_id: string;
  size: number;
  members: string[];
  pending_swipes: Record<string, string[]>;
  filters: CircleFilters;
  meetup_goal: string;
  status: 'forming' | 'complete';
  created_at: string;
}

const rowToCircle = (row: CircleRow): Circle => ({
  id: row.id,
  name: row.name,
  creatorId: row.creator_id,
  size: row.size,
  members: row.members,
  pendingSwipes: row.pending_swipes,
  filters: row.filters,
  status: row.status,
  createdAt: new Date(row.created_at),
});

export const createCircle = async (input: CreateCircleInput): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('circles')
      .insert({
        name: input.name,
        creator_id: input.creatorId,
        size: input.size,
        members: [input.creatorId],
        pending_swipes: {},
        filters: {
          age_range: input.ageRange,
          education_level: input.educationLevel,
          location_radius: input.locationRadius,
          interests: input.interests,
          vibe: input.vibe || '',
        },
        meetup_goal: input.meetupGoal || '',
        status: 'forming',
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log('Circle created:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating circle:', error);
    throw error;
  }
};

export const getCircle = async (circleId: string): Promise<Circle | null> => {
  try {
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .eq('id', circleId)
      .maybeSingle();

    if (error) throw error;
    if (data) return rowToCircle(data as CircleRow);
    return null;
  } catch (error) {
    console.error('Error getting circle:', error);
    return null;
  }
};

export const updateCircle = async (circleId: string, updates: Partial<Circle>): Promise<void> => {
  try {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.size !== undefined) dbUpdates.size = updates.size;
    if (updates.members !== undefined) dbUpdates.members = updates.members;
    if (updates.pendingSwipes !== undefined) dbUpdates.pending_swipes = updates.pendingSwipes;
    if (updates.filters !== undefined) {
      dbUpdates.filters = {
        age_range: updates.filters.ageRange,
        education_level: updates.filters.educationLevel,
        location_radius: updates.filters.locationRadius,
        interests: updates.filters.interests,
        vibe: updates.filters.vibe || '',
      };
    }
    if (updates.meetupGoal !== undefined) dbUpdates.meetup_goal = updates.meetupGoal;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await supabase
      .from('circles')
      .update(dbUpdates)
      .eq('id', circleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating circle:', error);
    throw error;
  }
};

export const addMember = async (circleId: string, userId: string): Promise<void> => {
  try {
    // First get current members
    const { data: circle, error: fetchError } = await supabase
      .from('circles')
      .select('members, size')
      .eq('id', circleId)
      .single();

    if (fetchError) throw fetchError;

    // Check if already a member
    if (circle.members.includes(userId)) {
      console.log('User already a member');
      return;
    }

    // Check if circle is full
    if (circle.members.length >= circle.size) {
      throw new Error('Circle is full');
    }

    // Add member
    const newMembers = [...circle.members, userId];
    const { error } = await supabase
      .from('circles')
      .update({ members: newMembers })
      .eq('id', circleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

export const removeMember = async (circleId: string, userId: string): Promise<void> => {
  try {
    const { data: circle, error: fetchError } = await supabase
      .from('circles')
      .select('members')
      .eq('id', circleId)
      .single();

    if (fetchError) throw fetchError;

    const newMembers = circle.members.filter((id: string) => id !== userId);

    const { error } = await supabase
      .from('circles')
      .update({ members: newMembers })
      .eq('id', circleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

export const addPendingJoiner = async (circleId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('circle_pending')
      .insert({
        circle_id: circleId,
        user_id: userId,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding pending joiner:', error);
    throw error;
  }
};

export const getPendingJoiners = async (circleId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('circle_pending')
      .select('user_id')
      .eq('circle_id', circleId);

    if (error) throw error;
    return data?.map((row) => row.user_id) ?? [];
  } catch (error) {
    console.error('Error getting pending joiners:', error);
    return [];
  }
};

export const removePendingJoiner = async (circleId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('circle_pending')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing pending joiner:', error);
    throw error;
  }
};

export const getCirclesForJoiner = async (filters: {
  ageRange?: [number, number];
  educationLevel?: string;
  interests?: Interest[];
}): Promise<Circle[]> => {
  try {
    let query = supabase
      .from('circles')
      .select('*')
      .eq('status', 'forming');

    if (filters.ageRange) {
      query = query.gte('age_range', filters.ageRange[0]).lte('age_range', filters.ageRange[1]);
    }

    if (filters.educationLevel) {
      query = query.eq('education_level', filters.educationLevel);
    }

    if (filters.interests && filters.interests.length > 0) {
      query = query.contains('interests', filters.interests);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map((row) => rowToCircle(row as CircleRow)) ?? [];
  } catch (error) {
    console.error('Error getting circles for joiner:', error);
    return [];
  }
};

export const getCirclesForUser = async (userId: string): Promise<Circle[]> => {
  try {
    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .contains('members', [userId]);

    if (error) throw error;
    return data?.map((row) => rowToCircle(row as CircleRow)) ?? [];
  } catch (error) {
    console.error('Error getting circles for user:', error);
    return [];
  }
};

export const subscribeToCircle = (
  circleId: string,
  callback: (payload: unknown) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`circle:${circleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'circles',
        filter: `id=eq.${circleId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'circle_members',
        filter: `circle_id=eq.${circleId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};