import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { apiClient } from './api';
import { getDeviceInfo } from '../utils/deviceInfo';

const ANDROID_CHANNEL_ID = 'confidenceup_reminders';

async function requestAndroidPostNotifications(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function isAuthorized(status: FirebaseMessagingTypes.AuthorizationStatus): boolean {
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export const NotificationsService = {
  async getFcmToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token || null;
    } catch (err) {
      console.warn('[Notifications] Failed to get FCM token', err);
      return null;
    }
  },

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const androidGranted = await requestAndroidPostNotifications();
        if (!androidGranted) return false;
      }

      const status = await messaging().requestPermission();
      return isAuthorized(status);
    } catch (err) {
      console.warn('[Notifications] Permission request failed', err);
      return false;
    }
  },

  /** Send FCM token to API (requires auth header). */
  async syncDeviceWithServer(tokenOverride?: string): Promise<string | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) return null;

      const fcmToken = tokenOverride ?? (await this.getFcmToken());
      if (!fcmToken || fcmToken === 'placeholder-fcm-token') return null;

      await apiClient.post('/users/me/device', {
        deviceToken: fcmToken,
        ...getDeviceInfo(),
      });

      return fcmToken;
    } catch (err) {
      console.warn('[Notifications] Failed to register device token', err);
      return null;
    }
  },

  /** Payload for login / Google auth (optional — sync also runs after session). */
  async getAuthDevicePayload(): Promise<{
    deviceToken?: string;
    deviceName?: string;
    platform?: 'IOS' | 'ANDROID';
    appVersion?: string;
  }> {
    const granted = await this.requestPermission();
    if (!granted) return getDeviceInfo();

    const fcmToken = await this.getFcmToken();
    return {
      ...getDeviceInfo(),
      ...(fcmToken ? { deviceToken: fcmToken } : {}),
    };
  },

  setupForegroundHandler(
    onMessage?: (message: FirebaseMessagingTypes.RemoteMessage) => void,
  ): () => void {
    return messaging().onMessage(async remoteMessage => {
      if (onMessage) {
        onMessage(remoteMessage);
        return;
      }
      if (remoteMessage.notification?.title) {
        Alert.alert(
          remoteMessage.notification.title,
          remoteMessage.notification.body ?? '',
          [{ text: 'OK' }],
        );
      }
    });
  },

  setupTokenRefreshHandler(): () => void {
    return messaging().onTokenRefresh(token => {
      this.syncDeviceWithServer(token).catch(() => {});
    });
  },

  setupNotificationOpenHandlers(): () => void {
    const unsubOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[Notifications] Opened from background:', remoteMessage?.notification?.title);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[Notifications] Opened from quit:', remoteMessage.notification?.title);
        }
      })
      .catch(() => {});

    return unsubOpened;
  },

  getDefaultChannelId(): string {
    return ANDROID_CHANNEL_ID;
  },
};
