/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

const { InteractionManager } = require('react-native');
InteractionManager.createInteractionHandle = jest.fn(() => 1);
InteractionManager.clearInteractionHandle = jest.fn();
InteractionManager.runAfterInteractions = jest.fn((cb: any) => {
  if (typeof cb === 'function') cb();
  return { cancel: jest.fn() };
});

jest.mock('react-native-config', () => ({}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => () => {}),
}));

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const View = require('react-native').View;
  return ({ children, ...props }: any) => React.createElement(View, props, children);
});

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    onMessage: jest.fn(() => () => {}),
    onTokenRefresh: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
  });
  messaging.AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
    NOT_DETERMINED: -1,
  };
  return messaging;
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ data: { idToken: 'mock-google-id-token' } })),
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Text = require('react-native').Text;
  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (c: any) => c,
    },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: any) => fn(),
    withTiming: (toValue: any) => toValue,
    withSpring: (toValue: any) => toValue,
    withSequence: (...args: any[]) => args[0],
    withDelay: (_d: any, val: any) => val,
    withRepeat: (val: any) => val,
    runOnJS: (fn: any) => fn,
    Easing: {
      bezier: () => () => {},
      out: (fn: any) => fn,
      in: (fn: any) => fn,
      inOut: (fn: any) => fn,
      ease: () => {},
      back: () => () => {},
      linear: () => {},
    },
    View,
    Text,
    createAnimatedComponent: (c: any) => c,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { width: 320, height: 640, x: 0, y: 0 };
  const InsetsContext = React.createContext(inset);
  const FrameContext = React.createContext(frame);
  return {
    SafeAreaInsetsContext: InsetsContext,
    SafeAreaFrameContext: FrameContext,
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: InsetsContext.Consumer,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { frame, insets: inset },
  };
});

jest.mock('react-native-screens', () => {
  const RealComponent = require('react-native').View;
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    ScreenContainer: RealComponent,
    Screen: RealComponent,
    NativeScreen: RealComponent,
    NativeScreenContainer: RealComponent,
  };
});

jest.mock('@dev-amirzubair/react-native-voice', () => ({
  onSpeechStart: jest.fn(),
  onSpeechRecognized: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechPartialResults: jest.fn(),
  onSpeechVolumeChanged: jest.fn(),
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  cancel: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(() => Promise.resolve()),
  removeAllListeners: jest.fn(),
  isAvailable: jest.fn(() => Promise.resolve(1)),
}));
