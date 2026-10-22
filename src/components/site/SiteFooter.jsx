import React from 'react';
import { Link } from 'react-router-dom';
import { churchInfo } from '@/lib/churchInfo';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-heading text-xl font-semibold">{churchInfo.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {churchInfo.tagline}
          </p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {churchInfo.address}
              <br />
              {churchInfo.city}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            {churchInfo.phone}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            {churchInfo.email}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <Link to="/service-times" className="text-muted-foreground transition-colors hover:text-foreground">
            Service Times
          </Link>
          <Link to="/songs-setlists" className="text-muted-foreground transition-colors hover:text-foreground">
            Songs &amp; Setlists
          </Link>
          <Link to="/serve" className="text-muted-foreground transition-colors hover:text-foreground">
            Serve With Us
          </Link>
          <Link to="/planner" className="text-muted-foreground transition-colors hover:text-foreground">
            Team Login
          </Link>
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-6 text-center text-xs text-muted-foreground sm:px-8">
        © {new Date().getFullYear()} {churchInfo.name}. All rights reserved.
      </div>
    </footer>
  );
}