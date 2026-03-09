import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { bedrockService } from '../services/bedrock.service';
import { dynamoDBService } from '../services/dynamodb.service';
import { metaService } from '../services/meta.service';
import { youtubeService } from '../services/youtube.service';
import { toolExecutorService } from '../services/tool-executor.service';
import { AuthRequest } from '../middleware/auth';
import { ConnectedAccount } from '../types';

const TABLES = {
  CONNECTED_ACCOUNTS: process.env.DYNAMODB_TABLE_PREFIX + 'connected_accounts',
  POST_HISTORY: process.env.DYNAMODB_TABLE_PREFIX + 'post_history',
};

export class AIController {
  // Generate caption using AI
  async generateCaption(req: Request, res: Response) {
    try {
      const {
        caption,
        platform,
        tone,
        audience,
        includeHashtags,
        includeEmojis,
        additionalContext,
        generateVideoMetadata,
      } = req.body;

      if (!caption) {
        return res.status(400).json({
          success: false,
          error: 'Caption is required',
        });
      }

      const generatedCaption = await bedrockService.generateCaption(
        caption,
        platform || 'Instagram',
        {
          tone: tone || 'engaging',
          audience: audience || 'general',
          includeHashtags: includeHashtags !== false,
          includeEmojis: includeEmojis !== false,
          additionalContext: additionalContext || '',
        }
      );

      let videoMetadata = null;
      if (generateVideoMetadata) {
        videoMetadata = await bedrockService.generateVideoMetadata(caption, {
          tone: tone || 'engaging',
          audience: audience || 'general',
          includeHashtags: includeHashtags !== false,
          includeEmojis: includeEmojis !== false,
          additionalContext: additionalContext || '',
        });
      }

      res.json({
        success: true,
        caption: generatedCaption,
        videoMetadata,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        caption: 'AI generation failed. Please try again.',
      });
    }
  }

