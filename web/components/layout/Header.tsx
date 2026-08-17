'use client';

import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/badges': 'Badges',
  '/fear-categories': 'Fear Categories',
  '/missions': 'Missions',
  '/challenges': 'Challenges',
  '/skill-tree': 'Skill Tree',
  '/announcements': 'Announcements',
  '/support-tickets': 'Support Tickets',
  '/feedback': 'Feedback',
  '/app-versions': 'App Versions',
  '/audit-logs': 'Audit Logs',
};

function getTitle(pathname: string): string {
  const exact = routeTitles[pathname];
  if (exact) return exact;
  const match = Object.entries(routeTitles).find(([key]) =>
    pathname.startsWith(key + '/'),
  );
  return match?.[1] ?? 'Admin';
}

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar, sidebarOpen } = useUiStore();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title = getTitle(pathname);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-background/95 backdrop-blur-sm transition-all duration-300"
      style={{ left: sidebarOpen ? '240px' : '64px' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
        >
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <span className="hidden sm:block">{user?.name ?? 'Admin'}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-medium text-foreground">
                  {user?.name ?? 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email ?? ''}
                </p>
              </div>
              <div className="p-1">
                <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
