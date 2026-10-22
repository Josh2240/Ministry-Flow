import { base44 } from '@/api/base44Client';
import { formatTime } from '@/lib/format';

export function shiftsOverlap(aStart, aEnd, bStart, bEnd) {
  const start1 = aStart || '00:00';
  const end1 = aEnd || '23:59';
  const start2 = bStart || '00:00';
  const end2 = bEnd || '23:59';
  return start1 < end2 && start2 < end1;
}

function blackoutBlocks(blackout, startTime, endTime) {
  if (!blackout.from_time && !blackout.to_time) return true;
  return shiftsOverlap(startTime, endTime, blackout.from_time, blackout.to_time);
}

function blackoutMessage(blackout) {
  return `Marked unavailable this day${blackout.note ? ` — ${blackout.note}` : ''}`;
}

/** Checks one volunteer against the day's other services and any blackout dates. */
export async function checkAssignmentConflicts({
  memberId,
  serviceId,
  serviceDate,
  startTime,
  endTime,
  team,
  position,
  excludeAssignmentId,
}) {
  if (!memberId || !serviceDate) return [];
  const [bookings, blackouts] = await Promise.all([
    base44.entities.Assignment.filter({
      member_id: memberId,
      service_date: serviceDate,
    }),
    base44.entities.Availability.filter({
      member_id: memberId,
      date: serviceDate,
      availability: 'unavailable',
    }),
  ]);

  const issues = [];
  (bookings || [])
    .filter((b) => b.id !== excludeAssignmentId)
    .forEach((b) => {
      if (b.service_id === serviceId) {
        if (b.team === team && b.position === position) {
          issues.push({
            type: 'duplicate_role',
            message: `Already serving in this service (${b.position || 'another role'})`,
          });
        }
      } else if (shiftsOverlap(startTime, endTime, b.start_time, b.end_time)) {
        issues.push({
          type: 'double_booked',
          message: `Also serving ${b.service_title} at ${formatTime(b.start_time)}`,
        });
      }
    });

  (blackouts || [])
    .filter((b) => blackoutBlocks(b, startTime, endTime))
    .forEach((b) => issues.push({ type: 'unavailable', message: blackoutMessage(b) }));

  return issues;
}

/** Scans a whole service roster: clashes across the day plus blackout dates. */
export async function scanServiceConflicts({ serviceId, serviceDate }) {
  if (!serviceId || !serviceDate) return {};
  const [dayAssignments, blackouts] = await Promise.all([
    base44.entities.Assignment.filter({ service_date: serviceDate }, { limit: 400 }),
    base44.entities.Availability.filter(
      { date: serviceDate, availability: 'unavailable' },
      { limit: 400 }
    ),
  ]);

  const rows = dayAssignments.items || [];
  const blackoutRows = blackouts.items || [];
  const issues = {};

  const add = (id, issue) => {
    if (!id) return;
    issues[id] = [...(issues[id] || []), issue];
  };

  rows.forEach((row) => {
    rows
      .filter((other) => other.member_id === row.member_id && other.id !== row.id)
      .forEach((other) => {
        if (other.service_id === row.service_id) {
          if (other.team === row.team && other.position === row.position) {
            add(row.id, {
              type: 'duplicate_role',
              message: `Assigned twice in this service (${other.position || 'another role'})`,
            });
          }
        } else if (shiftsOverlap(row.start_time, row.end_time, other.start_time, other.end_time)) {
          add(row.id, {
            type: 'double_booked',
            message: `Also serving ${other.service_title} at ${formatTime(other.start_time)}`,
          });
        }
      });

    blackoutRows
      .filter((b) => b.member_id === row.member_id)
      .forEach((b) => {
        if (blackoutBlocks(b, row.start_time, row.end_time)) {
          add(row.id, { type: 'unavailable', message: blackoutMessage(b) });
        }
      });
  });

  Object.keys(issues).forEach((key) => {
    const seen = {};
    issues[key] = issues[key].filter((issue) => {
      if (seen[issue.message]) return false;
      seen[issue.message] = true;
      return true;
    });
  });

  return issues;
}