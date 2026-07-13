import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      res.status(400).json({ error: `${first.path.join('.')}: ${first.message}` });
      return;
    }
    if (typeof result.data === 'object' && result.data !== null) {
      Object.assign(req[source], result.data);
    }
    next();
  };
}

export const registerSchema = z.object({
  login: z.string().min(1, 'required').max(50),
  password: z.string().min(3, 'min 3 characters').max(128),
  name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'required'),
  password: z.string().min(1, 'required'),
});

export const changePasswordSchema = z.object({
  login: z.string().min(1, 'required'),
  currentPassword: z.string().min(1, 'required'),
  newPassword: z.string().min(3, 'min 3 characters').max(128),
});

export const setEmailSchema = z.object({
  login: z.string().min(1, 'required'),
  email: z.string().email('invalid email'),
  password: z.string().min(1, 'password required'),
});

export const opSchema = z.object({
  login: z.string().min(1, 'required'),
});

export const dataUpsertSchema = z.object({
  key: z.string().min(1, 'required'),
  value: z.string().optional().default(''),
});

export const dataBatchSchema = z.object({
  data: z.record(z.string(), z.string()),
});

export const commandSchema = z.object({
  command: z.string().min(1, 'required'),
});

export const userIdParams = z.object({
  userId: z.coerce.number().int().positive('invalid userId'),
});

export const userIdKeyParams = z.object({
  userId: z.coerce.number().int().positive('invalid userId'),
  key: z.string().min(1, 'required'),
});

export const noteCreateSchema = z.object({
  title: z.string().max(200).default(''),
  body: z.string().max(10000).default(''),
  tags: z.array(z.string().max(50)).max(10).default([]),
  reminder_at: z.number().nullable().optional(),
  notify_telegram: z.boolean().optional().default(false),
});

export const noteUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  pinned: z.boolean().optional(),
  completed: z.boolean().optional(),
  reminder_at: z.number().nullable().optional(),
  notify_telegram: z.boolean().optional(),
});

export const noteIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
