import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../lib/logger';

const isProduction = process.env.NODE_ENV === 'production';

const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] || 'unknown';

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  logger.error(`[${requestId}] ${req.method} ${req.path}:`, err.message);

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
    requestId,
  });
};

export default errorHandler;
