import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { churchInfo } from '@/lib/churchInfo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Home' },
  { to: '/service-times', label: 'Service Times' },
  { to: '/songs-setlists', label: 'Songs & Setlists' },
  { to: '/serve', label: 'Serve With Us' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    cn(
      'text-sm transition-colors hover:text-foreground',
      isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
            {churchInfo.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to="/planner">Team Login</Link>
          </Button>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm',
                    isActive ? 'bg-secondary font-medium text-secondary-foreground' : 'text-muted-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/planner"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg px-3 py-2 text-sm font-medium text-primary"
            >
              Team Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}