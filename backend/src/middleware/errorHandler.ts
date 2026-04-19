import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../lib/logger';

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  logger.error(`${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
};

export default errorHandler;
