import { Router } from 'express';
import { getCourses, getSchoolInfo, getTerms, getCourseDescription } from '../controllers/courseController';

const router = Router();

router.get('/', getCourses);
router.get('/info', getSchoolInfo);
router.get('/terms', getTerms);

router.get('/:id/description', getCourseDescription);

export default router;
