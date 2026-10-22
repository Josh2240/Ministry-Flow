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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConflictList from '@/components/planner/ConflictList';
import { checkAssignmentConflicts } from '@/lib/conflicts';
import { dayLabel } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function ResolveSwapDialog({ open, onOpenChange, request, mode, members = [], onResolved }) {
  const { toast } = useToast();
  const [replacement, setReplacement] = useState('none');
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReplacement(request?.suggested_member_id || 'none');
    setNote('');
    setIssues([]);
  }, [open, request]);

  useEffect(() => {
    if (!open || mode !== 'approve' || replacement === 'none' || !request) {
      setIssues([]);
      return;
    }
    let active = true;
    setChecking(true);
    checkAssignmentConflicts({
      memberId: replacement,
      serviceId: request.service_id,
      serviceDate: request.service_date,
      excludeAssignmentId: request.assignment_id,
    })
      .then((result) => {
        if (active) setIssues(result);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [open, mode, replacement, request]);

  const resolve = async () => {
    if (!request) return;
    setSaving(true);

    if (mode === 'approve' && replacement !== 'none') {
      const member = members.find((m) => m.id === replacement);
      try {
        await api.entities.Assignment.update(request.assignment_id, {
          member_id: replacement,
          member_name: member?.full_name || '',
          status: 'confirmed',
        });
      } catch (error) {
        // the assignment may have been removed already; the request still gets resolved
      }
    }

    await api.entities.SwapRequest.update(request.id, {
      status: mode === 'approve' ? 'approved' : 'declined',
      resolution_note: note.trim(),
      suggested_member_id: mode === 'approve' ? replacement : request.suggested_member_id || '',
      suggested_member_name:
        mode === 'approve'
          ? members.find((m) => m.id === replacement)?.full_name || request.suggested_member_name || ''
          : request.suggested_member_name || '',
    });

    setSaving(false);
    toast({ title: mode === 'approve' ? 'Swap approved' : 'Swap request declined' });
    onOpenChange(false);
    onResolved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'approve' ? 'Approve the swap' : 'Decline the swap'}</DialogTitle>
          <DialogDescription>
            {request?.assigned_member_name} · {request?.position || 'Role'} ·{' '}
            {dayLabel(request?.service_date)} · {request?.service_title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'approve' && (
            <>
              <div className="space-y-2">
                <Label>Who is taking the slot?</Label>
                <Select value={replacement} onValueChange={setReplacement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a replacement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nobody yet — just approve</SelectItem>
                    {members
                      .filter((m) => m.id !== request?.assigned_member_id)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {checking ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking their schedule that day...
                </p>
              ) : (
                <ConflictList messages={issues.map((issue) => issue.message)} />
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="swap-note">Note</Label>
            <Textarea
              id="swap-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === 'approve' ? 'Anything the new volunteer needs to know' : 'Why this cannot be covered'
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={resolve} disabled={saving} variant={mode === 'approve' ? 'default' : 'destructive'}>
            {saving ? 'Saving...' : mode === 'approve' ? 'Approve swap' : 'Decline request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}