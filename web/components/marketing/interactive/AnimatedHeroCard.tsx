'use client';

import { useEffect, useState } from 'react';

const MISSIONS = [
  { title: 'Introduce yourself to someone new', score: '+12', streak: '7 days 🔥', xp: '450 XP' },
  { title: 'Practice a 2-minute elevator pitch', score: '+8', streak: '7 days 🔥', xp: '320 XP' },
  { title: 'Ask a question in a group setting', score: '+15', streak: '7 days 🔥', xp: '520 XP' },
  { title: 'Record a 60-second speech', score: '+10', streak: '7 days 🔥', xp: '380 XP' },
];

export function AnimatedHeroCard() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const mission = MISSIONS[index];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MISSIONS.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="aspect-square rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/10 transition-transform duration-500 hover:scale-[1.02]">
        <div
          className={`flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div>
            <p className="text-sm font-medium opacity-90">Today&apos;s mission</p>
            <p className="mt-2 text-2xl font-bold">{mission.title}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm">
              <span>Confidence score</span>
              <span className="font-bold">{mission.score}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm">
              <span>Streak</span>
              <span className="font-bold">{mission.streak}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm">
              <span>XP earned</span>
              <span className="font-bold">{mission.xp}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary/20 blur-2xl" aria-hidden />
      <div className="absolute -bottom-4 -left-4 size-32 rounded-full bg-accent/30 blur-2xl" aria-hidden />
    </div>
  );
}
