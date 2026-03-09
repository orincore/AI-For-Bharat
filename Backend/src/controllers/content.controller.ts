import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb.service';
import { metaService } from '../services/meta.service';
import { twitterService } from '../services/twitter.service';
import { youtubeService } from '../services/youtube.service';
import { TABLES } from '../config/aws';
import { ContentLibraryItem } from '../types';

export class ContentController {
  // Sync content library from platforms
  async syncContentLibrary(req: Request, res: Response) {
    try {
      const { userId, platform } = req.body;

      let contentItems: ContentLibraryItem[] = [];

      switch (platform) {
        case 'instagram':
          const instagramMedia = await metaService.getInstagramMedia(
            process.env.INSTAGRAM_ACCOUNT_ID || '',
            25
          );
          contentItems = this.parseInstagramContent(instagramMedia, userId);
          break;

        case 'twitter':
          const twitterTweets = await twitterService.getUserTweets(
            process.env.TWITTER_USER_ID || '',
            10
          );
          contentItems = this.parseTwitterContent(twitterTweets, userId);
          break;

        case 'youtube':
          const youtubeVideos = await youtubeService.listChannelVideos(
            process.env.YOUTUBE_CHANNEL_ID || '',
            25
          );
          contentItems = this.parseYouTubeContent(youtubeVideos, userId);
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Unsupported platform',
          });
      }

      // Store in DynamoDB
      for (const item of contentItems) {
        await dynamoDBService.put(TABLES.CONTENT_LIBRARY, item);
      }

      res.json({
        success: true,
        data: contentItems,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get content library for a user
  async getContentLibrary(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { platform } = req.query;

      let content = (await dynamoDBService.query(
        TABLES.CONTENT_LIBRARY,
        'userId = :userId',
        { ':userId': userId }
      )) as ContentLibraryItem[];

      if (platform && typeof platform === 'string') {
        content = content.filter((c: ContentLibraryItem) => c.platform === platform);
      }

      // Sort by date descending
      content.sort((a: ContentLibraryItem, b: ContentLibraryItem) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({
        success: true,
        data: content,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Delete content from library
  async deleteContent(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      await dynamoDBService.delete(TABLES.CONTENT_LIBRARY, { id: contentId });

      res.json({
        success: true,
        message: 'Content deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Helper methods
  private parseInstagramContent(data: any, userId: string): ContentLibraryItem[] {
    return data.data?.map((item: any) => ({
      id: uuidv4(),
      userId,
      caption: item.caption || '',
      thumbnail: item.thumbnail_url || item.media_url,
      platform: 'instagram' as const,
      likes: item.like_count || 0,
      comments: item.comments_count || 0,
      platformPostId: item.id,
      createdAt: item.timestamp,
    })) || [];
  }

  private parseTwitterContent(data: any, userId: string): ContentLibraryItem[] {
    return data.data?.map((tweet: any) => ({
      id: uuidv4(),
      userId,
      caption: tweet.text || '',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=400&fit=crop',
      platform: 'twitter' as const,
      likes: tweet.public_metrics?.like_count || 0,
      comments: tweet.public_metrics?.reply_count || 0,
      shares: tweet.public_metrics?.retweet_count || 0,
      platformPostId: tweet.id,
      createdAt: tweet.created_at,
    })) || [];
  }

  private parseYouTubeContent(data: any, userId: string): ContentLibraryItem[] {
    return data.items?.map((video: any) => ({
      id: uuidv4(),
      userId,
      caption: video.snippet?.title || '',
      thumbnail: video.snippet?.thumbnails?.high?.url || '',
      platform: 'youtube' as const,
      likes: 0,
      comments: 0,
      platformPostId: video.id?.videoId || video.id,
      createdAt: video.snippet?.publishedAt,
    })) || [];
  }
}

export const contentController = new ContentController();
