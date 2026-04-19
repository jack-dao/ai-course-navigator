import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../validators/auth';
import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../services/authService';
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

const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = refreshSchema.parse(req.body);

  const result = await refreshAccessToken(refreshToken);
  if ('error' in result) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json(result);
};

const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = logoutSchema.parse(req.body);

  await logoutUser(refreshToken);

  res.json({ message: 'Logged out successfully' });
};

export { register, login, refresh, logout };
