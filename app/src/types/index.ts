// ─── User ─────────────────────────────────────────────────────────────────────

export type ConfidenceArea = { name: string; score: number };

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  streak: number;
  streakShields: number;
  confidenceScore: number;
  confidenceAreas: ConfidenceArea[];
  preferredLanguages?: string[];
  fears: string[];
  totalSpeeches: number;
  totalChallenges: number;
  joinedAt: string;
}

// ─── Challenges / Missions ────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Category = 'speaking' | 'social' | 'academic' | 'sports' | 'creative';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  whyItHelps: string;
  category: Category;
  difficulty: Difficulty;
  xpReward: number;
  tips: string[];
  completed: boolean;
  completedAt?: string;
}

export interface Mission extends Challenge {
  prompt: string;
  isDaily: boolean;
  date: string;
}

// ─── Fear Exposure ────────────────────────────────────────────────────────────

export interface FearLevel {
  id?: string;
  level: number;
  title: string;
  description: string;
  tips: string[];
  xpReward: number;
  completed: boolean;
}

export interface Fear {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentLevel: number;
  levels: FearLevel[];
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeTier = 'beginner' | 'growth' | 'advanced' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  earnedAt?: string;
  isNew?: boolean;
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood: MoodLevel;
  date: string;
  linkedChallengeId?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface DailyScore {
  date: string;
  score: number;
}

export interface SpeechSession {
  id: string;
  date: string;
  prompt: string;
  overallScore: number;
  clarityScore: number;
  fillerCount: number;
  paceWPM: number;
  toneScore: number;
  transcript: string;
  fillerWords: string[];
  feedback: string[];
  xpEarned: number;
  languageDetected?: string;
  sentenceCount?: number;
  wordCount?: number;
  vocabularyRichness?: number;
  repetitionScore?: number;
  averageVolume?: number;
  pauseFrequency?: number;
  components?: {
    speechFluencyScore: number;
    topicRelevanceScore: number;
    vocabularyScore: number;
    structureScore: number;
    energyScore: number;
    practiceConsistencyScore: number;
  };
  localMetrics?: Record<string, unknown>;
  aiInsights?: Record<string, unknown>;
  fillerBreakdown?: Record<string, number>;
  suggestions?: string[];
  exercises?: string[];
  strengths?: string[];
  weaknesses?: string[];
  coachMessage?: string;
  topicCoverage?: { percent: number; missing: string[] };
  depthScore?: number;
  emotionalTone?: string;
  analysisProvider?: string;
  miniMission?: string;
  missionId?: string;
  challengeId?: string;
}

export interface UserProgress {
  confidenceHistory: DailyScore[];
  speechSessions: SpeechSession[];
  growthMetrics?: import('../modules/speech/types/speechAnalysis.types').GrowthMetrics;
  totalXP: number;
  weeklyXP: number;
  bestStreak: number;
  totalSpeeches: number;
  totalChallenges: number;
  averageScore: number;
}

// ─── Skill Tree ───────────────────────────────────────────────────────────────

export type SkillBranch = 'speaking' | 'confidence' | 'communication';

export interface SkillNode {
  id: string;
  title: string;
  description: string;
  branch: SkillBranch;
  nodeLevel: number;
  unlocked: boolean;
  available: boolean;
  canUnlock?: boolean;
  blockReason?: string | null;
  requirement: string;
  requirementProgress: number;
  requirementTotal: number;
  x: number;
  y: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RecordingState = 'idle' | 'recording' | 'processing' | 'results';
