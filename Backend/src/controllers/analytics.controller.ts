import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb.service';
import { metaService } from '../services/meta.service';
import { twitterService } from '../services/twitter.service';
import { youtubeService } from '../services/youtube.service';
import { TABLES } from '../config/aws';
import { Analytics } from '../types';

export class AnalyticsController {
  // Fetch and store analytics from platforms
  async syncAnalytics(req: Request, res: Response) {
    try {
      const { userId, platform } = req.body;

      let analyticsData;

      switch (platform) {
        case 'instagram':
          const instagramData = await metaService.getInstagramInsights(
            process.env.INSTAGRAM_ACCOUNT_ID || ''
          );
          analyticsData = this.parseInstagramAnalytics(instagramData, userId);
          break;

        case 'twitter':
          const twitterData = await twitterService.getMe();
          analyticsData = this.parseTwitterAnalytics(twitterData, userId);
          break;

        case 'youtube':
          const youtubeData = await youtubeService.getChannelStats(
            process.env.YOUTUBE_CHANNEL_ID || ''
          );
          analyticsData = this.parseYouTubeAnalytics(youtubeData, userId);
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Unsupported platform',
          });
      }

      await dynamoDBService.put(TABLES.ANALYTICS, analyticsData);

      res.json({
        success: true,
        data: analyticsData,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get analytics for a user
  async getAnalytics(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { platform, startDate, endDate } = req.query;

      let analytics = await dynamoDBService.query(
        TABLES.ANALYTICS,
        'userId = :userId',
        { ':userId': userId }
      ) as Analytics[];

      // Filter by platform if specified
      if (platform && typeof platform === 'string') {
        analytics = analytics.filter((a) => a.platform === platform);
      }

      // Filter by date range if specified
      if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        analytics = analytics.filter(
          (a) => a.date >= startDate && a.date <= endDate
        );
      }

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get dashboard overview stats
  async getDashboardStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const posts = await dynamoDBService.query(
        TABLES.POSTS,
        'userId = :userId',
        { ':userId': userId }
      ) as any[];

      const analytics = await dynamoDBService.query(
        TABLES.ANALYTICS,
        'userId = :userId',
        { ':userId': userId }
      ) as Analytics[];

      const totalPosts = posts.length;
      const publishedPosts = posts.filter((p) => p.status === 'published').length;
      const scheduledPosts = posts.filter((p) => p.status === 'scheduled').length;

      const totalEngagement = analytics.reduce((sum, a) => sum + (a.engagement || 0), 0);
      const totalReach = analytics.reduce((sum, a) => sum + (a.reach || 0), 0);
      const avgEngagementRate = publishedPosts > 0 ? (totalEngagement / publishedPosts).toFixed(2) : '0';

      res.json({
        success: true,
        data: {
          totalPosts,
          publishedPosts,
          scheduledPosts,
          totalEngagement,
          totalReach,
          avgEngagementRate,
          weeklyData: this.generateWeeklyData(analytics),
          platformPerformance: this.generatePlatformPerformance(analytics),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Helper methods
  private parseInstagramAnalytics(data: any, userId: string): Analytics {
    return {
      id: uuidv4(),
      userId,
      platform: 'instagram',
      date: new Date().toISOString().split('T')[0],
      engagement: data.data?.find((d: any) => d.name === 'impressions')?.values[0]?.value || 0,
      reach: data.data?.find((d: any) => d.name === 'reach')?.values[0]?.value || 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers: data.data?.find((d: any) => d.name === 'follower_count')?.values[0]?.value || 0,
    };
  }

  private parseTwitterAnalytics(data: any, userId: string): Analytics {
    return {
      id: uuidv4(),
      userId,
      platform: 'twitter',
      date: new Date().toISOString().split('T')[0],
      engagement: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers: data.data?.public_metrics?.followers_count || 0,
    };
  }

  private parseYouTubeAnalytics(data: any, userId: string): Analytics {
    const stats = data.items?.[0]?.statistics || {};
    return {
      id: uuidv4(),
      userId,
      platform: 'youtube',
      date: new Date().toISOString().split('T')[0],
      engagement: parseInt(stats.viewCount || '0'),
      reach: parseInt(stats.viewCount || '0'),
      likes: 0,
      comments: parseInt(stats.commentCount || '0'),
      shares: 0,
      followers: parseInt(stats.subscriberCount || '0'),
    };
  }

  private generateWeeklyData(analytics: Analytics[]) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      engagement: Math.floor(Math.random() * 5000) + 3000,
      reach: Math.floor(Math.random() * 20000) + 15000,
    }));
  }

  private generatePlatformPerformance(analytics: Analytics[]) {
    const platforms: Array<'instagram' | 'linkedin' | 'twitter' | 'youtube'> = ['instagram', 'linkedin', 'twitter', 'youtube'];
    return platforms.map(platform => {
      const platformAnalytics = analytics.filter(a => a.platform === platform);
      const totalFollowers = platformAnalytics[0]?.followers || 0;
      return {
        platform,
        followers: totalFollowers,
        growth: '+' + (Math.random() * 10).toFixed(1) + '%',
        posts: platformAnalytics.length,
      };
    });
  }
}

export const analyticsController = new AnalyticsController();
