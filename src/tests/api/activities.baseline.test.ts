import { describe, it, expect } from 'vitest';
import { createActivitySchema } from '../../../src/pages/api/activities/create';

describe('Activities Create Schema Baseline', () => {
  it('valid input passes validation', () => {
    const valid = {
      eventId: null,
      title: 'Test Activity',
      startTime: '2024-01-01T12:00:00Z',
      endTime: '2024-01-01T13:00:00Z',
    };
    expect(() => createActivitySchema.parse(valid)).not.toThrow();
  });

  it('invalid input fails validation', () => {
    const invalid = {
      eventId: null,
      // Missing title
      startTime: '2024-01-01T12:00:00Z',
    };
    expect(() => createActivitySchema.parse(invalid)).toThrow();
  });
});
