const express = require('express');
const router = express.Router();
const { getCourses, getSchoolInfo } = require('../controllers/courseController');

router.get('/', getCourses);
router.get('/info', getSchoolInfo);

module.exports = router;