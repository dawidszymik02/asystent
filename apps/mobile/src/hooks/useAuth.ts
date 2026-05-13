import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, session, isLoading, signIn, signOut } = useAuthStore();
  return { user, session, isLoading, signIn, signOut };
};
