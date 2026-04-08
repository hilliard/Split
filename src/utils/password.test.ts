import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password', () => {
  it('hashes and verifies correctly', async () => {
    const pwd = 'test123';
    const hash = await hashPassword(pwd);
    const valid = await verifyPassword(pwd, hash);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('test123');
    const valid = await verifyPassword('wrong', hash);
    expect(valid).toBe(false);
  });
});
