/**
 * Merge committed transcript with a new partial/final segment without duplicating
 * overlapping text from Android STT revisions, while keeping intentional repeats.
 */
export function mergeTranscriptSegments(committed: string, segment: string) {
  const base = committed.trim();
  const next = segment.trim();
  if (!next) return base;
  if (!base) return next;

  const lowerBase = base.toLowerCase();
  const lowerNext = next.toLowerCase();

  if (lowerNext.startsWith(lowerBase)) {
    const extension = segment.slice(base.length).trim();
    return extension ? `${base} ${extension}` : base;
  }

  const maxOverlap = Math.min(base.length, next.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    if (lowerBase.slice(-size) === lowerNext.slice(0, size)) {
      if (size === next.length) return `${base} ${next}`;
      return `${base}${segment.slice(size)}`;
    }
  }

  return `${base} ${next}`;
}

/** Ignore regressive partial hypotheses while keeping intentional repeated words. */
export function acceptPartialHypothesis(previous: string, next: string) {
  const prev = previous.trim();
  const candidate = next.trim();
  if (!candidate) return prev;
  if (!prev) return candidate;
  if (candidate.length >= prev.length) return candidate;
  if (prev.toLowerCase().startsWith(candidate.toLowerCase())) return candidate;
  return prev;
}
