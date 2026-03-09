import { Router } from 'express';
import passport from '../config/passport';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=authentication_failed`,
  }),
  authController.googleCallback
);

router.get('/auth/me', authenticateToken, authController.getCurrentUser);

router.post('/auth/logout', authenticateToken, authController.logout);

export default router;
