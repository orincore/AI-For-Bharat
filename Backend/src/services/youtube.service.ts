import axios from 'axios';
import { PLATFORM_CONFIG } from '../config/platforms';
import {
  TokenResponse,
  ChannelInfo,
  VideoMetadata,
  VideoUploadResponse,
  ChannelStatistics,
  YouTubeQuotaExceededError,
  YouTubeInvalidCredentialsError,
  YouTubeUploadFailedError,
  YouTubeValidationError,
  YouTubeTokenRefreshError,
} from '../types';

export class YouTubeService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private tokenEndpoint = 'https://oauth2.googleapis.com/token';

  constructor() {
    this.baseUrl = PLATFORM_CONFIG.YOUTUBE.BASE_URL;
    this.clientId = PLATFORM_CONFIG.YOUTUBE.CLIENT_ID || '';
    this.clientSecret = PLATFORM_CONFIG.YOUTUBE.CLIENT_SECRET || '';
  }

  /**
   * Exchanges authorization code for access and refresh tokens
   * Validates: Requirements 1.3, 7.1, 7.2
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        this.tokenEndpoint,
        {
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data as TokenResponse;
    } catch (error: any) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new YouTubeInvalidCredentialsError(
        'Failed to exchange authorization code for tokens'
      );
    }
  }

  /**
   * Refreshes an expired access token using refresh token
   * Validates: Requirements 7.1, 7.2, 7.5
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        this.tokenEndpoint,
        {
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data as TokenResponse;
    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new YouTubeTokenRefreshError(
        'Failed to refresh access token. Please reconnect your YouTube channel.'
      );
    }
  }

  /**
   * Checks if an access token is expired based on expiry timestamp
   * Validates: Requirements 7.5
   */
  isTokenExpired(tokenExpiry: string): boolean {
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    // Add 5 minute buffer to refresh before actual expiry
    const bufferMs = 5 * 60 * 1000;
    return expiryDate.getTime() - bufferMs <= now.getTime();
  }

  // Upload video
  async uploadVideo(
    accessToken: string,
    title: string,
    description: string,
    tags: string[],
    videoUrl: string
  ): Promise<any> {
    const metadata = {
      snippet: {
        title: title || 'Untitled Video',
        description: description || 'Uploaded via Orin',
        tags: tags && tags.length > 0 ? tags : undefined,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public',
      },
    };

    let contentLength: string | undefined;
    let contentType: string = 'video/mp4';

    try {
      const headResponse = await axios.head(videoUrl);
      contentLength = headResponse.headers['content-length'];
      if (headResponse.headers['content-type']) {
        contentType = headResponse.headers['content-type'];
      }
    } catch (error: any) {
      console.warn('YouTube upload: unable to fetch video metadata via HEAD. Continuing without length.', error.message);
    }

    try {
      const initiateResponse = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos',
        metadata,
        {
          params: {
            uploadType: 'resumable',
            part: 'snippet,status',
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            ...(contentLength ? { 'X-Upload-Content-Length': contentLength } : {}),
            ...(contentType ? { 'X-Upload-Content-Type': contentType } : {}),
          },
        }
      );

      const uploadUrl = initiateResponse.headers['location'];
      if (!uploadUrl) {
        throw new YouTubeUploadFailedError('Failed to obtain upload URL from YouTube.');
      }

      const videoStreamResponse = await axios.get(videoUrl, {
        responseType: 'stream',
      });

      const uploadResponse = await axios.put(uploadUrl, videoStreamResponse.data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': contentType,
          ...(contentLength ? { 'Content-Length': contentLength } : {}),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return uploadResponse.data;
    } catch (error: any) {
      console.error('YouTube upload error:', error.response?.data || error.message);
      throw new YouTubeUploadFailedError(
        error.response?.data?.error?.message || 'Failed to upload video to YouTube',
        error.response?.data
      );
    }
  }

  // Get channel statistics
  async getChannelStats(channelId: string): Promise<any> {
    const url = `${this.baseUrl}/channels`;
    const response = await axios.get(url, {
      params: {
        part: 'statistics,snippet',
        id: channelId,
      },
    });
    return response.data;
  }

  // Get video statistics
  async getVideoStats(videoId: string): Promise<any> {
    const url = `${this.baseUrl}/videos`;
    const response = await axios.get(url, {
      params: {
        part: 'statistics,snippet',
        id: videoId,
        key: process.env.YOUTUBE_API_KEY,
      },
    });
    return response.data;
  }

  // List channel videos
  async listChannelVideos(channelId: string, maxResults: number = 25): Promise<any> {
    const url = `${this.baseUrl}/search`;
    const response = await axios.get(url, {
      params: {
        part: 'snippet',
        channelId: channelId,
        maxResults: maxResults,
        order: 'date',
        type: 'video',
        key: process.env.YOUTUBE_API_KEY,
      },
    });
    return response.data;
  }

  // Get video analytics
  async getVideoAnalytics(videoId: string, accessToken: string): Promise<any> {
    const url = 'https://youtubeanalytics.googleapis.com/v2/reports';
    const response = await axios.get(url, {
      params: {
        ids: `channel==MINE`,
        startDate: '2024-01-01',
        endDate: new Date().toISOString().split('T')[0],
        metrics: 'views,likes,comments,shares,estimatedMinutesWatched',
        dimensions: 'video',
        filters: `video==${videoId}`,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  // Get comments for a specific video
  async getVideoComments(videoId: string, maxResults: number = 50): Promise<any> {
    const url = `${this.baseUrl}/commentThreads`;
    const response = await axios.get(url, {
      params: {
        part: 'snippet',
        videoId,
        maxResults: Math.min(Math.max(maxResults, 1), 100),
        textFormat: 'plainText',
        key: process.env.YOUTUBE_API_KEY,
        order: 'relevance',
      },
    });
    return response.data;
  }
}

export const youtubeService = new YouTubeService();
