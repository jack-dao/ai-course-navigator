import { Router } from 'express';
import { getRatings } from '../controllers/ratingsController';

const router = Router();

router.get('/', getRatings);

export default router;
