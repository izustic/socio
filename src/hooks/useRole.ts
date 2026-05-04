import { useState, useEffect } from 'react';
import { getUserRole } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';

interface UserRole {
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  suspended_until?: string;
}

export function useRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isUser = userRole?.role === 'user';
  const isModerator = userRole?.role === 'moderator';
  const isAdmin = userRole?.role === 'admin';
  const isBanned = userRole?.status === 'banned';
  const isSuspended = userRole?.status === 'suspended';
  const isActive = userRole?.status === 'active';

  return {
    role: userRole,
    loading,
    isUser,
    isModerator,
    isAdmin,
    isBanned,
    isSuspended,
    isActive,
  };
}
