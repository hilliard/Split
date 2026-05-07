export type TimeDisplayMode = 'utc' | 'event' | 'browser';

type DateInput = Date | string | null | undefined;

type FormatOptions = {
  mode?: TimeDisplayMode;
  eventTimezone?: string | null;
  locale?: string;
};

const DEFAULT_LOCALE = 'en-US';

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveTimeZone(mode: TimeDisplayMode, eventTimezone?: string | null): string | undefined {
  if (mode === 'utc') return 'UTC';
  if (mode === 'event') return eventTimezone || 'UTC';
  return undefined;
}

export function formatDateTime(value: DateInput, options: FormatOptions = {}): string | null {
  const date = toDate(value);
  if (!date) return null;

  const mode = options.mode || 'utc';
  const locale = options.locale || DEFAULT_LOCALE;
  const timeZone = resolveTimeZone(mode, options.eventTimezone);

  return date.toLocaleString(locale, {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(value: DateInput, options: FormatOptions = {}): string | null {
  const date = toDate(value);
  if (!date) return null;

  const mode = options.mode || 'utc';
  const locale = options.locale || DEFAULT_LOCALE;
  const timeZone = resolveTimeZone(mode, options.eventTimezone);

  return date.toLocaleTimeString(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRange(
  startValue: DateInput,
  endValue: DateInput,
  options: FormatOptions = {}
): string | null {
  const start = formatDateTime(startValue, options);
  if (!start) return null;

  const end = formatTime(endValue, options);
  return end ? `${start} - ${end}` : start;
}
