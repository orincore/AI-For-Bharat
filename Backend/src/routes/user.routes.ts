import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// WhatsApp number management
router.post('/user/whatsapp/link', authenticateToken, userController.linkWhatsAppNumber.bind(userController));
router.delete('/user/whatsapp/unlink', authenticateToken, userController.unlinkWhatsAppNumber.bind(userController));
router.get('/user/whatsapp/status', authenticateToken, userController.getWhatsAppStatus.bind(userController));
router.post('/user/whatsapp/set-primary', authenticateToken, userController.setPrimaryWhatsAppNumber.bind(userController));
router.put('/user/whatsapp/update-name', authenticateToken, userController.updateWhatsAppNumberName.bind(userController));
router.post('/user/whatsapp/toggle-status', authenticateToken, userController.toggleWhatsAppNumberStatus.bind(userController));

export default router;
