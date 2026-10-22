import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { todayISO } from '@/lib/format';
import { Input } from '@/components/ui/input';
import PublicSetlistCard from '@/components/site/PublicSetlistCard';
import { Search } from 'lucide-react';

export default function SongsSetlistsPage() {
  const [setlists, setSetlists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await api.entities.Setlist.filter(
          { is_published: true, service_date: { $gte: todayISO() } },
          { sort: 'service_date', limit: 12 }
        );
        if (active) setSetlists(rows.items || []);
      } catch (error) {
        // Visitors who are not signed in still see the welcome content
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const query = search.trim() ? { title: { $regex: search.trim(), $options: 'i' } } : {};
    const timer = setTimeout(async () => {
      try {
        const rows = await api.entities.Song.filter(query, { sort: 'title', limit: 200 });
        if (active) setSongs(rows.items || []);
      } catch (error) {
        if (active) setSongs([]);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">Songs we sing</p>
      <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-5xl">Songs &amp; setlists</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Our upcoming sets, and the songs our worship team draws on week by week.
      </p>

      <div className="mt-10">
        <h2 className="font-heading text-2xl font-semibold">Upcoming setlists</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {setlists.map((setlist) => (
            <PublicSetlistCard key={setlist.id} setlist={setlist} />
          ))}
        </div>
        {setlists.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            This week&rsquo;s setlist will be published soon.
          </p>
        )}
      </div>

      <div className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold">Song library</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a song or artist"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-6 divide-y divide-border rounded-2xl border border-border/70 bg-card">
          {songs.map((song) => (
            <div key={song.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{song.title}</p>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                {(song.themes || []).slice(0, 2).map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    {theme}
                  </span>
                ))}
                {song.song_key && (
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                    {song.song_key}
                  </span>
                )}
              </div>
            </div>
          ))}
          {songs.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">No songs match that search.</p>
          )}
        </div>
      </div>
    </div>
  );
}