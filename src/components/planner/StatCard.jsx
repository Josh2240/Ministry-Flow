import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ label, value, hint, icon: Icon, to }) {
  const body = (
    <Card className="h-full border-border/70 bg-card shadow-sm transition-transform hover:-translate-y-0.5">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className="rounded-xl bg-secondary p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  return to ? <Link to={to}>{body}</Link> : body;
}