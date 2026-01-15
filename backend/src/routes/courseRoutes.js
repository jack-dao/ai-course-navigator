const express = require('express');
const router = express.Router();
const { getCourses, getSchoolInfo, getTerms } = require('../controllers/courseController');

router.get('/', getCourses);
router.get('/info', getSchoolInfo);
router.get('/terms', getTerms);

module.exports = router;