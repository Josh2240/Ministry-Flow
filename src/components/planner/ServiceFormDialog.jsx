import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SERVICE_STATUS_OPTIONS, SERVICE_TYPE_OPTIONS } from '@/lib/ministry';
import { todayISO } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const empty = {
  title: 'Sunday Morning Worship',
  service_date: todayISO(),
  start_time: '09:00',
  end_time: '10:30',
  service_type: 'sunday_morning',
  location: 'Main Sanctuary',
  status: 'draft',
  notes: '',
};

export default function ServiceFormDialog({ open, onOpenChange, service, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(service ? { ...empty, ...service } : empty);
  }, [open, service]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    if (!form.title.trim() || !form.service_date) {
      toast({ title: 'A title and date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      service_date: form.service_date,
      start_time: form.start_time,
      end_time: form.end_time || '',
      service_type: form.service_type,
      location: form.location?.trim() || '',
      status: form.status,
      notes: form.notes?.trim() || '',
    };
    if (service?.id) {
      await api.entities.Service.update(service.id, payload);
    } else {
      await api.entities.Service.create(payload);
    }
    setSaving(false);
    toast({ title: service?.id ? 'Service updated' : 'Service added' });
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{service?.id ? 'Edit service' : 'Add a service'}</DialogTitle>
          <DialogDescription>
            Services, rehearsals and special events all live on the same schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="service-title">Title</Label>
            <Input
              id="service-title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-date">Date</Label>
            <Input
              id="service-date"
              type="date"
              value={form.service_date}
              onChange={(e) => update('service_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.service_type} onValueChange={(v) => update('service_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-start">Start time</Label>
            <Input
              id="service-start"
              type="time"
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-end">End time</Label>
            <Input
              id="service-end"
              type="time"
              value={form.end_time}
              onChange={(e) => update('end_time', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-location">Location</Label>
            <Input
              id="service-location"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="service-notes">Notes</Label>
            <Textarea
              id="service-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Sermon series, rehearsal call time, anything the team should know."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}