import { dynamoDBService } from './dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppNumber } from '../types/whatsapp';

const TABLES = {
  WHATSAPP_NUMBERS: process.env.DYNAMODB_TABLE_PREFIX + 'whatsapp_numbers',
};

export class WhatsAppNumberService {
  /**
   * Add a new WhatsApp number for a user
   */
  async addWhatsAppNumber(
    userId: string,
    phoneNumber: string,
    displayName?: string,
    isPrimary: boolean = false
  ): Promise<WhatsAppNumber> {
    const cleanedNumber = phoneNumber.replace(/\s+/g, '');
    
    // Check if this number already exists for this user
    const existingNumbers = await this.getUserWhatsAppNumbers(userId);
    const duplicate = existingNumbers.find(n => n.phoneNumber === cleanedNumber);
    
    if (duplicate) {
      throw new Error('This phone number is already linked to your account');
    }

    // Check if number is linked to another user
    const allNumbers = await dynamoDBService.queryByIndex(
      TABLES.WHATSAPP_NUMBERS,
      'PhoneNumberIndex',
      '#phoneNumber = :phoneNumber',
      { ':phoneNumber': cleanedNumber },
      { '#phoneNumber': 'phoneNumber' }
    ) as WhatsAppNumber[];

    if (allNumbers && allNumbers.length > 0) {
      throw new Error('This phone number is already linked to another account');
    }

    // If this is the first number or marked as primary, set it as primary
    const shouldBePrimary = isPrimary || existingNumbers.length === 0;

    // If setting as primary, unset other primary numbers
    if (shouldBePrimary) {
      await this.unsetPrimaryNumbers(userId);
    }

    const whatsappNumber: WhatsAppNumber = {
      id: uuidv4(),
      userId,
      phoneNumber: cleanedNumber,
      displayName: displayName || cleanedNumber,
      isVerified: true,
      isPrimary: shouldBePrimary,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        messageCount: 0,
      },
    };

    await dynamoDBService.put(TABLES.WHATSAPP_NUMBERS, whatsappNumber);
    console.log(`✅ Added WhatsApp number ${cleanedNumber} for user ${userId}`);
    
