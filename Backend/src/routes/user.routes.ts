import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// WhatsApp number management
router.post('/user/whatsapp/link', authenticateToken, userController.linkWhatsAppNumber.bind(userController));
router.delete('/user/whatsapp/unlink', authenticateToken, userController.unlinkWhatsAppNumber.bind(userController));
router.get('/user/whatsapp/status', authenticateToken, userController.getWhatsAppStatus.bind(userController));

export default router;
