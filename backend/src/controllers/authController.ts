import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import type { Request, Response } from 'express';

if (!process.env.JWT_SECRET) {
  console.error("Configuration Error: JWT_SECRET is not defined in the .env file.")
}
const SECRET_KEY = process.env.JWT_SECRET;

const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Email already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });

    res.json({ message: 'User created successfully', userId: user.id });
  }

  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password || '');
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY as string, { expiresIn: '30d' });

    res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
  }

  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export {
  register,
  login
};
