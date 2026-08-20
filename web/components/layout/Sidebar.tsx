'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard,
  Users,
  Award,
  Layers,
  Target,
  Zap,
  GitBranch,
  Megaphone,
  MessageSquare,
  Star,
  Smartphone,
  ScrollText,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/badges', label: 'Badges', icon: Award },
  { href: '/fear-categories', label: 'Fear Categories', icon: Layers },
  { href: '/missions', label: 'Missions', icon: Target },
  { href: '/challenges', label: 'Challenges', icon: Zap },
  { href: '/skill-tree', label: 'Skill Tree', icon: GitBranch },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/support-tickets', label: 'Support Tickets', icon: MessageSquare },
  { href: '/feedback', label: 'Feedback', icon: Star },
  { href: '/app-versions', label: 'App Versions', icon: Smartphone },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border min-h-[64px]">
        {sidebarOpen && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">SUM</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground leading-none truncate">
                SpeakUpMic
              </p>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                Admin
              </span>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-xs">SUM</span>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-muted',
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-primary' : '',
                )}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors py-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
