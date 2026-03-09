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

export interface ChatConversation {
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
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
  profilePicture?: string;
  role: string;
  phoneNumber?: string;
  whatsappVerified?: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  platform: PlatformType;
  platformAccountId: string;
  platformUsername: string;
  accessToken: string; // Page access token for IG API calls
  refreshToken?: string; // Long-lived user token
  tokenExpiry?: string; // Expiry for long-lived user token
  profilePicture?: string;
  isActive: boolean;
  pageId?: string;
  pageName?: string;
  scopes?: string[];
  metaAccessToken?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResponse {
  url: string;
  key: string;
  bucket: string;
}

export interface PostHistory {
  id: string;
  userId: string;
  postId: string;
  platform: PlatformType;
  platformAccountId?: string;
  platformUsername?: string;
  status: 'pending' | 'success' | 'failed';
  stage?: string;
  errorMessage?: string;
  platformPostId?: string;
  caption?: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// YouTube-specific types

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  customUrl?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'public' | 'unlisted' | 'private';
  thumbnailUrl?: string;
  videoUrl: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'public' | 'unlisted' | 'private';
  categoryId?: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface ChannelInfo {
  id: string;
  title: string;
  customUrl?: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface VideoUploadResponse {
  videoId: string;
  videoUrl: string;
  status: 'uploaded' | 'processing' | 'failed';
  thumbnailUrl?: string;
}

export interface ChannelStatistics {
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

// YouTube-specific error types

export class YouTubeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'YouTubeError';
  }
}

export class YouTubeQuotaExceededError extends YouTubeError {
  constructor(message: string = 'YouTube API quota exceeded. Please try again tomorrow.') {
    super(message, 'QUOTA_EXCEEDED', 429);
    this.name = 'YouTubeQuotaExceededError';
  }
}

export class YouTubeInvalidCredentialsError extends YouTubeError {
  constructor(message: string = 'Invalid YouTube credentials. Please reconnect your channel.') {
    super(message, 'INVALID_CREDENTIALS', 401);
    this.name = 'YouTubeInvalidCredentialsError';
  }
}

export class YouTubeUploadFailedError extends YouTubeError {
  constructor(message: string, public details?: any) {
    super(message, 'UPLOAD_FAILED', 500);
    this.name = 'YouTubeUploadFailedError';
  }
}

export class YouTubeValidationError extends YouTubeError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'YouTubeValidationError';
  }
}

export class YouTubeTokenRefreshError extends YouTubeError {
  constructor(message: string = 'Failed to refresh access token. Please reconnect your channel.') {
    super(message, 'TOKEN_REFRESH_FAILED', 401);
    this.name = 'YouTubeTokenRefreshError';
  }
}
