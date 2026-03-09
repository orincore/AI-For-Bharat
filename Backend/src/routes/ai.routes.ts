import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/ai/generate-caption', aiController.generateCaption.bind(aiController));
router.post('/ai/analyze', aiController.analyzeContent.bind(aiController));
router.get('/ai/recommendations/:userId', aiController.getRecommendations.bind(aiController));
router.get('/ai/summarize-analytics', authenticateToken, aiController.summarizeAnalytics.bind(aiController));
router.post('/ai/ask', authenticateToken, aiController.askQuestion.bind(aiController));
router.get('/ai/conversation', authenticateToken, aiController.getLatestConversation.bind(aiController));

export default router;
