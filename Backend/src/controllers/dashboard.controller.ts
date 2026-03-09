import { Response } from 'express';
import { dynamoDBService } from '../services/dynamodb.service';
import { TABLES } from '../config/aws';
import { AuthRequest } from '../middleware/auth';
import { ConnectedAccount } from '../types';

interface InstagramInsights {
  followersCount: number;
  mediaCount: number;
  followerGrowth: string;
  totalReach: number;
  totalEngagement: number;
  weeklyData: Array<{ day: string; engagement: number; reach: number }>;
  recentPosts: Array<{ platform: string; action: string; time: string; status: string; caption?: string }>;
  profilePicture?: string;
}

export class DashboardController {
  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      console.log('📊 Fetching dashboard stats for user:', userId);

      // Get connected Instagram accounts
      const connectedAccounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': 'instagram',
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      ) as ConnectedAccount[];

      console.log('📊 Connected accounts:', connectedAccounts.length);

      const activeAccount = connectedAccounts.find(acc => acc.isActive) || connectedAccounts[0];

      if (!activeAccount) {
        return res.json({
          success: true,
          data: {
            hasConnectedAccount: false,
            totalPosts: 0,
            scheduledPosts: 0,
            avgEngagementRate: 0,
            platformPerformance: [],
            weeklyData: [],
            recentActivity: [],
          },
        });
      }

      console.log('📊 Active account:', activeAccount.platformUsername);

      // Fetch Instagram insights from Graph API
      const insights = await this.fetchInstagramInsights(activeAccount);

      // Get posts from DynamoDB (fallback for scheduled items)
      let posts: any[] = [];
      try {
        posts = await dynamoDBService.queryByIndex(
          TABLES.POSTS,
          'UserIdIndex',
          '#userId = :userId',
          {
            ':userId': userId,
          },
          {
            '#userId': 'userId',
          }
        );
      } catch (error) {
        console.warn('Dashboard posts query failed, continuing with insights data:', error);
      }

      const postsArray = Array.isArray(posts) ? posts : [];
      const instagramPosts = postsArray.filter((p: any) => p.platform === 'instagram');
      const scheduledPosts = instagramPosts.filter((p: any) => p.status === 'scheduled');

      // Get analytics data (fallback for weekly chart)
      let analytics: any[] = [];
      try {
        analytics = await dynamoDBService.queryByIndex(
          TABLES.ANALYTICS,
          'UserDateIndex',
          '#userId = :userId',
          {
            ':userId': userId,
          },
          {
            '#userId': 'userId',
          }
        );
      } catch (error) {
        console.warn('Dashboard analytics query failed, continuing with insights data:', error);
      }

      const instagramAnalytics = analytics.filter((a: any) => a.platform === 'instagram');
      const analyticsEngagement = instagramAnalytics.reduce((sum: number, a: any) => sum + (a.engagement || 0), 0);
      const analyticsReach = instagramAnalytics.reduce((sum: number, a: any) => sum + (a.reach || 0), 0);

      const totalReach = insights.totalReach || analyticsReach || 0;
      const totalEngagement = insights.totalEngagement || analyticsEngagement || 0;
      const avgEngagementRate = totalReach > 0 ? Number(((totalEngagement / totalReach) * 100).toFixed(1)) : 0;

      const weeklyDataFromAnalytics = this.buildWeeklyData(instagramAnalytics);
      const weeklyData = insights.weeklyData?.length ? insights.weeklyData : weeklyDataFromAnalytics;

      const totalPostsFromDb = instagramPosts.length;
      const totalPosts = totalPostsFromDb || insights.mediaCount || 0;
      const scheduledPostsCount = scheduledPosts.length;

      const recentActivityFromPosts = instagramPosts
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((post: any) => ({
          platform: 'Instagram',
          action: post.status === 'published' ? 'Post published' : post.status === 'scheduled' ? 'Post scheduled' : 'Draft created',
          time: this.getRelativeTime(post.createdAt),
          status: post.status,
          caption: post.caption?.substring(0, 50) || '',
        }));

      const recentActivity = insights.recentPosts?.length ? insights.recentPosts : recentActivityFromPosts;

      const engagementBase = totalReach > 0 ? totalReach : (insights.followersCount || 1) * Math.max(recentActivity.length, 1);
      const normalizedAvgEngagementRate = engagementBase > 0 ? Number(((totalEngagement / engagementBase) * 100).toFixed(1)) : 0;

      const platformPerformance = [{
        platform: 'Instagram',
        followers: insights.followersCount || 0,
        growth: insights.followerGrowth || '+0%',
        posts: totalPosts,
        engagement: `${normalizedAvgEngagementRate}%`,
        username: activeAccount.platformUsername,
        color: 'text-neon-instagram',
      }];

      res.json({
        success: true,
        data: {
          hasConnectedAccount: true,
          activeAccount: {
            username: activeAccount.platformUsername,
            profilePicture: insights.profilePicture || activeAccount.profilePicture,
            platformAccountId: activeAccount.platformAccountId,
            followersCount: insights.followersCount || 0,
          },
          totalPosts,
          scheduledPosts: scheduledPostsCount,
          avgEngagementRate: normalizedAvgEngagementRate,
          totalReach,
          totalEngagement,
          followersCount: insights.followersCount || 0,
          platformPerformance,
          weeklyData,
          recentActivity,
        },
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  private async fetchInstagramInsights(account: ConnectedAccount): Promise<InstagramInsights> {
    const defaultInsights: InstagramInsights = {
      followersCount: 0,
      mediaCount: 0,
      followerGrowth: '+0%',
      totalReach: 0,
      totalEngagement: 0,
      weeklyData: [],
      recentPosts: [],
      profilePicture: account.profilePicture,
    };

    try {
      // Basic profile data
      const profileResponse = await fetch(
        `https://graph.facebook.com/v19.0/${account.platformAccountId}?fields=followers_count,media_count,name,username,profile_picture_url&access_token=${account.accessToken}`
      );
      const profileData = await profileResponse.json() as any;

      const followersCount = Number(profileData.followers_count) || 0;
      const mediaCount = Number(profileData.media_count) || 0;
      const profilePicture = profileData.profile_picture_url || account.profilePicture;

      // Daily reach + profile views for last 7 days
      const since = Math.floor(Date.now() / 1000) - 6 * 24 * 60 * 60;
      const until = Math.floor(Date.now() / 1000);
      const metricsResponse = await fetch(
        `https://graph.facebook.com/v19.0/${account.platformAccountId}/insights?metric=reach,profile_views&period=day&since=${since}&until=${until}&access_token=${account.accessToken}`
      );
      const metricsData = await metricsResponse.json() as any;

      const weeklyDataMap: Record<string, { reach: number; engagement: number }> = {};
      let totalReach = 0;
      let totalEngagementFromMetrics = 0;

      metricsData.data?.forEach((metric: any) => {
        metric.values?.forEach((entry: any) => {
          const day = new Date(entry.end_time).toLocaleDateString('en-US', { weekday: 'short' });
          if (!weeklyDataMap[day]) {
            weeklyDataMap[day] = { reach: 0, engagement: 0 };
          }
          if (metric.name === 'reach') {
            weeklyDataMap[day].reach += entry.value || 0;
            totalReach += entry.value || 0;
          }
          if (metric.name === 'profile_views') {
            weeklyDataMap[day].engagement += entry.value || 0;
            totalEngagementFromMetrics += entry.value || 0;
          }
        });
      });

      const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = orderedDays.map((day) => ({
        day,
        engagement: weeklyDataMap[day]?.engagement || 0,
        reach: weeklyDataMap[day]?.reach || 0,
      }));

      // Recent media for engagement + activity
      const mediaResponse = await fetch(
        `https://graph.facebook.com/v19.0/${account.platformAccountId}/media?fields=id,caption,timestamp,media_type,like_count,comments_count,permalink&limit=10&access_token=${account.accessToken}`
      );
      const mediaData = await mediaResponse.json() as any;

      const recentPosts = (mediaData.data || []).map((media: any) => {
        const likes = Number(media.like_count) || 0;
        const comments = Number(media.comments_count) || 0;
        const engagement = likes + comments;
        return {
          platform: 'Instagram',
          action: media.media_type === 'VIDEO' ? 'Reel posted' : 'Post published',
          time: this.getRelativeTime(media.timestamp),
          status: 'published',
          caption: media.caption || '',
          engagement,
        };
      });

      const totalEngagement = recentPosts.reduce((sum: number, post: any) => sum + (post.engagement || 0), 0) || totalEngagementFromMetrics;

      return {
        followersCount,
        mediaCount,
        followerGrowth: '+0%',
        totalReach,
        totalEngagement,
        weeklyData,
        recentPosts,
        profilePicture,
      };
    } catch (error) {
      console.error('Error fetching Instagram insights:', error);
      return defaultInsights;
    }
  }

  private buildWeeklyData(analytics: any[]) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      const dayAnalytics = analytics.filter((a: any) => {
        const aDate = new Date(a.date);
        return aDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        day: dayName,
        engagement: dayAnalytics.reduce((sum: number, a: any) => sum + (a.engagement || 0), 0),
        reach: dayAnalytics.reduce((sum: number, a: any) => sum + (a.reach || 0), 0),
      });
    }

    return last7Days;
  }

  private getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

export const dashboardController = new DashboardController();
