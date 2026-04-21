import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  username: z.string().min(3, 'Username is required').max(255),
  password: z.string().min(1, 'Password is required'),
});

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  description: z.string().max(1000).optional(),
});

export const createActivitySchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  name: z.string().min(1, 'Activity name is required').max(255),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255),
});

export const inviteUserSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  email: z.string().email('Invalid email address'),
});

export const createExpenseSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  activityId: z.string().uuid('Invalid activity ID').optional(),
  description: z.string().min(1, 'Description is required').max(255),
  amount: z.number().int().positive('Amount must be positive'),
  splits: z.array(z.object({
    userId: z.string().uuid('Invalid user ID'),
    amount: z.number().int().nonnegative(),
  })).min(1, 'At least one person must be included in the split'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
