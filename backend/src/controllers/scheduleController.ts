import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { saveScheduleSchema, getScheduleSchema } from '../validators/schedule';
import type { Request, Response } from 'express';

const saveSchedule = async (req: Request, res: Response): Promise<void> => {
  const { name, courses } = saveScheduleSchema.parse(req.body);
  const userId = req.user!.userId;
  const email = req.user!.email;
  const userName = req.user!.user_metadata?.full_name || email?.split('@')[0] || 'User';

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: email || `user_${userId}@example.com`,
      name: userName,
      password: null,
    },
  });

  const existingSchedule = await prisma.schedule.findFirst({
    where: {
      userId: userId,
      name: name,
    },
  });

  let schedule;
  if (existingSchedule) {
    schedule = await prisma.schedule.update({
      where: { id: existingSchedule.id },
      data: { courses },
    });
    logger.info(`Updated schedule "${name}" for user ${userId}`);
  } else {
    schedule = await prisma.schedule.create({
      data: {
        userId,
        name: name || 'My Schedule',
        courses,
      },
    });
    logger.info(`Created new schedule "${name}" for user ${userId}`);
  }

  res.status(200).json(schedule);
};

const getSchedules = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { term } = getScheduleSchema.parse(req.query);

  const schedule = await prisma.schedule.findFirst({
    where: {
      userId: userId,
      name: term,
    },
  });

  if (!schedule) {
    res.json({ courses: [] });
    return;
  }

  res.json(schedule);
};

export { saveSchedule, getSchedules };
