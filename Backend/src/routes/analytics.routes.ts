import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.post('/analytics/sync', analyticsController.syncAnalytics.bind(analyticsController));
router.get('/analytics/:userId', analyticsController.getAnalytics.bind(analyticsController));
router.get('/analytics/dashboard/:userId', analyticsController.getDashboardStats.bind(analyticsController));

export default router;
