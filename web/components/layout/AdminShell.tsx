'use client';

import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  return (
    <main
      className={cn(
        'pt-16 transition-all duration-300',
        sidebarOpen ? 'pl-60' : 'pl-16'
      )}
    >
      <div className="p-6">{children}</div>
    </main>
  );
}
