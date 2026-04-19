import type { Request, Response, NextFunction } from 'express';

const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  // x-forwarded-proto is set by reverse proxies (Render, Heroku, etc.)
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};

export default httpsRedirect;
