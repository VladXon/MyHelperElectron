import { describe, it, expect } from 'vitest';
import { validateServerPath, PathValidationError } from '../utils/path-validation';
import path from 'node:path';

const baseDir = path.join(path.resolve('.'), 'test-base');

describe('validateServerPath', () => {
  it('allows normal paths', () => {
    expect(validateServerPath('file.txt', baseDir)).toBe(path.join(baseDir, 'file.txt'));
  });

  it('rejects .. traversal', () => {
    expect(() => validateServerPath('../etc/passwd', baseDir)).toThrow(PathValidationError);
  });

  it('rejects absolute paths', () => {
    expect(() => validateServerPath(path.resolve('/etc/passwd'), baseDir)).toThrow(PathValidationError);
  });

  it('rejects null bytes', () => {
    expect(() => validateServerPath('file.txt\0', baseDir)).toThrow(PathValidationError);
  });

  it('rejects empty paths', () => {
    expect(() => validateServerPath('', baseDir)).toThrow(PathValidationError);
  });
});