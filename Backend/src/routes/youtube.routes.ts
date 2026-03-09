import { Router } from 'express';
import { youtubeController } from '../controllers/youtube.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/youtube/connect', authenticateToken, youtubeController.initiateConnection);
router.get('/youtube/callback', youtubeController.handleCallback);
router.get('/youtube/channel', authenticateToken, youtubeController.getConnectedChannel);
router.delete('/youtube/channel', authenticateToken, youtubeController.disconnectChannel);

export default router;
