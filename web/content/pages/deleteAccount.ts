export type DeletionStep = {
  step: number;
  title: string;
  description: string;
};

export const deleteAccountContent = {
  title: 'Request Account & Data Deletion',
  subtitle:
    'Instructions and options to delete your SpeakUpMic account and all associated personal data.',
  lastUpdated: 'June 25, 2026',
  appTitle: 'SpeakUpMic',
  company: 'ThinkFeat',
  supportEmail: 'info@thinkfeat.com',
  retentionPeriod: '30 days',
  inAppSteps: [
    {
      step: 1,
      title: 'Open SpeakUpMic App',
      description: 'Launch the SpeakUpMic app on your Android or iOS device.',
    },
    {
      step: 2,
      title: 'Navigate to Profile',
      description: 'Tap the Profile tab in the bottom navigation bar.',
    },
    {
      step: 3,
      title: 'Select Delete Account & Data',
      description: 'Scroll to the bottom of the Profile page and tap "Delete Account & Data" or "Delete Account".',
    },
    {
      step: 4,
      title: 'Confirm Deletion',
      description: 'Confirm the prompt. Your account will be immediately signed out and scheduled for permanent deletion.',
    },
  ],
  deletedData: [
    'Profile & authentication records (name, email address, password hash, avatar).',
    'Speech practice recordings, transcripts, AI evaluation scores, and filler word metrics.',
    'Journal entries, mood logs, and reflections.',
    'Gamification history (XP, levels, badges, streaks, challenge completions).',
    'Device notification tokens and user settings.',
  ],
  retainedData: [
    'Aggregated, fully anonymized analytical telemetry that cannot be linked back to your identity.',
    'Transactional records required for compliance, legal, security, or accounting obligations (retained only as long as required by law).',
  ],
};
