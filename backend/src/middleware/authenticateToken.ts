import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
        if (err) {
            console.error("Token verification failed:", err.message);
            return res.sendStatus(403);
        }

        req.user = { userId: (user as any).sub, ...(user as Record<string, any>) };
        next();
    });
};

export default authenticateToken;
