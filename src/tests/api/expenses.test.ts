import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { sessions, users, expenseGroups, groupMembers, activities, expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

/**
 * API Integration Tests for Expenses and Activities
 *
 * Tests cover:
 * - Expense categories (meal, transport, accommodation, parking, entertainment, tickets, misc)
 * - GET /api/activities/[id] - Fetch activity details
 * - POST /api/expenses/create - Create expense with category
 * - Activity creation with optional expense
 *
 * Note: These are integration tests that require a running database.
 */

describe.skip('Expenses and Activities API', () => {
  let testUser: { id: string; email: string };
  let testSession: any;
  let testGroup: any;
  let testActivity: any;

  beforeAll(async () => {
    // Create test user
    const userId = uuid();

    await db.insert(users).values({
      id: userId,
      email: `test-expenses-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      passwordHash: 'hashed_password_test',
    });

    testUser = { id: userId, email: `test-expenses-${Date.now()}@example.com` };

    // Create test session
    const sessionId = uuid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      id: sessionId,
      userId: userId,
      expiresAt,
    });

    testSession = { id: sessionId, userId, expiresAt };

    // Create test group
    const groupId = uuid();

    await db.insert(expenseGroups).values({
      id: groupId,
      name: `Test Group - ${Date.now()}`,
      description: 'Test group for expenses',
      creatorId: userId,
    });

    testGroup = { id: groupId, name: `Test Group - ${Date.now()}` };

    // Add user to group
    await db.insert(groupMembers).values({
      id: uuid(),
      groupId,
      userId,
      role: 'admin',
    });

    // Create test activity
    const activityId = uuid();

    await db.insert(activities).values({
      id: activityId,
      title: 'Test Activity',
      locationName: 'Test Location',
      sequenceOrder: 1,
      eventId: null,
    });

    testActivity = { id: activityId, title: 'Test Activity' };
  });

  describe('Expense Categories', () => {
    it('should accept all valid expense categories', async () => {
      const categories = [
        'meal',
        'transport',
        'accommodation',
        'parking',
        'entertainment',
        'tickets',
        'misc',
      ];

      for (const category of categories) {
        const expenseId = uuid();
        const result = await db.insert(expenses).values({
          id: expenseId,
          groupId: testGroup.id,
          description: `Expense for ${category}`,
          category,
          amount: 1000, // $10.00 in cents
          paidBy: testUser.id,
          activityId: null,
        });

        expect(result).toBeDefined();
      }
    });

    it('should default to misc category for expenses without category', async () => {
      const expenseId = uuid();

      const expense = await db
        .insert(expenses)
        .values({
          id: expenseId,
          groupId: testGroup.id,
          description: 'Default category expense',
          amount: 2000,
          paidBy: testUser.id,
          activityId: null,
        })
        .returning();

      expect(expense[0].category).toBe('misc');
    });
  });

  describe('GET /api/activities/[id]', () => {
    it('should fetch activity details with correct fields', async () => {
      const activityData = await db
        .select()
        .from(activities)
        .where(eq(activities.id, testActivity.id))
        .limit(1);

      expect(activityData).toHaveLength(1);
      expect(activityData[0].id).toBe(testActivity.id);
      expect(activityData[0].title).toBe(testActivity.title);
      expect(activityData[0]).toHaveProperty('locationName');
      expect(activityData[0]).toHaveProperty('startTime');
      expect(activityData[0]).toHaveProperty('endTime');
      expect(activityData[0]).toHaveProperty('sequenceOrder');
    });

    it('should return null for non-existent activities', async () => {
      const nonExistentId = uuid();
      const activityData = await db
        .select()
        .from(activities)
        .where(eq(activities.id, nonExistentId))
        .limit(1);

      expect(activityData).toHaveLength(0);
    });
  });

  describe('Expense Creation with Category', () => {
    it('should create expense with all fields including category', async () => {
      const expenseId = uuid();

      const result = await db
        .insert(expenses)
        .values({
          id: expenseId,
          groupId: testGroup.id,
          description: 'Restaurant meal',
          category: 'meal',
          amount: 3500, // $35.00
          paidBy: testUser.id,
          activityId: testActivity.id,
        })
        .returning();

      expect(result[0]).toMatchObject({
        description: 'Restaurant meal',
        category: 'meal',
        amount: 3500,
        groupId: testGroup.id,
        activityId: testActivity.id,
        paidBy: testUser.id,
      });
    });

    it('should link expense to activity when provided', async () => {
      const expenseId = uuid();

      await db.insert(expenses).values({
        id: expenseId,
        groupId: testGroup.id,
        description: 'Activity expense',
        category: 'transport',
        amount: 2000,
        paidBy: testUser.id,
        activityId: testActivity.id,
      });

      // Verify the link
      const expense = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);

      expect(expense[0].activityId).toBe(testActivity.id);
    });

    it('should allow null activity ID for standalone expenses', async () => {
      const expenseId = uuid();

      await db.insert(expenses).values({
        id: expenseId,
        groupId: testGroup.id,
        description: 'Standalone expense',
        category: 'entertainment',
        amount: 5000,
        paidBy: testUser.id,
        activityId: null,
      });

      const expense = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);

      expect(expense[0].activityId).toBeNull();
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testActivity?.id) {
      await db.delete(activities).where(eq(activities.id, testActivity.id));
    }

    if (testGroup?.id) {
      await db.delete(groupMembers).where(eq(groupMembers.groupId, testGroup.id));
      await db.delete(expenseGroups).where(eq(expenseGroups.id, testGroup.id));
    }

    if (testSession?.id) {
      await db.delete(sessions).where(eq(sessions.id, testSession.id));
    }

    if (testUser?.id) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });
});
