import { describe, it, expect } from 'vitest';
import { validatePath, PathValidationError } from '../path-validation';
import path from 'node:path';
import { tmpdir } from 'node:os';

describe('validatePath', () => {
  const baseDir = path.join(tmpdir(), 'test-app-data');

  it('allows normal relative paths', () => {
    expect(validatePath('presets.json', baseDir)).toBe(path.join(baseDir, 'presets.json'));
  });

  it('normalizes and allows subdirectories', () => {
    expect(validatePath('subdir/file.txt', baseDir)).toBe(path.join(baseDir, 'subdir', 'file.txt'));
  });

  it('rejects directory traversal with ..', () => {
    expect(() => validatePath('../etc/passwd', baseDir)).toThrow(PathValidationError);
    expect(() => validatePath('subdir/../../etc/passwd', baseDir)).toThrow(PathValidationError);
  });

  it('rejects absolute paths', () => {
    expect(() => validatePath(path.resolve('/etc/passwd'), baseDir)).toThrow(PathValidationError);
    expect(() => validatePath(path.resolve('C:\\Windows\\System32'), baseDir)).toThrow(PathValidationError);
  });

  it('rejects paths with null bytes', () => {
    expect(() => validatePath('file.txt\0.exe', baseDir)).toThrow(PathValidationError);
  });

  it('rejects empty paths', () => {
    expect(() => validatePath('', baseDir)).toThrow(PathValidationError);
  });
});