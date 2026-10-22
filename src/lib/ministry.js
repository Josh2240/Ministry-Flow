export const TEAM_LABELS = {
  worship_leader: 'Worship Leader',
  vocals: 'Vocals',
  band: 'Band',
  media: 'Media & Livestream',
  sound: 'Sound',
  lighting: 'Lighting',
  other: 'Other',
};

export const TEAM_OPTIONS = Object.entries(TEAM_LABELS).map(([value, label]) => ({ value, label }));

export const MEMBER_ROLE_LABELS = {
  worship_leader: 'Worship Leader',
  vocalist: 'Vocalist',
  musician: 'Musician',
  media: 'Media',
  sound: 'Sound',
  lighting: 'Lighting',
  other: 'Other',
};

export const MEMBER_ROLE_OPTIONS = Object.entries(MEMBER_ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const SERVICE_TYPE_LABELS = {
  sunday_morning: 'Sunday Morning',
  sunday_evening: 'Sunday Evening',
  midweek: 'Midweek',
  rehearsal: 'Rehearsal',
  special_event: 'Special Event',
};

export const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const SERVICE_STATUS_LABELS = { draft: 'Draft', confirmed: 'Confirmed', completed: 'Completed' };
export const SERVICE_STATUS_OPTIONS = Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const ASSIGNMENT_STATUS_LABELS = { pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined' };

export const STATUS_BADGE = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  joined: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const SWAP_STATUS_LABELS = { open: 'Open', approved: 'Approved', declined: 'Declined' };
export const SIGNUP_STATUS_LABELS = { new: 'New', contacted: 'Contacted', joined: 'Joined', declined: 'Declined' };

export const POSITION_PRESETS = [
  'Worship Leader',
  'Acoustic Guitar',
  'Electric Guitar',
  'Bass',
  'Drums',
  'Keys',
  'Vocals 1',
  'Vocals 2',
  'Vocals 3',
  'Sound Engineer',
  'Media / Lyrics',
  'Livestream',
  'Camera',
];

export const SIGNUP_TEAM_OPTIONS = [
  { value: 'vocals', label: 'Vocalist' },
  { value: 'band', label: 'Musician / Band' },
  { value: 'media', label: 'Media & Livestream' },
  { value: 'sound', label: 'Sound' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'other', label: 'Welcome & Hospitality' },
];

export const TEAM_ORDER = ['worship_leader', 'vocals', 'band', 'media', 'sound', 'lighting', 'other'];