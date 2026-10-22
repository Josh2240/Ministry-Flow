import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { churchInfo } from '@/lib/churchInfo';
import {
  CalendarDays,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Music,
  RefreshCw,
  Send,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/planner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/planner/team', label: 'Team', icon: Users },
  { to: '/planner/availability', label: 'Availability', icon: Clock },
  { to: '/planner/swaps', label: 'Swap Requests', icon: RefreshCw },
  { to: '/planner/songs', label: 'Songs', icon: Music },
  { to: '/planner/signups', label: 'Sign-ups', icon: Send },
];

export default function PlannerLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-2">
      <Link
        to="/"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      >
        <ExternalLink className="h-4 w-4" />
        View website
      </Link>
      <button
        type="button"
        onClick={() => logout(true)}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-sidebar p-5 lg:flex">
        <div>
          <div className="px-3 pb-6 pt-2">
            <p className="font-heading text-lg font-semibold text-sidebar-foreground">
              {churchInfo.name}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sidebar-foreground/50">
              Ministry Planner
            </p>
          </div>
          {nav}
        </div>
        <div className="space-y-3 pt-6">
          <p className="px-3.5 text-xs text-sidebar-foreground/50">
            Signed in as {user?.full_name || user?.email || 'team member'}
          </p>
          {footer}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/60 bg-sidebar px-4 py-3 lg:hidden">
          <div>
            <p className="font-heading text-base font-semibold text-sidebar-foreground">
              {churchInfo.name}
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/50">
              Ministry Planner
            </p>
          </div>
          <button type="button" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
            {open ? (
              <X className="h-5 w-5 text-sidebar-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {open && (
          <div className="space-y-3 border-b border-border/60 bg-sidebar px-4 py-4 lg:hidden">
            {nav}
            {footer}
          </div>
        )}

        <main className="flex-1 px-4 py-7 sm:px-8 sm:py-10">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}