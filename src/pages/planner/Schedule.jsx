import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDateLabel, formatTimeRange, todayISO } from '@/lib/format';
import { SERVICE_TYPE_LABELS, SERVICE_STATUS_LABELS, STATUS_BADGE } from '@/lib/ministry';
import ServiceFormDialog from '@/components/planner/ServiceFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, CalendarDays, Clock, MapPin, Plus, Users } from 'lucide-react';

export default function Schedule() {
  const [view, setView] = useState('upcoming');
  const [services, setServices] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async (currentView) => {
    const today = todayISO();
    const query =
      currentView === 'upcoming'
        ? { service_date: { $gte: today } }
        : { service_date: { $lt: today } };
    const [list, tally] = await Promise.all([
      base44.entities.Service.filter(query, {
        sort: currentView === 'upcoming' ? 'service_date' : '-service_date',
        limit: 60,
      }),
      base44.entities.Assignment.aggregate({ query, groupBy: 'service_id' }),
    ]);
    const map = {};
    (tally.rows || []).forEach((row) => {
      map[row.service_id] = row.count;
    });
    setServices(list.items || []);
    setCounts(map);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load(view);
  }, [view]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Schedule</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">Services &amp; rehearsals</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Build each gathering, then fill the team from your volunteer list.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add service
        </Button>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {view === 'upcoming'
                ? 'Nothing on the calendar yet. Add your next Sunday service or rehearsal.'
                : 'No past services recorded yet.'}
            </p>
            {view === 'upcoming' && (
              <Button variant="outline" className="rounded-full" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Link key={service.id} to={`/planner/schedule/${service.id}`} className="block">
              <Card className="border-border/70 transition-transform hover:-translate-y-0.5">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-secondary">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {formatDateLabel(service.service_date, 'MMM')}
                      </span>
                      <span className="font-heading text-lg font-semibold leading-none">
                        {formatDateLabel(service.service_date, 'd')}
                      </span>
                    </div>
                    <div>
                      <p className="font-heading text-lg font-semibold">{service.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{formatDateLabel(service.service_date, 'EEEE')}</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeRange(service.start_time, service.end_time)}
                        </span>
                        {service.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {service.location}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-border">
                      {SERVICE_TYPE_LABELS[service.service_type]}
                    </Badge>
                    <Badge variant="outline" className={STATUS_BADGE[service.status]}>
                      {SERVICE_STATUS_LABELS[service.status]}
                    </Badge>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {counts[service.id] || 0} serving
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => load(view)} />
    </div>
  );
}