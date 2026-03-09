import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dynamoDBService } from '../services/dynamodb.service';
import { TABLES } from '../config/aws';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: any;
}

export const generateToken = (user: any): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const userRecord = await dynamoDBService.get(TABLES.USERS, { id: tokenPayload.id });
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    req.user = userRecord;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to authenticate request',
    });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
};
