import { z } from 'zod';

export const termQuerySchema = z.object({
  term: z.string().optional(),
});

export const courseIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid course ID').transform(Number),
});
