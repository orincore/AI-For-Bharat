export type PlatformType = 'instagram' | 'linkedin' | 'twitter' | 'youtube';

export interface Post {
  id: string;
  userId: string;
  platform: PlatformType;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  videoTitle?: string;
  videoDescription?: string;
  videoTags?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledTime?: string;
  publishedTime?: string;
  platformPostId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentLibraryItem {
  id: string;
  userId: string;
  caption: string;
  thumbnail: string;
  platform: PlatformType;
  likes: number;
  comments: number;
  shares?: number;
  platformPostId: string;
  createdAt: string;
}

export interface Analytics {
  id: string;
  userId: string;
  platform: PlatformType;
  date: string;
  engagement: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  connectedPlatforms: {
    instagram?: { connected: boolean; accountId?: string; username?: string };
    linkedin?: { connected: boolean; accountId?: string; username?: string };
    twitter?: { connected: boolean; accountId?: string; username?: string };
    youtube?: { connected: boolean; accountId?: string; channelId?: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  url: string;
  key: string;
  bucket: string;
}
