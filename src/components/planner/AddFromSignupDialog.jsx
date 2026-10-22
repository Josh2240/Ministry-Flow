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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEMBER_ROLE_OPTIONS } from '@/lib/ministry';
import { useToast } from '@/components/ui/use-toast';

export default function AddFromSignupDialog({ open, onOpenChange, signup, onAdded }) {
  const { toast } = useToast();
  const [role, setRole] = useState('musician');
  const [instrument, setInstrument] = useState('');
  const [voicePart, setVoicePart] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const interest = signup?.teams || [];
    setRole(interest.includes('vocals') ? 'vocalist' : interest.includes('band') ? 'musician' : interest[0] || 'musician');
    setInstrument('');
    setVoicePart('');
  }, [open, signup]);

  const add = async () => {
    if (!signup) return;
    setSaving(true);
    await base44.entities.TeamMember.create({
      full_name: signup.full_name,
      email: signup.email || '',
      phone: signup.phone || '',
      role,
      instrument: instrument.trim(),
      voice_part: voicePart.trim(),
      is_active: true,
      notes: [signup.experience, signup.message].filter(Boolean).join(' — '),
    });
    await base44.entities.SignupInterest.update(signup.id, { status: 'joined' });
    setSaving(false);
    toast({ title: 'Added to the team' });
    onOpenChange(false);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {signup?.full_name} to the team</DialogTitle>
          <DialogDescription>
            We will keep their contact details and mark the sign-up as joined.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
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
            <Label htmlFor="signup-instrument">Instrument</Label>
            <Input
              id="signup-instrument"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-voice">Voice part</Label>
            <Input
              id="signup-voice"
              value={voicePart}
              onChange={(e) => setVoicePart(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={add} disabled={saving}>
            {saving ? 'Adding...' : 'Add to team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}