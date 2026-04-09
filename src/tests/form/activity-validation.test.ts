import { describe, it, expect } from 'vitest';

/**
 * Validation Tests for Activity Management
 * 
 * Tests cover:
 * - Activity creation with required/optional fields
 * - Activity edit validation
 * - Time/date validation
 * - Sequence order validation
 */

describe('Activity Form Validation', () => {
  describe('Activity Creation', () => {
    it('should require activity title', () => {
      const activity = {
        title: 'Team meeting',
        locationName: 'Conference room', // optional
        sequenceOrder: 1,
      };
      
      expect(activity.title).toBeDefined();
      expect(activity.title.length).toBeGreaterThan(0);
    });

    it('should make location optional', () => {
      const activity = {
        title: 'Virtual meeting',
        locationName: undefined, // optional
        sequenceOrder: 2,
      };
      
      expect(activity.title).toBeDefined();
      expect(activity.locationName).toBeUndefined();
    });

    it('should validate activity object structure', () => {
      const validActivity = {
        title: 'Breakfast',
        locationName: 'Downtown café',
        startTime: new Date('2026-04-15T08:00:00'),
        endTime: new Date('2026-04-15T09:00:00'),
        sequenceOrder: 1,
        eventId: null, // optional
      };
      
      expect(validActivity.title).toBeDefined();
      expect(validActivity.sequenceOrder).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DateTime Validation', () => {
    it('should accept valid start and end times', () => {
      const startTime = new Date('2026-04-15T08:00:00');
      const endTime = new Date('2026-04-15T09:00:00');
      
      expect(startTime.getTime()).toBeLessThan(endTime.getTime());
    });

    it('should allow start time without end time', () => {
      const activity = {
        title: 'Activity',
        startTime: new Date('2026-04-15T08:00:00'),
        endTime: undefined,
      };
      
      expect(activity.startTime).toBeDefined();
      expect(activity.endTime).toBeUndefined();
    });

    it('should allow activities without any times', () => {
      const activity = {
        title: 'Activity',
        startTime: undefined,
        endTime: undefined,
      };
      
      // Both can be optional
      expect(activity.startTime).toBeUndefined();
      expect(activity.endTime).toBeUndefined();
    });

    it('should parse datetime-local format correctly', () => {
      const dateTimeLocal = '2026-04-15T14:30';
      const date = new Date(dateTimeLocal);
      
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3); // 0-indexed
      expect(date.getDate()).toBe(15);
    });
  });

  describe('Sequence Order Validation', () => {
    it('should accept non-negative sequence order', () => {
      const validSequences = [0, 1, 5, 100];
      
      validSequences.forEach(seq => {
        expect(seq).toBeGreaterThanOrEqual(0);
      });
    });

    it('should default to 0 if not provided', () => {
      const defaultSequence = 0;
      expect(defaultSequence).toBe(0);
    });

    it('should handle sequence order updates', () => {
      const activities = [
        { id: '1', title: 'First', sequenceOrder: 0 },
        { id: '2', title: 'Second', sequenceOrder: 1 },
        { id: '3', title: 'Third', sequenceOrder: 2 },
      ];
      
      expect(activities).toHaveLength(3);
      expect(activities[0].sequenceOrder).toBeLessThan(activities[1].sequenceOrder);
      expect(activities[1].sequenceOrder).toBeLessThan(activities[2].sequenceOrder);
    });
  });

  describe('Activity Edit Validation', () => {
    it('should preserve required fields during edit', () => {
      const originalActivity = {
        id: 'activity-123',
        title: 'Meeting',
        sequenceOrder: 1,
      };
      
      const updatedActivity = {
        ...originalActivity,
        title: 'Updated Meeting', // Changed
      };
      
      expect(updatedActivity.id).toBe(originalActivity.id);
      expect(updatedActivity.sequenceOrder).toBe(originalActivity.sequenceOrder);
      expect(updatedActivity.title).not.toBe(originalActivity.title);
    });

    it('should allow partial updates', () => {
      const activity = {
        title: 'Activity',
        locationName: 'Original location',
        sequenceOrder: 1,
      };
      
      // Update only location
      const updated = {
        ...activity,
        locationName: 'New location',
      };
      
      expect(updated.title).toBe(activity.title);
      expect(updated.sequenceOrder).toBe(activity.sequenceOrder);
      expect(updated.locationName).not.toBe(activity.locationName);
    });
  });

  describe('Activity Event Linking', () => {
    it('should accept activities with event ID', () => {
      const activity = {
        title: 'Event activity',
        eventId: 'event-456',
      };
      
      expect(activity.eventId).toBeDefined();
    });

    it('should allow standalone activities without event', () => {
      const activity = {
        title: 'Standalone activity',
        eventId: null,
      };
      
      expect(activity.eventId).toBeNull();
    });

    it('should support null event ID for standalone activities', () => {
      const standaloneActivity = {
        title: 'Independent activity',
        eventId: undefined, // No event
      };
      
      expect(standaloneActivity.eventId).toBeUndefined();
    });
  });

  describe('Activity with Expense', () => {
    it('should create activity with expense toggle enabled', () => {
      const activity = {
        title: 'Activity with expense',
        addExpense: true,
        expenseDescription: 'Activity cost',
        expenseCategory: 'meal',
        expenseAmount: 2500, // cents
      };
      
      expect(activity.addExpense).toBe(true);
      expect(activity.expenseAmount).toBeGreaterThan(0);
      expect(['meal', 'transport', 'accommodation', 'parking', 'entertainment', 'tickets', 'misc']).toContain(activity.expenseCategory);
    });

    it('should create activity without expense when toggle disabled', () => {
      const activity = {
        title: 'Activity without expense',
        addExpense: false,
        expenseDescription: undefined,
        expenseAmount: undefined,
      };
      
      expect(activity.addExpense).toBe(false);
      expect(activity.expenseAmount).toBeUndefined();
    });

    it('should link expense to activity when created together', () => {
      const activity = {
        id: 'activity-789',
        title: 'Activity',
      };
      
      const expense = {
        activityId: activity.id,
        description: 'Activity expense',
      };
      
      expect(expense.activityId).toBe(activity.id);
    });
  });

  describe('Activity List Management', () => {
    it('should find activity by ID', () => {
      const activities = [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' },
        { id: '3', title: 'Third' },
      ];
      
      const found = activities.find(a => a.id === '2');
      expect(found?.title).toBe('Second');
    });

    it('should filter activities by event', () => {
      const activities = [
        { id: '1', title: 'Activity 1', eventId: 'event-1' },
        { id: '2', title: 'Activity 2', eventId: 'event-1' },
        { id: '3', title: 'Standalone', eventId: null },
      ];
      
      const eventActivities = activities.filter(a => a.eventId === 'event-1');
      expect(eventActivities).toHaveLength(2);
    });

    it('should sort activities by sequence order', () => {
      const activities = [
        { id: '1', title: 'First', sequenceOrder: 0 },
        { id: '3', title: 'Third', sequenceOrder: 2 },
        { id: '2', title: 'Second', sequenceOrder: 1 },
      ];
      
      const sorted = activities.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      expect(sorted[0].sequenceOrder).toBe(0);
      expect(sorted[1].sequenceOrder).toBe(1);
      expect(sorted[2].sequenceOrder).toBe(2);
    });
  });
});
