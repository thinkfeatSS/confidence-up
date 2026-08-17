import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import { enrichNlpMetrics } from '../intelligence/nlpIntelligence';
import { NlpMetrics } from '../types/speechAnalysis.types';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
let nlp: ReturnType<typeof winkNLP> | null = null;

function getNlp() {
  if (!nlp) nlp = winkNLP(model);
  return nlp;
}

function tokenizeFallback(text: string) {
  return text
    .trim()
    .split(/[\s،,.;:!?؟۔]+/u)
    .map(token => token.trim())
    .filter(Boolean);
}

function estimateSentenceCount(text: string, tokenCount: number, nlpCount?: number) {
  const punctuationCount = text.match(/[.!?؟۔]+/gu)?.length ?? 0;
  if (punctuationCount > 0) return punctuationCount;
  if (tokenCount <= 0) return 0;

  const clauseBreaks =
    text.match(
      /\b(and then|but|so|because|however|also|then|while|although|whereas|لیکن|مگر|پر|تو)\b/giu,
    )?.length ?? 0;

  const lengthEstimate = Math.max(1, Math.round(tokenCount / 12));
  const clauseEstimate = clauseBreaks + 1;
  const estimate = Math.max(lengthEstimate, clauseEstimate);

  if (nlpCount && nlpCount > 1) return Math.max(nlpCount, estimate);
  return estimate;
}

function repetitionScore(tokens: string[]) {
  if (tokens.length < 4) return 95;
  const normalized = tokens.map(t => t.toLowerCase()).filter(t => t.length > 2);
  const counts = new Map<string, number>();
  for (const token of normalized) counts.set(token, (counts.get(token) ?? 0) + 1);
  const repeated = Array.from(counts.values()).filter(count => count > 1).reduce((sum, count) => sum + count - 1, 0);
  const repeatRate = normalized.length ? repeated / normalized.length : 0;
  return Math.round(clamp(100 - repeatRate * 180));
}

export function analyzeTranscript(transcript: string, durationSeconds: number): NlpMetrics {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return enrichNlpMetrics(
      {
        wordCount: 0,
        sentenceCount: 0,
        vocabularyRichness: 0,
        repetitionScore: 0,
        fillerCount: 0,
        fillerWords: [],
        fillerBreakdown: {},
        speakingLengthSeconds: durationSeconds,
        vocabularyScore: 0,
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
      },
      trimmed,
    );
  }

  let tokens = tokenizeFallback(trimmed);
  let sentenceCount = estimateSentenceCount(trimmed, tokens.length);
  const latinRatio =
    (trimmed.match(/[A-Za-z]/g)?.length ?? 0) / Math.max(trimmed.replace(/\s/g, '').length, 1);

  if (latinRatio > 0.5) {
    try {
      const doc = getNlp().readDoc(trimmed);
      tokens = doc.tokens().out().filter((token: string) => /\p{L}/u.test(token));
      const nlpSentenceCount = doc.sentences().out().length;
      sentenceCount = estimateSentenceCount(trimmed, tokens.length, nlpSentenceCount);
    } catch {
      // Keep fallback tokenization if the model is unavailable in a native bundle.
    }
  }

  const unique = new Set(tokens.map(token => token.toLowerCase()));
  const vocabularyRichness = Math.round(clamp((unique.size / Math.max(tokens.length, 1)) * 100));
  const repetition = repetitionScore(tokens);
  const vocabularyScore = Math.round(clamp(vocabularyRichness * 0.75 + repetition * 0.25));

  return enrichNlpMetrics(
    {
      wordCount: tokens.length,
      sentenceCount,
      vocabularyRichness,
      repetitionScore: repetition,
      fillerCount: 0,
      fillerWords: [],
      fillerBreakdown: {},
      speakingLengthSeconds: durationSeconds,
      vocabularyScore,
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
    },
    trimmed,
  );
}
