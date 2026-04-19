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

  const existingSchedule = await prisma.schedule.findFirst({
    where: { userId, name },
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

  return schedule;
};

export const getUserSchedule = async (userId: string, term?: string) => {
  return prisma.schedule.findFirst({
    where: { userId, name: term },
  });
};
