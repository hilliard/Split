import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  selectResults: [] as unknown[][],
  updateRows: [] as Record<string, unknown>[],
  lastUpdateSet: undefined as Record<string, unknown> | undefined,
}));

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => mockState.selectResults.shift() ?? []),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        mockState.lastUpdateSet = values;

        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () => mockState.updateRows),
          })),
        };
      }),
    })),
  },
}));

vi.mock('../../db/schema', () => ({
  activities: Symbol('activities'),
  sessions: Symbol('sessions'),
  events: Symbol('events'),
  groupMembers: Symbol('groupMembers'),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
}));

import { POST } from '../../pages/api/activities/update';

describe('POST /api/activities/update route', () => {
  beforeEach(() => {
    mockState.selectResults = [];
    mockState.updateRows = [];
    mockState.lastUpdateSet = undefined;
  });

  it('accepts null times when editing a standalone activity', async () => {
    const sessionId = '11111111-1111-1111-1111-111111111111';
    const activityId = '22222222-2222-4222-8222-222222222222';

    mockState.selectResults.push(
      [
        {
          id: sessionId,
          userId: '33333333-3333-4333-8333-333333333333',
          expiresAt: '2999-01-01T00:00:00.000Z',
        },
      ],
      [
        {
          id: activityId,
          eventId: null,
        },
      ]
    );

    mockState.updateRows = [
      {
        id: activityId,
        title: 'Updated standalone activity',
        startTime: null,
        endTime: null,
        eventId: null,
      },
    ];

    const response = await POST({
      request: new Request('http://localhost/api/activities/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          title: 'Updated standalone activity',
          startTime: null,
          endTime: null,
        }),
      }),
      cookies: {
        get: (name: string) =>
          name === 'sessionId'
            ? {
                value: sessionId,
              }
            : undefined,
      },
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(200);
    expect(mockState.lastUpdateSet).toMatchObject({
      title: 'Updated standalone activity',
      startTime: undefined,
      endTime: undefined,
    });

    const body = (await response.json()) as {
      success: boolean;
      activity: { id: string; startTime: null; endTime: null };
    };

    expect(body.success).toBe(true);
    expect(body.activity).toMatchObject({
      id: activityId,
      startTime: null,
      endTime: null,
    });
  });

  it('returns 400 when start time is not before end time', async () => {
    const sessionId = '44444444-4444-4444-8444-444444444444';
    const activityId = '55555555-5555-4555-8555-555555555555';

    mockState.selectResults.push(
      [
        {
          id: sessionId,
          userId: '66666666-6666-4666-8666-666666666666',
          expiresAt: '2999-01-01T00:00:00.000Z',
        },
      ],
      [
        {
          id: activityId,
          eventId: null,
        },
      ]
    );

    const response = await POST({
      request: new Request('http://localhost/api/activities/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          title: 'Time range should fail',
          startTime: '2026-05-07T14:00:00.000Z',
          endTime: '2026-05-07T13:00:00.000Z',
        }),
      }),
      cookies: {
        get: (name: string) =>
          name === 'sessionId'
            ? {
                value: sessionId,
              }
            : undefined,
      },
    } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    expect(mockState.lastUpdateSet).toBeUndefined();

    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Start time must be before end time');
  });
});