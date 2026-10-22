import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { dayLabel, formatTimeRange, todayISO } from '@/lib/format';
import { ASSIGNMENT_STATUS_LABELS, STATUS_BADGE, TEAM_LABELS } from '@/lib/ministry';
import { scanServiceConflicts } from '@/lib/conflicts';
import StatCard from '@/components/planner/StatCard';
import ConflictList from '@/components/planner/ConflictList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, CalendarDays, Clock, MapPin, RefreshCw, Send, Users } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const today = todayISO();
      const [members, services, openSwaps, newSignups, upcoming, swapList, signupList] =
        await Promise.all([
          api.entities.TeamMember.count({ is_active: true }),
          api.entities.Service.count({ service_date: { $gte: today } }),
          api.entities.SwapRequest.count({ status: 'open' }),
          api.entities.SignupInterest.count({ status: 'new' }),
          api.entities.Service.filter(
            { service_date: { $gte: today } },
            { sort: 'service_date', limit: 3 }
          ),
          api.entities.SwapRequest.filter({ status: 'open' }, { sort: '-created_date', limit: 4 }),
          api.entities.SignupInterest.filter(
            { status: 'new' },
            { sort: '-created_date', limit: 4 }
          ),
        ]);

      const nextService = (upcoming.items || [])[0] || null;
      let roster = [];
      let conflicts = {};
      if (nextService) {
        const [rosterRows, conflictMap] = await Promise.all([
          api.entities.Assignment.filter(
            { service_id: nextService.id },
            { sort: 'member_name', limit: 100 }
          ),
          scanServiceConflicts({
            serviceId: nextService.id,
            serviceDate: nextService.service_date,
          }),
        ]);
        roster = rosterRows.items || [];
        conflicts = conflictMap;
      }

      if (!active) return;
      setState({
        members,
        services,
        openSwaps,
        newSignups,
        nextService,
        roster,
        conflicts,
        swaps: swapList.items || [],
        signups: signupList.items || [],
      });
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!state) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const conflictMessages = Array.from(
    new Set(
      state.roster.flatMap((row) =>
        (state.conflicts[row.id] || []).map((issue) => `${row.member_name}: ${issue.message}`)
      )
    )
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Ministry planner</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Worship planning'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything your teams need between now and the next service.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active volunteers" value={state.members} icon={Users} to="/planner/team" />
        <StatCard
          label="Upcoming services"
          value={state.services}
          icon={CalendarDays}
          to="/planner/schedule"
        />
        <StatCard label="Open swaps" value={state.openSwaps} icon={RefreshCw} to="/planner/swaps" />
        <StatCard label="New sign-ups" value={state.newSignups} icon={Send} to="/planner/signups" />
      </div>

      {state.nextService ? (
        <Card className="border-border/70">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-accent">
                {dayLabel(state.nextService.service_date)}
              </p>
              <CardTitle className="mt-2 font-heading text-2xl">
                {state.nextService.title}
              </CardTitle>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatTimeRange(state.nextService.start_time, state.nextService.end_time)}
                </span>
                {state.nextService.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {state.nextService.location}
                  </span>
                )}
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={`/planner/schedule/${state.nextService.id}`}>
                Open service
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {conflictMessages.length > 0 && <ConflictList messages={conflictMessages} />}

            {state.roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nobody is assigned to this service yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {state.roster.map((row) => (
                  <span
                    key={row.id}
                    className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm"
                  >
                    {row.member_name}
                    <span className="text-muted-foreground">
                      {row.position || TEAM_LABELS[row.team]}
                    </span>
                    <Badge variant="outline" className={STATUS_BADGE[row.status]}>
                      {ASSIGNMENT_STATUS_LABELS[row.status]}
                    </Badge>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No services are scheduled yet.{' '}
            <Link to="/planner/schedule" className="font-medium text-primary">
              Add your first service
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-heading text-lg">Swap requests</CardTitle>
            <Link to="/planner/swaps" className="text-sm font-medium text-primary">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.swaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open swap requests. Everyone is set.
              </p>
            ) : (
              state.swaps.map((swap) => (
                <div key={swap.id} className="rounded-xl border border-border/70 px-4 py-3">
                  <p className="text-sm font-medium">
                    {swap.assigned_member_name} · {swap.position || 'Role'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {swap.service_title} · {dayLabel(swap.service_date)}
                  </p>
                  {swap.reason && (
                    <p className="mt-1.5 text-xs italic text-muted-foreground">{swap.reason}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-heading text-lg">New sign-ups</CardTitle>
            <Link to="/planner/signups" className="text-sm font-medium text-primary">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.signups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nobody has signed up to serve through the website yet.
              </p>
            ) : (
              state.signups.map((signup) => (
                <div key={signup.id} className="rounded-xl border border-border/70 px-4 py-3">
                  <p className="text-sm font-medium">{signup.full_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(signup.teams || []).map((team) => TEAM_LABELS[team] || team).join(', ') ||
                      'No team chosen'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}