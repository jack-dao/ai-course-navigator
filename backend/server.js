const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

const courseRoutes = require('./src/routes/courseRoutes');
const authRoutes = require('./src/routes/authRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const ratingsRoutes = require('./src/routes/ratingsRoutes'); 
const chatRoutes = require('./src/routes/chatRoutes');


app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});