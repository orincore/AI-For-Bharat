import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb.service';
import { s3Service } from '../services/s3.service';
import { twitterService } from '../services/twitter.service';
import { linkedInService } from '../services/linkedin.service';
import { youtubeService } from '../services/youtube.service';
import { TABLES } from '../config/aws';
import { Post, ConnectedAccount, PlatformType } from '../types';
import { AuthRequest } from '../middleware/auth';

export class PostController {
  // Create a new post
  async createPost(req: AuthRequest, res: Response) {
    try {
      console.log('📝 [Posts] Received createPost request');
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { platform, caption, videoTitle, videoDescription, videoTags, scheduledTime } = req.body;
      const file = req.file;

      console.log('📝 [Posts] Payload summary', {
        userId,
        platform,
        captionLength: caption?.length,
        hasFile: !!file,
        scheduledTime,
      });

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Media file is required',
        });
      }

      let mediaUrl: string | undefined;
      if (file) {
        console.log('📝 [Posts] Uploading file to S3', {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
        const uploadResult = await s3Service.uploadFile(file, userId);
        mediaUrl = uploadResult.url;
        console.log('📝 [Posts] File uploaded', uploadResult);
      }

      const post: Post = {
        id: uuidv4(),
        userId,
        platform,
        caption,
        mediaUrl,
        mediaType: file?.mimetype.startsWith('video') ? 'video' : 'image',
        videoTitle,
        videoDescription,
        videoTags,
        status: scheduledTime ? 'scheduled' : 'draft',
        scheduledTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoDBService.put(TABLES.POSTS, post);

      await this.logPostHistory({
        userId,
        postId: post.id,
        platform,
        status: 'pending',
        stage: 'created',
        caption,
        mediaUrl,
      });

      console.log('📝 [Posts] Post saved to DynamoDB', { postId: post.id, platform });

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      console.error('❌ [Posts] createPost failed', formatPostError(error));
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Publish a post to platform
  async publishPost(req: AuthRequest, res: Response) {
    let post: Post | null = null;
    try {
      console.log('🚀 [Posts] Received publishPost request', { params: req.params });
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { postId } = req.params;
      post = (await dynamoDBService.get(TABLES.POSTS, { id: postId })) as Post | null;
      console.log('🚀 [Posts] Loaded post for publish', { postId, hasPost: !!post });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }

      if (!post.mediaUrl) {
        return res.status(400).json({
          success: false,
          error: 'Post media URL missing. Please re-upload the media.',
        });
      }

      let platformResponse;

      // Get user's active Instagram account
      const connectedAccounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': post.platform,
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      ) as ConnectedAccount[];

      console.log('🚀 [Posts] Connected accounts found', { count: connectedAccounts.length });

      const activeAccount = connectedAccounts.find(acc => acc.isActive) || connectedAccounts[0];
      if (!activeAccount) {
        return res.status(400).json({
          success: false,
          error: `No connected ${post.platform} account found`,
        });
      }

      console.log('🚀 [Posts] Using active account', {
        accountId: activeAccount.id,
        platformUsername: activeAccount.platformUsername,
        platformAccountId: activeAccount.platformAccountId,
        hasAccessToken: !!activeAccount.accessToken,
        hasMetaAccessToken: !!activeAccount.metaAccessToken,
        hasRefreshToken: !!activeAccount.refreshToken,
        pageId: activeAccount.pageId,
        scopes: activeAccount.scopes,
      });

      switch (post.platform) {
        case 'instagram':
          if (post.mediaType === 'video') {
            console.log('📹 [Posts] Publishing Instagram reel');
            platformResponse = await this.publishInstagramReel(
              activeAccount,
              post.mediaUrl!,
              post.caption
            );
          } else {
            console.log('🖼️ [Posts] Publishing Instagram image');
            platformResponse = await this.publishInstagramImage(
              activeAccount,
              post.mediaUrl!,
              post.caption
            );
          }
          break;

        case 'twitter':
          platformResponse = await twitterService.createTweet(post.caption);
          break;

        case 'linkedin':
          platformResponse = await linkedInService.createPost(
            process.env.LINKEDIN_PERSON_URN || '',
            post.caption
          );
          break;

        case 'youtube': {
          const tags = post.videoTags?.split(',').map((tag: string) => tag.trim()) || [];
          const youtubeAccount = connectedAccounts.find((acc) => acc.platform === 'youtube');
          if (!youtubeAccount?.accessToken) {
            return res.status(400).json({
              success: false,
              error: 'No connected YouTube channel with valid access token. Please reconnect.',
            });
          }

          platformResponse = await youtubeService.uploadVideo(
            youtubeAccount.accessToken,
            post.videoTitle || '',
            post.videoDescription || '',
            tags,
            post.mediaUrl!
          );
          break;
        }

        default:
          return res.status(400).json({
            success: false,
            error: 'Unsupported platform',
          });
      }

      if (platformResponse?.error) {
        console.error('⚠️ [Posts] Platform returned error', platformResponse.error);
        await this.logPostHistory({
          userId,
          postId: post.id,
          platform: post.platform,
          status: 'failed',
          stage: 'publishing',
          errorMessage: platformResponse.error.message,
          caption: post.caption,
          mediaUrl: post.mediaUrl,
          platformAccountId: activeAccount.platformAccountId,
          platformUsername: activeAccount.platformUsername,
        });
        return res.status(502).json({
          success: false,
          error: platformResponse.error.error_user_msg || platformResponse.error.message,
          details: platformResponse.error,
        });
      }

      // Update post status
      await dynamoDBService.update(
        TABLES.POSTS,
        { id: postId },
        'SET #status = :status, #platformPostId = :platformPostId, publishedTime = :publishedTime, updatedAt = :updatedAt',
        {
          ':status': 'published',
          ':platformPostId': platformResponse.id,
          ':publishedTime': new Date().toISOString(),
          ':updatedAt': new Date().toISOString(),
        },
        {
          '#status': 'status',
          '#platformPostId': 'platformPostId',
        }
      );

      await this.logPostHistory({
        userId,
        postId: post.id,
        platform: post.platform,
        status: 'success',
        stage: 'completed',
        platformPostId: platformResponse.id,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        platformAccountId: activeAccount.platformAccountId,
        platformUsername: activeAccount.platformUsername,
      });

      console.log('✅ [Posts] Publish complete', {
        postId,
        platformResponse,
      });

      res.json({
        success: true,
        data: {
          postId,
          platformResponse,
        },
      });
    } catch (error: any) {
      console.error('❌ [Posts] publishPost failed', formatPostError(error));
      const fallbackPlatform = (post?.platform || 'instagram') as PlatformType;
      const fallbackPostId = post?.id
        || (typeof req.params.postId === 'string'
          ? req.params.postId
          : Array.isArray(req.params.postId)
            ? req.params.postId[0]
            : 'unknown');
      const fallbackUserId = req.user?.id || post?.userId || 'unknown';
      await this.logPostHistory({
        userId: fallbackUserId,
        postId: fallbackPostId,
        platform: fallbackPlatform,
        status: 'failed',
        stage: 'error',
        errorMessage: error.message,
        caption: post?.caption,
        mediaUrl: post?.mediaUrl,
      });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  private async logPostHistory(entry: {
    userId: string;
    postId: string;
    platform: PlatformType;
    status: 'pending' | 'success' | 'failed';
    stage?: string;
    platformAccountId?: string;
    platformUsername?: string;
    errorMessage?: string;
    platformPostId?: string;
    caption?: string;
    mediaUrl?: string;
  }) {
    const historyEntry = {
      id: uuidv4(),
      userId: entry.userId,
      postId: entry.postId,
      platform: entry.platform,
      platformAccountId: entry.platformAccountId,
      platformUsername: entry.platformUsername,
      status: entry.status,
      stage: entry.stage,
      errorMessage: entry.errorMessage,
      platformPostId: entry.platformPostId,
      caption: entry.caption,
      mediaUrl: entry.mediaUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDBService.logPostHistory(historyEntry as any);
  }

  private async publishInstagramImage(account: ConnectedAccount, imageUrl: string, caption: string) {
    console.log('🖼️ [Posts] Creating Instagram image container', { account: account.platformUsername });
    const containerUrl = `https://graph.facebook.com/v19.0/${account.platformAccountId}/media`;
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: account.accessToken,
      }),
    });
    const containerData = await containerResponse.json() as any;
    console.log('🖼️ [Posts] Container response', containerData);

    if (!containerData.id) {
      throw new Error(`Failed to create Instagram media container: ${JSON.stringify(containerData)}`);
    }

    await this.waitForMediaReady(containerData.id, account.accessToken);

    const publishUrl = `https://graph.facebook.com/v19.0/${account.platformAccountId}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: account.accessToken,
      }),
    });
    const publishData = await publishResponse.json();
    console.log('🖼️ [Posts] Publish response', publishData);
    return publishData;
  }

  private async publishInstagramReel(account: ConnectedAccount, videoUrl: string, caption: string) {
    console.log('📹 [Posts] Creating Instagram reel container', { account: account.platformUsername });
    const containerUrl = `https://graph.facebook.com/v19.0/${account.platformAccountId}/media`;
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        share_to_feed: true,
        access_token: account.accessToken,
      }),
    });
    const containerData = await containerResponse.json() as any;
    console.log('📹 [Posts] Reel container response', containerData);

    if (!containerData.id) {
      throw new Error(`Failed to create Instagram reel container: ${JSON.stringify(containerData)}`);
    }

    await this.waitForMediaReady(containerData.id, account.accessToken);

    const publishUrl = `https://graph.facebook.com/v19.0/${account.platformAccountId}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: account.accessToken,
      }),
    });
    const publishData = await publishResponse.json();
    console.log('📹 [Posts] Reel publish response', publishData);
    return publishData;
  }

  private async waitForMediaReady(creationId: string, accessToken: string, attempts: number = 60, delayMs: number = 3000) {
    console.log('⏳ [Posts] Waiting for media readiness', {
      creationId,
      maxAttempts: attempts,
      delayMs,
    });
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const statusUrl = `https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${accessToken}`;
      const statusResponse = await fetch(statusUrl, { method: 'GET' });
      const statusData = await statusResponse.json() as any;

      console.log('⏳ [Posts] Media status check', { creationId, attempt, status: statusData });

      if (statusData.error) {
        throw new Error(`Failed to check media status: ${JSON.stringify(statusData.error)}`);
      }

      if (statusData.status_code === 'FINISHED') {
        console.log('✅ [Posts] Media ready for publish', { creationId, attempt });
        return statusData;
      }

      if (statusData.status_code === 'ERROR' || attempt === attempts) {
        throw new Error(`Media not ready for publishing: ${JSON.stringify(statusData)}`);
      }

      await delay(delayMs);
    }
  }

  // Get all posts for a user
  async getUserPosts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const posts = await dynamoDBService.queryByIndex(
        TABLES.POSTS,
        'UserIdIndex',
        '#userId = :userId',
        { ':userId': userId },
        { '#userId': 'userId' }
      );

      res.json({
        success: true,
        data: posts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get scheduled posts
  async getScheduledPosts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const posts = await dynamoDBService.scan(
        TABLES.POSTS,
        'userId = :userId AND #status = :status',
        {
          ':userId': userId,
          ':status': 'scheduled',
        }
      );

      res.json({
        success: true,
        data: posts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Delete a post
  async deletePost(req: AuthRequest, res: Response) {
    try {
      const { postId } = req.params;
      await dynamoDBService.delete(TABLES.POSTS, { id: postId });

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      console.error('❌ [Posts] deletePost failed', formatPostError(error));
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get post history for a user
  async getPostHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const history = await dynamoDBService.listPostHistory(userId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('❌ [Posts] getPostHistory failed', formatPostError(error));
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

function formatPostError(error: any) {
  if (!error) return {};
  return {
    message: error.message,
    stack: error.stack,
    responseData: error.response?.data,
    responseStatus: error.response?.status,
  };
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const postController = new PostController();
