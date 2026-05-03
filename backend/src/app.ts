import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';

import errorHandler from './middleware/errorHandler';
import httpsRedirect from './middleware/httpsRedirect';
import requestId from './middleware/requestId';
import { allowedOrigins } from './config/cors';
import { generalLimiter, chatLimiter } from './config/rateLimits';
import prisma from './lib/prisma';
import courseRoutes from './routes/courseRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import ratingsRoutes from './routes/ratingsRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.use(requestId);

if (isProduction) {
  app.use(httpsRedirect);
}

app.use(helmet());

app.use(
  compression({
    filter: (req, res) => {
      if (req.path.includes('/api/chat')) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use(generalLimiter);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'unavailable', timestamp: new Date().toISOString() });
  }
});

app.use('/api/courses', courseRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

app.use(errorHandler);

export default app;
