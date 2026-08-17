declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
