import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useTheme } from '../../theme/ThemeContext';
import { NotificationsService } from '../../services/notifications';

/** Sync server settings once per login — avoids fighting Profile toggles on every refetch */
export const UserSettingsSync = () => {
  const { isAuthenticated } = useAuth();
  const { data: settings } = useUserSettings();
  const { setDarkMode } = useTheme();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !settings || syncedRef.current) return;
    syncedRef.current = true;
    setDarkMode(settings.darkMode);
    if (settings.dailyReminders) {
      NotificationsService.requestPermission()
        .then(granted => (granted ? NotificationsService.syncDeviceWithServer() : null))
        .catch(() => {});
    }
  }, [isAuthenticated, settings, setDarkMode]);

  return null;
};
