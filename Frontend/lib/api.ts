const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = {
  // Posts
  async createPost(data: FormData) {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      body: data,
    });
    return response.json();
  },

  async publishPost(postId: string) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/publish`, {
      method: 'POST',
    });
    return response.json();
  },

  async getUserPosts(userId: string) {
    const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`);
    return response.json();
  },

  async getScheduledPosts(userId: string) {
    const response = await fetch(`${API_BASE_URL}/posts/scheduled/${userId}`);
    return response.json();
  },

  async deletePost(postId: string) {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // AI
  async generateCaption(caption: string, platform: string = 'Instagram') {
    const response = await fetch(`${API_BASE_URL}/ai/generate-caption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ caption, platform }),
    });
    return response.json();
  },

  async analyzeContent(content: string) {
    const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    return response.json();
  },

  async getRecommendations(userId: string) {
    const response = await fetch(`${API_BASE_URL}/ai/recommendations/${userId}`);
    return response.json();
  },

  // Analytics
  async syncAnalytics(userId: string, platform: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, platform }),
    });
    return response.json();
  },

  async getAnalytics(userId: string, platform?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE_URL}/analytics/${userId}?${params}`);
    return response.json();
  },

  async getDashboardStats(userId: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard/${userId}`);
    return response.json();
  },

  // Content Library
  async syncContentLibrary(userId: string, platform: string) {
    const response = await fetch(`${API_BASE_URL}/content/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, platform }),
    });
    return response.json();
  },

  async getContentLibrary(userId: string, platform?: string) {
    const params = platform ? `?platform=${platform}` : '';
    const response = await fetch(`${API_BASE_URL}/content/${userId}${params}`);
    return response.json();
  },

  async deleteContent(contentId: string) {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
