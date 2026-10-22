import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { todayISO } from '@/lib/format';
import { MEMBER_ROLE_LABELS } from '@/lib/ministry';
import MemberFormDialog from '@/components/planner/MemberFormDialog';
import ConfirmDelete from '@/components/planner/ConfirmDelete';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Mail, Phone, Plus, Search } from 'lucide-react';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [counts, setCounts] = useState({});
  const [blackouts, setBlackouts] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async (term) => {
    const today = todayISO();
    const query = term ? { full_name: { $regex: term, $options: 'i' } } : {};
    const [list, tally, blackoutRows] = await Promise.all([
      api.entities.TeamMember.filter(query, { sort: 'full_name', limit: 200 }),
      api.entities.Assignment.aggregate({
        query: { service_date: { $gte: today } },
        groupBy: 'member_id',
      }),
      api.entities.Availability.filter(
        { availability: 'unavailable', date: { $gte: today } },
        { sort: 'date', limit: 200 }
      ),
    ]);

    const countMap = {};
    (tally.rows || []).forEach((row) => {
      countMap[row.member_id] = row.count;
    });
    const blackoutMap = {};
    (blackoutRows.items || []).forEach((row) => {
      blackoutMap[row.member_id] = [...(blackoutMap[row.member_id] || []), row];
    });

    setMembers(list.items || []);
    setCounts(countMap);
    setBlackouts(blackoutMap);
    setLoading(false);
  };

  useEffect(() => {
    const term = search.trim();
    const timer = setTimeout(() => load(term), term ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleActive = async (member) => {
    await api.entities.TeamMember.update(member.id, { is_active: !member.is_active });
    load(search.trim());
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    await api.entities.TeamMember.delete(deleteTarget.id);
    setDeleteTarget(null);
    load(search.trim());
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent">People</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">Ministry team</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Volunteers, their instruments and voice parts, and how often they are serving.
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
          Add volunteer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your team"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No volunteers yet. Add the people who serve on your teams.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const memberBlackouts = blackouts[member.id] || [];
            return (
              <Card key={member.id} className={member.is_active ? 'border-border/70' : 'border-border/70 opacity-70'}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-lg font-semibold">{member.full_name}</p>
                      <Badge variant="outline" className="border-border">
                        {MEMBER_ROLE_LABELS[member.role] || member.role}
                      </Badge>
                      {!member.is_active && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {(member.instrument || member.voice_part) && (
                        <span>
                          {[member.instrument, member.voice_part].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {member.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {member.email}
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {member.phone}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {counts[member.id] || 0} upcoming
                    </span>
                    <span
                      className={`text-sm ${memberBlackouts.length ? 'text-amber-700' : 'text-muted-foreground'}`}
                    >
                      {memberBlackouts.length} blackout {memberBlackouts.length === 1 ? 'day' : 'days'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(member);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(member)}>
                        {member.is_active ? 'Pause' : 'Reactivate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(member)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MemberFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editing}
        onSaved={() => load(search.trim())}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        title="Delete this team member?"
        description={`${deleteTarget?.full_name || 'This volunteer'} will be removed from your list. Their past assignments stay on the services they served.`}
        onConfirm={confirmRemove}
      />
    </div>
  );
}