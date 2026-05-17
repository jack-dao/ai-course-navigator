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

const ensureUserAccount = async (userId: string, email: string, userName: string) => {
  const userEmail = email || `user_${userId}@example.com`;
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (existingUser) {
    return userId;
  }

  const existingUserByEmail = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (existingUserByEmail) {
    await prisma.user.update({
      where: { email },
      data: {
        id: userId,
        name: userName,
      },
    });
    return userId;
  }

  await prisma.user.create({
    data: {
      id: userId,
      email: userEmail,
      name: userName,
      password: null,
    },
  });

  return userId;
};

export const saveUserSchedule = async ({ userId, email, userName, name, courses }: SaveScheduleInput) => {
  const scheduleUserId = await ensureUserAccount(userId, email, userName);

  const schedule = await prisma.schedule.upsert({
    where: { userId_name: { userId: scheduleUserId, name: name || 'My Schedule' } },
    update: { courses },
    create: { userId: scheduleUserId, name: name || 'My Schedule', courses },
  });

  logger.info(`Saved schedule "${name}" for user ${scheduleUserId}`);

  return schedule;
};

export const getUserSchedule = async (userId: string, term?: string) => {
  return prisma.schedule.findFirst({
    where: { userId, name: term },
  });
};
