import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';

/**
 * UNIT TESTS FOR ACTIVITIES API VALIDATION
 * 
 * These tests verify that the activity creation endpoint validates input correctly.
 * They don't require a running database or API server.
 */

const createActivitySchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  title: z.string().min(1, 'Activity title is required').max(255),
  startTime: z.union([
    z.null(),
    z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v), 'Invalid start time format')
  ]).optional().transform(v => (v === null || v === '') ? undefined : v),
  endTime: z.union([
    z.null(),
    z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v), 'Invalid end time format')
  ]).optional().transform(v => (v === null || v === '') ? undefined : v),
  locationName: z.union([
    z.null(),
    z.string().max(255)
  ]).optional().transform(v => (v === null || v === '') ? undefined : v),
  sequenceOrder: z.number().int().nonnegative().default(0),
});

describe('Activities API Validation', () => {
  describe('createActivitySchema', () => {
    it('should reject invalid event ID', () => {
      const invalidData = {
        eventId: 'not-a-uuid',
        title: 'Breakfast',
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });

    it('should reject empty title', () => {
      const invalidData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });

    it('should accept minimal valid activity', () => {
      const validData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
      };
      const result = createActivitySchema.parse(validData);
      expect(result.title).toBe('Breakfast');
      expect(result.startTime).toBeUndefined();
      expect(result.endTime).toBeUndefined();
    });

    it('should accept activity with times', () => {
      const validData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
        startTime: '2026-04-08T08:00',
        endTime: '2026-04-08T09:00',
      };
      const result = createActivitySchema.parse(validData);
      expect(result.startTime).toBe('2026-04-08T08:00');
      expect(result.endTime).toBe('2026-04-08T09:00');
    });

    it('should reject invalid start time format', () => {
      const invalidData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
        startTime: 'not-a-datetime',
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });

    it('should transform null values to undefined', () => {
      const dataWithNull = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
        startTime: null,
        endTime: null,
        locationName: null,
      };
      const result = createActivitySchema.parse(dataWithNull);
      expect(result.startTime).toBeUndefined();
      expect(result.endTime).toBeUndefined();
      expect(result.locationName).toBeUndefined();
    });

    it('should handle optional location name', () => {
      const validData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
        locationName: 'Downtown Café',
      };
      const result = createActivitySchema.parse(validData);
      expect(result.locationName).toBe('Downtown Café');
    });

    it('should reject too long title', () => {
      const invalidData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'a'.repeat(256),
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });

    it('should default sequence order to 0', () => {
      const validData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
      };
      const result = createActivitySchema.parse(validData);
      expect(result.sequenceOrder).toBe(0);
    });

    it('should accept custom sequence order', () => {
      const validData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
        sequenceOrder: 5,
      };
      const result = createActivitySchema.parse(validData);
      expect(result.sequenceOrder).toBe(5);
    });

    it('should reject negative sequence order', () => {
      const invalidData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Breakfast',
        sequenceOrder: -1,
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });
  });
});
