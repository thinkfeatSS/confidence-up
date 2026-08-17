import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { NotificationsService } from '../../services/notifications';

/** Registers FCM, syncs token with API, and wires push handlers after login. */
export const PushNotificationBootstrap = () => {
  const { isAuthenticated } = useAuth();
  const { data: settings } = useUserSettings();

  useEffect(() => {
    if (!isAuthenticated) return;

    const remindersEnabled = settings?.dailyReminders !== false;
    if (remindersEnabled) {
      NotificationsService.syncDeviceWithServer().catch(() => {});
    }

    const unsubForeground = NotificationsService.setupForegroundHandler();
    const unsubToken = NotificationsService.setupTokenRefreshHandler();
    const unsubOpen = NotificationsService.setupNotificationOpenHandlers();

    return () => {
      unsubForeground();
      unsubToken();
      unsubOpen();
    };
  }, [isAuthenticated, settings?.dailyReminders]);

  return null;
};
