import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createEventSchema,
  createActivitySchema,
  createGroupSchema,
  inviteUserSchema,
  createExpenseSchema,
} from '@/utils/validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate a correct registration', () => {
      const validData = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'password123',
        confirmPassword: 'password123',
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        username: 'testuser',
        password: 'password123',
        confirmPassword: 'password123',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject short username', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'ab',
        password: 'password123',
        confirmPassword: 'password123',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'short',
        confirmPassword: 'short',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'testuser',
        password: 'password123',
        confirmPassword: 'password456',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should require password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createEventSchema', () => {
    it('should validate a valid event', () => {
      const validData = {
        name: 'Birthday Party',
        description: 'A fun celebration',
      };
      expect(() => createEventSchema.parse(validData)).not.toThrow();
    });

    it('should require event name', () => {
      const invalidData = {
        name: '',
        description: 'A fun celebration',
      };
      expect(() => createEventSchema.parse(invalidData)).toThrow();
    });

    it('should accept events without description', () => {
      const validData = {
        name: 'Birthday Party',
      };
      expect(() => createEventSchema.parse(validData)).not.toThrow();
    });

    it('should reject too long description', () => {
      const invalidData = {
        name: 'Birthday Party',
        description: 'a'.repeat(1001),
      };
      expect(() => createEventSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createActivitySchema', () => {
    it('should validate a valid activity', () => {
      const validData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Dinner',
      };
      expect(() => createActivitySchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid event ID', () => {
      const invalidData = {
        eventId: 'not-a-uuid',
        name: 'Dinner',
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });

    it('should require activity name', () => {
      const invalidData = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: '',
      };
      expect(() => createActivitySchema.parse(invalidData)).toThrow();
    });
  });

  describe('createGroupSchema', () => {
    it('should validate a valid group', () => {
      const validData = {
        name: 'Roommates',
      };
      expect(() => createGroupSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty group name', () => {
      const invalidData = {
        name: '',
      };
      expect(() => createGroupSchema.parse(invalidData)).toThrow();
    });
  });

  describe('inviteUserSchema', () => {
    it('should validate a valid invitation', () => {
      const validData = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'friend@example.com',
      };
      expect(() => inviteUserSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid group ID', () => {
      const invalidData = {
        groupId: 'invalid-uuid',
        email: 'friend@example.com',
      };
      expect(() => inviteUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'not-an-email',
      };
      expect(() => inviteUserSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createExpenseSchema', () => {
    it('should validate a valid expense', () => {
      const validData = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner at restaurant',
        amount: 10000, // $100.00 in cents
        splits: [
          {
            userId: '550e8400-e29b-41d4-a716-446655440001',
            amount: 5000,
          },
          {
            userId: '550e8400-e29b-41d4-a716-446655440002',
            amount: 5000,
          },
        ],
      };
      expect(() => createExpenseSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative amount', () => {
      const invalidData = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner',
        amount: -1000,
        splits: [
          {
            userId: '550e8400-e29b-41d4-a716-446655440001',
            amount: 1000,
          },
        ],
      };
      expect(() => createExpenseSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty splits', () => {
      const invalidData = {
        groupId: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Dinner',
        amount: 1000,
        splits: [],
      };
      expect(() => createExpenseSchema.parse(invalidData)).toThrow();
    });
  });
});
