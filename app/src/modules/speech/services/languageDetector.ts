import { FILLERS_BY_LANGUAGE } from '../data/fillers';
import { STOPWORDS_BY_LANGUAGE } from '../data/stopwords';
import { DEFAULT_PREFERRED_LANGUAGES } from '../data/languageProfiles';
import { LanguageCode, LanguageDetectionResult } from '../types/speechAnalysis.types';

const SCRIPT_PATTERNS = {
  latin: /[A-Za-z]/g,
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g,
  devanagari: /[\u0900-\u097F]/g,
};

const LANGUAGE_CODE_BY_NAME: Record<string, LanguageCode> = {
  English: 'en',
  Urdu: 'ur',
  Hindi: 'hi',
  Sindhi: 'sd',
};

function ratio(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function countMatches(transcript: string, words: string[]) {
  const lower = transcript.toLowerCase();
  return words.reduce((sum, word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isLatin = /^[a-z\s]+$/i.test(word);
    const pattern = isLatin
      ? new RegExp(`(?:^|\\s)${escaped}(?=\\s|$|[,.!?])`, 'gi')
      : new RegExp(escaped, 'gu');
    return sum + (lower.match(pattern)?.length ?? 0);
  }, 0);
}

export function detectLanguage(args: {
  transcript: string;
  preferredLanguages?: string[];
  recentLanguages?: string[];
}): LanguageDetectionResult {
  const transcript = args.transcript.trim();
  const compact = transcript.replace(/\s/g, '');
  const totalChars = compact.length || 1;
  const scriptRatios = {
    latin: ratio(transcript.match(SCRIPT_PATTERNS.latin)?.length ?? 0, totalChars),
    arabic: ratio(transcript.match(SCRIPT_PATTERNS.arabic)?.length ?? 0, totalChars),
    devanagari: ratio(transcript.match(SCRIPT_PATTERNS.devanagari)?.length ?? 0, totalChars),
  };

  const scores: Record<string, number> = {
    English: scriptRatios.latin,
    Urdu: scriptRatios.arabic * 0.75,
    Sindhi: scriptRatios.arabic * 0.65,
    Hindi: scriptRatios.devanagari,
  };

  for (const language of Object.keys(scores)) {
    scores[language] += countMatches(transcript, STOPWORDS_BY_LANGUAGE[language] ?? []) * 6;
    scores[language] += countMatches(transcript, FILLERS_BY_LANGUAGE[language] ?? []) * 8;
  }

  const preferred = args.preferredLanguages?.length ? args.preferredLanguages : DEFAULT_PREFERRED_LANGUAGES;
  for (const language of preferred) {
    if (scores[language] !== undefined) scores[language] += 12;
  }
  for (const language of args.recentLanguages ?? []) {
    const normalized = language.replace(/^Mixed\s+/i, '').split('-');
    for (const item of normalized) {
      const name = item.trim();
      if (scores[name] !== undefined) scores[name] += 8;
    }
  }

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 8);
  const top = ranked[0];
  const second = ranked[1];

  if (!top) {
    return {
      label: 'Unknown',
      code: 'unknown',
      languages: [],
      confidence: 0,
      source: 'local',
      scriptRatios,
      aiNeeded: true,
      geminiNeeded: true,
    };
  }

  const isMixed = Boolean(second && second[1] >= top[1] * 0.45);
  const languages = isMixed && second ? [top[0], second[0]] : [top[0]];
  const confidence = Math.round(Math.min(95, top[1] + (isMixed ? 5 : 15)));
  const label = isMixed ? `Mixed ${languages.join('-')}` : languages[0];

  return {
    label,
    code: isMixed ? 'mixed' : LANGUAGE_CODE_BY_NAME[top[0]] ?? 'unknown',
    languages,
    confidence,
    source: confidence >= 70 ? 'local' : 'history',
    scriptRatios,
    aiNeeded: confidence < 70,
    geminiNeeded: confidence < 70,
  };
}
