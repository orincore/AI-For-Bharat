import { Request, Response } from 'express';
import { msg91Service } from '../services/msg91.service';
import { bedrockService } from '../services/bedrock.service';
import { toolExecutorService } from '../services/tool-executor.service';
import { dynamoDBService } from '../services/dynamodb.service';
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
      const payload = req.body;
      console.log('📱 Received WhatsApp webhook:', JSON.stringify(payload, null, 2));

      // Parse the inbound message
      const parsedMessage = msg91Service.parseInboundMessage(payload);

      if (!parsedMessage) {
        console.log('⏭️ Skipping non-inbound message');
        return res.status(200).json({ success: true, message: 'Not an inbound message' });
      }

      const { from, message, messageId } = parsedMessage;
      console.log(`💬 Processing message from ${from}: "${message}"`);

      // Check if this phone number is linked to a verified user account
      const verifiedUser = await this.getVerifiedUserByPhone(from);
      
      if (!verifiedUser) {
        console.log(`🚫 Unauthorized WhatsApp number: ${from}`);
        await msg91Service.sendTextMessage(
          from,
          '⚠️ Your WhatsApp number is not linked to an Orin AI account. Please link your number in the dashboard at https://your-app-url.com/dashboard to access your data securely.'
        );
        return res.status(200).json({ 
          success: false, 
          message: 'Phone number not linked to account',
          unauthorized: true 
        });
      }

      const userId = verifiedUser.id;
      console.log(`✅ Verified user ${userId} for phone ${from}`);

      // Get or create conversation for this user
      const conversationId = await this.getOrCreateConversation(userId, from);

      // Save user message
      await dynamoDBService.createChatMessage({
        id: messageId || uuidv4(),
        conversationId,
        userId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        metadata: { source: 'whatsapp', phoneNumber: from },
      });

      // Get conversation history
      const priorMessagesRaw = await dynamoDBService.listChatMessages(conversationId, 40);
      const priorMessages = priorMessagesRaw
        .map((msg: any) => {
          const role: 'assistant' | 'user' = msg.role === 'assistant' ? 'assistant' : 'user';
          return {
            role,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          };
        })
        .filter((msg: any) => Boolean(msg.content))
        .slice(-6);

      // Prepare context for Orin AI
      const accounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId',
        { ':userId': userId },
        { '#userId': 'userId' }
      );

      const context = {
        connectedAccounts: accounts.map((acc: any) => ({
          platform: acc.platform,
          username: acc.platformUsername,
          isActive: acc.isActive,
        })),
        capabilities: {
          analyticsTools: ['get_instagram_analytics', 'get_youtube_analytics', 'get_all_analytics_summary'],
          postingTools: ['post_to_instagram', 'post_to_youtube', 'post_to_multiple_platforms'],
          utilities: ['generate_caption', 'get_connected_accounts'],
          commentTools: ['get_instagram_comments', 'get_youtube_comments', 'get_latest_comment'],
        },
        channel: 'whatsapp',
      };

      // Process message through Orin AI
      const toolExecutor = async (toolName: string, toolInput: any) => {
        return await toolExecutorService.executeTool(toolName, toolInput, userId);
      };

      console.log('🤖 Processing message through Orin AI...');
      const aiResponse = await bedrockService.answerQuestionWithTools(
        message,
        context,
        toolExecutor,
        { priorMessages }
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
      await msg91Service.sendTextMessage(from, aiResponse);

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
   * Get verified user by phone number
   */
  private async getVerifiedUserByPhone(phoneNumber: string): Promise<any | null> {
    try {
      const users = await dynamoDBService.query(
        TABLES.USERS,
        '#phoneNumber = :phoneNumber AND #whatsappVerified = :verified',
        { ':phoneNumber': phoneNumber, ':verified': true },
        { '#phoneNumber': 'phoneNumber', '#whatsappVerified': 'whatsappVerified' }
      );

      if (users && users.length > 0) {
        return users[0];
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error getting verified user:', error);
      return null;
    }
  }

  /**
   * Get or create a conversation for this WhatsApp user
   */
  private async getOrCreateConversation(userId: string, phoneNumber: string): Promise<string> {
    try {
      // Try to find existing conversation
      const conversations = await dynamoDBService.listConversations(userId, 1);

      if (conversations && conversations.length > 0) {
        console.log(`💬 Found existing conversation: ${conversations[0].id}`);
        return conversations[0].id;
      }

      // Create new conversation
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

      console.log(`✅ Created new conversation: ${conversationId}`);
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
