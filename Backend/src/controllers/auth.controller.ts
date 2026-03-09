import { Request, Response } from 'express';
import { generateToken, AuthRequest } from '../middleware/auth';

export class AuthController {
  async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
      }

      const token = generateToken(user);
      
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error: any) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const authController = new AuthController();
