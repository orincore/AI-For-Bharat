import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb.service';
import { s3Service } from '../services/s3.service';
import { metaService } from '../services/meta.service';
import { twitterService } from '../services/twitter.service';
import { linkedInService } from '../services/linkedin.service';
import { youtubeService } from '../services/youtube.service';
import { TABLES } from '../config/aws';
import { Post } from '../types';

export class PostController {
  // Create a new post
  async createPost(req: Request, res: Response) {
    try {
      const { userId, platform, caption, videoTitle, videoDescription, videoTags, scheduledTime } = req.body;
      const file = req.file;

      let mediaUrl: string | undefined;
      if (file) {
        const uploadResult = await s3Service.uploadFile(file, userId);
        mediaUrl = uploadResult.url;
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

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Publish a post to platform
  async publishPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const post = await dynamoDBService.get(TABLES.POSTS, { id: postId });

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }

      let platformResponse;

      switch (post.platform) {
        case 'instagram':
          if (post.mediaType === 'video') {
            platformResponse = await metaService.publishInstagramReel(
              process.env.INSTAGRAM_ACCOUNT_ID || '',
              post.mediaUrl!,
              post.caption
            );
          } else {
            platformResponse = await metaService.publishInstagramImage(
              process.env.INSTAGRAM_ACCOUNT_ID || '',
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

        case 'youtube':
          const tags = post.videoTags?.split(',').map(t => t.trim()) || [];
          platformResponse = await youtubeService.uploadVideo(
            post.videoTitle || '',
            post.videoDescription || '',
            tags,
            post.mediaUrl!
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Unsupported platform',
          });
      }

      // Update post status
      await dynamoDBService.update(
        TABLES.POSTS,
        { id: postId },
        'SET #status = :status, platformPostId = :platformPostId, publishedTime = :publishedTime, updatedAt = :updatedAt',
        {
          ':status': 'published',
          ':platformPostId': platformResponse.id,
          ':publishedTime': new Date().toISOString(),
          ':updatedAt': new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        data: {
          postId,
          platformResponse,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all posts for a user
  async getUserPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const posts = await dynamoDBService.query(
        TABLES.POSTS,
        'userId = :userId',
        { ':userId': userId }
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
  async getScheduledPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
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
  async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      await dynamoDBService.delete(TABLES.POSTS, { id: postId });

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const postController = new PostController();
