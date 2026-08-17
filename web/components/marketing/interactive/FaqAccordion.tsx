'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type FaqItem = { question: string; answer: string };

type FaqAccordionProps = {
  faqs: FaqItem[];
};

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <dl className="mx-auto max-w-3xl divide-y divide-border rounded-xl border border-border bg-card">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question}>
            <dt>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
              >
                <span className="text-base font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
            </dt>
            <dd
              className={cn(
                'overflow-hidden px-5 text-sm leading-relaxed text-muted-foreground transition-all duration-200 sm:px-6',
                isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              {faq.answer}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
