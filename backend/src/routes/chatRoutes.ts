import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import authenticateToken from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.post('/', handleChat);

export default router;
