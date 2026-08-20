export const APP_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.speakupmic',
  joinUrl: (code: string) => `https://speakupmic.vercel.app/join?ref=${code}`,
  shareMessage: (code: string) =>
    `Join me on SpeakUpMic and build your speaking confidence! Use my invite link: https://speakupmic.vercel.app/join?ref=${code}`,
};

export const LEGAL_VERSION = 'June 25, 2026';
