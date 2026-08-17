type XPBarProps = {
  level: number;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;
  streak: number;
};

export function XPBar({ level, levelTitle, xp, xpToNextLevel, streak }: XPBarProps) {
  const pct = Math.min(100, Math.round((xp / Math.max(xpToNextLevel, 1)) * 100));

  return (
    <div className="border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Level {level} · {levelTitle}
          </p>
          <div className="mt-2 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-muted sm:w-80">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {xp} / {xpToNextLevel} XP to next level
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
          <span>🔥</span>
          <span>{streak} day streak</span>
        </div>
      </div>
    </div>
  );
}
