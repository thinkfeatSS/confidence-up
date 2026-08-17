export type ConfidenceComponents = {
  speechFluencyScore: number;
  topicRelevanceScore: number;
  vocabularyScore: number;
  structureScore: number;
  energyScore: number;
  practiceConsistencyScore: number;
};

export type TopicCoverage = {
  percent: number;
  missing: string[];
};

export type WebSpeechSession = {
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
  fillerBreakdown?: Record<string, number>;
  feedback: string[];
  xpEarned: number;
  languageDetected?: string;
  sentenceCount?: number;
  wordCount?: number;
  vocabularyRichness?: number;
  repetitionScore?: number;
  averageVolume?: number;
  pauseFrequency?: number;
  durationSeconds?: number;
  components?: ConfidenceComponents;
  localMetrics?: Record<string, unknown>;
  aiInsights?: Record<string, unknown>;
  suggestions?: string[];
  exercises?: string[];
  strengths?: string[];
  weaknesses?: string[];
  coachMessage?: string;
  topicCoverage?: TopicCoverage;
  depthScore?: number;
  emotionalTone?: string;
  analysisProvider?: string;
  miniMission?: string;
};

export type GrowthMetricPoint = { date: string; value: number };

export type GrowthMetrics = {
  confidence: {
    best: number;
    average: number;
    growthPercent: number;
    trend: GrowthMetricPoint[];
  };
  vocabulary: {
    uniqueWordsNow: number;
    uniqueWordsBaseline: number;
    growthPercent: number;
  };
  wpm: {
    current: number;
    baseline: number;
    changePercent: number;
  };
  fillers: {
    current: number;
    baseline: number;
    reductionPercent: number;
  };
  pauses: {
    current: number;
    baseline: number;
    reductionPercent: number;
  };
  components: {
    fluency: GrowthMetricPoint[];
    structure: GrowthMetricPoint[];
    energy: GrowthMetricPoint[];
    vocabulary: GrowthMetricPoint[];
  };
  consistency: {
    streakDays: number;
    sessionsLast7Days: number;
    sessionsLast30Days: number;
  };
};

