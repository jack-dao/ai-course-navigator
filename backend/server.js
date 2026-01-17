const express = require('express');
const cors = require('cors');
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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
    }
    return callback(null, true);
  }
}));

app.use(express.json({ limit: '10mb' }));

const courseRoutes = require('./src/routes/courseRoutes');
const authRoutes = require('./src/routes/authRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const ratingsRoutes = require('./src/routes/ratingsRoutes'); 
const chatRoutes = require('./src/routes/chatRoutes');


app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});