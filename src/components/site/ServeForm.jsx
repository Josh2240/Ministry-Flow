import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SIGNUP_TEAM_OPTIONS } from '@/lib/ministry';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Loader2 } from 'lucide-react';

const emptyForm = { full_name: '', email: '', phone: '', teams: [], experience: '', message: '' };

export default function ServeForm() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleTeam = (value) =>
    setForm((prev) => ({
      ...prev,
      teams: prev.teams.includes(value)
        ? prev.teams.filter((t) => t !== value)
        : [...prev.teams, value],
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Please add your name and email', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.SignupInterest.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        teams: form.teams,
        experience: form.experience.trim(),
        message: form.message.trim(),
        status: 'new',
      });
      setDone(true);
      setForm(emptyForm);
    } catch (error) {
      toast({
        title: 'We could not send that just now',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="space-y-4 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="font-heading text-xl font-semibold">Thank you for saying yes</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            One of our ministry leaders will reach out to you this week to talk through where you
            could serve and what the next rehearsal looks like.
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => setDone(false)}>
            Send another response
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Your name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="First and last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="How we can reach you"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Where would you like to serve?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SIGNUP_TEAM_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm transition-colors hover:bg-secondary/50"
                >
                  <Checkbox
                    checked={form.teams.includes(option.value)}
                    onCheckedChange={() => toggleTeam(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Musical or technical experience</Label>
            <Textarea
              id="experience"
              rows={3}
              value={form.experience}
              onChange={(e) => update('experience', e.target.value)}
              placeholder="Instruments you play, voice part, sound or media experience..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Anything else we should know?</Label>
            <Textarea
              id="message"
              rows={3}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              placeholder="Which services suit you, how often you can serve..."
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full rounded-full sm:w-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Sending...' : 'I want to serve'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}