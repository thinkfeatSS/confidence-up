import { unwrapApiData } from '../services/api';
import { Difficulty, Category, BadgeTier, SpeechSession } from '../types';
import { generateFeedback } from './speechAnalysis';

/** Extract list from API payloads: array | { data: [] } | { items: [] } */
export function unwrapList<T>(payload: unknown): T[] {
  const data = unwrapApiData<unknown>(payload);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

export function normalizeDifficulty(value: unknown): Difficulty {
  const d = String(value ?? 'easy').toLowerCase();
  if (d === 'medium' || d === 'hard') return d;
  return 'easy';
}

export function toApiDifficulty(value: Difficulty | 'all'): string | undefined {
  if (value === 'all') return undefined;
  return value.toUpperCase();
}

export function normalizeCategory(value: unknown): Category {
  const c = String(value ?? 'social').toLowerCase();
  const allowed: Category[] = ['speaking', 'social', 'academic', 'sports', 'creative'];
  return (allowed.includes(c as Category) ? c : 'social') as Category;
}

export function normalizeTier(value: unknown): BadgeTier {
  const t = String(value ?? 'beginner').toLowerCase();
  const allowed: BadgeTier[] = ['beginner', 'growth', 'advanced', 'special'];
  return (allowed.includes(t as BadgeTier) ? t : 'beginner') as BadgeTier;
}

export function parseTips(tips: unknown): string[] {
  if (Array.isArray(tips)) return tips.map(String);
  if (typeof tips === 'string') {
    try {
      const parsed = JSON.parse(tips);
      return Array.isArray(parsed) ? parsed.map(String) : [tips];
    } catch {
      return [tips];
    }
  }
  return [];
}

export function toSpeechSessionDto(
  built: SpeechSession,
  durationSeconds: number,
): Record<string, number | string | string[] | object | undefined> {
  const wordCount = built.wordCount ?? Math.max(built.transcript.trim().split(/\s+/).filter(Boolean).length, 1);
  const aiInsights = built.aiInsights ?? {
    strengths: built.strengths ?? [],
    weaknesses: built.weaknesses ?? [],
    coachMessage: built.coachMessage,
    topicCoverage: built.topicCoverage,
    depthScore: built.depthScore,
    emotionalTone: built.emotionalTone,
    personalizedExercises: built.exercises ?? [],
  };

  return {
    transcript: built.transcript,
    topic: built.prompt,
    languageDetected: built.languageDetected,
    wordCount,
    sentenceCount: built.sentenceCount ?? 0,
    fillerCount: built.fillerCount,
    vocabularyRichness: built.vocabularyRichness ?? Math.min(100, 40 + wordCount * 3),
    repetitionScore: built.repetitionScore ?? 0,
    averageVolume: built.averageVolume ?? 70,
    pauseFrequency: built.pauseFrequency ?? 0,
    speechSpeedWpm: built.paceWPM,
    fluencyScore: built.clarityScore,
    topicRelevanceScore: built.toneScore,
    overallConfidenceScore: built.overallScore,
    durationSeconds,
    xpEarned: built.xpEarned,
    confidenceComponents: built.components,
    localMetrics: built.localMetrics,
    aiInsights,
    fillerBreakdown: built.fillerBreakdown,
    coachingFeedback: built.feedback,
    personalizedSuggestions: built.suggestions ?? [],
    miniMission: built.miniMission,
    languageMix: built.languageDetected
      ? { label: built.languageDetected, source: 'client' }
      : undefined,
    analysisMeta: {
      source: 'client-speech-intelligence',
      provider: built.analysisProvider,
    },
    missionId: built.missionId,
    challengeId: built.challengeId,
  };
}

export function mapSpeechSessionFromApi(s: Record<string, any>, prompt = ''): SpeechSession {
  const fillerCount = s.fillerCount ?? 0;
  const paceWPM = s.speechSpeedWpm ?? s.paceWPM ?? 0;
  const overallScore = s.overallConfidenceScore ?? s.overallScore ?? 0;
  const clarityScore = s.fluencyScore ?? s.clarityScore ?? 0;
  const toneScore = s.topicRelevanceScore ?? s.toneScore ?? 0;
  const transcript = s.transcript ?? '';
  const aiInsights = (s.aiInsights ?? {}) as Record<string, unknown>;
  const analysisMeta = (s.analysisMeta ?? {}) as Record<string, unknown>;

  return {
    id: s.id,
    date: s.createdAt?.split?.('T')?.[0] ?? s.date ?? new Date().toISOString().split('T')[0],
    prompt: s.topic ?? prompt,
    overallScore,
    clarityScore,
    fillerCount,
    paceWPM,
    toneScore,
    transcript,
    fillerWords: s.fillerWords ?? Object.keys(s.fillerBreakdown ?? {}),
    feedback: s.coachingFeedback ?? s.feedback ?? generateFeedback([], fillerCount, paceWPM),
    xpEarned: s.xpEarned ?? 0,
    languageDetected: s.languageDetected,
    sentenceCount: s.sentenceCount ?? 0,
    wordCount: s.wordCount ?? 0,
    vocabularyRichness: s.vocabularyRichness ?? 0,
    repetitionScore: s.repetitionScore ?? 0,
    averageVolume: s.averageVolume ?? 0,
    pauseFrequency: s.pauseFrequency ?? 0,
    components: s.confidenceComponents ?? s.components,
    localMetrics: s.localMetrics,
    aiInsights: s.aiInsights,
    fillerBreakdown: s.fillerBreakdown,
    suggestions: s.personalizedSuggestions ?? [],
    exercises: (aiInsights.personalizedExercises as string[]) ?? [],
    strengths: (aiInsights.strengths as string[]) ?? [],
    weaknesses: (aiInsights.weaknesses as string[]) ?? [],
    coachMessage: aiInsights.coachMessage as string | undefined,
    topicCoverage: aiInsights.topicCoverage as SpeechSession['topicCoverage'],
    depthScore: aiInsights.depthScore as number | undefined,
    emotionalTone: aiInsights.emotionalTone as string | undefined,
    analysisProvider: analysisMeta.provider as string | undefined,
    miniMission: s.miniMission,
    missionId: s.missionId,
    challengeId: s.challengeId,
  };
}
