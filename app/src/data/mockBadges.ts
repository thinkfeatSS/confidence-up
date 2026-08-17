import { Badge } from '../types';

export const mockBadges: Badge[] = [
  // ── BEGINNER ─────────────────────────────────────────────────────
  { id: 'b1', name: 'First Step', description: 'Complete your very first challenge', icon: '🌱', tier: 'beginner', earned: true, earnedAt: '2026-05-02' },
  { id: 'b2', name: 'First Speech', description: 'Record your first practice speech', icon: '🎤', tier: 'beginner', earned: true, earnedAt: '2026-05-03' },
  { id: 'b3', name: 'Streak Starter', description: 'Complete challenges 3 days in a row', icon: '🔥', tier: 'beginner', earned: true, earnedAt: '2026-05-05', isNew: false },
  { id: 'b4', name: 'Journal Keeper', description: 'Write your first journal entry', icon: '📔', tier: 'beginner', earned: true, earnedAt: '2026-05-04' },
  { id: 'b5', name: 'Fear Facer', description: 'Complete your first fear exposure level', icon: '😤', tier: 'beginner', earned: true, earnedAt: '2026-05-06' },
  { id: 'b6', name: 'Curious Mind', description: 'Chat with Atlas, your AI coach', icon: '🤖', tier: 'beginner', earned: false },

  // ── GROWTH ───────────────────────────────────────────────────────
  { id: 'g1', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚔️', tier: 'growth', earned: true, earnedAt: '2026-05-10', isNew: true },
  { id: 'g2', name: 'Speech Collector', description: 'Complete 10 speech sessions', icon: '📊', tier: 'growth', earned: false },
  { id: 'g3', name: 'Challenge Crusher', description: 'Complete 20 challenges', icon: '💪', tier: 'growth', earned: true, earnedAt: '2026-05-15' },
  { id: 'g4', name: 'Social Butterfly', description: 'Complete 5 social challenges', icon: '🦋', tier: 'growth', earned: false },
  { id: 'g5', name: 'Fear Climber', description: 'Reach Level 5 in any fear', icon: '🧗', tier: 'growth', earned: false },
  { id: 'g6', name: 'Score Riser', description: 'Reach a confidence score of 70+', icon: '📈', tier: 'growth', earned: true, earnedAt: '2026-05-18' },
  { id: 'g7', name: 'Knowledge Sharer', description: 'Complete 3 academic challenges', icon: '🎓', tier: 'growth', earned: false },
  { id: 'g8', name: 'Reflector', description: 'Write 7 journal entries', icon: '🌟', tier: 'growth', earned: false },

  // ── ADVANCED ─────────────────────────────────────────────────────
  { id: 'a1', name: 'No Filler Master', description: 'Complete a speech with 0 filler words', icon: '🏆', tier: 'advanced', earned: false },
  { id: 'a2', name: '30-Day Streak', description: 'Maintain a streak for 30 consecutive days', icon: '🌋', tier: 'advanced', earned: false },
  { id: 'a3', name: 'Fear Conqueror', description: 'Complete all 10 levels of any fear', icon: '🦁', tier: 'advanced', earned: false },
  { id: 'a4', name: 'Skill Unlocked', description: 'Unlock your first skill tree node', icon: '🌳', tier: 'advanced', earned: false },
  { id: 'a5', name: 'Confidence Booster', description: 'Reach a confidence score of 90+', icon: '🚀', tier: 'advanced', earned: false },
  { id: 'a6', name: 'Top Communicator', description: 'Complete 50 challenges total', icon: '👑', tier: 'advanced', earned: false },
  { id: 'a7', name: 'Speech Ace', description: 'Score 90+ on 3 consecutive speeches', icon: '🎯', tier: 'advanced', earned: false },

  // ── SPECIAL ──────────────────────────────────────────────────────
  { id: 'sp1', name: 'Level 10 Reached', description: 'Reach Level 10 in the confidence RPG', icon: '💎', tier: 'special', earned: false },
  { id: 'sp2', name: 'Consistent Champion', description: 'Complete challenges every day for 7 weeks', icon: '✨', tier: 'special', earned: false },
  { id: 'sp3', name: 'AI Partner', description: 'Have 20 coaching sessions with Atlas', icon: '🌐', tier: 'special', earned: false },
  { id: 'sp4', name: 'Transformation', description: 'Improve your confidence score by 30+ points', icon: '🦅', tier: 'special', earned: false },
];
