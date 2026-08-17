'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  value: string;
  duration?: number;
};

function parseNumeric(value: string): { prefix: string; num: number; suffix: string } | null {
  const match = value.match(/^([^0-9]*)([\d,]+)(.*)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    num: parseInt(match[2].replace(/,/g, ''), 10),
    suffix: match[3],
  };
}

export function CountUp({ value, duration = 1200 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(value);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [parsed]);

  useEffect(() => {
    if (!started || !parsed) return;

    const start = performance.now();
    const target = parsed.num;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplay(`${parsed.prefix}${current.toLocaleString()}${parsed.suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [started, parsed, duration]);

  return <span ref={ref}>{display}</span>;
}
