import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller';

const router = Router();

// MSG91 WhatsApp webhook endpoint
router.post('/msg91/whatsapp', whatsappController.handleInboundMessage.bind(whatsappController));

// Health check endpoint
router.get('/msg91/whatsapp/health', whatsappController.healthCheck.bind(whatsappController));

export default router;
