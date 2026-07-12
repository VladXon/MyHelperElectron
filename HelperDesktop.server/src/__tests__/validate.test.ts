import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  setEmailSchema,
  opSchema,
  dataUpsertSchema,
  dataBatchSchema,
  commandSchema,
  userIdParams,
  userIdKeyParams,
} from '../validate';

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({ login: 'alice', password: '123', name: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('accepts without optional name', () => {
    const result = registerSchema.safeParse({ login: 'alice', password: '123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty login', () => {
    const result = registerSchema.safeParse({ login: '', password: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({ login: 'alice', password: '12' });
    expect(result.success).toBe(false);
  });

  it('rejects long login', () => {
    const result = registerSchema.safeParse({ login: 'a'.repeat(51), password: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects long password', () => {
    const result = registerSchema.safeParse({ login: 'alice', password: 'a'.repeat(129) });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = registerSchema.safeParse({ login: 'alice' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({ login: 'alice', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects empty login', () => {
    const result = loginSchema.safeParse({ login: '', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ login: 'alice', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid input', () => {
    const result = changePasswordSchema.safeParse({ login: 'alice', currentPassword: 'old', newPassword: 'new123' });
    expect(result.success).toBe(true);
  });

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({ login: 'alice', currentPassword: 'old', newPassword: '12' });
    expect(result.success).toBe(false);
  });

  it('rejects missing currentPassword', () => {
    const result = changePasswordSchema.safeParse({ login: 'alice', newPassword: 'new123' });
    expect(result.success).toBe(false);
  });
});

describe('setEmailSchema', () => {
  it('accepts valid input', () => {
    const result = setEmailSchema.safeParse({ login: 'alice', email: 'a@b.com', password: 'pass' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = setEmailSchema.safeParse({ login: 'alice', email: 'notanemail', password: 'pass' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = setEmailSchema.safeParse({ login: 'alice', email: 'a@b.com' });
    expect(result.success).toBe(false);
  });
});

describe('opSchema', () => {
  it('accepts valid input', () => {
    const result = opSchema.safeParse({ login: 'alice' });
    expect(result.success).toBe(true);
  });

  it('rejects empty login', () => {
    const result = opSchema.safeParse({ login: '' });
    expect(result.success).toBe(false);
  });
});

describe('dataUpsertSchema', () => {
  it('accepts key with default value', () => {
    const result = dataUpsertSchema.safeParse({ key: 'foo' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.value).toBe('');
  });

  it('accepts key with custom value', () => {
    const result = dataUpsertSchema.safeParse({ key: 'foo', value: 'bar' });
    expect(result.success).toBe(true);
  });

  it('rejects empty key', () => {
    const result = dataUpsertSchema.safeParse({ key: '' });
    expect(result.success).toBe(false);
  });
});

describe('dataBatchSchema', () => {
  it('accepts valid data object', () => {
    const result = dataBatchSchema.safeParse({ data: { a: '1', b: '2' } });
    expect(result.success).toBe(true);
  });

  it('accepts empty data', () => {
    const result = dataBatchSchema.safeParse({ data: {} });
    expect(result.success).toBe(true);
  });
});

describe('commandSchema', () => {
  it('accepts valid command', () => {
    const result = commandSchema.safeParse({ command: '/serverinfo' });
    expect(result.success).toBe(true);
  });

  it('rejects empty command', () => {
    const result = commandSchema.safeParse({ command: '' });
    expect(result.success).toBe(false);
  });
});

describe('userIdParams', () => {
  it('accepts valid numeric id', () => {
    const result = userIdParams.safeParse({ userId: '42' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.userId).toBe(42);
  });

  it('rejects negative id', () => {
    const result = userIdParams.safeParse({ userId: '-1' });
    expect(result.success).toBe(false);
  });

  it('rejects zero', () => {
    const result = userIdParams.safeParse({ userId: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric', () => {
    const result = userIdParams.safeParse({ userId: 'abc' });
    expect(result.success).toBe(false);
  });
});

describe('userIdKeyParams', () => {
  it('accepts valid params', () => {
    const result = userIdKeyParams.safeParse({ userId: '1', key: 'theme' });
    expect(result.success).toBe(true);
  });

  it('rejects empty key', () => {
    const result = userIdKeyParams.safeParse({ userId: '1', key: '' });
    expect(result.success).toBe(false);
  });
});
