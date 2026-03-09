import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/dashboard/stats', authenticateToken, (req, res) => dashboardController.getDashboardStats(req, res));

export default router;
