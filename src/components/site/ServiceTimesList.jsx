import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime } from '@/lib/format';
import { Clock, MapPin } from 'lucide-react';

export default function ServiceTimesList({ times = [] }) {
  if (!times.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Our regular service times will be posted here soon.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {times.map((time) => (
        <Card key={time.id} className="border-border/70 bg-card shadow-sm">
          <CardContent className="space-y-3 p-6">
            <p className="font-heading text-lg font-semibold">{time.label}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {time.day_of_week}s, {formatTime(time.time)}
              {time.end_time ? ` – ${formatTime(time.end_time)}` : ''}
            </p>
            {time.location && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {time.location}
              </p>
            )}
            {time.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{time.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}