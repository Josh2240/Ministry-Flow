import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { churchInfo } from '@/lib/churchInfo';
import { todayISO } from '@/lib/format';
import { Button } from '@/components/ui/button';
import ServiceTimesList from '@/components/site/ServiceTimesList';
import RosterCard from '@/components/site/RosterCard';
import PublicSetlistCard from '@/components/site/PublicSetlistCard';
import { ArrowRight, Heart } from 'lucide-react';

export default function Home() {
  const [times, setTimes] = useState([]);
  const [services, setServices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [setlists, setSetlists] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const today = todayISO();
      try {
        const [timeRows, serviceRows, setlistRows] = await Promise.all([
          api.entities.ServiceTime.filter({ is_active: true }, { sort: 'time', limit: 20 }),
          api.entities.Service.filter(
            { service_date: { $gte: today } },
            { sort: 'service_date', limit: 4 }
          ),
          api.entities.Setlist.filter(
            { is_published: true, service_date: { $gte: today } },
            { sort: 'service_date', limit: 3 }
          ),
        ]);
        const upcoming = serviceRows.items || [];
        let roster = [];
        if (upcoming.length) {
          const rows = await api.entities.Assignment.filter(
            { service_id: { $in: upcoming.map((s) => s.id) } },
            { limit: 200 }
          );
          roster = rows.items || [];
        }
        if (!active) return;
        setTimes(timeRows.items || []);
        setServices(upcoming);
        setAssignments(roster);
        setSetlists(setlistRows.items || []);
      } catch (error) {
        // A visitor who is not signed in still sees the welcome content
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section className="bg-sanctuary border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">
            Welcome home
          </p>
          <h1 className="mt-5 max-w-3xl text-balance font-heading text-4xl font-semibold leading-[1.05] sm:text-6xl">
            {churchInfo.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {churchInfo.intro}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/service-times">
                Join us this Sunday
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/serve">Serve on a team</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">{churchInfo.serviceNote}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Gather with us</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Our regular rhythm of worship through the week.
        </p>
        <div className="mt-8">
          <ServiceTimesList times={times} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">Who is serving</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The teams leading our next gatherings.
            </p>
          </div>
          <Link
            to="/service-times"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            See all upcoming teams
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {services.slice(0, 2).map((service) => (
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
      </section>

      <section className="bg-secondary/40 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                Songs &amp; setlists
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                What we are singing together, so you can learn it at home.
              </p>
            </div>
            <Link
              to="/songs-setlists"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Browse the song library
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {setlists.map((setlist) => (
              <PublicSetlistCard key={setlist.id} setlist={setlist} />
            ))}
          </div>
          {setlists.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">
              This week&rsquo;s setlist will be published soon.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="rounded-3xl border border-border/70 bg-sanctuary px-6 py-14 text-center sm:px-16">
          <Heart className="mx-auto h-7 w-7 text-accent" />
          <h2 className="mt-5 font-heading text-2xl font-semibold sm:text-4xl">
            Everyone has something to bring
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Whether you sing, play, run lyrics, mix sound or simply welcome people at the door,
            there is a place for you on one of our teams.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link to="/serve">Tell us you want to serve</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}