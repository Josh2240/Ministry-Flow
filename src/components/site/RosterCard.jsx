import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { dayLabel, formatTimeRange } from '@/lib/format';
import { TEAM_LABELS, TEAM_ORDER } from '@/lib/ministry';
import { Clock, MapPin } from 'lucide-react';

export default function RosterCard({ service, assignments = [] }) {
  const grouped = TEAM_ORDER.map((team) => ({
    team,
    rows: assignments.filter((a) => a.team === team),
  })).filter((group) => group.rows.length);

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">
            {dayLabel(service.service_date)}
          </p>
          <h3 className="font-heading text-xl font-semibold">{service.title}</h3>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTimeRange(service.start_time, service.end_time)}
            </span>
            {service.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {service.location}
              </span>
            )}
          </p>
        </div>

        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The team for this service is still being put together.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.team}>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {TEAM_LABELS[group.team]}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {group.rows.map((row) => (
                    <li key={row.id} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="font-medium">{row.member_name}</span>
                      <span className="text-right text-muted-foreground">{row.position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}