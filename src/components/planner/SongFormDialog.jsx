import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const empty = {
  title: '',
  artist: '',
  song_key: '',
  tempo: '',
  ccli_number: '',
  themes: '',
  youtube_url: '',
  notes: '',
};

export default function SongFormDialog({ open, onOpenChange, song, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      song
        ? { ...empty, ...song, themes: (song.themes || []).join(', '), tempo: song.tempo || '' }
        : empty
    );
  }, [open, song]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: 'A song title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      artist: form.artist?.trim() || '',
      song_key: form.song_key?.trim() || '',
      tempo: form.tempo === '' || form.tempo === null ? null : Number(form.tempo),
      ccli_number: form.ccli_number?.trim() || '',
      themes: String(form.themes || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      youtube_url: form.youtube_url?.trim() || '',
      notes: form.notes?.trim() || '',
    };
    if (song?.id) {
      await api.entities.Song.update(song.id, payload);
    } else {
      await api.entities.Song.create(payload);
    }
    setSaving(false);
    toast({ title: song?.id ? 'Song updated' : 'Song added' });
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{song?.id ? 'Edit song' : 'Add a song'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="song-title">Title</Label>
            <Input
              id="song-title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="song-artist">Artist / writer</Label>
            <Input
              id="song-artist"
              value={form.artist}
              onChange={(e) => update('artist', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="song-key">Key</Label>
            <Input
              id="song-key"
              value={form.song_key}
              onChange={(e) => update('song_key', e.target.value)}
              placeholder="G, A, Bb..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="song-tempo">Tempo (BPM)</Label>
            <Input
              id="song-tempo"
              type="number"
              value={form.tempo}
              onChange={(e) => update('tempo', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="song-ccli">CCLI number</Label>
            <Input
              id="song-ccli"
              value={form.ccli_number}
              onChange={(e) => update('ccli_number', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="song-themes">Themes (comma separated)</Label>
            <Input
              id="song-themes"
              value={form.themes}
              onChange={(e) => update('themes', e.target.value)}
              placeholder="Praise, Communion, Advent"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="song-link">Reference link</Label>
            <Input
              id="song-link"
              value={form.youtube_url}
              onChange={(e) => update('youtube_url', e.target.value)}
              placeholder="Link to a recording the team can learn from"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="song-notes">Arrangement notes</Label>
            <Textarea
              id="song-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Intro, dynamics, who leads each verse..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save song'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}