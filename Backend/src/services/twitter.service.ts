import axios from 'axios';
import { PLATFORM_CONFIG } from '../config/platforms';

export class TwitterService {
  private baseUrl: string;
  private bearerToken: string;

  constructor() {
    this.baseUrl = PLATFORM_CONFIG.TWITTER.BASE_URL;
    this.bearerToken = PLATFORM_CONFIG.TWITTER.BEARER_TOKEN || '';
  }

  // Create a tweet
  async createTweet(text: string): Promise<any> {
    const url = `${this.baseUrl}/tweets`;
    const response = await axios.post(
      url,
      {
        text: text,
      },
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  // Create a tweet with media
  async createTweetWithMedia(text: string, mediaIds: string[]): Promise<any> {
    const url = `${this.baseUrl}/tweets`;
    const response = await axios.post(
      url,
      {
        text: text,
        media: {
          media_ids: mediaIds,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  // Get user tweets
  async getUserTweets(userId: string, maxResults: number = 10): Promise<any> {
    const url = `${this.baseUrl}/users/${userId}/tweets`;
    const response = await axios.get(url, {
      params: {
        max_results: maxResults,
        'tweet.fields': 'created_at,public_metrics,attachments',
      },
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });
    return response.data;
  }

  // Get tweet metrics
  async getTweetMetrics(tweetId: string): Promise<any> {
    const url = `${this.baseUrl}/tweets/${tweetId}`;
    const response = await axios.get(url, {
      params: {
        'tweet.fields': 'public_metrics',
      },
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });
    return response.data;
  }

  // Get authenticated user
  async getMe(): Promise<any> {
    const url = `${this.baseUrl}/users/me`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });
    return response.data;
  }
}

export const twitterService = new TwitterService();
