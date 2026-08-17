import {
  BarChart3,
  BookOpen,
  Mic,
  Mountain,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { landingContent } from '@/content/pages/landing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const iconMap: Record<string, LucideIcon> = {
  Target,
  Mic,
  Mountain,
  Trophy,
  BarChart3,
  BookOpen,
};

export function FeatureGrid() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Everything you need to build confidence
          </h2>
          <p className="mt-3 text-muted-foreground">
            Gamified missions, AI coaching, and analytics — designed to work together.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {landingContent.features.map((feature) => {
            const Icon = iconMap[feature.icon] ?? Target;
            return (
              <Card key={feature.title} className="border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
