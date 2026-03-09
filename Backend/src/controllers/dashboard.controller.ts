import { Response } from 'express';
import { dynamoDBService } from '../services/dynamodb.service';
import { TABLES } from '../config/aws';
import { AuthRequest } from '../middleware/auth';
import { ConnectedAccount, ContentLibraryItem } from '../types';
import { youtubeService } from '../services/youtube.service';

interface InstagramInsights {
  followersCount: number;
  mediaCount: number;
  followerGrowth: string;
  totalReach: number;
  totalEngagement: number;
  weeklyData: Array<{ day: string; engagement: number; reach: number }>;
  recentPosts: Array<{ platform: string; action: string; time: string; status: string; caption?: string; timestamp?: number }>;
  profilePicture?: string;
}

interface YouTubeInsights {
  subscriberCount: number;
  videoCount: number;
  subscriberGrowth: string;
  totalViews: number;
  totalEngagement: number;
  weeklyData: Array<{ day: string; engagement: number; reach: number }>;
  recentVideos: Array<{ platform: string; action: string; time: string; status: string; title?: string; caption?: string; timestamp?: number }>;
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

      // Get all connected accounts
      const allConnectedAccounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId',
        { ':userId': userId },
        { '#userId': 'userId' }
      ) as ConnectedAccount[];

      const instagramAccounts = allConnectedAccounts.filter(acc => acc.platform === 'instagram');
      const youtubeAccounts = allConnectedAccounts.filter(acc => acc.platform === 'youtube');

      console.log('📊 Connected accounts - Instagram:', instagramAccounts.length, 'YouTube:', youtubeAccounts.length);

      const activeInstagramAccount = instagramAccounts.find(acc => acc.isActive) || instagramAccounts[0];
      const activeYouTubeAccount = youtubeAccounts.find(acc => acc.isActive) || youtubeAccounts[0];

      if (!activeInstagramAccount && !activeYouTubeAccount) {
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

      console.log('📊 Active Instagram:', activeInstagramAccount?.platformUsername || 'None');
      console.log('📊 Active YouTube:', activeYouTubeAccount?.platformUsername || 'None');

      // Fetch insights from both platforms
      const instagramInsights = activeInstagramAccount 
        ? await this.fetchInstagramInsights(activeInstagramAccount)
        : null;
      
      const youtubeInsights = activeYouTubeAccount
        ? await this.fetchYouTubeInsights(activeYouTubeAccount)
        : null;

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
      const youtubePosts = postsArray.filter((p: any) => p.platform === 'youtube');
      const scheduledPosts = [...instagramPosts, ...youtubePosts].filter((p: any) => p.status === 'scheduled');

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
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException' || error.message?.includes('does not have the specified index')) {
          console.warn('Dashboard analytics index missing, falling back to scan');
          analytics = await dynamoDBService.scan(
            TABLES.ANALYTICS,
            'userId = :userId',
            { ':userId': userId }
          );
        } else {
          console.warn('Dashboard analytics query failed, continuing with insights data:', error);
        }
      }

      const instagramAnalytics = analytics.filter((a: any) => a.platform === 'instagram');
      const youtubeAnalytics = analytics.filter((a: any) => a.platform === 'youtube');
      
      const analyticsEngagement = [...instagramAnalytics, ...youtubeAnalytics].reduce((sum: number, a: any) => sum + (a.engagement || 0), 0);
      const analyticsReach = [...instagramAnalytics, ...youtubeAnalytics].reduce((sum: number, a: any) => sum + (a.reach || 0), 0);

      const totalReach = (instagramInsights?.totalReach || 0) + (youtubeInsights?.totalViews || 0) || analyticsReach || 0;
      const totalEngagement = (instagramInsights?.totalEngagement || 0) + (youtubeInsights?.totalEngagement || 0) || analyticsEngagement || 0;
      const avgEngagementRate = totalReach > 0 ? Number(((totalEngagement / totalReach) * 100).toFixed(1)) : 0;

      // Combine weekly data from both platforms (with analytics fallback)
      const weeklyDataFromInsights = this.combineWeeklyData(
        instagramInsights?.weeklyData || [],
        youtubeInsights?.weeklyData || []
      );

      const weeklyDataFromAnalytics = this.buildWeeklyData([
        ...instagramAnalytics,
        ...youtubeAnalytics,
      ]);

      const weeklyData = this.hasWeeklyDataSignal(weeklyDataFromInsights)
        ? weeklyDataFromInsights
        : weeklyDataFromAnalytics;

      const totalPostsFromDb = instagramPosts.length + youtubePosts.length;
      const totalPosts = totalPostsFromDb || (instagramInsights?.mediaCount || 0) + (youtubeInsights?.videoCount || 0);
      const scheduledPostsCount = scheduledPosts.length;

      const recentActivityFromPosts = [...instagramPosts, ...youtubePosts]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((post: any) => ({
          platform: post.platform === 'instagram' ? 'Instagram' : 'YouTube',
          action: post.status === 'published' ? (post.platform === 'youtube' ? 'Video published' : 'Post published') : post.status === 'scheduled' ? (post.platform === 'youtube' ? 'Video scheduled' : 'Post scheduled') : 'Draft created',
          time: this.getRelativeTime(post.createdAt),
          status: post.status,
          caption: post.caption?.substring(0, 50) || post.title?.substring(0, 50) || '',
        }));

      // Fetch content library items for additional activity context
      let contentLibraryItems: ContentLibraryItem[] = [];
      try {
        contentLibraryItems = await dynamoDBService.scan(
          TABLES.CONTENT_LIBRARY,
          'userId = :userId',
          { ':userId': userId }
        ) as ContentLibraryItem[];
        contentLibraryItems = contentLibraryItems.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 10);
      } catch (error) {
        console.warn('Failed to load content library items:', error);
      }

      const libraryActivity = contentLibraryItems.map((item) => ({
        platform: item.platform === 'youtube' ? 'YouTube' : item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
        action: item.platform === 'youtube' ? 'Video added to library' : 'Post added to library',
        time: this.getRelativeTime(item.createdAt),
        status: 'library',
        caption: item.caption?.substring(0, 60) || '',
        timestamp: new Date(item.createdAt).getTime(),
      }));

      const combinedRecentActivity = [
        ...(instagramInsights?.recentPosts || []).map(post => ({ ...post, timestamp: post.timestamp || this.parseRelativeTime(post.time) })),
        ...(youtubeInsights?.recentVideos || []).map(video => ({ ...video, caption: video.caption || video.title, timestamp: video.timestamp || this.parseRelativeTime(video.time) })),
        ...libraryActivity,
        ...recentActivityFromPosts.map(activity => ({ ...activity, timestamp: activity.time ? this.parseRelativeTime(activity.time) : Date.now() })),
      ]
        .filter(activity => activity && activity.time)
        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 8)
        .map(activity => ({
          platform: activity.platform,
          action: activity.action,
          time: activity.time,
          status: activity.status || 'published',
          caption: activity.caption,
        }));

      const recentActivity = combinedRecentActivity.length ? combinedRecentActivity : recentActivityFromPosts;

      const totalFollowers = (instagramInsights?.followersCount || 0) + (youtubeInsights?.subscriberCount || 0);
      const engagementBase = totalReach > 0 ? totalReach : totalFollowers * Math.max(recentActivity.length, 1);
      const normalizedAvgEngagementRate = engagementBase > 0 ? Number(((totalEngagement / engagementBase) * 100).toFixed(1)) : 0;

      const platformPerformance = [];
      
      if (activeInstagramAccount && instagramInsights) {
        platformPerformance.push({
          platform: 'Instagram',
          followers: instagramInsights.followersCount || 0,
          growth: instagramInsights.followerGrowth || '+0%',
          posts: instagramPosts.length || instagramInsights.mediaCount,
          engagement: `${instagramInsights.totalReach > 0 ? Number(((instagramInsights.totalEngagement / instagramInsights.totalReach) * 100).toFixed(1)) : 0}%`,
          username: activeInstagramAccount.platformUsername,
          color: 'text-neon-instagram',
        });
      }
      
      if (activeYouTubeAccount && youtubeInsights) {
        platformPerformance.push({
          platform: 'YouTube',
          followers: youtubeInsights.subscriberCount || 0,
          growth: youtubeInsights.subscriberGrowth || '+0%',
          posts: youtubePosts.length || youtubeInsights.videoCount,
          engagement: `${youtubeInsights.totalViews > 0 ? Number(((youtubeInsights.totalEngagement / youtubeInsights.totalViews) * 100).toFixed(1)) : 0}%`,
          username: activeYouTubeAccount.platformUsername,
          color: 'text-red-500',
        });
      }

      res.json({
        success: true,
        data: {
          hasConnectedAccount: true,
          activeAccounts: {
            instagram: activeInstagramAccount ? {
              username: activeInstagramAccount.platformUsername,
              profilePicture: instagramInsights?.profilePicture || activeInstagramAccount.profilePicture,
              platformAccountId: activeInstagramAccount.platformAccountId,
              followersCount: instagramInsights?.followersCount || 0,
            } : null,
            youtube: activeYouTubeAccount ? {
              username: activeYouTubeAccount.platformUsername,
              profilePicture: youtubeInsights?.profilePicture || activeYouTubeAccount.profilePicture,
              platformAccountId: activeYouTubeAccount.platformAccountId,
              subscriberCount: youtubeInsights?.subscriberCount || 0,
            } : null,
          },
          totalPosts,
          scheduledPosts: scheduledPostsCount,
          avgEngagementRate: normalizedAvgEngagementRate,
          totalReach,
          totalEngagement,
          totalFollowers,
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

  private hasWeeklyDataSignal(weeklyData: Array<{ day: string; engagement: number; reach: number }>): boolean {
    if (!weeklyData || weeklyData.length === 0) return false;
    return weeklyData.some(dataPoint => (dataPoint.engagement || 0) > 0 || (dataPoint.reach || 0) > 0);
  }

  private async fetchYouTubeInsights(account: ConnectedAccount): Promise<YouTubeInsights> {
    const defaultInsights: YouTubeInsights = {
      subscriberCount: 0,
      videoCount: 0,
      subscriberGrowth: '+0%',
      totalViews: 0,
      totalEngagement: 0,
      weeklyData: [],
      recentVideos: [],
      profilePicture: account.profilePicture,
    };

    try {
      // Check if token is expired and refresh if needed
      let accessToken = account.accessToken;
      if (account.tokenExpiry && youtubeService.isTokenExpired(account.tokenExpiry)) {
        console.log('🔄 YouTube token expired, refreshing...');
        if (!account.refreshToken) {
          console.error('❌ No refresh token available for YouTube account');
          return defaultInsights;
        }
        try {
          const refreshed = await youtubeService.refreshAccessToken(account.refreshToken);
          accessToken = refreshed.access_token;
          const newExpiry = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();
          
          // Update token in database
          await dynamoDBService.update(
            TABLES.CONNECTED_ACCOUNTS,
            { id: account.id },
            'SET accessToken = :accessToken, tokenExpiry = :tokenExpiry, refreshToken = :refreshToken, updatedAt = :updatedAt',
            {
              ':accessToken': accessToken,
              ':tokenExpiry': newExpiry,
              ':refreshToken': refreshed.refresh_token || account.refreshToken,
              ':updatedAt': new Date().toISOString(),
            }
          );
          console.log('✅ YouTube token refreshed successfully');
        } catch (error: any) {
          console.error('❌ Failed to refresh YouTube token:', error.message);
          return defaultInsights;
        }
      }

      // Get channel statistics
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${account.platformAccountId}&access_token=${accessToken}`
      );
      
      if (!channelResponse.ok) {
        const errorData = await channelResponse.json() as any;
        console.error('❌ YouTube API error:', channelResponse.status, errorData);
        
        // If 403, token might be invalid even after refresh
        if (channelResponse.status === 403) {
          console.error('❌ YouTube API 403: Token lacks required scopes or is invalid');
        }
        return defaultInsights;
      }
      
      const channelData = await channelResponse.json() as any;

      if (!channelData.items || channelData.items.length === 0) {
        return defaultInsights;
      }

      const channel = channelData.items[0];
      const subscriberCount = Number(channel.statistics?.subscriberCount) || 0;
      const videoCount = Number(channel.statistics?.videoCount) || 0;
      const profilePicture = channel.snippet?.thumbnails?.default?.url || account.profilePicture;

      // Get recent videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${account.platformAccountId}&order=date&maxResults=10&type=video&access_token=${accessToken}`
      );
      
      if (!videosResponse.ok) {
        console.error('❌ Failed to fetch YouTube videos:', videosResponse.status);
        return {
          subscriberCount,
          videoCount,
          subscriberGrowth: '+0%',
          totalViews: 0,
          totalEngagement: 0,
          weeklyData: [],
          recentVideos: [],
          profilePicture,
        };
      }
      
      const videosData = await videosResponse.json() as any;

      const videoIds = (videosData.items || []).map((item: any) => item.id.videoId).join(',');

      // Get video statistics
      let totalViews = 0;
      let totalEngagement = 0;
      const recentVideos: any[] = [];
      const weeklyDataMap: Record<string, { reach: number; engagement: number }> = {};

      if (videoIds) {
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&access_token=${accessToken}`
        );
        
        if (!statsResponse.ok) {
          console.error('❌ Failed to fetch YouTube video stats:', statsResponse.status);
          return {
            subscriberCount,
            videoCount,
            subscriberGrowth: '+0%',
            totalViews: 0,
            totalEngagement: 0,
            weeklyData: [],
            recentVideos: [],
            profilePicture,
          };
        }
        
        const statsData = await statsResponse.json() as any;

        (statsData.items || []).forEach((video: any) => {
          const views = Number(video.statistics?.viewCount) || 0;
          const likes = Number(video.statistics?.likeCount) || 0;
          const comments = Number(video.statistics?.commentCount) || 0;
          const engagement = likes + comments;

          totalViews += views;
          totalEngagement += engagement;

          const publishedAt = video.snippet?.publishedAt;
          const day = new Date(publishedAt).toLocaleDateString('en-US', { weekday: 'short' });
          
          if (!weeklyDataMap[day]) {
            weeklyDataMap[day] = { reach: 0, engagement: 0 };
          }
          weeklyDataMap[day].reach += views;
          weeklyDataMap[day].engagement += engagement;

          recentVideos.push({
            platform: 'YouTube',
            action: 'Video published',
            time: this.getRelativeTime(publishedAt),
            status: 'published',
            title: video.snippet?.title || '',
            engagement,
          });
        });
      }

      const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = orderedDays.map((day) => ({
        day,
        engagement: weeklyDataMap[day]?.engagement || 0,
        reach: weeklyDataMap[day]?.reach || 0,
      }));

      return {
        subscriberCount,
        videoCount,
        subscriberGrowth: '+0%',
        totalViews,
        totalEngagement,
        weeklyData,
        recentVideos,
        profilePicture,
      };
    } catch (error) {
      console.error('Error fetching YouTube insights:', error);
      return defaultInsights;
    }
  }

  private combineWeeklyData(
    instagramData: Array<{ day: string; engagement: number; reach: number }>,
    youtubeData: Array<{ day: string; engagement: number; reach: number }>
  ): Array<{ day: string; engagement: number; reach: number }> {
    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const combinedMap: Record<string, { engagement: number; reach: number }> = {};

    // Combine Instagram data
    instagramData.forEach((item) => {
      if (!combinedMap[item.day]) {
        combinedMap[item.day] = { engagement: 0, reach: 0 };
      }
      combinedMap[item.day].engagement += item.engagement;
      combinedMap[item.day].reach += item.reach;
    });

    // Combine YouTube data
    youtubeData.forEach((item) => {
      if (!combinedMap[item.day]) {
        combinedMap[item.day] = { engagement: 0, reach: 0 };
      }
      combinedMap[item.day].engagement += item.engagement;
      combinedMap[item.day].reach += item.reach;
    });

    return orderedDays.map((day) => ({
      day,
      engagement: combinedMap[day]?.engagement || 0,
      reach: combinedMap[day]?.reach || 0,
    }));
  }

  private parseRelativeTime(timeStr: string): number {
    const match = timeStr.match(/(\d+)([mhd])/);
    if (!match) return Date.now();

    const value = parseInt(match[1]);
    const unit = match[2];

    const now = Date.now();
    if (unit === 'm') return now - value * 60 * 1000;
    if (unit === 'h') return now - value * 60 * 60 * 1000;
    if (unit === 'd') return now - value * 24 * 60 * 60 * 1000;
    return now;
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
