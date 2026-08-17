import { NlpMetrics } from '../types/speechAnalysis.types';
import { HEDGING_WORDS } from './dictionaries/hedging';
import { NEGATIVE_WORDS, POSITIVE_WORDS } from './dictionaries/mindset';
import { TRANSITION_WORDS } from './dictionaries/transitions';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const REPEATED_PHRASE_SEEDS = [
  'i think',
  'basically',
  'you know',
  'like',
  'so',
  'actually',
  'literally',
  'kind of',
  'sort of',
];

function countPhraseMatches(transcript: string, phrases: string[]) {
  const lower = transcript.toLowerCase();
  return phrases.reduce((sum, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\s)${escaped}(?=\\s|$|[,.!?])`, 'gi');
    return sum + (lower.match(pattern)?.length ?? 0);
  }, 0);
}

function detectRepeatedPhrases(transcript: string): string[] {
  const lower = transcript.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  const phraseCounts = new Map<string, number>();

  for (let size = 2; size <= 3; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const phrase = tokens.slice(index, index + size).join(' ');
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
    }
  }

  const flagged: string[] = [];
  for (const [phrase, count] of phraseCounts.entries()) {
    if (count < 2) continue;
    const isSeed = REPEATED_PHRASE_SEEDS.some(seed => phrase.includes(seed) || seed.includes(phrase));
    const isHedging = HEDGING_WORDS.some(word => phrase.includes(word));
    if (isSeed || isHedging) flagged.push(`${phrase} (×${count})`);
  }

  return flagged.slice(0, 8);
}

function sentenceLengthScore(avgSentenceLength: number) {
  if (avgSentenceLength <= 0) return 50;
  if (avgSentenceLength >= 8 && avgSentenceLength <= 20) return 90;
  if (avgSentenceLength >= 4 && avgSentenceLength <= 25) return 75;
  return 55;
}

export function enrichNlpMetrics(base: NlpMetrics, transcript: string): NlpMetrics {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      ...base,
      fillerBreakdown: {},
      avgSentenceLength: 0,
      transitionCount: 0,
      organizationScore: 0,
      questionCount: 0,
      hedgingCount: 0,
      hedgingScore: 0,
      positiveCount: 0,
      negativeCount: 0,
      mindsetScore: 0,
      repeatedPhrases: [],
    };
  }

  const transitionCount = countPhraseMatches(trimmed, TRANSITION_WORDS);
  const hedgingCount = countPhraseMatches(trimmed, HEDGING_WORDS);
  const positiveCount = countPhraseMatches(trimmed, POSITIVE_WORDS);
  const negativeCount = countPhraseMatches(trimmed, NEGATIVE_WORDS);
  const questionCount = (trimmed.match(/[?؟]/gu) ?? []).length;
  const avgSentenceLength =
    base.sentenceCount > 0 ? Math.round((base.wordCount / base.sentenceCount) * 10) / 10 : base.wordCount;

  const organizationScore = Math.round(
    clamp(Math.min(100, transitionCount * 12 + (questionCount > 0 ? 8 : 0) + 40)),
  );
  const hedgingScore = Math.round(clamp(100 - hedgingCount * 10));
  const mindsetScore = Math.round(
    clamp(50 + (positiveCount - negativeCount) * 8 + (positiveCount > 0 ? 10 : 0)),
  );
  const structureBandScore = sentenceLengthScore(avgSentenceLength);

  return {
    ...base,
    fillerBreakdown: {},
    fillerCount: 0,
    fillerWords: [],
    avgSentenceLength,
    transitionCount,
    organizationScore: Math.round(organizationScore * 0.6 + structureBandScore * 0.4),
    questionCount,
    hedgingCount,
    hedgingScore,
    positiveCount,
    negativeCount,
    mindsetScore,
    repeatedPhrases: detectRepeatedPhrases(trimmed),
  };
}

export function calculateStructureScore(nlp: NlpMetrics) {
  const lengthBand = sentenceLengthScore(nlp.avgSentenceLength);
  return Math.round(
    clamp(
      nlp.organizationScore * 0.4 +
        lengthBand * 0.25 +
        nlp.hedgingScore * 0.2 +
        nlp.repetitionScore * 0.15,
    ),
  );
}
