import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { dayLabel } from '@/lib/format';
import { STATUS_BADGE, SWAP_STATUS_LABELS } from '@/lib/ministry';
import ResolveSwapDialog from '@/components/planner/ResolveSwapDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';

export default function Swaps() {
  const [view, setView] = useState('open');
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [mode, setMode] = useState('approve');

  const load = async (currentView) => {
    const query =
      currentView === 'open'
        ? { status: 'open' }
        : { status: { $in: ['approved', 'declined'] } };
    const [rows, memberRows] = await Promise.all([
      api.entities.SwapRequest.filter(query, { sort: '-created_date', limit: 60 }),
      api.entities.TeamMember.filter({ is_active: true }, { sort: 'full_name', limit: 300 }),
    ]);
    setRequests(rows.items || []);
    setMembers(memberRows.items || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load(view);
  }, [view]);

  const openDialog = (request, nextMode) => {
    setTarget(request);
    setMode(nextMode);
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Cover</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Swap requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          When someone cannot serve, log it here and find a replacement without losing the slot.
        </p>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <RefreshCw className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {view === 'open'
                ? 'No open swap requests. Every slot is covered.'
                : 'No resolved swap requests yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="border-border/70">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold">
                      {request.assigned_member_name}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {request.position || 'Role'}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.service_title} · {dayLabel(request.service_date)}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_BADGE[request.status]}>
                    {SWAP_STATUS_LABELS[request.status]}
                  </Badge>
                </div>

                {(request.reason || request.requested_by) && (
                  <p className="text-sm text-muted-foreground">
                    {request.reason}
                    {request.requested_by ? ` — logged by ${request.requested_by}` : ''}
                  </p>
                )}

                {request.suggested_member_name && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Suggested replacement: </span>
                    {request.suggested_member_name}
                  </p>
                )}

                {request.status !== 'open' && request.resolution_note && (
                  <p className="text-sm italic text-muted-foreground">{request.resolution_note}</p>
                )}

                {request.status === 'open' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" className="rounded-full" onClick={() => openDialog(request, 'approve')}>
                      Approve &amp; reassign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => openDialog(request, 'decline')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResolveSwapDialog
        open={!!target}
        onOpenChange={(value) => !value && setTarget(null)}
        request={target}
        mode={mode}
        members={members}
        onResolved={() => load(view)}
      />
    </div>
  );
}