'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Menu } from 'lucide-react';
import { site, navLinks } from '@/content/site';
import { AUTH_COOKIE, decodeJwtRole, defaultRouteForRole } from '@/lib/auth';
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get(AUTH_COOKIE) ?? Cookies.get('admin_token');
    if (!token) {
      setDashboardHref(null);
      return;
    }
    const role = decodeJwtRole(token);
    setDashboardHref(role ? defaultRouteForRole(role) : null);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span>{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground',
                pathname === link.href
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {dashboardHref ? (
            <ButtonLink variant="outline" size="sm" href={dashboardHref}>
              My Dashboard
            </ButtonLink>
          ) : (
            <ButtonLink variant="outline" size="sm" href="/login">
              Log In
            </ButtonLink>
          )}
          <ButtonAnchor size="sm" href={site.appStoreUrl}>
            Get the App
          </ButtonAnchor>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Open menu" className="md:hidden" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100vw-2rem,320px)]">
            <SheetHeader>
              <SheetTitle>{site.name}</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-muted',
                    pathname === link.href ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {dashboardHref ? (
                  <ButtonLink
                    variant="outline"
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                  >
                    My Dashboard
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    variant="outline"
                    href="/login"
                    onClick={() => setOpen(false)}
                  >
                    Log In
                  </ButtonLink>
                )}
                <ButtonAnchor href={site.appStoreUrl}>Get the App</ButtonAnchor>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
