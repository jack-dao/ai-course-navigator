import { registerSchema, loginSchema } from '../validators/auth';
import { registerUser, loginUser } from '../services/authService';
import type { Request, Response } from 'express';

const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = registerSchema.parse(req.body);

  const result = await registerUser(email, password, name);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'User created successfully', userId: result.userId });
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const result = await loginUser(email, password);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ message: 'Login successful', ...result });
};

export { register, login };
