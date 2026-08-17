import Config from 'react-native-config';

/** Live Hostinger API — override in `.env.development` for local backend */
export const DEFAULT_API_BASE_URL =
  'https://pink-nightingale-973118.hostingersite.com/api/v1';

export const API_BASE_URL =
  Config.API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
