import { dynamoDBService } from './dynamodb.service';
import { msg91Service } from './msg91.service';
import { bedrockService } from './bedrock.service';
import { toolExecutorService } from './tool-executor.service';
import { s3Service } from './s3.service';
import { v4 as uuidv4 } from 'uuid';
import { PLATFORM_CONFIG } from '../config/platforms';

const TABLES = {
  CHAT_CONVERSATIONS: process.env.DYNAMODB_TABLE_PREFIX + 'chat_conversations',
  CHAT_MESSAGES: process.env.DYNAMODB_TABLE_PREFIX + 'chat_messages',
};

interface WorkflowState {
  type: 'instagram_post' | 'youtube_post' | null;
  step: 'awaiting_media' | 'awaiting_platform' | 'awaiting_caption' | 'generating_caption' | 'awaiting_approval' | 'posting' | 'complete' | null;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  title?: string;
  description?: string;
  tags?: string[];
  platform?: 'instagram' | 'youtube';
  captionContext?: string;
}

export class WhatsAppWorkflowService {
  /**
   * Get or initialize workflow state from conversation metadata
   */
  private async getWorkflowState(conversationId: string): Promise<WorkflowState> {
    const conversation = await dynamoDBService.getConversation(conversationId);
    return conversation?.metadata?.workflowState || { type: null, step: null };
  }

  /**
   * Update workflow state in conversation metadata
   */
  private async updateWorkflowState(conversationId: string, state: WorkflowState): Promise<void> {
    const conversation = await dynamoDBService.getConversation(conversationId);
    if (!conversation) return;

    await dynamoDBService.update(
      TABLES.CHAT_CONVERSATIONS,
      { id: conversationId },
      'SET #metadata = :metadata',
      { ':metadata': { ...conversation.metadata, workflowState: state } },
      { '#metadata': 'metadata' }
    );
  }

  /**
   * Clear workflow state
   */
  private async clearWorkflowState(conversationId: string): Promise<void> {
    await this.updateWorkflowState(conversationId, { type: null, step: null });
  }

  /**
   * Detect posting intent from user message
   */
  private detectPostingIntent(message: string): { platform?: 'instagram' | 'youtube'; detected: boolean } {
    const lowerMsg = message.toLowerCase();
    const postKeywords = /\b(post|upload|share|publish)\b/i;
    
    if (!postKeywords.test(message)) {
      return { detected: false };
    }

    if (/(instagram|insta|ig)/i.test(message)) {
      return { platform: 'instagram', detected: true };
    }
    
    if (/(youtube|yt)/i.test(message)) {
      return { platform: 'youtube', detected: true };
    }

    return { detected: false };
  }

  /**
   * Handle WhatsApp message with workflow orchestration
   */
  async handleMessage(
    userId: string,
    conversationId: string,
    message: string,
    phoneNumber: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video'
  ): Promise<string> {
    const workflowState = await this.getWorkflowState(conversationId);

    const normalizedMessage = message.trim();

    // Check if user wants to cancel (STOP command)
    if (/^stop$/i.test(normalizedMessage) || /\b(cancel|abort|nevermind)\b/i.test(normalizedMessage)) {
      if (workflowState.step) {
        await this.clearWorkflowState(conversationId);
        return '🛑 Content upload flow stopped. You can start again anytime by sending a new request.';
      }
    }

    const postingIntent = this.detectPostingIntent(message);

    // If we're in an active workflow, allow user to switch context when no media is provided
    if (workflowState.step) {

      if (
        workflowState.step === 'awaiting_media' &&
        !mediaUrl &&
        !postingIntent.detected
      ) {
        console.log('🔁 User sent a non-posting request while awaiting media. Clearing workflow.');
        await this.clearWorkflowState(conversationId);
      } else {
        return await this.continueWorkflow(userId, conversationId, message, phoneNumber, workflowState, mediaUrl, mediaType);
      }
    }

    // Detect new posting intent
    if (postingIntent.detected && postingIntent.platform) {
      // Start new posting workflow
      if (!mediaUrl) {
        const newState: WorkflowState = {
          type: postingIntent.platform === 'instagram' ? 'instagram_post' : 'youtube_post',
          step: 'awaiting_media',
          platform: postingIntent.platform,
        };
        await this.updateWorkflowState(conversationId, newState);
        
        const mediaTypeText = postingIntent.platform === 'instagram' ? 'image or video' : 'video';
        return `📸 Great! To post to ${postingIntent.platform === 'instagram' ? 'Instagram' : 'YouTube'}, please send me the ${mediaTypeText} you'd like to upload. (Type "STOP" anytime to cancel.)`;
      } else {
        // Media already attached, start workflow
        return await this.startPostingWorkflow(
          userId,
          conversationId,
          phoneNumber,
          postingIntent.platform,
          mediaUrl,
          mediaType || 'image'
        );
      }
    }

    // If media is provided without explicit intent, ask for platform
    if (mediaUrl) {
      const inferredPlatform = mediaType === 'video' ? 'youtube' : 'instagram';
      const newState: WorkflowState = {
        type: null,
        step: 'awaiting_platform',
        mediaUrl,
        mediaType: mediaType || 'image',
      };
      await this.updateWorkflowState(conversationId, newState);

      return `📎 Got your ${mediaType || 'media'}! Where should I post it?
Reply with "Instagram" or "YouTube" to continue.
Type "STOP" anytime to cancel the upload flow.`;
    }

    // No workflow active, process as normal AI chat
    return await this.processNormalChat(userId, conversationId, message);
  }

