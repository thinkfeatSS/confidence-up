export type LanguageCode = 'en' | 'ur' | 'hi' | 'sd' | 'mixed' | 'unknown';

export type LanguageDetectionSource = 'local' | 'history' | 'ollama' | 'ai' | 'gemini' | 'manual';

export interface LanguageDetectionResult {
  label: string;
  code: LanguageCode;
  languages: string[];
  confidence: number;
  source: LanguageDetectionSource;
  scriptRatios: Record<string, number>;
  aiNeeded?: boolean;
  geminiNeeded?: boolean;
  romanUrduScore?: number;
  languageStability?: Record<string, number>;
  languageTimeline?: LanguageTimelineSegment[];
}

export interface LanguageTimelineSegment {
  text: string;
  startMs: number;
  endMs: number;
  label: string;
  code: LanguageCode;
}

export interface UtteranceSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export interface AudioSample {
  timestampMs: number;
  volume: number;
}

export interface PauseBreakdown {
  natural: number;
  thinking: number;
  lost: number;
}

export interface AudioMetrics {
  averageVolume: number;
  pauseCount: number;
  pauseFrequency: number;
  activeSpeakingSeconds: number;
  speechSpeedWpm: number;
  volumeStabilityScore: number;
  pauseBreakdown: PauseBreakdown;
  energyScore: number;
  rhythmScore: number;
  pauseRatio: number;
}

export interface NlpMetrics {
  wordCount: number;
  sentenceCount: number;
  vocabularyRichness: number;
  repetitionScore: number;
  fillerCount: number;
  fillerWords: string[];
  fillerBreakdown: Record<string, number>;
  fillerDensityPercent?: number;
  pronunciationScore?: number;
  articulationScore?: number;
  unclearWords?: Array<{ word: string; confidence: number; startMs?: number }>;
  speakingLengthSeconds: number;
  vocabularyScore: number;
  avgSentenceLength: number;
  transitionCount: number;
  organizationScore: number;
  questionCount: number;
  hedgingCount: number;
  hedgingScore: number;
  positiveCount: number;
  negativeCount: number;
  mindsetScore: number;
  repeatedPhrases: string[];
}

export interface TopicCoverage {
  percent: number;
  missing: string[];
}

export interface AiSpeechAnalysis {
  topicRelevanceScore: number;
  coachingFeedback: string[];
  personalizedSuggestions: string[];
  personalizedExercises: string[];
  miniMission: string;
  strengths: string[];
  weaknesses: string[];
  coachMessage: string;
  topicCoverage?: TopicCoverage;
  depthScore?: number;
  codeSwitchingQuality?: number;
  emotionalTone?: string;
  languageFallback?: Partial<LanguageDetectionResult>;
  analysisMeta?: Record<string, unknown>;
}

export interface ConfidenceComponents {
  speechFluencyScore: number;
  topicRelevanceScore: number;
  vocabularyScore: number;
  structureScore: number;
  energyScore: number;
  practiceConsistencyScore: number;
  pronunciationScore?: number;
}

export interface LocalMetricsSnapshot {
  nlp: Partial<NlpMetrics>;
  audio: Partial<AudioMetrics>;
  language: Partial<LanguageDetectionResult>;
}

export interface AiInsightsSnapshot {
  strengths: string[];
  weaknesses: string[];
  coachMessage: string;
  topicCoverage?: TopicCoverage;
  depthScore?: number;
  codeSwitchingQuality?: number;
  emotionalTone?: string;
  personalizedExercises: string[];
}

export interface SpeechAnalysisResult {
  transcript: string;
  topic: string;
  durationSeconds: number;
  language: LanguageDetectionResult;
  nlp: NlpMetrics;
  audio: AudioMetrics;
  ai: AiSpeechAnalysis;
  components: ConfidenceComponents;
  confidenceScore: number;
  xpEarned: number;
  missionId?: string;
  challengeId?: string;
}

export interface SpeechAnalysisInput {
  transcript: string;
  topic: string;
  durationSeconds: number;
  audioSamples: AudioSample[];
  utteranceSegments?: UtteranceSegment[];
  preferredLanguages?: string[];
  recentLanguages?: string[];
  sessionsLast7Days?: number;
  currentStreak?: number;
  previousScore?: number;
  missionId?: string;
  challengeId?: string;
}

export interface LiveSpeechMetrics {
  wpm: number;
  averageVolume: number;
  languageLabel: string;
}

export interface GrowthMetricPoint {
  date: string;
  value: number;
}

export interface GrowthMetrics {
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
}
