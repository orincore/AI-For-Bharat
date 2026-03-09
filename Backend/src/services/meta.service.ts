import axios from 'axios';
import { PLATFORM_CONFIG } from '../config/platforms';

export class MetaService {
  private baseUrl: string;
  private accessToken: string;
  private version: string;

  constructor() {
    this.baseUrl = PLATFORM_CONFIG.META.BASE_URL;
    this.accessToken = PLATFORM_CONFIG.META.ACCESS_TOKEN || '';
    this.version = PLATFORM_CONFIG.META.GRAPH_API_VERSION;
  }

  // Get Instagram Business Account ID
  async getInstagramAccountId(facebookPageId: string): Promise<string> {
    const url = `${this.baseUrl}/${this.version}/${facebookPageId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'instagram_business_account',
        access_token: this.accessToken,
      },
    });
    return response.data.instagram_business_account.id;
  }

  // Publish Instagram Post (Image)
  async publishInstagramImage(
    instagramAccountId: string,
    imageUrl: string,
    caption: string
  ): Promise<any> {
    // Step 1: Create media container
    const containerUrl = `${this.baseUrl}/${this.version}/${instagramAccountId}/media`;
    const containerResponse = await axios.post(containerUrl, null, {
      params: {
        image_url: imageUrl,
        caption: caption,
        access_token: this.accessToken,
      },
    });

    const creationId = containerResponse.data.id;

    // Step 2: Publish the container
    const publishUrl = `${this.baseUrl}/${this.version}/${instagramAccountId}/media_publish`;
    const publishResponse = await axios.post(publishUrl, null, {
      params: {
        creation_id: creationId,
        access_token: this.accessToken,
      },
    });

    return publishResponse.data;
  }

  // Publish Instagram Reel (Video)
  async publishInstagramReel(
    instagramAccountId: string,
    videoUrl: string,
    caption: string
  ): Promise<any> {
    // Step 1: Create media container for reel
    const containerUrl = `${this.baseUrl}/${this.version}/${instagramAccountId}/media`;
    const containerResponse = await axios.post(containerUrl, null, {
      params: {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        share_to_feed: true,
        access_token: this.accessToken,
      },
    });

    const creationId = containerResponse.data.id;

    // Step 2: Publish the container
    const publishUrl = `${this.baseUrl}/${this.version}/${instagramAccountId}/media_publish`;
    const publishResponse = await axios.post(publishUrl, null, {
      params: {
        creation_id: creationId,
        access_token: this.accessToken,
      },
    });

    return publishResponse.data;
  }

  // Get Instagram Insights
  async getInstagramInsights(instagramAccountId: string): Promise<any> {
    const url = `${this.baseUrl}/${this.version}/${instagramAccountId}/insights`;
    const response = await axios.get(url, {
      params: {
        metric: 'impressions,reach,follower_count,profile_views',
        period: 'day',
        access_token: this.accessToken,
      },
    });
    return response.data;
  }

  // Get Instagram profile stats (followers, follows, media count)
  async getInstagramProfile(instagramAccountId: string, accessToken?: string): Promise<any> {
    const url = `${this.baseUrl}/${this.version}/${instagramAccountId}`;
    const response = await axios.get(url, {
      params: {
        fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
        access_token: accessToken || this.accessToken,
      },
    });
    return response.data;
  }

  // Get Instagram Media
  async getInstagramMedia(instagramAccountId: string, limit: number = 25, accessToken?: string): Promise<any> {
    const url = `${this.baseUrl}/${this.version}/${instagramAccountId}/media`;
    const response = await axios.get(url, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        limit: limit,
        access_token: accessToken || this.accessToken,
      },
    });
    return response.data;
  }

  // Get comments for a specific Instagram media
  async getInstagramComments(mediaId: string, limit: number = 50, accessToken?: string): Promise<any> {
    const url = `${this.baseUrl}/${this.version}/${mediaId}/comments`;
    const response = await axios.get(url, {
      params: {
        fields: 'id,text,username,timestamp,like_count',
        limit,
        access_token: accessToken || this.accessToken,
      },
    });
    return response.data;
  }
}

export const metaService = new MetaService();
