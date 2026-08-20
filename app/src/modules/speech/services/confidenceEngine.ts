import {
  AudioMetrics,
  ConfidenceComponents,
  NlpMetrics,
  SpeechAnalysisResult,
} from '../types/speechAnalysis.types';
import { calculateStructureScore } from '../intelligence/nlpIntelligence';
import { calculateFluencyScore } from './audioAnalysisService';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function calculatePracticeConsistency(args: {
  currentStreak?: number;
  sessionsLast7Days?: number;
  previousScore?: number;
  currentScoreEstimate?: number;
}) {
  const streakScore = clamp((args.currentStreak ?? 0) * 12, 0, 45);
  const frequencyScore = clamp((args.sessionsLast7Days ?? 0) * 12, 0, 40);
  const improvementScore =
    args.previousScore === undefined || args.currentScoreEstimate === undefined
      ? 10
      : clamp((args.currentScoreEstimate - args.previousScore) * 2 + 10, 0, 15);
  return Math.round(clamp(streakScore + frequencyScore + improvementScore));
}

export function calculateConfidenceComponents(args: {
  nlp: NlpMetrics;
  audio: AudioMetrics;
  topicRelevanceScore: number;
  currentStreak?: number;
  sessionsLast7Days?: number;
  previousScore?: number;
}): ConfidenceComponents {
  const speechFluencyScore = calculateFluencyScore({
    speechSpeedWpm: args.audio.speechSpeedWpm,
    pauseFrequency: args.audio.pauseFrequency,
    averageVolume: args.audio.averageVolume,
    volumeStabilityScore: args.audio.volumeStabilityScore,
    repetitionScore: args.nlp.repetitionScore,
  });
  const structureScore = calculateStructureScore(args.nlp);
  const energyScore = args.audio.energyScore;
  const pronunciationScore = Math.round(clamp(args.nlp.pronunciationScore ?? 85));

  const currentScoreEstimate = Math.round(
    (speechFluencyScore +
      args.topicRelevanceScore +
      pronunciationScore +
      args.nlp.vocabularyScore +
      structureScore +
      energyScore) /
      6,
  );

  return {
    speechFluencyScore,
    topicRelevanceScore: Math.round(clamp(args.topicRelevanceScore)),
    vocabularyScore: Math.round(clamp(args.nlp.vocabularyScore)),
    structureScore,
    energyScore,
    pronunciationScore,
    practiceConsistencyScore: calculatePracticeConsistency({
      currentStreak: args.currentStreak,
      sessionsLast7Days: args.sessionsLast7Days,
      previousScore: args.previousScore,
      currentScoreEstimate,
    }),
  };
}

export function calculateConfidenceScore(components: ConfidenceComponents) {
  const pronScore = components.pronunciationScore ?? 85;
  return Math.round(
    0.25 * components.speechFluencyScore +
      0.20 * components.topicRelevanceScore +
      0.15 * pronScore +
      0.15 * components.vocabularyScore +
      0.15 * components.structureScore +
      0.10 * components.practiceConsistencyScore,
  );
}

export function xpForConfidence(score: number) {
  return score >= 80 ? 70 : score >= 65 ? 50 : score >= 50 ? 30 : 15;
}

export function buildMiniMission(result: Pick<SpeechAnalysisResult, 'nlp' | 'audio' | 'components'>) {
  if (result.nlp.fillerCount > 2) {
    return `Practice replacing filler words (${result.nlp.fillerWords.slice(0, 2).join(', ')}) with 1-second silent pauses.`;
  }
  if ((result.components.pronunciationScore ?? 85) < 75) {
    return 'Enunciate consonants and word endings crisply to improve articulation clarity.';
  }
  if (result.audio.pauseBreakdown.lost > 0) {
    return 'Add shorter pauses when thinking — avoid long silences over 3 seconds.';
  }
  if (result.components.structureScore < 60) {
    return 'Use two transition words (e.g. firstly, because) to structure your answer.';
  }
  if (result.audio.speechSpeedWpm > 180) {
    return 'Slow down by about 15 WPM and add one silent pause.';
  }
  if (result.components.topicRelevanceScore < 60) {
    return 'Mention two specific details from the prompt in your next attempt.';
  }
  if (result.components.vocabularyScore < 60) {
    return 'Use three more specific words in your next attempt.';
  }
  return 'Try again and make your opening sentence more direct.';
}
