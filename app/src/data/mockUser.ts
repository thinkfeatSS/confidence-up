import { User } from '../types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Ismail',
  email: 'ismail@example.com',
  level: 8,
  levelTitle: 'Confident Speaker',
  xp: 1240,
  xpToNextLevel: 1500,
  totalXP: 9740,
  streak: 7,
  streakShields: 1,
  confidenceScore: 74,
  confidenceAreas: [
    { name: 'Speaking', score: 72 },
    { name: 'Social', score: 58 },
    { name: 'Academic', score: 81 },
    { name: 'Leadership', score: 45 },
  ],
  fears: ['fear-1', 'fear-2', 'fear-3'],
  totalSpeeches: 18,
  totalChallenges: 34,
  joinedAt: '2026-05-01',
};

export const getLevelThresholds = (): { level: number; title: string; xp: number }[] => [
  { level: 1, title: 'Nervous Beginner', xp: 0 },
  { level: 2, title: 'Nervous Beginner', xp: 100 },
  { level: 3, title: 'Nervous Beginner', xp: 250 },
  { level: 4, title: 'Quiet Speaker', xp: 450 },
  { level: 5, title: 'Quiet Speaker', xp: 700 },
  { level: 6, title: 'Quiet Speaker', xp: 1000 },
  { level: 7, title: 'Confident Speaker', xp: 1350 },
  { level: 8, title: 'Confident Speaker', xp: 1750 },
  { level: 9, title: 'Confident Speaker', xp: 2200 },
  { level: 10, title: 'Confident Speaker', xp: 2700 },
  { level: 15, title: 'Fluent Communicator', xp: 5000 },
  { level: 20, title: 'Fluent Communicator', xp: 8500 },
  { level: 25, title: 'Public Speaker', xp: 13000 },
  { level: 30, title: 'Public Speaker', xp: 18500 },
  { level: 40, title: 'Confidence Master', xp: 30000 },
  { level: 50, title: 'Confidence Master', xp: 45000 },
];

export const getLevelColor = (level: number): string => {
  if (level < 5) return '#CD7F32';
  if (level < 10) return '#94A3B8';
  if (level < 20) return '#F59E0B';
  if (level < 30) return '#06B6D4';
  return '#A855F7';
};
