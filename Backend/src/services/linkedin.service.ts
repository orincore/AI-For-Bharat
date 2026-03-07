import axios from 'axios';
import { PLATFORM_CONFIG } from '../config/platforms';

export class LinkedInService {
  private baseUrl: string;
  private accessToken: string;

  constructor() {
    this.baseUrl = PLATFORM_CONFIG.LINKEDIN.BASE_URL;
    this.accessToken = PLATFORM_CONFIG.LINKEDIN.ACCESS_TOKEN || '';
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    const url = `${this.baseUrl}/me`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.data;
  }

  // Create a text post
  async createPost(personUrn: string, text: string): Promise<any> {
    const url = `${this.baseUrl}/ugcPosts`;
    const response = await axios.post(
      url,
      {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    return response.data;
  }

  // Create a post with image
  async createImagePost(personUrn: string, text: string, imageUrl: string): Promise<any> {
    // First, register the upload
    const registerUrl = `${this.baseUrl}/assets?action=registerUpload`;
    const registerResponse = await axios.post(
      registerUrl,
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: personUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const asset = registerResponse.data.value.asset;

    // Create the post with the image
    const url = `${this.baseUrl}/ugcPosts`;
    const response = await axios.post(
      url,
      {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                media: asset,
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    return response.data;
  }

  // Get post analytics
  async getPostAnalytics(postUrn: string): Promise<any> {
    const url = `${this.baseUrl}/socialActions/${postUrn}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.data;
  }
}

export const linkedInService = new LinkedInService();
