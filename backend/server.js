const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const courseRoutes = require('./src/routes/courseRoutes');
const authRoutes = require('./src/routes/authRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');
const ratingsRoutes = require('./src/routes/ratingsRoutes'); 
const chatRoutes = require('./src/routes/chatRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/chat', chatRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});