/**
 * @format
 */
import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Background & quit-state FCM (data-only messages; notification payload handled by OS)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Notifications] Background message:', remoteMessage?.notification?.title);
});

AppRegistry.registerComponent(appName, () => App);