  // Analyze content
  async analyzeContent(req: Request, res: Response) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
        });
      }

      const analysis = await bedrockService.analyzeContent(content);

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get AI recommendations
  async getRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Mock recommendations - in production, this would use historical data
      const recommendations = {
        bestPostingTime: 'Tue & Sat, 6 - 8 PM',
        topPerformingPlatform: 'Instagram Reels',
        suggestedContentType: 'Behind-the-scenes video',
        trendingHashtags: ['#ContentCreator', '#SocialMedia', '#DigitalMarketing'],
        engagementTips: [
          'Post consistently at optimal times',
          'Use trending audio in Reels',
          'Engage with comments within first hour',
        ],
      };

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Summarize analytics using AI
  async summarizeAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      console.log('🤖 Fetching analytics data for AI summarization...');

      // Fetch all connected accounts
      const accounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId',
        { ':userId': userId },
        { '#userId': 'userId' }
      ) as ConnectedAccount[];

      // Fetch post history
      const postHistory = await dynamoDBService.listPostHistory(userId, 50);

      // Fetch real Instagram analytics
      const instagramAnalytics: any[] = [];
      for (const account of accounts.filter(a => a.platform === 'instagram' && a.isActive)) {
        try {
          const igAccountId = account.platformAccountId;
          if (igAccountId && account.accessToken) {
            const mediaData = await metaService.getInstagramMedia(igAccountId, 30, account.accessToken);
            if (mediaData?.data && Array.isArray(mediaData.data)) {
              for (const media of mediaData.data) {
                instagramAnalytics.push({
                  username: account.platformUsername,
                  caption: media.caption || 'No caption',
                  mediaType: media.media_type,
                  timestamp: media.timestamp,
                  likes: media.like_count || 0,
                  comments: media.comments_count || 0,
                  engagement: (media.like_count || 0) + (media.comments_count || 0),
                });
              }
            }
          }
        } catch (error: any) {
          console.warn(`Failed to fetch Instagram analytics for ${account.platformUsername}:`, error.message);
        }
      }

      // Fetch real YouTube analytics
      const youtubeAnalytics: any[] = [];
      for (const account of accounts.filter(a => a.platform === 'youtube' && a.isActive)) {
        try {
          const channelId = account.metadata?.channelId;
          if (channelId) {
            const videosData = await youtubeService.listChannelVideos(channelId, 30);
            if (videosData?.items) {
              for (const video of videosData.items) {
                try {
                  const stats = await youtubeService.getVideoStats(video.id.videoId);
                  if (stats?.items?.[0]) {
                    const videoStats = stats.items[0].statistics;
                    youtubeAnalytics.push({
                      username: account.platformUsername,
                      title: video.snippet.title,
                      publishedAt: video.snippet.publishedAt,
                      views: parseInt(videoStats.viewCount || '0'),
                      likes: parseInt(videoStats.likeCount || '0'),
                      comments: parseInt(videoStats.commentCount || '0'),
                    });
                  }
                } catch (err) {
                  console.warn(`Failed to fetch stats for video ${video.id.videoId}`);
                }
              }
            }
          }
        } catch (error: any) {
          console.warn(`Failed to fetch YouTube analytics for ${account.platformUsername}:`, error.message);
        }
      }

      // Calculate aggregate metrics
      const totalInstagramEngagement = instagramAnalytics.reduce((sum, post) => sum + post.engagement, 0);
      const avgInstagramEngagement = instagramAnalytics.length > 0 ? (totalInstagramEngagement / instagramAnalytics.length).toFixed(1) : '0';
      const topInstagramPost = instagramAnalytics.sort((a, b) => b.engagement - a.engagement)[0];

      const totalYouTubeViews = youtubeAnalytics.reduce((sum, video) => sum + video.views, 0);
      const avgYouTubeViews = youtubeAnalytics.length > 0 ? Math.round(totalYouTubeViews / youtubeAnalytics.length) : 0;
      const topYouTubeVideo = youtubeAnalytics.sort((a, b) => b.views - a.views)[0];

      // Build comprehensive analytics context
      const analyticsData = {
        connectedPlatforms: accounts.map(acc => ({
          platform: acc.platform,
          username: acc.platformUsername,
          isActive: acc.isActive,
        })),
        instagram: {
          totalPosts: instagramAnalytics.length,
          totalEngagement: totalInstagramEngagement,
          avgEngagement: avgInstagramEngagement,
          topPost: topInstagramPost ? {
            caption: topInstagramPost.caption.substring(0, 100),
            likes: topInstagramPost.likes,
            comments: topInstagramPost.comments,
            engagement: topInstagramPost.engagement,
          } : null,
          recentPosts: instagramAnalytics.slice(0, 10).map(p => ({
            caption: p.caption.substring(0, 80),
            likes: p.likes,
            comments: p.comments,
            timestamp: p.timestamp,
          })),
        },
        youtube: {
          totalVideos: youtubeAnalytics.length,
          totalViews: totalYouTubeViews,
          avgViews: avgYouTubeViews,
          topVideo: topYouTubeVideo ? {
            title: topYouTubeVideo.title,
            views: topYouTubeVideo.views,
            likes: topYouTubeVideo.likes,
            comments: topYouTubeVideo.comments,
          } : null,
          recentVideos: youtubeAnalytics.slice(0, 10).map(v => ({
            title: v.title.substring(0, 80),
            views: v.views,
            likes: v.likes,
            publishedAt: v.publishedAt,
          })),
        },
        postHistory: postHistory.slice(0, 20).map((post: any) => ({
          platform: post.platform,
          status: post.status,
          createdAt: post.createdAt,
        })),
        summary: {
          totalAccounts: accounts.length,
          totalPosts: postHistory.length,
          platforms: [...new Set(accounts.map(a => a.platform))],
        },
      };

      console.log('🤖 Generating comprehensive AI summary with real data...');
      const summary = await bedrockService.summarizeAnalytics(analyticsData);

      res.json({
        success: true,
        summary,
        data: {
          ...analyticsData.summary,
          instagram: analyticsData.instagram,
          youtube: analyticsData.youtube,
        },
      });
    } catch (error: any) {
      console.error('❌ Analytics summarization error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Answer user questions using AI with social media context
  async askQuestion(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const {
        question,
        conversationId: incomingConversationId,
        conversationTitle,
      } = req.body;
      if (!question) {
        return res.status(400).json({ success: false, error: 'Question is required' });
      }

      console.log('🤖 Processing question:', question);

      const now = new Date().toISOString();
      let conversationId: string | undefined = incomingConversationId as string | undefined;
      let conversation = conversationId
        ? await dynamoDBService.getConversation(conversationId)
        : null;

      if (!conversation) {
        conversationId = uuidv4();
        conversation = await dynamoDBService.createConversation({
          id: conversationId,
          userId,
          title:
            conversationTitle?.trim() ||
            question.substring(0, 60) + (question.length > 60 ? '…' : ''),
          createdAt: now,
          updatedAt: now,
        });
      }

      // Fetch all connected accounts
      const accounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId',
        { ':userId': userId },
        { '#userId': 'userId' }
      ) as ConnectedAccount[];

      // Fetch recent post history
      const postHistory = await dynamoDBService.listPostHistory(userId, 20);

      // Build lightweight context and let the LLM decide when to call analytics/posting tools
      const context = {
        connectedAccounts: accounts.map(acc => ({
          platform: acc.platform,
          username: acc.platformUsername,
          isActive: acc.isActive,
          metadata: acc.metadata,
          createdAt: acc.createdAt,
        })),
        recentPosts: postHistory.map((post: any) => ({
          platform: post.platform,
          status: post.status,
          createdAt: post.createdAt,
          caption: post.caption,
          errorMessage: post.errorMessage,
        })),
        capabilities: {
          analyticsTools: ['get_instagram_analytics', 'get_youtube_analytics', 'get_all_analytics_summary'],
          postingTools: ['post_to_instagram', 'post_to_youtube', 'post_to_multiple_platforms'],
          utilities: ['generate_caption', 'get_connected_accounts'],
          commentTools: ['get_instagram_comments', 'get_youtube_comments', 'get_latest_comment'],
        },
        accountSummary: {
          totalConnectedAccounts: accounts.length,
          platforms: accounts.map(a => a.platform),
          totalPosts: postHistory.length,
          successfulPosts: postHistory.filter((p: any) => p.status === 'success').length,
          failedPosts: postHistory.filter((p: any) => p.status === 'error').length,
        },
      };

      const assuredConversationId = conversationId as string;

      const priorMessagesRaw = await dynamoDBService.listChatMessages(assuredConversationId, 40);
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

      await dynamoDBService.createChatMessage({
        id: uuidv4(),
        conversationId: assuredConversationId,
        userId,
        role: 'user',
        content: question,
        createdAt: now,
      });

      console.log('🤖 Generating AI response with tool support...');

      const toolExecutor = async (toolName: string, toolInput: any) => {
        return await toolExecutorService.executeTool(toolName, toolInput, userId);
      };

      const answer = await bedrockService.answerQuestionWithTools(
        question,
        context,
        toolExecutor,
        { priorMessages }
      );

      const assistantTimestamp = new Date().toISOString();
      await dynamoDBService.createChatMessage({
        id: uuidv4(),
        conversationId: assuredConversationId,
        userId,
        role: 'assistant',
        content: answer,
        createdAt: assistantTimestamp,
      });

      await dynamoDBService.updateConversationTimestamp(assuredConversationId, assistantTimestamp);

      res.json({
        success: true,
        answer,
        conversationId: assuredConversationId,
        context: context.accountSummary,
      });
    } catch (error: any) {
      console.error('❌ Question answering error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        answer: 'I apologize, but I encountered an error processing your question. Please try again.',
      });
    }
  }

  async getLatestConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const requestedConversationId = (req.query?.conversationId as string | undefined)?.trim();

      let conversation = null;

      if (requestedConversationId) {
        const existing = await dynamoDBService.getConversation(requestedConversationId);
        if (existing && existing.userId === userId) {
          conversation = existing;
        }
      }

      if (!conversation) {
        const conversations = await dynamoDBService.listConversations(userId, 1);
        conversation = conversations[0];
      }

      if (!conversation) {
        return res.json({ success: true, conversation: null, messages: [] });
      }

      const messages = await dynamoDBService.listChatMessages(conversation.id, 50);

      return res.json({
        success: true,
        conversation,
        messages,
      });
    } catch (error: any) {
      console.error('❌ Failed to load latest conversation:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const aiController = new AIController();
