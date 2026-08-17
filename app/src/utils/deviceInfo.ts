import { Platform } from 'react-native';

const APP_VERSION = '1.0.0';

export function getDeviceInfo() {
  return {
    platform: (Platform.OS === 'ios' ? 'IOS' : 'ANDROID') as 'IOS' | 'ANDROID',
    deviceName: `${Platform.OS} ${String(Platform.Version)}`,
    appVersion: APP_VERSION,
  };
}
