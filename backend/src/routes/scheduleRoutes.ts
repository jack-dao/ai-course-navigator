import { Router } from 'express';
import { saveSchedule, getSchedules } from '../controllers/scheduleController';
import authenticateToken from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.post('/', saveSchedule);
router.get('/', getSchedules);

export default router;
