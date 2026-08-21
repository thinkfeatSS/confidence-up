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
  const wordCount = Math.max(
    built.wordCount ?? built.transcript.trim().split(/\s+/).filter(Boolean).length,
    1,
  );
  const sentenceCount = built.sentenceCount ?? Math.max(built.transcript.split(/[.!?]+/).filter(Boolean).length, 1);
  const fillerCount = Number.isFinite(built.fillerCount) ? Math.max(0, built.fillerCount) : 0;
  const overallConfidenceScore = Math.max(0, Math.min(100, Math.round(Number(built.overallScore) || 70)));
  const clarityScore = Math.max(0, Math.min(100, Math.round(Number(built.clarityScore) || 70)));
  const toneScore = Math.max(0, Math.min(100, Math.round(Number(built.toneScore) || 70)));
  const paceWPM = Math.max(0, Math.round(Number(built.paceWPM) || 0));
  const averageVolume = Math.max(0, Math.min(100, Math.round(Number(built.averageVolume) || 70)));
  const pauseFrequency = Math.max(0, Math.round((Number(built.pauseFrequency) || 0) * 100) / 100);
  const vocabularyRichness = Math.max(0, Math.min(100, Math.round(Number(built.vocabularyRichness) || Math.min(100, 40 + wordCount * 3))));
  const repetitionScore = Math.max(0, Math.min(100, Math.round(Number(built.repetitionScore) || 0)));
  const xpEarned = Math.max(0, Math.round(Number(built.xpEarned) || 50));
  const duration = Math.max(1, Math.round(Number(durationSeconds) || 1));

  const feedbackArray = Array.isArray(built.feedback)
    ? built.feedback.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
    : [];

  const suggestionsArray = Array.isArray(built.suggestions)
    ? built.suggestions.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];

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
    transcript: built.transcript || 'Practice speech',
    topic: built.prompt || 'Speaking Practice',
    languageDetected: built.languageDetected || 'English',
    wordCount,
    sentenceCount,
    fillerCount,
    vocabularyRichness,
    repetitionScore,
    averageVolume,
    pauseFrequency,
    speechSpeedWpm: paceWPM,
    fluencyScore: clarityScore,
    topicRelevanceScore: toneScore,
    overallConfidenceScore,
    durationSeconds: duration,
    xpEarned,
    confidenceComponents: built.components,
    localMetrics: built.localMetrics,
    aiInsights,
    fillerBreakdown: built.fillerBreakdown,
    coachingFeedback: feedbackArray,
    personalizedSuggestions: suggestionsArray,
    miniMission: built.miniMission,
    languageMix: built.languageDetected
      ? { label: built.languageDetected, source: 'client' }
      : undefined,
    analysisMeta: {
      source: 'client-speech-intelligence',
      provider: built.analysisProvider ?? 'client-local',
    },
    missionId: built.missionId,
    challengeId: built.challengeId,
  };
}

export function mapSpeechSessionFromApi(s: Record<string, any>, prompt = ''): SpeechSession {
  const fillerCount = Number(s.fillerCount ?? 0);
  const paceWPM = Math.round(Number(s.speechSpeedWpm ?? s.paceWPM ?? 0));
  const overallScore = Math.round(Number(s.overallConfidenceScore ?? s.overallScore ?? 70));
  const clarityScore = Math.round(Number(s.fluencyScore ?? s.clarityScore ?? 70));
  const toneScore = Math.round(Number(s.topicRelevanceScore ?? s.toneScore ?? 70));
  const transcript = String(s.transcript ?? '');
  const aiInsights = (s.aiInsights ?? {}) as Record<string, unknown>;
  const analysisMeta = (s.analysisMeta ?? {}) as Record<string, unknown>;

  const rawDate = s.createdAt ?? s.date ?? new Date().toISOString();
  const dateStr = typeof rawDate === 'string' ? rawDate : new Date(rawDate).toISOString();

  let feedback: string[] = [];
  if (Array.isArray(s.coachingFeedback)) {
    feedback = s.coachingFeedback.map(String);
  } else if (Array.isArray(s.feedback)) {
    feedback = s.feedback.map(String);
  } else if (s.coachingFeedback && typeof s.coachingFeedback === 'object') {
    const cf = s.coachingFeedback as Record<string, any>;
    feedback = [
      ...(Array.isArray(cf.strengths) ? cf.strengths.map(String) : []),
      ...(Array.isArray(cf.improvements) ? cf.improvements.map(String) : []),
    ];
  }
  if (!feedback.length) {
    feedback = generateFeedback([], fillerCount, paceWPM);
  }

  return {
    id: s.id ?? `speech-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: dateStr,
    prompt: s.topic ?? prompt ?? 'Speaking Practice Session',
    overallScore,
    clarityScore,
    fillerCount,
    paceWPM,
    toneScore,
    transcript,
    fillerWords: s.fillerWords ?? Object.keys(s.fillerBreakdown ?? {}),
    feedback,
    xpEarned: Math.round(Number(s.xpEarned ?? 50)),
    languageDetected: s.languageDetected,
    sentenceCount: Number(s.sentenceCount ?? 0),
    wordCount: Number(s.wordCount ?? 0),
    vocabularyRichness: Number(s.vocabularyRichness ?? 0),
    repetitionScore: Number(s.repetitionScore ?? 0),
    averageVolume: Number(s.averageVolume ?? 0),
    pauseFrequency: Number(s.pauseFrequency ?? 0),
    components: s.confidenceComponents ?? s.components,
    localMetrics: s.localMetrics,
    aiInsights: s.aiInsights,
    fillerBreakdown: s.fillerBreakdown,
    suggestions: Array.isArray(s.personalizedSuggestions) ? s.personalizedSuggestions.map(String) : [],
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
