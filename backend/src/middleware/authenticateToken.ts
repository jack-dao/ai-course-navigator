import jwt from 'jsonwebtoken';
import logger from '../lib/logger';
import type { Request, Response, NextFunction } from 'express';

interface JwtUserPayload {
  sub: string;
  userId?: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) => {
      if (err) {
        logger.error({ err }, 'Token verification failed');
        return res.sendStatus(403);
      }

      if (!decoded || typeof decoded === 'string' || !('sub' in decoded) || typeof decoded.sub !== 'string') {
        logger.error('Token payload missing required "sub" field');
        return res.sendStatus(403);
      }

      const user = decoded as JwtUserPayload;
      req.user = { userId: user.sub, ...user };
      next();
    }
  );
};

export default authenticateToken;
