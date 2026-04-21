import { saveScheduleSchema, getScheduleSchema } from '../validators/schedule';
import { saveUserSchedule, getUserSchedule } from '../services/scheduleService';
import type { Request, Response } from 'express';

const saveSchedule = async (req: Request, res: Response): Promise<void> => {
  const { name, courses } = saveScheduleSchema.parse(req.body);
  const userId = req.user!.userId;
  const email = req.user!.email;
  const userName = req.user!.user_metadata?.full_name || email?.split('@')[0] || 'User';

  const schedule = await saveUserSchedule({ userId, email: email || '', userName, name, courses });

  res.status(200).json(schedule);
};

const getSchedules = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { term } = getScheduleSchema.parse(req.query);

  const schedule = await getUserSchedule(userId, term);

  if (!schedule) {
    res.json({ courses: [] });
    return;
  }

  res.json(schedule);
};

export { saveSchedule, getSchedules };
