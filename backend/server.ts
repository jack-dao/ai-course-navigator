import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import courseRoutes from './src/routes/courseRoutes';
import authRoutes from './src/routes/authRoutes';
import scheduleRoutes from './src/routes/scheduleRoutes';
import ratingsRoutes from './src/routes/ratingsRoutes';
import chatRoutes from './src/routes/chatRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'https://ai-course-navigator.vercel.app',
  'https://aislugnavigator.com',
  'https://www.aislugnavigator.com',
  'https://ai-slug-navigator.onrender.com'
];

app.use(compression({
  filter: (req, res) => {
    if (req.path.includes('/api/chat')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat requests, please try again later.' },
});

app.use(generalLimiter);

app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
