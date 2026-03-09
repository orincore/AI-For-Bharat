export const PLATFORM_CONFIG = {
  META: {
    APP_ID: process.env.META_APP_ID,
    APP_SECRET: process.env.META_APP_SECRET,
    ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    GRAPH_API_VERSION: 'v21.0',
    BASE_URL: 'https://graph.facebook.com',
  },
  LINKEDIN: {
    CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN,
    BASE_URL: 'https://api.linkedin.com/v2',
  },
  TWITTER: {
    API_KEY: process.env.TWITTER_API_KEY,
    API_SECRET: process.env.TWITTER_API_SECRET,
    ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    ACCESS_SECRET: process.env.TWITTER_ACCESS_SECRET,
    BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    BASE_URL: 'https://api.twitter.com/2',
  },
  YOUTUBE: {
    API_KEY: process.env.YOUTUBE_API_KEY,
    CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
    CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
    REFRESH_TOKEN: process.env.YOUTUBE_REFRESH_TOKEN,
    BASE_URL: 'https://www.googleapis.com/youtube/v3',
  },
  MSG91: {
    AUTH_KEY: process.env.MSG91_AUTH_KEY,
    WHATSAPP_NUMBER: process.env.MSG91_WHATSAPP_NUMBER,
    BASE_URL: process.env.MSG91_BASE_URL || 'https://control.msg91.com/api/v5',
    WEBHOOK_SECRET: process.env.MSG91_WEBHOOK_SECRET,
    WHATSAPP_ACCESS_TOKEN: process.env.MSG91_WHATSAPP_ACCESS_TOKEN,
  },
};
