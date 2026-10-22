import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { formatDateLabel, formatTimeRange, nextSundayISO } from '@/lib/format';
import { SERVICE_TYPE_LABELS } from '@/lib/ministry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Check, Clock, X } from 'lucide-react';

export default function Availability() {
  const [date, setDate] = useState(nextSundayISO());
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [services, setServices] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (day) => {
    const [memberRows, recordRows, serviceRows, blackoutRows] = await Promise.all([
      api.entities.TeamMember.filter({ is_active: true }, { sort: 'full_name', limit: 300 }),
      api.entities.Availability.filter({ date: day }, { limit: 300 }),
      api.entities.Service.filter({ service_date: day }, { sort: 'start_time', limit: 20 }),
      api.entities.Availability.filter(
        { availability: 'unavailable', date: { $gte: nextSundayISO() } },
        { sort: 'date', limit: 100 }
      ),
    ]);
    setMembers(memberRows.items || []);
    setRecords(recordRows.items || []);
    setServices(serviceRows.items || []);
    setBlackouts(blackoutRows.items || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load(date);
  }, [date]);

  const recordFor = (memberId) => records.find((r) => r.member_id === memberId);

  const setAvailability = async (member, availability) => {
    const existing = recordFor(member.id);
    if (existing) {
      await api.entities.Availability.update(existing.id, { availability });
    } else {
      await api.entities.Availability.create({
        member_id: member.id,
        member_name: member.full_name,
        date,
        availability,
      });
    }
    load(date);
  };

  const saveNote = async (member, note) => {
    const existing = recordFor(member.id);
    if (!existing) return;
    await api.entities.Availability.update(existing.id, { note });
    load(date);
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Availability</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Who can serve when</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mark the days each volunteer cannot serve. Blackout days show up as conflicts when you
          build a roster.
        </p>
      </div>

      <Card className="border-border/70">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <Label htmlFor="availability-date">Date</Label>
            <Input
              id="availability-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{formatDateLabel(date, 'EEEE, MMM d')}</p>
            {services.length === 0 ? (
              <p>No services scheduled on this day.</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {services.map((service) => (
                  <li key={service.id} className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {service.title} · {formatTimeRange(service.start_time, service.end_time)}
                    <Badge variant="outline" className="border-border">
                      {SERVICE_TYPE_LABELS[service.service_type]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add volunteers to your team first.</p>
          ) : (
            members.map((member) => {
              const record = recordFor(member.id);
              const unavailable = record?.availability === 'unavailable';
              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{member.full_name}</p>
                    {member.instrument || member.voice_part ? (
                      <p className="text-xs text-muted-foreground">
                        {[member.instrument, member.voice_part].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {unavailable && (
                      <Input
                        defaultValue={record?.note || ''}
                        placeholder="Reason (optional)"
                        className="h-9 w-48"
                        onBlur={(e) => {
                          if (e.target.value !== (record?.note || '')) saveNote(member, e.target.value);
                        }}
                      />
                    )}
                    <Button
                      size="sm"
                      variant={record?.availability === 'available' ? 'default' : 'outline'}
                      className="rounded-full"
                      onClick={() => setAvailability(member, 'available')}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Available
                    </Button>
                    <Button
                      size="sm"
                      variant={unavailable ? 'destructive' : 'outline'}
                      className="rounded-full"
                      onClick={() => setAvailability(member, 'unavailable')}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Unavailable
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Upcoming blackout days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {blackouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody has blocked out a day yet.
            </p>
          ) : (
            blackouts.map((blackout) => (
              <div
                key={blackout.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm"
              >
                <span className="font-medium text-amber-900">{blackout.member_name}</span>
                <span className="text-amber-800">
                  {formatDateLabel(blackout.date, 'EEE, MMM d')}
                  {blackout.note ? ` · ${blackout.note}` : ''}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}