export const APP_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.speakupmic',
  website: 'https://speakupmic.binaryunit.tech',
  privacyPolicy: 'https://speakupmic.binaryunit.tech/privacy',
  termsOfService: 'https://speakupmic.binaryunit.tech/terms',
  deleteAccount: 'https://speakupmic.binaryunit.tech/delete-account',
  contactSupport: 'https://speakupmic.binaryunit.tech/contact',
  joinUrl: (code: string) => `https://speakupmic.binaryunit.tech/join?ref=${code}`,
  shareMessage: (code: string) =>
    `Join me on SpeakUpMic and build your speaking confidence! Use my invite link: https://speakupmic.binaryunit.tech/join?ref=${code}`,
};

export const LEGAL_VERSION = 'June 25, 2026';
