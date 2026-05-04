import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { getDefaultUserRole, getUserRole, syncUserToSupabase } from '../services/supabase';
import { getUserProfile } from '../services/user';
import { User } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [role, setRole] = useState<AuthContextType['role']>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setRole(null);
      return;
    }

    const userProfile = await getUserProfile(auth.currentUser.uid);
    setProfile(userProfile);
    
    // Also refresh role from Supabase
    try {
      const userRole = await getUserRole(auth.currentUser.uid);
      setRole(userRole ?? getDefaultUserRole());
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(getDefaultUserRole());
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Get Firestore profile
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
        
        // Sync to Supabase and get role
        try {
          const userRole = await syncUserToSupabase(firebaseUser);
          setRole(userRole);
        } catch (error) {
          if (isSupabaseRlsError(error)) {
            console.warn(
              'Supabase users insert is blocked by RLS. Apply the ARCHITECTURE.md users INSERT policy to persist roles.'
            );
          } else {
            console.error('Error syncing user to Supabase:', error);
          }
          // Do not block regular users if the role row cannot be created yet.
          setRole(getDefaultUserRole());
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