  /**
   * Start posting workflow with media
   */
  private async startPostingWorkflow(
    userId: string,
    conversationId: string,
    phoneNumber: string,
    platform: 'instagram' | 'youtube',
    mediaUrl: string,
    mediaType: 'image' | 'video'
  ): Promise<string> {
    let finalMediaUrl = mediaUrl;
    
    // Upload WhatsApp media to S3 for Instagram compatibility
    if (mediaUrl.includes('phone91.com') || mediaUrl.includes('whatsapp')) {
      try {
        console.log(`📤 Downloading WhatsApp media from phone91 and uploading to S3: ${mediaUrl}`);

        // Download media using MSG91 service with authkey authentication
        const mediaBuffer = await msg91Service.downloadMedia(mediaUrl);
        
        // Upload buffer directly to S3
        const extension = mediaType === 'image' ? 'jpg' : 'mp4';
        const contentType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';
        const key = `whatsapp/${userId}/${Date.now()}.${extension}`;
        
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const { s3Client, S3_BUCKET, S3_BUCKET_REGION } = await import('../config/aws');
        
        const command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: mediaBuffer,
          ContentType: contentType,
        });

        await s3Client.send(command);
        finalMediaUrl = `https://${S3_BUCKET}.s3.${S3_BUCKET_REGION}.amazonaws.com/${key}`;
        
        console.log(`✅ Media uploaded to S3: ${finalMediaUrl}`);
      } catch (error: any) {
        console.error('❌ Failed to upload media to S3:', error.message);
        return `❌ Failed to process your ${mediaType}. Please try uploading again.`;
      }
    }
    
    const workflowState: WorkflowState = {
      type: platform === 'instagram' ? 'instagram_post' : 'youtube_post',
      step: 'awaiting_caption',
      mediaUrl: finalMediaUrl,
      mediaType,
      platform,
    };
    
    await this.updateWorkflowState(conversationId, workflowState);

    if (platform === 'instagram') {
      return `📸 Perfect! I've received your ${mediaType}.\n\nWould you like to:\n1️⃣ Write your own caption\n2️⃣ Let me generate a caption for you\n\nReply with "1" or "2", or type your caption directly.`;
    } else {
      return `🎥 Great! I've received your video.\n\nLet's set up your YouTube post. Would you like to:\n1️⃣ Provide title, description, and tags manually\n2️⃣ Let me generate them for you\n\nReply with "1" or "2".`;
    }
  }

  /**
   * Continue existing workflow based on current step
   */
  private async continueWorkflow(
    userId: string,
    conversationId: string,
    message: string,
    phoneNumber: string,
    state: WorkflowState,
    mediaUrl?: string,
    mediaType?: 'image' | 'video'
  ): Promise<string> {
    if (state.step === 'awaiting_platform') {
      // Get the latest media URL from recent messages to ensure we use phone91 URL
      let finalMediaUrl = state.mediaUrl || mediaUrl || '';
      let finalMediaType = state.mediaType || mediaType || 'image';
      
      // Retrieve recent messages to find the latest media with phone91 URL
      const recentMessages = await dynamoDBService.listChatMessages(conversationId, 5);
      for (const msg of recentMessages) {
        if (msg.metadata?.mediaUrl && msg.metadata.mediaUrl.includes('phone91.com')) {
          finalMediaUrl = msg.metadata.mediaUrl;
          finalMediaType = msg.metadata.mediaType || finalMediaType;
          console.log(`📎 Using phone91 media URL from recent messages: ${finalMediaUrl}`);
          break;
        }
      }
      
      const lowerMsg = message.toLowerCase();
      if (/(instagram|insta|ig)/i.test(lowerMsg)) {
        return await this.startPostingWorkflow(
          userId,
          conversationId,
          phoneNumber,
          'instagram',
          finalMediaUrl,
          finalMediaType as 'image' | 'video'
        );
      }

      if (/(youtube|yt)/i.test(lowerMsg)) {
        return await this.startPostingWorkflow(
          userId,
          conversationId,
          phoneNumber,
          'youtube',
          finalMediaUrl,
          finalMediaType as 'image' | 'video'
        );
      }

      return '📌 Please reply with "Instagram" or "YouTube" to choose where to post this media.';
    }

    if (state.step === 'awaiting_media') {
      if (mediaUrl) {
        return await this.startPostingWorkflow(
          userId,
          conversationId,
          phoneNumber,
          state.platform || 'instagram',
          mediaUrl,
          mediaType || 'image'
        );
      }
      return '📎 I\'m ready when you send the media file for this post. Please attach the photo/video and resend.';
    }

    if (state.type === 'instagram_post') {
      return await this.handleInstagramWorkflow(userId, conversationId, message, phoneNumber, state);
    } else if (state.type === 'youtube_post') {
      return await this.handleYouTubeWorkflow(userId, conversationId, message, phoneNumber, state);
    }

    return 'Something went wrong with the workflow. Please try again.';
  }

  /**
   * Handle Instagram posting workflow
   */
  private async handleInstagramWorkflow(
    userId: string,
    conversationId: string,
    message: string,
    phoneNumber: string,
    state: WorkflowState
  ): Promise<string> {
    if (state.step === 'awaiting_caption') {
      if (message.trim() === '2') {
        // User wants AI-generated caption
        state.step = 'generating_caption';
        await this.updateWorkflowState(conversationId, state);
        return '✨ I can generate a caption for you! Please provide some context:\n\nWhat\'s the main theme or message of this post? (e.g., "promoting our new product", "travel adventure", "motivational quote")';
      } else if (message.trim() === '1' || message.length > 10) {
        // User provided caption or chose manual
        if (message.trim() === '1') {
          return '📝 Please type your caption:';
        }
        state.caption = message;
        state.step = 'awaiting_approval';
        await this.updateWorkflowState(conversationId, state);
        return await this.showInstagramPreview(state);
      }
      return 'Please reply with "1" to write your own caption, "2" for AI generation, or type your caption directly.';
    }

    if (state.step === 'generating_caption') {
      // Generate caption based on context
      state.captionContext = message;
      const generatedCaption = await this.generateCaption(message, 'Instagram');
      state.caption = generatedCaption;
      state.step = 'awaiting_approval';
      await this.updateWorkflowState(conversationId, state);
      
      return `✨ Here's your generated caption:\n\n"${generatedCaption}"\n\nDo you approve this caption?\n✅ Reply "yes" to approve\n🔄 Reply "regenerate" to try again\n✏️ Or type a new caption to use instead`;
    }

    if (state.step === 'awaiting_approval') {
      const lowerMsg = message.toLowerCase().trim();
      
      if (lowerMsg === 'yes' || lowerMsg === 'approve' || lowerMsg === 'post' || lowerMsg === 'confirm') {
        // Post to Instagram
        state.step = 'posting';
        await this.updateWorkflowState(conversationId, state);
        
        try {
          const result = await toolExecutorService.executeTool(
            'post_to_instagram',
            { imageUrl: state.mediaUrl!, caption: state.caption!, mediaType: state.mediaType },
            userId
          );
          
          const parsed = JSON.parse(result);
          await this.clearWorkflowState(conversationId);
          
          if (parsed.success) {
            return `🎉 Success! Your post has been published to Instagram!\n\nAnything else I can help you with?`;
          } else {
            return `❌ Failed to post: ${parsed.error}\n\nPlease try again or contact support.`;
          }
        } catch (error: any) {
          await this.clearWorkflowState(conversationId);
          return `❌ Error posting to Instagram: ${error.message}`;
        }
      } else if (lowerMsg === 'regenerate' || lowerMsg === 'retry') {
        state.step = 'generating_caption';
        await this.updateWorkflowState(conversationId, state);
        return '✨ Let me generate a new caption. Please provide updated context or theme:';
      } else {
        // User provided new caption
        state.caption = message;
        await this.updateWorkflowState(conversationId, state);
        return await this.showInstagramPreview(state);
      }
    }

    return 'Something went wrong. Please try again.';
  }

  /**
   * Handle YouTube posting workflow
   */
  private async handleYouTubeWorkflow(
    userId: string,
    conversationId: string,
    message: string,
    phoneNumber: string,
    state: WorkflowState
  ): Promise<string> {
    if (state.step === 'awaiting_caption') {
      if (message.trim() === '2') {
        state.step = 'generating_caption';
        await this.updateWorkflowState(conversationId, state);
        return '✨ I can generate title, description, and tags for you!\n\nPlease provide context about your video:\n(e.g., "tutorial on web development", "product review", "travel vlog")';
      } else if (message.trim() === '1') {
        return '📝 Please provide:\n\n1. Title:\n2. Description:\n3. Tags (comma-separated):\n\nFormat: Title | Description | tag1, tag2, tag3';
      } else if (message.includes('|')) {
        // Parse manual input
        const parts = message.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          state.title = parts[0];
          state.description = parts[1];
          state.tags = parts[2] ? parts[2].split(',').map(t => t.trim()) : [];
          state.step = 'awaiting_approval';
          await this.updateWorkflowState(conversationId, state);
          return await this.showYouTubePreview(state);
        }
        return 'Invalid format. Please use: Title | Description | tag1, tag2, tag3';
      }
      return 'Please reply with "1" for manual input or "2" for AI generation.';
    }

    if (state.step === 'generating_caption') {
      const context = message;
      const titleResult = await this.generateCaption(`YouTube video title for: ${context}`, 'YouTube');
      const descResult = await this.generateCaption(`YouTube video description for: ${context}`, 'YouTube');
      
      state.title = titleResult.substring(0, 100);
      state.description = descResult;
      state.tags = this.extractTags(context);
      state.step = 'awaiting_approval';
      await this.updateWorkflowState(conversationId, state);
      
      return await this.showYouTubePreview(state) + '\n\nDo you approve?\n✅ Reply "yes" to post\n🔄 Reply "regenerate" to try again\n✏️ Or provide new details in format: Title | Description | tag1, tag2';
    }

    if (state.step === 'awaiting_approval') {
      const lowerMsg = message.toLowerCase().trim();
      
      if (lowerMsg === 'yes' || lowerMsg === 'approve' || lowerMsg === 'post' || lowerMsg === 'confirm') {
        state.step = 'posting';
        await this.updateWorkflowState(conversationId, state);
        
        try {
          const result = await toolExecutorService.executeTool(
            'post_to_youtube',
            {
              videoUrl: state.mediaUrl!,
              title: state.title!,
              description: state.description!,
              tags: state.tags || [],
            },
            userId
          );
          
          const parsed = JSON.parse(result);
          await this.clearWorkflowState(conversationId);
          
          if (parsed.success) {
            return `🎉 Success! Your video has been uploaded to YouTube!\n\nAnything else I can help you with?`;
          } else {
            return `❌ Failed to upload: ${parsed.error}`;
          }
        } catch (error: any) {
          await this.clearWorkflowState(conversationId);
          return `❌ Error uploading to YouTube: ${error.message}`;
        }
      } else if (lowerMsg === 'regenerate') {
        state.step = 'generating_caption';
        await this.updateWorkflowState(conversationId, state);
        return '✨ Let me generate new details. Please provide updated context:';
      } else if (message.includes('|')) {
        const parts = message.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          state.title = parts[0];
          state.description = parts[1];
          state.tags = parts[2] ? parts[2].split(',').map(t => t.trim()) : state.tags;
          await this.updateWorkflowState(conversationId, state);
          return await this.showYouTubePreview(state);
        }
      }
    }

    return 'Something went wrong. Please try again.';
  }

  /**
   * Show Instagram post preview
   */
  private async showInstagramPreview(state: WorkflowState): Promise<string> {
    return `📸 Instagram Post Preview:\n\n📝 Caption:\n"${state.caption}"\n\n✅ Reply "yes" to post\n✏️ Or type a new caption to update`;
  }

  /**
   * Show YouTube post preview
   */
  private async showYouTubePreview(state: WorkflowState): Promise<string> {
    return `🎥 YouTube Video Preview:\n\n📌 Title: ${state.title}\n\n📄 Description:\n${state.description}\n\n🏷️ Tags: ${state.tags?.join(', ') || 'None'}`;
  }

  /**
   * Generate caption using AI
   */
  private async generateCaption(context: string, platform: string): Promise<string> {
    const result = await toolExecutorService.executeTool(
      'generate_caption',
      { prompt: context, platform, tone: 'engaging' },
      'system'
    );
    
    const parsed = JSON.parse(result);
    return parsed.caption || parsed.answer || 'Check out this amazing content!';
  }

  /**
   * Extract tags from context
   */
  private extractTags(context: string): string[] {
    const words = context.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 3).slice(0, 5);
  }

  /**
   * Process normal AI chat (no workflow)
   */
  private async processNormalChat(userId: string, conversationId: string, message: string): Promise<string> {
    const toolExecutor = async (toolName: string, toolInput: any) => {
      return await toolExecutorService.executeTool(toolName, toolInput, userId);
    };

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

    const context = { channel: 'whatsapp' };
    
    return await bedrockService.answerQuestionWithTools(message, context, toolExecutor, { priorMessages });
  }
}

export const whatsappWorkflowService = new WhatsAppWorkflowService();
