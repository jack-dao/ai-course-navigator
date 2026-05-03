import { z } from 'zod';

export const saveScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  courses: z.array(
    z.object({
      code: z.string(),
      sectionCode: z.string().optional().default(''),
      labCode: z.string().optional().default(''),
    })
  ),
});

export const getScheduleSchema = z.object({
  term: z.string().optional(), // Used as schedule name (schedules are named by term)
});
