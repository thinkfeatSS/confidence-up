export const FILLERS_BY_LANGUAGE: Record<string, string[]> = {
  English: [
    'um',
    'uh',
    'er',
    'ah',
    'eh',
    'hmm',
    'hm',
    'like',
    'you know',
    'basically',
    'literally',
    'actually',
    'sort of',
    'kind of',
  ],
  Urdu: ['تو', 'یعنی', 'اچھا', 'بس', 'مطلب', 'وہ', 'ہمم', 'ام', 'اہ', 'ہم'],
  Hindi: ['तो', 'मतलब', 'अच्छा', 'वो', 'यानी', 'हम्म', 'अम', 'आह', 'उम'],
  Sindhi: ['ته', 'يعني', 'اڇا', 'بس', 'مطلب', 'هو', 'هم'],
};

/** Hesitation sounds often elongated in STT output (um/uh/ah/aa). */
export const HESITATION_FILLER_PATTERNS: RegExp[] = [
  /\b[uúù]m+m*\b/giu,
  /\b[uúù]h+h*\b/giu,
  /\b[eéè]r+r*\b/giu,
  /\b[aáà]h+h*\b/giu,
  /\b[eéè]h+h*\b/giu,
  /\b[hH]m+\b/gu,
  /\b[hH]mm+\b/gu,
  /\baa+\b/giu,
  /\b[eéè]m+m*\b/giu,
];

export const ALL_FILLERS = Object.values(FILLERS_BY_LANGUAGE).flat();
