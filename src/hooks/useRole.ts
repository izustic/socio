import { useAuth } from '@/src/context/AuthContext';

export function useRole() {
  const { role: userRole, loading } = useAuth();

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
