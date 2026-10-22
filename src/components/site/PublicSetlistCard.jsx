import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { dayLabel } from '@/lib/format';
import { Music } from 'lucide-react';

export default function PublicSetlistCard({ setlist }) {
  const items = setlist.items || [];

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">
            {dayLabel(setlist.service_date)}
          </p>
          <h3 className="font-heading text-xl font-semibold">{setlist.title}</h3>
          {setlist.service_title && (
            <p className="text-sm text-muted-foreground">{setlist.service_title}</p>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">The song list is being prayerfully chosen.</p>
        ) : (
          <ol className="space-y-2.5">
            {items.map((item, index) => (
              <li key={`${item.song_id || item.title}-${index}`} className="flex items-baseline gap-3">
                <span className="w-5 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
                <span className="flex-1 font-medium">{item.title}</span>
                {item.song_key && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {item.song_key}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        {setlist.notes && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Music className="mt-0.5 h-4 w-4 shrink-0" />
            {setlist.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}