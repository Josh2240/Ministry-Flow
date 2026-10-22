import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import SongFormDialog from '@/components/planner/SongFormDialog';
import ConfirmDelete from '@/components/planner/ConfirmDelete';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Plus, Search } from 'lucide-react';

export default function Songs() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async (term) => {
    const query = term
      ? { $or: [{ title: { $regex: term, $options: 'i' } }, { artist: { $regex: term, $options: 'i' } }] }
      : {};
    const rows = await api.entities.Song.filter(query, { sort: 'title', limit: 300 });
    setSongs(rows.items || []);
    setLoading(false);
  };

  useEffect(() => {
    const term = search.trim();
    const timer = setTimeout(() => load(term), term ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    await api.entities.Song.delete(deleteTarget.id);
    setDeleteTarget(null);
    load(search.trim());
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Repertoire</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">Song library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every song your teams know, with the key and arrangement notes.
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add song
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or artist"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Music className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No songs here yet. Add the songs your worship team plays.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {songs.map((song) => (
            <Card key={song.id} className="border-border/70">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-heading text-lg font-semibold">{song.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[song.artist, song.tempo ? `${song.tempo} BPM` : '', song.ccli_number ? `CCLI ${song.ccli_number}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {(song.themes || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {song.themes.map((theme) => (
                        <span
                          key={theme}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {song.song_key && (
                    <span className="rounded-full border border-border px-3 py-1 text-sm font-medium">
                      Key {song.song_key}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(song);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(song)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SongFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        song={editing}
        onSaved={() => load(search.trim())}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        title="Delete this song?"
        description={`${deleteTarget?.title || 'This song'} will be removed from your library. Setlists that already use it keep their entries.`}
        onConfirm={confirmRemove}
      />
    </div>
  );
}