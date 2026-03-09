export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'get_instagram_analytics',
    description: 'Fetch Instagram analytics including recent posts, engagement metrics, likes, comments, and top performing content. Use this when user asks about Instagram performance, metrics, or wants to see their Instagram data.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent posts to fetch (default: 10, max: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_youtube_analytics',
    description: 'Fetch YouTube analytics including recent videos, views, likes, comments, and top performing videos. Use this when user asks about YouTube performance, video metrics, or wants to see their YouTube data.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent videos to fetch (default: 10, max: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_instagram_comments',
    description: 'Fetch comments for a specific Instagram media/post. Use this when user wants to review audience feedback or analyze comment sentiment on a post.',
    inputSchema: {
      type: 'object',
      properties: {
        mediaId: {
          type: 'string',
          description: 'Instagram media ID to fetch comments for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of comments to fetch (default: 50, max: 100)',
        },
        accountUsername: {
          type: 'string',
          description: 'Optional Instagram username to target if multiple accounts are connected',
        },
      },
      required: ['mediaId'],
    },
  },
  {
    name: 'get_youtube_comments',
    description: 'Fetch top-level comments for a specific YouTube video. Use this when user wants to see viewer feedback or analyze audience sentiment on a video.',
    inputSchema: {
      type: 'object',
      properties: {
        videoId: {
          type: 'string',
          description: 'YouTube video ID to fetch comments for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of comments to fetch (default: 50, max: 100)',
        },
        accountUsername: {
          type: 'string',
          description: 'Optional YouTube channel username to target when multiple accounts connected',
        },
      },
      required: ['videoId'],
    },
  },
  {
    name: 'get_all_analytics_summary',
    description: 'Get a comprehensive summary of analytics across all connected platforms (Instagram, YouTube). Use this when user asks for overall performance, cross-platform comparison, or general analytics overview.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'post_to_instagram',
    description: 'Post content to Instagram. Requires image URL and caption. Use this when user wants to publish content to Instagram or share a post on Instagram.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to post (must be publicly accessible)',
        },
        caption: {
          type: 'string',
          description: 'Caption text for the Instagram post',
        },
      },
      required: ['imageUrl', 'caption'],
    },
  },
  {
    name: 'post_to_youtube',
    description: 'Upload a video to YouTube. Requires video URL, title, description, and optional tags. Use this when user wants to publish a video to YouTube.',
    inputSchema: {
      type: 'object',
      properties: {
        videoUrl: {
          type: 'string',
          description: 'URL of the video file to upload (must be publicly accessible)',
        },
        title: {
          type: 'string',
          description: 'Title of the YouTube video',
        },
        description: {
          type: 'string',
          description: 'Description text for the YouTube video',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of tags/keywords for the video',
        },
      },
      required: ['videoUrl', 'title', 'description'],
    },
  },
  {
    name: 'post_to_multiple_platforms',
    description: 'Post content to multiple social media platforms simultaneously. Use this when user wants to cross-post to Instagram and YouTube at once.',
    inputSchema: {
      type: 'object',
      properties: {
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['instagram', 'youtube'] },
          description: 'Array of platforms to post to',
        },
        content: {
          type: 'object',
          properties: {
            imageUrl: { type: 'string' },
            videoUrl: { type: 'string' },
            caption: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          description: 'Content details for posting',
        },
      },
      required: ['platforms', 'content'],
    },
  },
  {
    name: 'generate_caption',
    description: 'Generate an AI-optimized caption for social media posts. Use this when user needs help writing captions or wants caption suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Brief description or idea for the caption',
        },
        platform: {
          type: 'string',
          enum: ['Instagram', 'YouTube', 'LinkedIn', 'Twitter'],
          description: 'Target platform for the caption',
        },
        tone: {
          type: 'string',
          enum: ['engaging', 'professional', 'casual', 'inspirational', 'humorous'],
          description: 'Desired tone of the caption',
        },
      },
      required: ['prompt', 'platform'],
    },
  },
  {
    name: 'get_connected_accounts',
    description: 'Get list of all connected social media accounts and their status. Use this when user asks what accounts are connected or wants to see their connected platforms.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_latest_comment',
    description: 'Fetch the most recent audience comment from Instagram or YouTube. REQUIRED when user asks about: latest comment, last comment, recent comment, top comments, top 10 comments, second last comment, or any comment-related query without specifying a post/video ID. This tool scans recent posts to find the newest comment by timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['instagram', 'youtube'],
          description: 'Platform to fetch the latest comment from',
        },
        lookbackPosts: {
          type: 'number',
          description: 'How many recent posts/videos to scan for comments (default 5, max 50). Increase this for "top 10 comments" requests.',
        },
        requestedCount: {
          type: 'number',
          description: 'Number of comments requested by user (e.g., 10 for "top 10 comments"). Tool will fetch enough posts to satisfy this count.',
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'get_instagram_profile_stats',
    description: 'Fetch Instagram profile metrics such as followers count, following count, and media count for the connected account. Use this when user asks about follower numbers or profile stats.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_youtube_channel_stats',
    description: 'Fetch YouTube channel metrics such as subscriber count, total views, and video count for the connected channel. Use this when user asks about YouTube subscribers or channel stats.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];
