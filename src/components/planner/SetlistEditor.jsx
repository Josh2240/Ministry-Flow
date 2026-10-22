import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, ListMusic, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SetlistEditor({ service, setlist, songs = [], onChanged }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [songId, setSongId] = useState('');
  const [overrideKey, setOverrideKey] = useState('');
  const [busy, setBusy] = useState(false);

  const items = setlist?.items || [];

  const createSetlist = async () => {
    setBusy(true);
    await base44.entities.Setlist.create({
      title: `${service.title} Set`,
      service_id: service.id,
      service_title: service.title,
      service_date: service.service_date,
      is_published: false,
      items: [],
    });
    setBusy(false);
    toast({ title: 'Setlist started' });
    onChanged?.();
  };

  const persist = async (nextItems, extra = {}) => {
    await base44.entities.Setlist.update(setlist.id, { items: nextItems, ...extra });
    onChanged?.();
  };

  const addSong = async () => {
    const song = songs.find((s) => s.id === songId);
    if (!song) return;
    const next = [
      ...items,
      {
        song_id: song.id,
        title: song.title,
        song_key: overrideKey.trim() || song.song_key || '',
      },
    ];
    setBusy(true);
    await persist(next);
    setBusy(false);
    setAddOpen(false);
    setSongId('');
    setOverrideKey('');
    toast({ title: 'Song added to the set' });
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    await persist(next);
    setBusy(false);
  };

  const remove = async (index) => {
    setBusy(true);
    await persist(items.filter((_, i) => i !== index));
    setBusy(false);
  };

  if (!setlist) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          No setlist yet for this service.
        </p>
        <Button onClick={createSetlist} disabled={busy} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Start a setlist
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListMusic className="h-4 w-4" />
          {items.length} {items.length === 1 ? 'song' : 'songs'}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="published" className="text-xs text-muted-foreground">
              Show on website
            </Label>
            <Switch
              id="published"
              checked={!!setlist.is_published}
              onCheckedChange={async (value) => {
                await base44.entities.Setlist.update(setlist.id, { is_published: value });
                onChanged?.();
              }}
            />
          </div>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add song
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Add songs from your song library and drag them into order below.
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.song_id}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
            >
              <span className="w-5 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
              {item.song_key && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {item.song_key}
                </span>
              )}
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  title="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy || index === items.length - 1}
                  onClick={() => move(index, 1)}
                  title="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={busy} onClick={() => remove(index)} title="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Song</Label>
              <Select value={songId} onValueChange={setSongId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose from your library" />
                </SelectTrigger>
                <SelectContent>
                  {songs.map((song) => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title}
                      {song.song_key ? ` (${song.song_key})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="override-key">Key for this service (optional)</Label>
              <Input
                id="override-key"
                value={overrideKey}
                onChange={(e) => setOverrideKey(e.target.value)}
                placeholder="Leave blank to use the library key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addSong} disabled={!songId || busy}>
              Add song
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}