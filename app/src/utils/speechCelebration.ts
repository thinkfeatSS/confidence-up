import { Badge } from '../types';
import { normalizeTier } from './apiHelpers';

export type SpeechCelebration =
  | { kind: 'xp'; amount: number }
  | { kind: 'levelUp'; level: number; title: string }
  | { kind: 'badge'; badge: Badge }
  | { kind: 'highlight'; title: string; message: string; icon: string };

export interface SpeechGamificationPayload {
  newXp?: number;
  newLevel?: number;
  leveledUp?: boolean;
  levelTitle?: string;
  newBadges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
  }>;
}

function mapApiBadge(b: NonNullable<SpeechGamificationPayload['newBadges']>[number]): Badge {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    tier: normalizeTier(b.tier),
    earned: true,
    earnedAt: new Date().toISOString(),
    isNew: true,
  };
}

/** Build ordered post-session celebrations (XP → level-up → badges → optional highlight). */
export function buildSpeechCelebrations(
  xpEarned: number,
  gamification: SpeechGamificationPayload | undefined,
  options: { previousScore?: number; currentScore?: number },
): SpeechCelebration[] {
  const queue: SpeechCelebration[] = [{ kind: 'xp', amount: xpEarned }];

  if (gamification?.leveledUp && gamification.newLevel) {
    queue.push({
      kind: 'levelUp',
      level: gamification.newLevel,
      title: gamification.levelTitle ?? `Level ${gamification.newLevel}`,
    });
  }

  for (const badge of gamification?.newBadges ?? []) {
    queue.push({ kind: 'badge', badge: mapApiBadge(badge) });
  }

  const hasUnlock =
    (gamification?.newBadges?.length ?? 0) > 0 || Boolean(gamification?.leveledUp);

  if (!hasUnlock && options.currentScore != null) {
    const prev = options.previousScore;
    const score = options.currentScore;

    if (prev != null && score > prev) {
      queue.push({
        kind: 'highlight',
        icon: '📈',
        title: 'Score improved!',
        message: `You went from ${prev} to ${score}. Nice progress — keep building momentum.`,
      });
    } else if (score >= 90) {
      queue.push({
        kind: 'highlight',
        icon: '🌟',
        title: 'Excellent delivery!',
        message: `You scored ${score}/100. Your confidence is really showing.`,
      });
    }
  }

  return queue;
}

export function highlightToBadge(highlight: Extract<SpeechCelebration, { kind: 'highlight' }>): Badge {
  return {
    id: `highlight-${Date.now()}`,
    name: highlight.title,
    description: highlight.message,
    icon: highlight.icon,
    tier: 'beginner',
    earned: true,
  };
}
