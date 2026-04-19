import express from 'express';
import cors from 'cors';
import compression from 'compression';
import 'dotenv/config';

import logger from './lib/logger';
import errorHandler from './middleware/errorHandler';
import { allowedOrigins } from './config/cors';
import { generalLimiter, chatLimiter } from './config/rateLimits';
import courseRoutes from './routes/courseRoutes';
import authRoutes from './routes/authRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import ratingsRoutes from './routes/ratingsRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
