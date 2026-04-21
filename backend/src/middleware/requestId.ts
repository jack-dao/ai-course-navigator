import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export default requestId;
