import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

interface SaveScheduleInput {
  userId: string;
  email: string;
  userName: string;
  name: string;
  courses: Prisma.InputJsonValue;
}

export const saveUserSchedule = async ({ userId, email, userName, name, courses }: SaveScheduleInput) => {
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

  const schedule = await prisma.schedule.upsert({
    where: { userId_name: { userId, name: name || 'My Schedule' } },
    update: { courses },
    create: { userId, name: name || 'My Schedule', courses },
  });

  logger.info(`Saved schedule "${name}" for user ${userId}`);

  return schedule;
};

export const getUserSchedule = async (userId: string, term?: string) => {
  return prisma.schedule.findFirst({
    where: { userId, name: term },
  });
};
