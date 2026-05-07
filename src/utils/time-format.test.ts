import { describe, expect, it } from 'vitest';
import { formatDateTime, formatTime, formatTimeRange } from './time-format';

describe('time-format utils', () => {
  const sampleIso = '2026-05-15T14:30:00.000Z';
  const sampleEndIso = '2026-05-15T15:35:00.000Z';

  it('formats UTC date-time deterministically', () => {
    expect(formatDateTime(sampleIso, { mode: 'utc' })).toBe('May 15, 02:30 PM');
  });

  it('formats UTC time deterministically', () => {
    expect(formatTime(sampleEndIso, { mode: 'utc' })).toBe('03:35 PM');
  });

  it('formats time range with end time', () => {
    expect(formatTimeRange(sampleIso, sampleEndIso, { mode: 'utc' })).toBe(
      'May 15, 02:30 PM - 03:35 PM'
    );
  });

  it('returns null for invalid input', () => {
    expect(formatDateTime('not-a-date', { mode: 'utc' })).toBeNull();
    expect(formatTime(null, { mode: 'utc' })).toBeNull();
    expect(formatTimeRange(undefined, sampleEndIso, { mode: 'utc' })).toBeNull();
  });
});
