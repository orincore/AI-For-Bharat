import axios from 'axios';
import { PLATFORM_CONFIG } from '../config/platforms';

export class YouTubeService {
  private baseUrl: string;
  private apiKey: string;
  private accessToken: string;

  constructor() {
    this.baseUrl = PLATFORM_CONFIG.YOUTUBE.BASE_URL;
    this.apiKey = PLATFORM_CONFIG.YOUTUBE.API_KEY || '';
    this.accessToken = ''; // Will be set via OAuth
  }

  // Upload video
  async uploadVideo(
    title: string,
    description: string,
    tags: string[],
    videoUrl: string
  ): Promise<any> {
    const url = 'https://www.googleapis.com/upload/youtube/v3/videos';
    
    // Note: This is a simplified version. Actual implementation requires multipart upload
    const response = await axios.post(
      url,
      {
        snippet: {
          title: title,
          description: description,
          tags: tags,
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'public',
        },
      },
      {
        params: {
          part: 'snippet,status',
          key: this.apiKey,
        },
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  // Get channel statistics
  async getChannelStats(channelId: string): Promise<any> {
    const url = `${this.baseUrl}/channels`;
    const response = await axios.get(url, {
      params: {
        part: 'statistics,snippet',
        id: channelId,
        key: this.apiKey,
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
        key: this.apiKey,
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
        key: this.apiKey,
      },
    });
    return response.data;
  }

  // Get video analytics
  async getVideoAnalytics(videoId: string): Promise<any> {
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
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.data;
  }
}

export const youtubeService = new YouTubeService();
