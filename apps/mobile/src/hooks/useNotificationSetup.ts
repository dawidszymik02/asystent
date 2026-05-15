import { useEffect } from 'react';
import { useNotifications } from './useNotifications';

export const useNotificationSetup = () => {
  const { requestPermissions } = useNotifications();
  useEffect(() => {
    requestPermissions();
  }, []);
};
