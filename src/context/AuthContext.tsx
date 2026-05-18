import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getDefaultUserRole, getUserRole, syncUserToSupabase } from '../services/supabase';
import { getUserProfile } from '../services/user';
import { getLatestCircleForParticipant } from '../services/circle';
import { User } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  role: {
    role: 'user' | 'moderator' | 'admin';
    status: 'active' | 'suspended' | 'banned';
    suspended_until?: string | null;
  } | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const isSupabaseRlsError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === '42501';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [role, setRole] = useState<AuthContextType['role']>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    const userProfile = await getUserProfile(user.id);
    setProfile(userProfile);

    try {
      const userRole = await getUserRole(user.id);
      setRole(userRole ?? getDefaultUserRole());
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(getDefaultUserRole());
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = session?.user ?? null;
      setUser(supabaseUser);

      if (supabaseUser) {
        // Get profile from Supabase
        const userProfile = await getUserProfile(supabaseUser.id);
        setProfile(userProfile);
        const latestCircle = await getLatestCircleForParticipant(supabaseUser.id);
        console.log('Logged in app user data:', { profile: userProfile, latestCircle });

        // Sync to Supabase and get role
        try {
          const userRole = await syncUserToSupabase(
            supabaseUser.id,
            supabaseUser.email,
            supabaseUser.user_metadata?.display_name ?? supabaseUser.email?.split('@')[0],
            supabaseUser.user_metadata?.avatar_url ?? null
          );
          setRole(userRole);
        } catch (error) {
          if (isSupabaseRlsError(error)) {
            console.warn(
              'Supabase users insert is blocked by RLS. Apply the ARCHITECTURE.md users INSERT policy to persist roles.'
            );
          } else {
            console.error('Error syncing user to Supabase:', error);
          }
          setRole(getDefaultUserRole());
        }
      } else {
        setProfile(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
