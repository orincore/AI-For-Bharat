import { dynamoDBService } from './dynamodb.service';
import { metaService } from './meta.service';
import { youtubeService } from './youtube.service';
import { bedrockService } from './bedrock.service';
import { ConnectedAccount } from '../types';

const TABLES = {
  CONNECTED_ACCOUNTS: process.env.DYNAMODB_TABLE_PREFIX + 'connected_accounts',
  POST_HISTORY: process.env.DYNAMODB_TABLE_PREFIX + 'post_history',
};

export class ToolExecutorService {
  async executeTool(
    toolName: string,
    toolInput: Record<string, any>,
    userId: string
  ): Promise<string> {
    console.log(`🔧 Executing tool: ${toolName}`, toolInput);

    try {
      switch (toolName) {
        case 'get_instagram_analytics':
          return await this.getInstagramAnalytics(userId, toolInput.limit || 10);

        case 'get_youtube_analytics':
          return await this.getYoutubeAnalytics(userId, toolInput.limit || 10);

        case 'get_all_analytics_summary':
          return await this.getAllAnalyticsSummary(userId);

        case 'post_to_instagram':
          return await this.postToInstagram(userId, toolInput as { imageUrl: string; caption: string });

        case 'post_to_youtube':
          return await this.postToYoutube(userId, toolInput as { videoUrl: string; title: string; description: string; tags?: string[] });

        case 'post_to_multiple_platforms':
          return await this.postToMultiplePlatforms(userId, toolInput as { platforms: string[]; content: any });

        case 'generate_caption':
          return await this.generateCaption(toolInput as { prompt: string; platform: string; tone?: string });

        case 'get_connected_accounts':
          return await this.getConnectedAccounts(userId);

        case 'get_instagram_profile_stats':
          return await this.getInstagramProfileStats(userId);

        case 'get_youtube_channel_stats':
          return await this.getYoutubeChannelStats(userId);

        case 'get_instagram_comments':
          return await this.getInstagramComments(userId, toolInput as { mediaId: string; limit?: number; accountUsername?: string });

        case 'get_youtube_comments':
          return await this.getYoutubeComments(userId, toolInput as { videoId: string; limit?: number; accountUsername?: string });

        case 'get_latest_comment':
          return await this.getLatestComment(userId, toolInput as { platform: 'instagram' | 'youtube'; lookbackPosts?: number; requestedCount?: number; accountUsername?: string });

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      console.error(`❌ Tool execution error for ${toolName}:`, error);
      return JSON.stringify({
        success: false,
        error: error.message || 'Tool execution failed',
      });
    }
  }

  private async getInstagramProfileStats(userId: string): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': 'instagram' },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return JSON.stringify({ success: false, error: 'No Instagram account connected' });
    }

    const instagramAccount = accounts[0];
    const accessToken = instagramAccount.accessToken;
    const igAccountId = instagramAccount.platformAccountId;

    if (!igAccountId) {
      return JSON.stringify({ success: false, error: 'Instagram account ID missing. Please reconnect your account.' });
    }

    const profile = await metaService.getInstagramProfile(igAccountId, accessToken);

