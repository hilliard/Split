import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './validation';

describe('Validation', () => {
  it('validates registration correctly', () => {
    const valid = {
      email: 'user@example.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123',
    };
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it('rejects mismatched passwords', () => {
    const invalid = {
      email: 'user@example.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'different',
    };
    expect(() => registerSchema.parse(invalid)).toThrow();
  });
});
