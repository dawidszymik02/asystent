export interface RecurrenceOption {
  label: string;
  value: string | null;
}

export const RECURRENCE_OPTIONS: RecurrenceOption[] = [
  { label: 'Nie powtarza się', value: null },
  { label: 'Codziennie',       value: 'FREQ=DAILY' },
  { label: 'Co tydzień',       value: 'FREQ=WEEKLY' },
  { label: 'Co 2 tygodnie',    value: 'FREQ=WEEKLY;INTERVAL=2' },
  { label: 'Co miesiąc',       value: 'FREQ=MONTHLY' },
  { label: 'Co rok',           value: 'FREQ=YEARLY' },
];

export const DELETE_MODE_OPTIONS = [
  { label: 'To wydarzenie',              value: 'this' },
  { label: 'To i następne wydarzenia',   value: 'future' },
  { label: 'Wszystkie wydarzenia',       value: 'all' },
] as const;

export type DeleteMode = 'this' | 'future' | 'all';
