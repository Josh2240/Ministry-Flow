import React, { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { churchInfo } from '@/lib/churchInfo';
import { todayISO } from '@/lib/format';
import ServiceTimesList from '@/components/site/ServiceTimesList';
import RosterCard from '@/components/site/RosterCard';

export default function ServiceTimesPage() {
  const [times, setTimes] = useState([]);
  const [services, setServices] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [timeRows, serviceRows] = await Promise.all([
          api.entities.ServiceTime.filter({ is_active: true }, { sort: 'time', limit: 20 }),
          api.entities.Service.filter(
            { service_date: { $gte: todayISO() } },
            { sort: 'service_date', limit: 6 }
          ),
        ]);
        const upcoming = serviceRows.items || [];
        let roster = [];
        if (upcoming.length) {
          const rows = await api.entities.Assignment.filter(
            { service_id: { $in: upcoming.map((s) => s.id) } },
            { limit: 300 }
          );
          roster = rows.items || [];
        }
        if (!active) return;
        setTimes(timeRows.items || []);
        setServices(upcoming);
        setAssignments(roster);
      } catch (error) {
        // Visitors who are not signed in still see the welcome content
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="text-xs uppercase tracking-[0.24em] text-accent">Gather with us</p>
      <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-5xl">Service times</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {churchInfo.name} gathers at {churchInfo.address}, {churchInfo.city}. Come as you are — there
        is always room.
      </p>

      <div className="mt-10">
        <ServiceTimesList times={times} />
      </div>

      <div className="mt-20">
        <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Upcoming teams</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Who is leading worship, running media and serving on the team.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {services.map((service) => (
            <RosterCard
              key={service.id}
              service={service}
              assignments={assignments.filter((a) => a.service_id === service.id)}
            />
          ))}
        </div>

        {services.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            Upcoming service teams will appear here once the schedule is set.
          </p>
        )}
      </div>
    </div>
  );
}