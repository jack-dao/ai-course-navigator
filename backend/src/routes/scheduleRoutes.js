const express = require('express');
const router = express.Router();
const { saveSchedule, getSchedules } = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.post('/', saveSchedule);
router.get('/', getSchedules);

module.exports = router;