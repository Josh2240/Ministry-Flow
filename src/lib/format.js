import { format, parseISO } from 'date-fns';

export function toDate(value) {
  if (!value) return null;
  const parsed = typeof value === 'string' && value.length <= 10 ? parseISO(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy-MM-dd');
}

export function nextSundayISO() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return format(d, 'yyyy-MM-dd');
}

export function formatDateLabel(value, pattern = 'EEE, MMM d') {
  const d = toDate(value);
  return d ? format(d, pattern) : '';
}

export function dayLabel(value) {
  const iso = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!iso) return '';
  if (iso === todayISO()) return 'Today';
  if (iso === addDaysISO(1)) return 'Tomorrow';
  return formatDateLabel(iso, 'EEEE, MMM d');
}

export function formatTime(value) {
  if (!value) return '';
  const [rawHour, rawMinute] = String(value).split(':');
  const hour = Number(rawHour);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${(rawMinute || '00').slice(0, 2)} ${suffix}`;
}

export function formatTimeRange(start, end) {
  if (!start) return '';
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? format(d, 'MMM d, h:mm a') : '';
}