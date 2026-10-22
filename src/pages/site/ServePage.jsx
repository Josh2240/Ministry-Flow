import React from 'react';
import { churchInfo } from '@/lib/churchInfo';
import ServeForm from '@/components/site/ServeForm';

const expectations = [
  'A short conversation with a ministry leader before your first service.',
  'A rehearsal or two so you are comfortable with the team and the room.',
  'A simple rotating schedule, so you know your dates well in advance.',
  'Grace when life happens — swap requests are always welcome.',
];

export default function ServePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Serve with us</p>
          <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-5xl">
            Join one of our ministry teams
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Our worship, band, media and service teams are made up of ordinary people who love
            Jesus and love this church. Tell us a little about yourself and a leader will get in
            touch.
          </p>

          <ul className="mt-9 space-y-3">
            {expectations.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-muted-foreground">
            Prefer to talk first? Call the church office on {churchInfo.phone} or email{' '}
            {churchInfo.email}.
          </p>
        </div>

        <ServeForm />
      </div>
    </div>
  );
}