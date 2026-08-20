import { landingContent } from '@/content/pages/landing';

export function DefinitionBlock() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            What is SpeakUpMic?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {landingContent.definition}
          </p>
        </div>
      </div>
    </section>
  );
}