    return whatsappNumber;
  }

  /**
   * Get all WhatsApp numbers for a user
   */
  async getUserWhatsAppNumbers(userId: string): Promise<WhatsAppNumber[]> {
    const numbers = await dynamoDBService.queryByIndex(
      TABLES.WHATSAPP_NUMBERS,
      'UserIdIndex',
      '#userId = :userId',
      { ':userId': userId },
      { '#userId': 'userId' }
    ) as WhatsAppNumber[];

    return numbers.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Get WhatsApp number by phone number
   */
  async getByPhoneNumber(phoneNumber: string): Promise<WhatsAppNumber | null> {
    const cleanedNumber = phoneNumber.replace(/\s+/g, '');
    const numbers = await dynamoDBService.queryByIndex(
      TABLES.WHATSAPP_NUMBERS,
      'PhoneNumberIndex',
      '#phoneNumber = :phoneNumber',
      { ':phoneNumber': cleanedNumber },
      { '#phoneNumber': 'phoneNumber' }
    ) as WhatsAppNumber[];

    return numbers && numbers.length > 0 ? numbers[0] : null;
  }

  /**
   * Get user ID by phone number
   */
  async getUserIdByPhoneNumber(phoneNumber: string): Promise<string | null> {
    const number = await this.getByPhoneNumber(phoneNumber);
    return number?.userId || null;
  }

  /**
   * Remove a WhatsApp number
   */
  async removeWhatsAppNumber(userId: string, numberId: string): Promise<void> {
    const number = await dynamoDBService.get(TABLES.WHATSAPP_NUMBERS, { id: numberId });
    
    if (!number || number.userId !== userId) {
      throw new Error('WhatsApp number not found or unauthorized');
    }

    // If removing primary number, set another as primary
    if (number.isPrimary) {
      const otherNumbers = (await this.getUserWhatsAppNumbers(userId))
        .filter(n => n.id !== numberId);
      
      if (otherNumbers.length > 0) {
        await this.setPrimaryNumber(userId, otherNumbers[0].id);
      }
    }

    await dynamoDBService.delete(TABLES.WHATSAPP_NUMBERS, { id: numberId });
    console.log(`✅ Removed WhatsApp number ${numberId} for user ${userId}`);
  }

  /**
   * Set a number as primary
   */
  async setPrimaryNumber(userId: string, numberId: string): Promise<void> {
    const number = await dynamoDBService.get(TABLES.WHATSAPP_NUMBERS, { id: numberId });
    
    if (!number || number.userId !== userId) {
      throw new Error('WhatsApp number not found or unauthorized');
    }

    // Unset all primary numbers for this user
    await this.unsetPrimaryNumbers(userId);

    // Set this number as primary
    await dynamoDBService.update(
      TABLES.WHATSAPP_NUMBERS,
      { id: numberId },
      'SET #isPrimary = :isPrimary, #updatedAt = :updatedAt',
      { ':isPrimary': true, ':updatedAt': new Date().toISOString() },
      { '#isPrimary': 'isPrimary', '#updatedAt': 'updatedAt' }
    );

    console.log(`✅ Set WhatsApp number ${numberId} as primary for user ${userId}`);
  }

  /**
   * Update number display name
   */
  async updateDisplayName(userId: string, numberId: string, displayName: string): Promise<void> {
    const number = await dynamoDBService.get(TABLES.WHATSAPP_NUMBERS, { id: numberId });
    
    if (!number || number.userId !== userId) {
      throw new Error('WhatsApp number not found or unauthorized');
    }

    await dynamoDBService.update(
      TABLES.WHATSAPP_NUMBERS,
      { id: numberId },
      'SET #displayName = :displayName, #updatedAt = :updatedAt',
      { ':displayName': displayName, ':updatedAt': new Date().toISOString() },
      { '#displayName': 'displayName', '#updatedAt': 'updatedAt' }
    );

    console.log(`✅ Updated display name for WhatsApp number ${numberId}`);
  }

  /**
   * Toggle number active status
   */
  async toggleActiveStatus(userId: string, numberId: string): Promise<boolean> {
    const number = await dynamoDBService.get(TABLES.WHATSAPP_NUMBERS, { id: numberId });
    
    if (!number || number.userId !== userId) {
      throw new Error('WhatsApp number not found or unauthorized');
    }

    const newStatus = !number.isActive;

    await dynamoDBService.update(
      TABLES.WHATSAPP_NUMBERS,
      { id: numberId },
      'SET #isActive = :isActive, #updatedAt = :updatedAt',
      { ':isActive': newStatus, ':updatedAt': new Date().toISOString() },
      { '#isActive': 'isActive', '#updatedAt': 'updatedAt' }
    );

    console.log(`✅ Toggled active status for WhatsApp number ${numberId} to ${newStatus}`);
    return newStatus;
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(phoneNumber: string): Promise<void> {
    const number = await this.getByPhoneNumber(phoneNumber);
    if (!number) return;

    const currentCount = number.metadata?.messageCount || 0;

    await dynamoDBService.update(
      TABLES.WHATSAPP_NUMBERS,
      { id: number.id },
      'SET #metadata = :metadata, #updatedAt = :updatedAt',
      {
        ':metadata': {
          lastUsed: new Date().toISOString(),
          messageCount: currentCount + 1,
        },
        ':updatedAt': new Date().toISOString(),
      },
      { '#metadata': 'metadata', '#updatedAt': 'updatedAt' }
    );
  }

  /**
   * Unset all primary numbers for a user (internal helper)
   */
  private async unsetPrimaryNumbers(userId: string): Promise<void> {
    const numbers = await this.getUserWhatsAppNumbers(userId);
    const primaryNumbers = numbers.filter(n => n.isPrimary);

    for (const number of primaryNumbers) {
      await dynamoDBService.update(
        TABLES.WHATSAPP_NUMBERS,
        { id: number.id },
        'SET #isPrimary = :isPrimary, #updatedAt = :updatedAt',
        { ':isPrimary': false, ':updatedAt': new Date().toISOString() },
        { '#isPrimary': 'isPrimary', '#updatedAt': 'updatedAt' }
      );
    }
  }
}

export const whatsappNumberService = new WhatsAppNumberService();
