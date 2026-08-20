'use client';

import Link from 'next/link';
import { LogOut, Home } from 'lucide-react';
import { site } from '@/content/site';
import { useAuthStore } from '@/stores/auth.store';
import { ButtonLink } from '@/components/ui/button';

export function UserShell({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/my-dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              S
            </span>
            {site.name}
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
            )}
            <ButtonLink variant="ghost" size="sm" href="/">
              <Home className="size-4" />
              <span className="hidden sm:inline">Home</span>
            </ButtonLink>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
