import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { Badge } from '../types';

interface GamificationEvent {
  type: 'xp' | 'levelUp' | 'badge';
  xpAmount?: number;
  newLevel?: number;
  newTitle?: string;
  badge?: Badge;
}

interface AppContextValue {
  pendingEvent: GamificationEvent | null;
  triggerXPGain: (amount: number) => void;
  triggerLevelUp: (newLevel: number, newTitle: string) => void;
  triggerBadgeUnlock: (badge: Badge) => void;
  clearEvent: () => void;
}

const AppContext = createContext<AppContextValue>({
  pendingEvent: null,
  triggerXPGain: () => {},
  triggerLevelUp: () => {},
  triggerBadgeUnlock: () => {},
  clearEvent: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [pendingEvent, setPendingEvent] = useState<GamificationEvent | null>(null);
  const queueRef = useRef<GamificationEvent[]>([]);
  // Track whether an event is currently displayed without causing stale closures
  const processingRef = useRef(false);

  const processNext = useCallback(() => {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      processingRef.current = true;
      setPendingEvent(next);
    } else {
      processingRef.current = false;
      setPendingEvent(null);
    }
  }, []);

  const enqueue = useCallback((event: GamificationEvent) => {
    queueRef.current.push(event);
    if (!processingRef.current) {
      processNext();
    }
  }, [processNext]);

  const triggerXPGain = useCallback((amount: number) => enqueue({ type: 'xp', xpAmount: amount }), [enqueue]);
  const triggerLevelUp = useCallback((newLevel: number, newTitle: string) => enqueue({ type: 'levelUp', newLevel, newTitle }), [enqueue]);
  const triggerBadgeUnlock = useCallback((badge: Badge) => enqueue({ type: 'badge', badge }), [enqueue]);
  const clearEvent = useCallback(() => processNext(), [processNext]);

  return (
    <AppContext.Provider value={{ pendingEvent, triggerXPGain, triggerLevelUp, triggerBadgeUnlock, clearEvent }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
