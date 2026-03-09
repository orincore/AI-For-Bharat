import { Router } from 'express';
import { instagramController } from '../controllers/instagram.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/instagram/connect', authenticateToken, instagramController.initiateConnection);
router.get('/instagram/callback', instagramController.handleCallback);
router.get('/instagram/accounts', authenticateToken, instagramController.getConnectedAccounts);
router.delete('/instagram/accounts/:accountId', authenticateToken, instagramController.disconnectAccount);
router.put('/instagram/accounts/:accountId/activate', authenticateToken, instagramController.setActiveAccount);

export default router;
