import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEMBER_ROLE_OPTIONS } from '@/lib/ministry';
import { useToast } from '@/components/ui/use-toast';

const empty = {
  full_name: '',
  email: '',
  phone: '',
  role: 'musician',
  instrument: '',
  voice_part: '',
  is_active: true,
  notes: '',
};

export default function MemberFormDialog({ open, onOpenChange, member, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(member ? { ...empty, ...member } : empty);
  }, [open, member]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    if (!form.full_name.trim()) {
      toast({ title: 'Please add a name', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email?.trim() || '',
      phone: form.phone?.trim() || '',
      role: form.role,
      instrument: form.instrument?.trim() || '',
      voice_part: form.voice_part?.trim() || '',
      is_active: !!form.is_active,
      notes: form.notes?.trim() || '',
    };
    if (member?.id) {
      await base44.entities.TeamMember.update(member.id, payload);
    } else {
      await base44.entities.TeamMember.create(payload);
    }
    setSaving(false);
    toast({ title: member?.id ? 'Team member updated' : 'Team member added' });
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member?.id ? 'Edit team member' : 'Add team member'}</DialogTitle>
          <DialogDescription>
            Anyone who serves on a worship, band, media or service team.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="member-name">Full name</Label>
            <Input
              id="member-name"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-phone">Phone</Label>
            <Input
              id="member-phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => update('role', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-instrument">Instrument</Label>
            <Input
              id="member-instrument"
              value={form.instrument}
              onChange={(e) => update('instrument', e.target.value)}
              placeholder="Keys, drums, acoustic..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-voice">Voice part</Label>
            <Input
              id="member-voice"
              value={form.voice_part}
              onChange={(e) => update('voice_part', e.target.value)}
              placeholder="Soprano, alto, tenor, bass"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Currently serving</p>
              <p className="text-xs text-muted-foreground">
                Turn off to keep their history but hide them from new schedules.
              </p>
            </div>
            <Switch checked={!!form.is_active} onCheckedChange={(v) => update('is_active', v)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="member-notes">Notes</Label>
            <Textarea
              id="member-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Availability preferences, instruments they can cover..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}