import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
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
import { dayLabel } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function SwapRequestDialog({ open, onOpenChange, service, assignment, members = [], onCreated }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requestedBy, setRequestedBy] = useState('');
  const [reason, setReason] = useState('');
  const [suggested, setSuggested] = useState('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRequestedBy(assignment?.member_name || user?.full_name || '');
    setReason('');
    setSuggested('none');
  }, [open, assignment, user]);

  const submit = async () => {
    if (!assignment) return;
    setSaving(true);
    const suggestion = members.find((m) => m.id === suggested);
    await base44.entities.SwapRequest.create({
      assignment_id: assignment.id,
      service_id: assignment.service_id,
      service_title: assignment.service_title,
      service_date: assignment.service_date,
      position: assignment.position || '',
      assigned_member_id: assignment.member_id,
      assigned_member_name: assignment.member_name,
      requested_by: requestedBy.trim(),
      reason: reason.trim(),
      suggested_member_id: suggestion?.id || '',
      suggested_member_name: suggestion?.full_name || '',
      status: 'open',
    });
    setSaving(false);
    toast({ title: 'Swap request logged', description: 'Review it under Swap Requests.' });
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a swap</DialogTitle>
          <DialogDescription>
            {assignment?.member_name} · {assignment?.position || 'Role'} ·{' '}
            {dayLabel(service?.service_date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="swap-by">Requested by</Label>
            <Input
              id="swap-by"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="swap-reason">Reason</Label>
            <Textarea
              id="swap-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Away that weekend, work travel, family commitment..."
            />
          </div>
          <div className="space-y-2">
            <Label>Suggested replacement</Label>
            <Select value={suggested} onValueChange={setSuggested}>
              <SelectTrigger>
                <SelectValue placeholder="No suggestion yet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No suggestion yet</SelectItem>
                {members
                  .filter((m) => m.id !== assignment?.member_id)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Sending...' : 'Log swap request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}