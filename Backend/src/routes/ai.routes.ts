import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';

const router = Router();

router.post('/ai/generate-caption', aiController.generateCaption.bind(aiController));
router.post('/ai/analyze', aiController.analyzeContent.bind(aiController));
router.get('/ai/recommendations/:userId', aiController.getRecommendations.bind(aiController));

export default router;
