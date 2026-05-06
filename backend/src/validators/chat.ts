import { z } from 'zod';

export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be under 2000 characters'),
  term: z.string().optional(),
  userSchedule: z
    .array(
      z.object({
        code: z.string(),
        name: z.string(),
        days: z.string().optional(),
        times: z.string().optional(),
      })
    )
    .max(30, 'Schedule cannot exceed 30 courses')
    .optional()
    .default([]),
});