    return JSON.stringify({
      success: true,
      platform: 'Instagram',
      profile: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profilePictureUrl: profile.profile_picture_url,
        followers: Number(profile.followers_count ?? 0),
        follows: Number(profile.follows_count ?? 0),
        mediaCount: Number(profile.media_count ?? 0),
      },
    });
  }

  private async getYoutubeChannelStats(userId: string): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': 'youtube' },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return JSON.stringify({ success: false, error: 'No YouTube account connected' });
    }

    const youtubeAccount = accounts[0];
    const channelId = youtubeAccount.platformAccountId;

    if (!channelId) {
      return JSON.stringify({ success: false, error: 'YouTube channel ID missing. Please reconnect your account.' });
    }

    const statsResponse = await youtubeService.getChannelStats(channelId);
    const channel = statsResponse?.items?.[0];

    if (!channel) {
      return JSON.stringify({ success: false, error: 'Unable to fetch YouTube channel stats right now.' });
    }

    const statistics = channel.statistics || {};

    return JSON.stringify({
      success: true,
      platform: 'YouTube',
      profile: {
        channelId,
        title: channel.snippet?.title,
        description: channel.snippet?.description,
        subscribers: Number(statistics.subscriberCount ?? 0),
        views: Number(statistics.viewCount ?? 0),
        videos: Number(statistics.videoCount ?? 0),
        hiddenSubscriberCount: statistics.hiddenSubscriberCount === 'true' || statistics.hiddenSubscriberCount === true,
      },
    });
  }

  private async getInstagramAnalytics(userId: string, limit: number): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': 'instagram' },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return JSON.stringify({ success: false, error: 'No Instagram account connected' });
    }

    const instagramAccount = accounts[0];
    const accessToken = instagramAccount.accessToken;
    const igAccountId = instagramAccount.platformAccountId;

    const mediaList = await metaService.getInstagramMedia(igAccountId, limit, accessToken);
    const analyticsData = [];

    for (const media of mediaList.data.slice(0, limit)) {
      const insights = {
        like_count: media.like_count || 0,
        comments_count: media.comments_count || 0,
      };
      analyticsData.push({
        id: media.id,
        caption: media.caption?.substring(0, 100) || 'No caption',
        mediaType: media.media_type,
        timestamp: media.timestamp,
        likes: insights.like_count || 0,
        comments: insights.comments_count || 0,
        engagement: (insights.like_count || 0) + (insights.comments_count || 0),
      });
    }

    const totalEngagement = analyticsData.reduce((sum, post) => sum + post.engagement, 0);
    const avgEngagement = analyticsData.length > 0 ? totalEngagement / analyticsData.length : 0;
    const topPost = analyticsData.reduce((max, post) => post.engagement > max.engagement ? post : max, analyticsData[0] || {});

    return JSON.stringify({
      success: true,
      platform: 'Instagram',
      summary: {
        totalPosts: analyticsData.length,
        totalEngagement,
        averageEngagement: Math.round(avgEngagement),
        topPost: {
          caption: topPost.caption,
          engagement: topPost.engagement,
        },
      },
      posts: analyticsData,
    });
  }

  private async getYoutubeAnalytics(userId: string, limit: number): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': 'youtube' },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return JSON.stringify({ success: false, error: 'No YouTube account connected' });
    }

    const youtubeAccount = accounts[0];
    const accessToken = youtubeAccount.accessToken;
    const channelId = youtubeAccount.platformAccountId;

    const videos = await youtubeService.listChannelVideos(channelId, limit);
    const analyticsData = [];

    for (const video of videos.items.slice(0, limit)) {
      const stats = await youtubeService.getVideoStats(video.id.videoId);
      analyticsData.push({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description?.substring(0, 100) || '',
        publishedAt: video.snippet.publishedAt,
        views: parseInt(stats.viewCount || '0'),
        likes: parseInt(stats.likeCount || '0'),
        comments: parseInt(stats.commentCount || '0'),
      });
    }

    const totalViews = analyticsData.reduce((sum, video) => sum + video.views, 0);
    const avgViews = analyticsData.length > 0 ? totalViews / analyticsData.length : 0;
    const topVideo = analyticsData.reduce((max, video) => video.views > max.views ? video : max, analyticsData[0] || {});

    return JSON.stringify({
      success: true,
      platform: 'YouTube',
      summary: {
        totalVideos: analyticsData.length,
        totalViews,
        averageViews: Math.round(avgViews),
        topVideo: {
          title: topVideo.title,
          views: topVideo.views,
        },
      },
      videos: analyticsData,
    });
  }

  private async getAllAnalyticsSummary(userId: string): Promise<string> {
    const [instagramData, youtubeData] = await Promise.allSettled([
      this.getInstagramAnalytics(userId, 30),
      this.getYoutubeAnalytics(userId, 30),
    ]);

    const instagram = instagramData.status === 'fulfilled' ? JSON.parse(instagramData.value) : null;
    const youtube = youtubeData.status === 'fulfilled' ? JSON.parse(youtubeData.value) : null;

    return JSON.stringify({
      success: true,
      instagram: instagram?.success ? instagram.summary : { error: 'Not connected or failed to fetch' },
      youtube: youtube?.success ? youtube.summary : { error: 'Not connected or failed to fetch' },
      crossPlatform: {
        totalContent: (instagram?.summary?.totalPosts || 0) + (youtube?.summary?.totalVideos || 0),
        platforms: [
          instagram?.success ? 'Instagram' : null,
          youtube?.success ? 'YouTube' : null,
        ].filter(Boolean),
      },
    });
  }

  private async postToInstagram(userId: string, input: { imageUrl: string; caption: string; mediaType?: string }): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': 'instagram' },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return JSON.stringify({ success: false, error: 'No Instagram account connected' });
    }

    const account = accounts[0];
    
    if (!account.accessToken) {
      return JSON.stringify({ success: false, error: 'Instagram account access token missing. Please reconnect your Instagram account.' });
    }
    
    // Detect if this is a video based on URL extension or mediaType
    const isVideo = input.mediaType === 'video' || /\.(mp4|mov|avi)$/i.test(input.imageUrl);
    
    const result = isVideo 
      ? await metaService.publishInstagramReel(
          account.platformAccountId,
          input.imageUrl,
          input.caption,
          account.accessToken
        )
      : await metaService.publishInstagramImage(
          account.platformAccountId,
          input.imageUrl,
          input.caption,
          account.accessToken
        );

    await dynamoDBService.put(TABLES.POST_HISTORY, {
      id: `${userId}_${Date.now()}`,
      userId,
      platform: 'instagram',
      postId: result.id,
      caption: input.caption,
      mediaUrl: input.imageUrl,
      status: 'published',
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return JSON.stringify({
      success: true,
      platform: 'Instagram',
      postId: result.id,
      message: 'Successfully posted to Instagram',
    });
  }

  private async postToYoutube(userId: string, input: { videoUrl: string; title: string; description: string; tags?: string[] }): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': 'youtube' },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return JSON.stringify({ success: false, error: 'No YouTube account connected' });
    }

    const account = accounts[0];
    const result = await youtubeService.uploadVideo(
      account.accessToken,
      input.title,
      input.description,
      input.tags || [],
      input.videoUrl
    );

    await dynamoDBService.put(TABLES.POST_HISTORY, {
      id: `${userId}_${Date.now()}`,
      userId,
      platform: 'youtube',
      postId: result.id,
      caption: input.description,
      mediaUrl: input.videoUrl,
      status: 'published',
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return JSON.stringify({
      success: true,
      platform: 'YouTube',
      videoId: result.id,
      message: 'Successfully uploaded to YouTube',
    });
  }

  private async postToMultiplePlatforms(userId: string, input: { platforms: string[]; content: any }): Promise<string> {
    const results = [];

    for (const platform of input.platforms) {
      try {
        let result;
        if (platform === 'instagram' && input.content.imageUrl) {
          result = await this.postToInstagram(userId, {
            imageUrl: input.content.imageUrl,
            caption: input.content.caption || input.content.description || '',
          });
        } else if (platform === 'youtube' && input.content.videoUrl) {
          result = await this.postToYoutube(userId, {
            videoUrl: input.content.videoUrl,
            title: input.content.title || 'Untitled Video',
            description: input.content.description || '',
            tags: input.content.tags || [],
          });
        } else {
          result = JSON.stringify({ success: false, error: `Missing required content for ${platform}` });
        }
        results.push({ platform, result: JSON.parse(result) });
      } catch (error: any) {
        results.push({ platform, result: { success: false, error: error.message } });
      }
    }

    return JSON.stringify({
      success: true,
      results,
      message: `Posted to ${results.filter(r => r.result.success).length} out of ${input.platforms.length} platforms`,
    });
  }

  private async generateCaption(input: { prompt: string; platform: string; tone?: string }): Promise<string> {
    const caption = await bedrockService.generateCaption(input.prompt, input.platform, {
      tone: input.tone || 'engaging',
    });

    return JSON.stringify({
      success: true,
      caption,
      platform: input.platform,
    });
  }

  private async getConnectedAccounts(userId: string): Promise<string> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId',
      { ':userId': userId },
      { '#userId': 'userId' }
    ) as ConnectedAccount[];

    return JSON.stringify({
      success: true,
      accounts: accounts.map(acc => ({
        platform: acc.platform,
        username: acc.platformUsername,
        isActive: acc.isActive,
        connectedAt: acc.createdAt,
      })),
      totalConnected: accounts.length,
    });
  }

  private async getInstagramComments(
    userId: string,
    input: { mediaId: string; limit?: number; accountUsername?: string }
  ): Promise<string> {
    const account = await this.findAccount(userId, 'instagram', input.accountUsername);
    if (!account) {
      return JSON.stringify({ success: false, error: 'No Instagram account connected' });
    }

    const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
    const commentsResponse = await metaService.getInstagramComments(
      input.mediaId,
      limit,
      account.accessToken
    );

    const comments = (commentsResponse?.data || []).map((comment: any) => ({
      id: comment.id,
      text: comment.text,
      username: comment.username,
      likeCount: comment.like_count || 0,
      timestamp: comment.timestamp,
    }));

    return JSON.stringify({
      success: true,
      platform: 'Instagram',
      mediaId: input.mediaId,
      comments,
      totalComments: comments.length,
    });
  }

  private async getYoutubeComments(
    userId: string,
    input: { videoId: string; limit?: number; accountUsername?: string }
  ): Promise<string> {
    const account = await this.findAccount(userId, 'youtube', input.accountUsername);

    if (!account) {
      return JSON.stringify({ success: false, error: 'No YouTube account connected' });
    }

    const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
    const commentsResponse = await youtubeService.getVideoComments(input.videoId, limit);

    const comments = (commentsResponse?.items || []).map((item: any) => {
      const snippet = item?.snippet?.topLevelComment?.snippet;
      return {
        id: item?.id,
        author: snippet?.authorDisplayName,
        text: snippet?.textDisplay || snippet?.textOriginal,
        likeCount: snippet?.likeCount || 0,
        publishedAt: snippet?.publishedAt,
      };
    });

    return JSON.stringify({
      success: true,
      platform: 'YouTube',
      videoId: input.videoId,
      comments,
      totalComments: comments.length,
    });
  }

  private async getLatestComment(
    userId: string,
    input: { platform: 'instagram' | 'youtube'; lookbackPosts?: number; requestedCount?: number; accountUsername?: string }
  ): Promise<string> {
    const lookback = Math.min(Math.max(input.lookbackPosts ?? 5, 1), 50);
    const requestedCount = input.requestedCount || 1;

    if (input.platform === 'instagram') {
      return await this.getLatestInstagramComment(userId, lookback, requestedCount, input.accountUsername);
    }

    if (input.platform === 'youtube') {
      return await this.getLatestYoutubeComment(userId, lookback, requestedCount, input.accountUsername);
    }

    return JSON.stringify({ success: false, error: `Unsupported platform: ${input.platform}` });
  }

  private async getLatestInstagramComment(userId: string, lookback: number, requestedCount: number, accountUsername?: string): Promise<string> {
    const account = await this.findAccount(userId, 'instagram', accountUsername);
    if (!account) {
      return JSON.stringify({ success: false, error: 'No Instagram account connected' });
    }

    console.log(`🔍 Fetching Instagram media for account ${account.platformAccountId}, lookback: ${lookback}`);
    const mediaResponse = await metaService.getInstagramMedia(
      account.platformAccountId,
      lookback,
      account.accessToken
    );
    const mediaItems = mediaResponse?.data || [];
    console.log(`📸 Found ${mediaItems.length} Instagram media items`);

    const allComments: any[] = [];
    let totalCommentsScanned = 0;
    let postsScanned = 0;

    // Continue fetching until we have enough comments or run out of posts
    for (const media of mediaItems) {
      postsScanned++;
      console.log(`🔍 Fetching comments for media ${media.id}`);
      const commentsResponse = await metaService.getInstagramComments(media.id, 50, account.accessToken);
      const comments = commentsResponse?.data || [];
      console.log(`💬 Found ${comments.length} comments on media ${media.id}`);
      totalCommentsScanned += comments.length;

      for (const comment of comments) {
        const timestampMs = Date.parse(comment.timestamp);
        if (Number.isNaN(timestampMs)) {
          console.warn(`⚠️ Invalid timestamp for comment ${comment.id}`);
          continue;
        }

        allComments.push({
          platform: 'Instagram',
          commentId: comment.id,
          text: comment.text,
          username: comment.username,
          likeCount: comment.like_count || 0,
          timestamp: comment.timestamp,
          timestampMs,
          mediaId: media.id,
          mediaCaption: media.caption,
          mediaPermalink: media.permalink,
          mediaTimestamp: media.timestamp,
        });
      }
      
      // If we have enough comments, we can stop early
      if (allComments.length >= requestedCount) {
        console.log(`✅ Collected ${allComments.length} comments (requested: ${requestedCount}), stopping early`);
        break;
      }
    }

    console.log(`📊 Total comments scanned: ${totalCommentsScanned} from ${postsScanned} posts`);

    if (allComments.length === 0) {
      console.log(`❌ No comments found across ${mediaItems.length} posts`);
      return JSON.stringify({
        success: false,
        platform: 'Instagram',
        message: 'No recent comments found on your latest posts.',
        scannedPosts: mediaItems.length,
      });
    }

    // Sort by timestamp descending (newest first)
    allComments.sort((a, b) => b.timestampMs - a.timestampMs);
    
    console.log(`✅ Returning ${allComments.length} comments, latest from @${allComments[0].username}`);
    
    // Remove timestampMs from all comments
    const commentsPayload = allComments.map(({ timestampMs, ...rest }) => rest);

    return JSON.stringify({
      success: true,
      platform: 'Instagram',
      scannedPosts: postsScanned,
      totalCommentsScanned,
      latestComment: commentsPayload[0],
      allComments: commentsPayload,
      requestedCount,
      satisfied: commentsPayload.length >= requestedCount,
    });
  }

  private async getLatestYoutubeComment(userId: string, lookback: number, requestedCount: number, accountUsername?: string): Promise<string> {
    const account = await this.findAccount(userId, 'youtube', accountUsername);
    if (!account) {
      return JSON.stringify({ success: false, error: 'No YouTube account connected' });
    }

    const videosResponse = await youtubeService.listChannelVideos(account.platformAccountId, lookback);
    const videos = videosResponse?.items || [];

    let latestComment: any = null;

    for (const video of videos) {
      const videoId = video?.id?.videoId || video?.id;
      if (!videoId) {
        continue;
      }

      const commentsResponse = await youtubeService.getVideoComments(videoId, 50);
      const comments = commentsResponse?.items || [];

      for (const item of comments) {
        const snippet = item?.snippet?.topLevelComment?.snippet;
        if (!snippet?.publishedAt) {
          continue;
        }

        const timestampMs = Date.parse(snippet.publishedAt);
        if (Number.isNaN(timestampMs)) {
          continue;
        }

        if (!latestComment || timestampMs > latestComment.timestampMs) {
          latestComment = {
            platform: 'YouTube',
            commentId: item?.id,
            text: snippet.textDisplay || snippet.textOriginal,
            username: snippet.authorDisplayName,
            likeCount: snippet.likeCount || 0,
            timestamp: snippet.publishedAt,
            timestampMs,
            videoId,
            videoTitle: video?.snippet?.title,
            videoPublishedAt: video?.snippet?.publishedAt,
            videoDescription: video?.snippet?.description,
          };
        }
      }

      if (latestComment) {
        break;
      }
    }

    if (!latestComment) {
      return JSON.stringify({
        success: false,
        platform: 'YouTube',
        message: 'No recent comments found on your latest videos.',
        scannedVideos: videos.length,
      });
    }

    const { timestampMs, ...commentPayload } = latestComment;

    return JSON.stringify({
      success: true,
      platform: 'YouTube',
      scannedVideos: videos.length,
      latestComment: commentPayload,
    });
  }

  private async findAccount(
    userId: string,
    platform: string,
    username?: string
  ): Promise<ConnectedAccount | null> {
    const accounts = await dynamoDBService.queryByIndex(
      TABLES.CONNECTED_ACCOUNTS,
      'UserPlatformIndex',
      '#userId = :userId AND #platform = :platform',
      { ':userId': userId, ':platform': platform },
      { '#userId': 'userId', '#platform': 'platform' }
    ) as ConnectedAccount[];

    if (!accounts || accounts.length === 0) {
      return null;
    }

    if (username) {
      const matched = accounts.find(acc => acc.platformUsername?.toLowerCase() === username.toLowerCase());
      if (matched) return matched;
    }

    return accounts.find(acc => acc.isActive) || accounts[0];
  }
}

export const toolExecutorService = new ToolExecutorService();
