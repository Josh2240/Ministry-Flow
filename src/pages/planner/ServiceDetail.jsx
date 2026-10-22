import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { dayLabel, formatTimeRange } from '@/lib/format';
import {
  ASSIGNMENT_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_BADGE,
} from '@/lib/ministry';
import { scanServiceConflicts } from '@/lib/conflicts';
import RosterList from '@/components/planner/RosterList';
import ConflictList from '@/components/planner/ConflictList';
import AssignmentDialog from '@/components/planner/AssignmentDialog';
import SwapRequestDialog from '@/components/planner/SwapRequestDialog';
import SetlistEditor from '@/components/planner/SetlistEditor';
import ServiceFormDialog from '@/components/planner/ServiceFormDialog';
import ConfirmDelete from '@/components/planner/ConfirmDelete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Clock, MapPin, Pencil, Plus, RefreshCw } from 'lucide-react';
import { SWAP_STATUS_LABELS } from '@/lib/ministry';

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [roster, setRoster] = useState([]);
  const [conflicts, setConflicts] = useState({});
  const [setlist, setSetlist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [members, setMembers] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    const svc = await base44.entities.Service.get(serviceId);
    const [rosterRows, songRows, memberRows, setlistRows, swapRows, conflictMap] = await Promise.all([
      base44.entities.Assignment.filter({ service_id: serviceId }, { sort: 'member_name', limit: 100 }),
      base44.entities.Song.list({ sort: 'title', limit: 300 }),
      base44.entities.TeamMember.filter({ is_active: true }, { sort: 'full_name', limit: 300 }),
      base44.entities.Setlist.filter({ service_id: serviceId }, { limit: 1 }),
      base44.entities.SwapRequest.filter({ service_id: serviceId }, { sort: '-created_date', limit: 20 }),
      scanServiceConflicts({ serviceId, serviceDate: svc.service_date }),
    ]);
    setService(svc);
    setRoster(rosterRows.items || []);
    setSongs(songRows.items || []);
    setMembers(memberRows.items || []);
    setSetlist((setlistRows.items || [])[0] || null);
    setSwaps(swapRows.items || []);
    setConflicts(conflictMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const conflictMessages = Array.from(
    new Set(
      roster.flatMap((row) =>
        (conflicts[row.id] || []).map((issue) => `${row.member_name}: ${issue.message}`)
      )
    )
  );

  const setStatus = async (row, status) => {
    await base44.entities.Assignment.update(row.id, { status });
    load();
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    await base44.entities.Assignment.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-7">
      <Link
        to="/planner/schedule"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to schedule
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent">
            {dayLabel(service.service_date)}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">{service.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTimeRange(service.start_time, service.end_time)}
            </span>
            {service.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {service.location}
              </span>
            )}
            <Badge variant="outline" className="border-border">
              {SERVICE_TYPE_LABELS[service.service_type]}
            </Badge>
            <Badge variant="outline" className={STATUS_BADGE[service.status]}>
              {SERVICE_STATUS_LABELS[service.status]}
            </Badge>
          </p>
          {service.notes && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{service.notes}</p>
          )}
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => setServiceOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit service
        </Button>
      </div>

      {conflictMessages.length > 0 && <ConflictList messages={conflictMessages} />}

      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-heading text-xl">Team roster</CardTitle>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditing(null);
              setAssignOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add volunteer
          </Button>
        </CardHeader>
        <CardContent>
          <RosterList
            assignments={roster}
            conflicts={conflicts}
            onEdit={(row) => {
              setEditing(row);
              setAssignOpen(true);
            }}
            onStatus={setStatus}
            onSwap={setSwapTarget}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Setlist</CardTitle>
        </CardHeader>
        <CardContent>
          <SetlistEditor service={service} setlist={setlist} songs={songs} onChanged={load} />
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="font-heading text-xl">Swap requests</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/planner/swaps">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Review
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {swaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No swap requests for this service. Use the roster menu to log one.
            </p>
          ) : (
            swaps.map((swap) => (
              <div
                key={swap.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {swap.assigned_member_name} · {swap.position || 'Role'}
                  </p>
                  {swap.reason && (
                    <p className="mt-1 text-xs text-muted-foreground">{swap.reason}</p>
                  )}
                </div>
                <Badge variant="outline" className={STATUS_BADGE[swap.status]}>
                  {SWAP_STATUS_LABELS[swap.status]}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AssignmentDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        service={service}
        assignment={editing}
        members={members}
        onSaved={load}
      />

      <ServiceFormDialog
        open={serviceOpen}
        onOpenChange={setServiceOpen}
        service={service}
        onSaved={load}
      />

      <SwapRequestDialog
        open={!!swapTarget}
        onOpenChange={(value) => !value && setSwapTarget(null)}
        service={service}
        assignment={swapTarget}
        members={members}
        onCreated={load}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        title="Remove from this service?"
        description={`${deleteTarget?.member_name || 'This volunteer'} will be taken off ${service.title}. They stay on your team list.`}
        onConfirm={confirmRemove}
      />
    </div>
  );
}