function percentChange(current: number, baseline: number) {
  if (!baseline) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function mapSpeechSessionFromApi(
  s: Record<string, unknown>,
  prompt = '',
): WebSpeechSession {
  const aiInsights = (s.aiInsights ?? {}) as Record<string, unknown>;
  const analysisMeta = (s.analysisMeta ?? {}) as Record<string, unknown>;
  const fillerCount = (s.fillerCount as number) ?? 0;
  const paceWPM = (s.speechSpeedWpm as number) ?? (s.paceWPM as number) ?? 0;

  return {
    id: s.id as string,
    date:
      typeof s.createdAt === 'string'
        ? s.createdAt.split('T')[0]
        : (s.date as string) ?? new Date().toISOString().split('T')[0],
    prompt: (s.topic as string) ?? prompt,
    overallScore: (s.overallConfidenceScore as number) ?? (s.overallScore as number) ?? 0,
    clarityScore: (s.fluencyScore as number) ?? (s.clarityScore as number) ?? 0,
    fillerCount,
    paceWPM,
    toneScore: (s.topicRelevanceScore as number) ?? (s.toneScore as number) ?? 0,
    transcript: (s.transcript as string) ?? '',
    fillerWords: (s.fillerWords as string[]) ?? Object.keys((s.fillerBreakdown as object) ?? {}),
    fillerBreakdown: s.fillerBreakdown as Record<string, number> | undefined,
    feedback: (s.coachingFeedback as string[]) ?? (s.feedback as string[]) ?? [],
    xpEarned: (s.xpEarned as number) ?? 0,
    languageDetected: s.languageDetected as string | undefined,
    sentenceCount: (s.sentenceCount as number) ?? 0,
    wordCount: (s.wordCount as number) ?? 0,
    vocabularyRichness: (s.vocabularyRichness as number) ?? 0,
    repetitionScore: (s.repetitionScore as number) ?? 0,
    averageVolume: (s.averageVolume as number) ?? 0,
    pauseFrequency: (s.pauseFrequency as number) ?? 0,
    durationSeconds: (s.durationSeconds as number) ?? 0,
    components: (s.confidenceComponents ?? s.components) as ConfidenceComponents | undefined,
    localMetrics: s.localMetrics as Record<string, unknown> | undefined,
    aiInsights: s.aiInsights as Record<string, unknown> | undefined,
    suggestions: (s.personalizedSuggestions as string[]) ?? [],
    exercises: (aiInsights.personalizedExercises as string[]) ?? [],
    strengths: (aiInsights.strengths as string[]) ?? [],
    weaknesses: (aiInsights.weaknesses as string[]) ?? [],
    coachMessage: aiInsights.coachMessage as string | undefined,
    topicCoverage: aiInsights.topicCoverage as TopicCoverage | undefined,
    depthScore: aiInsights.depthScore as number | undefined,
    emotionalTone: aiInsights.emotionalTone as string | undefined,
    analysisProvider: analysisMeta.provider as string | undefined,
    miniMission: s.miniMission as string | undefined,
  };
}

export function computeGrowthMetrics(
  sessions: WebSpeechSession[],
  streakDays = 0,
): GrowthMetrics {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const baseline = sorted.slice(0, 7);
  const scores = sorted.map((session) => session.overallScore);

  const buildTrend = (pick: (session: WebSpeechSession) => number) =>
    sorted.slice(-14).map((session) => ({
      date: session.date,
      value: pick(session),
    }));

  const currentVocab = average(recent.map((s) => s.vocabularyRichness ?? 0));
  const baselineVocab = average(baseline.map((s) => s.vocabularyRichness ?? 0));
  const currentWpm = average(recent.map((s) => s.paceWPM));
  const baselineWpm = average(baseline.map((s) => s.paceWPM));
  const currentFillers = average(recent.map((s) => s.fillerCount));
  const baselineFillers = average(baseline.map((s) => s.fillerCount));
  const currentPauses = average(recent.map((s) => s.pauseFrequency ?? 0));
  const baselinePauses = average(baseline.map((s) => s.pauseFrequency ?? 0));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sessionsLast30Days = sorted.filter(
    (session) => new Date(session.date) >= thirtyDaysAgo,
  ).length;

  return {
    confidence: {
      best: scores.length ? Math.max(...scores) : 0,
      average: average(scores),
      growthPercent: percentChange(
        average(recent.map((s) => s.overallScore)),
        average(baseline.map((s) => s.overallScore)),
      ),
      trend: buildTrend((s) => s.overallScore),
    },
    vocabulary: {
      uniqueWordsNow: Math.round(currentVocab),
      uniqueWordsBaseline: Math.round(baselineVocab),
      growthPercent: percentChange(currentVocab, baselineVocab),
    },
    wpm: {
      current: Math.round(currentWpm),
      baseline: Math.round(baselineWpm),
      changePercent: percentChange(currentWpm, baselineWpm),
    },
    fillers: {
      current: Math.round(currentFillers),
      baseline: Math.round(baselineFillers),
      reductionPercent: baselineFillers
        ? Math.round(((baselineFillers - currentFillers) / baselineFillers) * 100)
        : 0,
    },
    pauses: {
      current: currentPauses,
      baseline: baselinePauses,
      reductionPercent: baselinePauses
        ? Math.round(((baselinePauses - currentPauses) / baselinePauses) * 100)
        : 0,
    },
    components: {
      fluency: buildTrend((s) => s.components?.speechFluencyScore ?? s.clarityScore),
      structure: buildTrend((s) => s.components?.structureScore ?? 0),
      energy: buildTrend((s) => s.components?.energyScore ?? 0),
      vocabulary: buildTrend((s) => s.components?.vocabularyScore ?? 0),
    },
    consistency: {
      streakDays,
      sessionsLast7Days: recent.length,
      sessionsLast30Days,
    },
  };
}

export function mapGrowthMetricsFromApi(raw: unknown): GrowthMetrics | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const g = raw as Record<string, unknown>;
  if (!g.confidence) return undefined;
  return g as GrowthMetrics;
}
