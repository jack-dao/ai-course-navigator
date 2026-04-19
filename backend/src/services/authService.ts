import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

if (!process.env.JWT_SECRET) {
  logger.error('Configuration Error: JWT_SECRET is not defined in the .env file.');
}
const SECRET_KEY = process.env.JWT_SECRET;

export const registerUser = async (email: string, password: string, name: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already taken' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword },
  });

  return { userId: user.id };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'Invalid email or password' };
  }

  const validPassword = await bcrypt.compare(password, user.password || '');
  if (!validPassword) {
    return { error: 'Invalid email or password' };
  }

  const token = jwt.sign({ userId: user.id }, SECRET_KEY as string, { expiresIn: '30d' });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
};
