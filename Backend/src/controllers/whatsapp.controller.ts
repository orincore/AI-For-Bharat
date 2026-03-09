import { Request, Response } from 'express';
import { msg91Service } from '../services/msg91.service';
import { bedrockService } from '../services/bedrock.service';
import { toolExecutorService } from '../services/tool-executor.service';
import { dynamoDBService } from '../services/dynamodb.service';
import { whatsappWorkflowService } from '../services/whatsapp-workflow.service';
import { whatsappNumberService } from '../services/whatsapp-number.service';
import { v4 as uuidv4 } from 'uuid';

const TABLES = {
  USERS: process.env.DYNAMODB_TABLE_PREFIX + 'users',
  CHAT_CONVERSATIONS: process.env.DYNAMODB_TABLE_PREFIX + 'chat_conversations',
  CHAT_MESSAGES: process.env.DYNAMODB_TABLE_PREFIX + 'chat_messages',
  CONNECTED_ACCOUNTS: process.env.DYNAMODB_TABLE_PREFIX + 'connected_accounts',
};

export class WhatsAppController {
  /**
   * Handle incoming WhatsApp messages from MSG91 webhook
   */
  async handleInboundMessage(req: Request, res: Response) {
    try {
      if (!msg91Service.validateWebhookSecret(req.headers)) {
        console.warn('🚫 Invalid MSG91 webhook secret');
        return res.status(401).json({ success: false, error: 'Invalid webhook secret' });
      }

      const payload = req.body;
      console.log('📱 Received WhatsApp webhook:', JSON.stringify(payload, null, 2));

      // Parse the inbound message
      const parsedMessage = msg91Service.parseInboundMessage(payload);

      if (!parsedMessage) {
        console.log('⏭️ Skipping non-inbound message');
        return res.status(200).json({ success: true, message: 'Not an inbound message' });
      }

      const { from, message, messageId, mediaUrl, mediaType } = parsedMessage;
      
      // Normalize phone number to match DynamoDB format (+prefix)
      const normalizedPhone = from.startsWith('+') ? from : `+${from}`;
      
      console.log(`💬 Processing message from ${normalizedPhone}: "${message}"${mediaUrl ? ` [Media: ${mediaType}]` : ''}`);

      // Check if this phone number is linked to a verified user account
      const userId = await whatsappNumberService.getUserIdByPhoneNumber(normalizedPhone);
      
      if (!userId) {
        console.log(`🚫 Unauthorized WhatsApp number: ${from}`);
        await msg91Service.sendTextMessage(
          from,
          '⚠️ Your WhatsApp number is not linked to an Orin AI account. Please link your number in the dashboard to access your data securely.'
        );
        return res.status(200).json({ 
          success: false, 
          message: 'Phone number not linked to account',
          unauthorized: true 
        });
      }

      // Update last used timestamp for this number
      await whatsappNumberService.updateLastUsed(normalizedPhone);
      console.log(`✅ Verified user ${userId} for phone ${normalizedPhone}`);

      // Get or create conversation for this user
      const conversationId = await this.getOrCreateConversation(userId, normalizedPhone);

      // Save user message
      const metadata: any = { source: 'whatsapp', phoneNumber: normalizedPhone };
      if (mediaUrl) metadata.mediaUrl = mediaUrl;
      if (mediaType) metadata.mediaType = mediaType;
      
      await dynamoDBService.createChatMessage({
        id: messageId || uuidv4(),
        conversationId,
        userId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        metadata,
      });

      // Process message through workflow service (handles posting workflows and normal chat)
      console.log('🤖 Processing message through WhatsApp workflow service...');
      const aiResponse = await whatsappWorkflowService.handleMessage(
        userId,
        conversationId,
        message,
        normalizedPhone,
        mediaUrl,
        mediaType
      );

      // Save assistant response
      await dynamoDBService.createChatMessage({
        id: uuidv4(),
        conversationId,
        userId,
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date().toISOString(),
        metadata: { source: 'whatsapp' },
      });

      // Update conversation timestamp
      await dynamoDBService.updateConversationTimestamp(conversationId, new Date().toISOString());

      // Send response back via WhatsApp
      console.log('📤 Sending AI response back to WhatsApp...');
      await msg91Service.sendTextMessage(normalizedPhone, aiResponse);

      console.log('✅ WhatsApp message processed successfully');
      return res.status(200).json({ success: true, messageId });
    } catch (error: any) {
      console.error('❌ WhatsApp webhook error:', error);
      
      // Still return 200 to MSG91 to avoid retries
      return res.status(200).json({ 
        success: false, 
        error: error.message,
        note: 'Error logged but returning 200 to prevent retries'
      });
    }
  }

  /**
   * Get or create a conversation for this WhatsApp user and phone number
   * Each phone number gets its own isolated conversation and workflow state
   */
  private async getOrCreateConversation(userId: string, phoneNumber: string): Promise<string> {
    try {
      // Try to find existing conversation for this specific phone number
      const allConversations = await dynamoDBService.listConversations(userId, 50);
      
      const existingConversation = allConversations?.find(
        (conv: any) => conv.metadata?.phoneNumber === phoneNumber && conv.metadata?.source === 'whatsapp'
      );

      if (existingConversation) {
        console.log(`💬 Found existing conversation for ${phoneNumber}: ${existingConversation.id}`);
        return existingConversation.id;
      }

      // Create new conversation for this phone number
      const conversationId = uuidv4();
      const now = new Date().toISOString();

      await dynamoDBService.createConversation({
        id: conversationId,
        userId,
        title: `WhatsApp Chat - ${phoneNumber}`,
        createdAt: now,
        updatedAt: now,
        metadata: {
          source: 'whatsapp',
          phoneNumber,
        },
      });

      console.log(`✅ Created new conversation for ${phoneNumber}: ${conversationId}`);
      return conversationId;
    } catch (error: any) {
      console.error('❌ Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint for webhook verification
   */
  async healthCheck(req: Request, res: Response) {
    return res.status(200).json({ 
      success: true, 
      service: 'WhatsApp Webhook',
      timestamp: new Date().toISOString(),
    });
  }
}

export const whatsappController = new WhatsAppController();
