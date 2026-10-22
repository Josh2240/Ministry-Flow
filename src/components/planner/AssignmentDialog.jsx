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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ASSIGNMENT_STATUS_LABELS, POSITION_PRESETS, TEAM_OPTIONS } from '@/lib/ministry';
import { checkAssignmentConflicts } from '@/lib/conflicts';
import ConflictList from '@/components/planner/ConflictList';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const MEMBER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'worship_leader', label: 'Worship Leader' },
  { value: 'vocals', label: 'Vocals' },
  { value: 'instrumentalist', label: 'Instrumentalist / Music team' },
  { value: 'support', label: 'Media & Sound' },
];

export default function AssignmentDialog({
  open,
  onOpenChange,
  service,
  assignment,
  members = [],
  onSaved,
}) {
  const { toast } = useToast();
  const [memberId, setMemberId] = useState('');
  const [team, setTeam] = useState('band');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [issues, setIssues] = useState([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberFilter, setMemberFilter] = useState('all');

  const visibleMembers = members.filter((member) => {
    if (memberFilter === 'all') return true;
    if (memberFilter === 'instrumentalist') return member.role === 'musician';
    if (memberFilter === 'support') return ['media', 'sound', 'lighting'].includes(member.role);
    return member.role === memberFilter;
  });

  useEffect(() => {
    if (!open) return;
    setMemberId(assignment?.member_id || '');
    setTeam(assignment?.team || 'band');
    setPosition(assignment?.position || '');
    setStatus(assignment?.status || 'pending');
    setNotes(assignment?.notes || '');
    setIssues([]);
    setMemberFilter('all');
  }, [open, assignment]);

  useEffect(() => {
    if (!open || !memberId || !service) return;
    let active = true;
    setChecking(true);
    checkAssignmentConflicts({
      memberId,
      serviceId: service.id,
      serviceDate: service.service_date,
      startTime: service.start_time,
      endTime: service.end_time,
      team,
      position,
      excludeAssignmentId: assignment?.id,
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
  }, [open, memberId, team, position, service, assignment]);

  const save = async () => {
    if (!memberId) {
      toast({ title: 'Pick a team member first', variant: 'destructive' });
      return;
    }
    const member = members.find((m) => m.id === memberId);
    setSaving(true);
    const payload = {
      service_id: service.id,
      service_title: service.title,
      service_date: service.service_date,
      start_time: service.start_time,
      end_time: service.end_time || '',
      member_id: memberId,
      member_name: member?.full_name || '',
      team,
      position: position.trim(),
      status,
      notes: notes.trim(),
    };
    if (assignment?.id) {
      await base44.entities.Assignment.update(assignment.id, payload);
    } else {
      await base44.entities.Assignment.create(payload);
    }
    setSaving(false);
    toast({ title: assignment?.id ? 'Assignment updated' : 'Added to the roster' });
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment?.id ? 'Edit assignment' : 'Add to the roster'}</DialogTitle>
          <DialogDescription>{service?.title}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Team member</Label>
            <div className="flex flex-wrap gap-1.5">
              {MEMBER_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setMemberFilter(filter.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    memberFilter === filter.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a volunteer" />
              </SelectTrigger>
              <SelectContent>
                {visibleMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                    {member.instrument ? ` — ${member.instrument}` : ''}
                  </SelectItem>
                ))}
                {visibleMembers.length === 0 && (
                  <SelectItem value="none" disabled>
                    No volunteers in this group yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={team} onValueChange={setTeam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-position">Position</Label>
            <Input
              id="assignment-position"
              list="position-presets"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Keys, Vocals 2, Livestream..."
            />
            <datalist id="position-presets">
              {POSITION_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Confirmation</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSIGNMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="assignment-notes">Notes</Label>
            <Textarea
              id="assignment-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {checking ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking the rest of that day...
          </p>
        ) : (
          <ConflictList messages={issues.map((issue) => issue.message)} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}