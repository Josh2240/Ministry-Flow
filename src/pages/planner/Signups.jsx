import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { formatDateTime } from '@/lib/format';
import { SIGNUP_STATUS_LABELS, STATUS_BADGE, TEAM_LABELS } from '@/lib/ministry';
import AddFromSignupDialog from '@/components/planner/AddFromSignupDialog';
import ConfirmDelete from '@/components/planner/ConfirmDelete';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, Send } from 'lucide-react';

export default function Signups() {
  const [view, setView] = useState('new');
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async (currentView) => {
    const query = currentView === 'new' ? { status: 'new' } : {};
    const rows = await api.entities.SignupInterest.filter(query, {
      sort: '-created_date',
      limit: 80,
    });
    setSignups(rows.items || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load(view);
  }, [view]);

  const markStatus = async (signup, status) => {
    await api.entities.SignupInterest.update(signup.id, { status });
    load(view);
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    await api.entities.SignupInterest.delete(deleteTarget.id);
    setDeleteTarget(null);
    load(view);
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Website</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Sign-ups to serve</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everyone who filled in the form on your website. Follow up, then add them to a team.
        </p>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : signups.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Send className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {view === 'new'
                ? 'No new sign-ups right now.'
                : 'Nobody has signed up to serve yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {signups.map((signup) => (
            <Card key={signup.id} className="border-border/70">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold">{signup.full_name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {signup.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {signup.email}
                        </span>
                      )}
                      {signup.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {signup.phone}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_BADGE[signup.status]}>
                    {SIGNUP_STATUS_LABELS[signup.status] || signup.status}
                  </Badge>
                </div>

                {(signup.teams || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {signup.teams.map((team) => (
                      <span
                        key={team}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                      >
                        {TEAM_LABELS[team] || team}
                      </span>
                    ))}
                  </div>
                )}

                {signup.experience && (
                  <p className="text-sm text-muted-foreground">{signup.experience}</p>
                )}
                {signup.message && <p className="text-sm text-muted-foreground">{signup.message}</p>}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDateTime(signup.created_date)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-full" onClick={() => setTarget(signup)}>
                      Add to team
                    </Button>
                    {signup.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => markStatus(signup, 'contacted')}
                      >
                        Mark contacted
                      </Button>
                    )}
                    {signup.status !== 'declined' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markStatus(signup, 'declined')}
                      >
                        Not a fit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(signup)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddFromSignupDialog
        open={!!target}
        onOpenChange={(value) => !value && setTarget(null)}
        signup={target}
        onAdded={() => load(view)}
      />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
        title="Delete this sign-up?"
        description={`${deleteTarget?.full_name || 'This response'} will be removed from the list.`}
        onConfirm={confirmRemove}
      />
    </div>
  );
}