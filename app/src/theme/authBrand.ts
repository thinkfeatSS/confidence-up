import { ThemeColors } from './colors';

/** Full-screen hero gradient for splash & onboarding */
export function getAuthHeroGradient(isDark: boolean, colors: ThemeColors): string[] {
  if (isDark) {
    return [colors.bgPrimary, '#0D0A1A', colors.bgPrimary];
  }
  return ['#FAFBFF', '#EDE9FE', '#E0F2FE'];
}

/** Per-slide background (onboarding pager) */
export function getAuthSlideGradient(isDark: boolean, colors: ThemeColors): string[] {
  if (isDark) {
    return [colors.bgPrimary, '#0D0A1A'];
  }
  return ['#FAFBFF', '#EEF2FF'];
}

export type OnboardingSlideConfig = {
  emoji: string;
  title: string;
  body: string;
  gradient: [string, string];
};

export function getOnboardingSlides(isDark: boolean, colors: ThemeColors): OnboardingSlideConfig[] {
  if (isDark) {
    return [
      {
        emoji: '⚡',
        title: 'Level Up Your Confidence',
        body: 'Earn XP, unlock badges, and grow from a shy beginner to a confident champion through real-life challenges.',
        gradient: [colors.accentPurple, '#4C1D95'],
      },
      {
        emoji: '🎤',
        title: 'AI-Powered Speaking Coach',
        body: 'Practice speeches with your AI coach Atlas. Get instant feedback on clarity, pace, and tone.',
        gradient: ['#0891B2', colors.accentCyan],
      },
      {
        emoji: '🗺️',
        title: 'Face Your Fears Daily',
        body: 'Track your top fears — public speaking, interviews, and more. Complete small challenges to conquer them.',
        gradient: ['#D97706', colors.xpGold],
      },
    ];
  }

  return [
    {
      emoji: '⚡',
      title: 'Level Up Your Confidence',
      body: 'Earn XP, unlock badges, and grow from a shy beginner to a confident champion through real-life challenges.',
      gradient: ['#7C3AED', '#A78BFA'],
    },
    {
      emoji: '🎤',
      title: 'AI-Powered Speaking Coach',
      body: 'Practice speeches with your AI coach Atlas. Get instant feedback on clarity, pace, and tone.',
      gradient: ['#0891B2', '#22D3EE'],
    },
    {
      emoji: '🗺️',
      title: 'Face Your Fears Daily',
      body: 'Track your top fears — public speaking, interviews, and more. Complete small challenges to conquer them.',
      gradient: ['#D97706', '#FBBF24'],
    },
  ];
}
