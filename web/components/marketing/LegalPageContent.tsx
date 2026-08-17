import type { LegalSection } from '@/content/pages/privacy';
import Link from 'next/link';

type LegalPageContentProps = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPageContent({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageContentProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <nav
            className="sticky top-24 rounded-lg border border-border bg-card p-4"
            aria-label="Table of contents"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ul className="mt-3 space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="max-w-3xl">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{intro}</p>
          </header>

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                {section.summary && (
                  <p className="mt-2 text-sm font-medium text-primary">{section.summary}</p>
                )}
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mt-3 text-base leading-relaxed text-muted-foreground"
                  >
                    {paragraph.includes('Privacy Policy') ? (
                      <>
                        {paragraph.split('Privacy Policy')[0]}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        {paragraph.split('Privacy Policy')[1]}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
                    {section.list.map((item) => (
                      <li key={item.slice(0, 40)} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
