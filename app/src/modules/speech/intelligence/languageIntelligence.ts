import { detectLanguage } from '../services/languageDetector';
import { ROMAN_URDU_WORDS } from './dictionaries/romanUrdu';
import {
  LanguageDetectionResult,
  LanguageTimelineSegment,
  UtteranceSegment,
} from '../types/speechAnalysis.types';

function countRomanUrduMatches(transcript: string) {
  const lower = transcript.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;

  let matches = 0;
  for (const token of tokens) {
    if (ROMAN_URDU_WORDS.includes(token)) matches += 1;
  }
  for (const phrase of ROMAN_URDU_WORDS.filter(word => word.includes(' '))) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`, 'gi');
    matches += lower.match(pattern)?.length ?? 0;
  }

  return matches;
}

function buildLanguageStability(
  timeline: LanguageTimelineSegment[],
): Record<string, number> | undefined {
  if (!timeline.length) return undefined;

  const weights = new Map<string, number>();
  let total = 0;
  for (const segment of timeline) {
    const weight = Math.max(1, segment.text.split(/\s+/).filter(Boolean).length);
    weights.set(segment.label, (weights.get(segment.label) ?? 0) + weight);
    total += weight;
  }

  const stability: Record<string, number> = {};
  for (const [label, weight] of weights.entries()) {
    stability[label] = Math.round((weight / total) * 100);
  }
  return stability;
}

export function buildLanguageTimeline(
  segments: UtteranceSegment[],
  preferredLanguages?: string[],
): LanguageTimelineSegment[] {
  return segments
    .filter(segment => segment.text.trim())
    .map(segment => {
      const detection = detectLanguage({
        transcript: segment.text,
        preferredLanguages,
      });
      return {
        text: segment.text,
        startMs: segment.startMs,
        endMs: segment.endMs,
        label: detection.label,
        code: detection.code,
      };
    });
}

export function enrichLanguageDetection(args: {
  base: LanguageDetectionResult;
  transcript: string;
  utteranceSegments?: UtteranceSegment[];
  preferredLanguages?: string[];
}): LanguageDetectionResult {
  const { base, transcript, utteranceSegments, preferredLanguages } = args;
  const tokens = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  const romanUrduMatches = countRomanUrduMatches(transcript);
  const romanUrduScore =
    tokens.length > 0 ? Math.round((romanUrduMatches / tokens.length) * 100) : 0;

  const timeline = utteranceSegments?.length
    ? buildLanguageTimeline(utteranceSegments, preferredLanguages)
    : undefined;
  const languageStability = timeline ? buildLanguageStability(timeline) : undefined;

  let label = base.label;
  let languages = [...base.languages];
  if (romanUrduScore >= 20 && !languages.includes('Urdu') && base.code !== 'ur') {
    label = languages.length ? `Mixed ${[...languages, 'Roman Urdu'].join('-')}` : 'Roman Urdu';
    if (!languages.includes('English') && base.code === 'en') {
      languages = ['English', 'Roman Urdu'];
    } else if (!languages.includes('Roman Urdu')) {
      languages = [...languages, 'Roman Urdu'];
    }
  }

  return {
    ...base,
    label,
    languages,
    code: languages.length > 1 || romanUrduScore >= 25 ? 'mixed' : base.code,
    romanUrduScore,
    languageStability,
    languageTimeline: timeline,
  };
}
