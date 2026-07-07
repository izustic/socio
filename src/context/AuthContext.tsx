import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, getDefaultUserRole, getUserRole, syncUserToSupabase } from '../services/supabase';
import { getUserProfile } from '../services/user';
import { getLatestCircleForParticipant } from '../services/circle';
import { refreshSubscriptionStatus, withStaffSocioPlusAccess } from '../services/billing';
import {
  checkCurrentAuthUserExists,
  clearLocalAuthSession,
  getFreshAuthUser,
} from '../services/auth';
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
  staleAuthSessionCleared: boolean;
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
  const [staleAuthSessionCleared, setStaleAuthSessionCleared] = useState(false);
  const effectiveProfile = useMemo(
    () => withStaffSocioPlusAccess(profile, role),
    [profile, role],
  );

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    try {
      await refreshSubscriptionStatus();
    } catch (error) {
      console.warn('Could not refresh subscription status:', error);
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
    // Bumped on every auth event so async work (getUserProfile,
    // getLatestCircleForParticipant, syncUserToSupabase) can detect that
    // a newer event has fired and bail out before clobbering the cleared
    // sign-out state with stale data from the previous user.
    let authGeneration = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const generation = ++authGeneration;
      let supabaseUser = session?.user ?? null;

      if (supabaseUser) {
        const authUserExists = await checkCurrentAuthUserExists();
        if (generation !== authGeneration) return;

        if (!authUserExists) {
          await clearLocalAuthSession();
          if (generation !== authGeneration) return;
          setStaleAuthSessionCleared(true);
          supabaseUser = null;
        }
      }

      if (supabaseUser) {
        const freshUser = await getFreshAuthUser();
        if (generation !== authGeneration) return;

        if (!freshUser || freshUser.id !== supabaseUser.id) {
          await clearLocalAuthSession();
          if (generation !== authGeneration) return;
          setStaleAuthSessionCleared(true);
          supabaseUser = null;
        } else {
          setStaleAuthSessionCleared(false);
          supabaseUser = freshUser;
        }
      }

      setUser(supabaseUser);

      if (supabaseUser) {
        // Get profile from Supabase
        const userProfile = await getUserProfile(supabaseUser.id);
        if (generation !== authGeneration) return;
        setProfile(userProfile);
        const latestCircle = await getLatestCircleForParticipant(supabaseUser.id);
        if (generation !== authGeneration) return;
        console.log('Logged in app user data:', { profile: userProfile, latestCircle });

        // Sync to Supabase and get role
        try {
          const userRole = await syncUserToSupabase(
            supabaseUser.id,
            supabaseUser.email,
            supabaseUser.user_metadata?.display_name ?? supabaseUser.email?.split('@')[0],
            supabaseUser.user_metadata?.avatar_url ?? null
          );
          if (generation !== authGeneration) return;
          setRole(userRole);
          try {
            await refreshSubscriptionStatus();
            if (generation !== authGeneration) return;
            const refreshedProfile = await getUserProfile(supabaseUser.id);
            if (generation !== authGeneration) return;
            setProfile(refreshedProfile);
          } catch (subscriptionError) {
            if (generation !== authGeneration) return;
            console.warn('Could not refresh subscription status:', subscriptionError);
          }
        } catch (error) {
          if (generation !== authGeneration) return;
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

      if (generation === authGeneration) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: effectiveProfile,
        role,
        loading,
        staleAuthSessionCleared,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
