import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/dynamodb.service';
import { whatsappNumberService } from '../services/whatsapp-number.service';
import { v4 as uuidv4 } from 'uuid';

const TABLES = {
  USERS: process.env.DYNAMODB_TABLE_PREFIX + 'users',
};

export class UserController {
  /**
   * Add WhatsApp number to authenticated user account
   */
  async linkWhatsAppNumber(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { phoneNumber, displayName, isPrimary } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ success: false, error: 'Phone number is required' });
      }

      // Validate phone number format (basic validation)
      const cleanedNumber = phoneNumber.replace(/\s+/g, '');
      if (!/^\+?\d{10,15}$/.test(cleanedNumber)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid phone number format. Use format: +1234567890 or 1234567890' 
        });
      }

      const whatsappNumber = await whatsappNumberService.addWhatsAppNumber(
        userId,
        cleanedNumber,
        displayName,
        isPrimary
      );

      return res.json({
        success: true,
        message: 'WhatsApp number added successfully',
        number: whatsappNumber,
      });
    } catch (error: any) {
      console.error('❌ Failed to add WhatsApp number:', error);
      const statusCode = error.message.includes('already linked') ? 409 : 500;
      return res.status(statusCode).json({ success: false, error: error.message });
    }
  }

  /**
   * Remove WhatsApp number from user account
   */
  async unlinkWhatsAppNumber(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { numberId } = req.body;
      if (!numberId) {
        return res.status(400).json({ success: false, error: 'Number ID is required' });
      }

      await whatsappNumberService.removeWhatsAppNumber(userId, numberId);

      return res.json({
        success: true,
        message: 'WhatsApp number removed successfully',
      });
    } catch (error: any) {
      console.error('❌ Failed to remove WhatsApp number:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get current user's WhatsApp numbers
   */
  async getWhatsAppStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const numbers = await whatsappNumberService.getUserWhatsAppNumbers(userId);

      return res.json({
        success: true,
        numbers,
        totalNumbers: numbers.length,
        hasNumbers: numbers.length > 0,
      });
    } catch (error: any) {
      console.error('❌ Failed to get WhatsApp numbers:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Set a WhatsApp number as primary
   */
  async setPrimaryWhatsAppNumber(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { numberId } = req.body;
      if (!numberId) {
        return res.status(400).json({ success: false, error: 'Number ID is required' });
      }

      await whatsappNumberService.setPrimaryNumber(userId, numberId);

      return res.json({
        success: true,
        message: 'Primary WhatsApp number updated successfully',
      });
    } catch (error: any) {
      console.error('❌ Failed to set primary WhatsApp number:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update WhatsApp number display name
   */
  async updateWhatsAppNumberName(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { numberId, displayName } = req.body;
      if (!numberId || !displayName) {
        return res.status(400).json({ success: false, error: 'Number ID and display name are required' });
      }

      await whatsappNumberService.updateDisplayName(userId, numberId, displayName);

      return res.json({
        success: true,
        message: 'Display name updated successfully',
      });
    } catch (error: any) {
      console.error('❌ Failed to update display name:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Toggle WhatsApp number active status
   */
  async toggleWhatsAppNumberStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { numberId } = req.body;
      if (!numberId) {
        return res.status(400).json({ success: false, error: 'Number ID is required' });
      }

      const newStatus = await whatsappNumberService.toggleActiveStatus(userId, numberId);

      return res.json({
        success: true,
        message: `WhatsApp number ${newStatus ? 'activated' : 'deactivated'} successfully`,
        isActive: newStatus,
      });
    } catch (error: any) {
      console.error('❌ Failed to toggle WhatsApp number status:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const userController = new UserController();
