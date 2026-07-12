import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../db';

describe('password hashing', () => {
  it('hashPassword returns hashed string in correct format', () => {
    const hash = hashPassword('test123');
    expect(hash).toMatch(/^scrypt:[a-f0-9]+:[a-f0-9]+$/);
  });

  it('verifyPassword returns true for correct password', () => {
    const hash = hashPassword('test123');
    expect(verifyPassword('test123', hash)).toBe(true);
  });

  it('verifyPassword returns false for incorrect password', () => {
    const hash = hashPassword('test123');
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('verifyPassword rejects non-hashed values', () => {
    expect(verifyPassword('plain', 'plain')).toBe(false);
    expect(verifyPassword('', '')).toBe(false);
  });

  it('verifyPassword handles malformed hash gracefully', () => {
    expect(verifyPassword('test', '')).toBe(false);
    expect(verifyPassword('test', 'invalid')).toBe(false);
  });

  it('generates unique hashes for same password', () => {
    const hash1 = hashPassword('test123');
    const hash2 = hashPassword('test123');
    expect(hash1).not.toBe(hash2);
    expect(verifyPassword('test123', hash1)).toBe(true);
    expect(verifyPassword('test123', hash2)).toBe(true);
  });
});
