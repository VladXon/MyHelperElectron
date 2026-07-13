import path from 'node:path';

export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathValidationError';
  }
}

export function validatePath(userPath: string, baseDir: string): string {
  if (!userPath || typeof userPath !== 'string') {
    throw new PathValidationError('Path must be a non-empty string');
  }

  if (userPath.includes('\0')) {
    throw new PathValidationError('Path contains null bytes');
  }

  const normalizedUserPath = path.normalize(userPath);

  if (normalizedUserPath.startsWith('..') || path.isAbsolute(normalizedUserPath)) {
    throw new PathValidationError('Path traversal or absolute path not allowed');
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, normalizedUserPath);

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new PathValidationError('Path escapes base directory');
  }

  return resolvedTarget;
}