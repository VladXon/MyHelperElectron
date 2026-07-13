import path from 'node:path';

export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathValidationError';
  }
}

export function validateServerPath(userPath: string, baseDir: string): string {
  if (!userPath || typeof userPath !== 'string') {
    throw new PathValidationError('Path must be a non-empty string');
  }
  if (userPath.includes('\0')) {
    throw new PathValidationError('Path contains null bytes');
  }
  const normalized = path.normalize(userPath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new PathValidationError('Path traversal or absolute path not allowed');
  }
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, normalized);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new PathValidationError('Path escapes base directory');
  }
  return resolvedTarget;
}