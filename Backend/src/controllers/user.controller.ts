import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dynamoDBService } from '../services/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';

const TABLES = {
  USERS: process.env.DYNAMODB_TABLE_PREFIX + 'users',
};

export class UserController {
  /**
   * Link WhatsApp number to authenticated user account
   */
  async linkWhatsAppNumber(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { phoneNumber } = req.body;
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

      // Check if phone number is already linked to another user
      const existingUsers = await dynamoDBService.queryByIndex(
        TABLES.USERS,
        'PhoneNumberVerificationIndex',
        '#phoneNumber = :phoneNumber',
        { ':phoneNumber': cleanedNumber },
        { '#phoneNumber': 'phoneNumber' }
      );

      if (existingUsers && existingUsers.length > 0 && existingUsers[0].id !== userId) {
        return res.status(409).json({ 
          success: false, 
          error: 'This phone number is already linked to another account' 
        });
      }

      // Update user with phone number
      await dynamoDBService.update(
        TABLES.USERS,
        { id: userId },
        'SET #phoneNumber = :phoneNumber, #whatsappVerified = :verified',
        { ':phoneNumber': cleanedNumber, ':verified': true },
        { '#phoneNumber': 'phoneNumber', '#whatsappVerified': 'whatsappVerified' }
      );

      console.log(`✅ Linked WhatsApp number ${cleanedNumber} to user ${userId}`);

      return res.json({
        success: true,
        message: 'WhatsApp number linked successfully',
        phoneNumber: cleanedNumber,
      });
    } catch (error: any) {
      console.error('❌ Failed to link WhatsApp number:', error);
      return res.status(500).json({ success: false, error: error.message });
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

      await dynamoDBService.update(
        TABLES.USERS,
        { id: userId },
        'REMOVE #phoneNumber, #whatsappVerified',
        {},
        { '#phoneNumber': 'phoneNumber', '#whatsappVerified': 'whatsappVerified' }
      );

      console.log(`✅ Unlinked WhatsApp number from user ${userId}`);

      return res.json({
        success: true,
        message: 'WhatsApp number unlinked successfully',
      });
    } catch (error: any) {
      console.error('❌ Failed to unlink WhatsApp number:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get current user's WhatsApp number status
   */
  async getWhatsAppStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await dynamoDBService.get(TABLES.USERS, { id: userId });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.json({
        success: true,
        phoneNumber: user.phoneNumber || null,
        whatsappVerified: user.whatsappVerified || false,
        isLinked: Boolean(user.phoneNumber),
      });
    } catch (error: any) {
      console.error('❌ Failed to get WhatsApp status:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const userController = new UserController();
