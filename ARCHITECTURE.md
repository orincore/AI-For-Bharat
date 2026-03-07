# System Architecture

## Overview

This document describes the architecture of the Social Media Management Platform.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Dashboard UI                                           │  │
│  │  • Create Post                                            │  │
│  │  • Schedule Post                                          │  │
│  │  • Content Library                                        │  │
│  │  • Analytics                                              │  │
│  │  • AI Chat (Orin)                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             │ http://localhost:3001/api
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API ROUTES                             │  │
│  │  • /api/posts                                             │  │
│  │  • /api/ai                                                │  │
│  │  • /api/analytics                                         │  │
│  │  • /api/content                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   CONTROLLERS                             │  │
│  │  • PostController                                         │  │
│  │  • AIController                                           │  │
│  │  • AnalyticsController                                    │  │
│  │  • ContentController                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SERVICES                               │  │
│  │  • DynamoDBService                                        │  │
│  │  • S3Service                                              │  │
│  │  • BedrockService                                         │  │
│  │  • MetaService                                            │  │
│  │  • TwitterService                                         │  │
│  │  • LinkedInService                                        │  │
│  │  • YouTubeService                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬──────────────┬──────────────┬────────────────────┘
              │              │              │
              │              │              │
    ┌─────────▼─────┐  ┌────▼─────┐  ┌────▼──────┐
    │  AWS SERVICES │  │ PLATFORM │  │  PLATFORM │
    │               │  │   APIs   │  │   APIs    │
    └───────────────┘  └──────────┘  └───────────┘
```

## Detailed Component Architecture

### Frontend Layer

```
Frontend (Next.js 16)
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── layout.tsx                  # Root layout
│   └── api/
│       └── generate-caption/       # Server-side API route
│           └── route.ts
├── components/
│   ├── dashboard/
│   │   ├── dashboard-overview.tsx  # Main dashboard
│   │   ├── create-post.tsx         # Post creation
│   │   ├── schedule-post.tsx       # Post scheduling
│   │   ├── content-library.tsx     # Content management
│   │   ├── analytics-section.tsx   # Analytics view
│   │   ├── orin-chat.tsx          # AI chat interface
│   │   └── ...
│   └── ui/                         # Reusable UI components
├── lib/
│   ├── api.ts                      # API client
│   └── utils.ts                    # Utility functions
└── public/                         # Static assets
```

### Backend Layer

```
Backend (Node.js + Express + TypeScript)
├── src/
│   ├── server.ts                   # Express app entry
│   ├── config/
│   │   ├── aws.ts                  # AWS SDK configuration
│   │   └── platforms.ts            # Platform API configs
│   ├── controllers/
│   │   ├── post.controller.ts      # Post operations
│   │   ├── ai.controller.ts        # AI operations
│   │   ├── analytics.controller.ts # Analytics operations
│   │   └── content.controller.ts   # Content operations
│   ├── services/
│   │   ├── dynamodb.service.ts     # DynamoDB operations
│   │   ├── s3.service.ts           # S3 operations
│   │   ├── bedrock.service.ts      # AI operations
│   │   ├── meta.service.ts         # Instagram/Facebook
│   │   ├── twitter.service.ts      # Twitter/X
│   │   ├── linkedin.service.ts     # LinkedIn
│   │   └── youtube.service.ts      # YouTube
│   ├── routes/
│   │   ├── post.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── content.routes.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   └── types/
│       └── index.ts                # TypeScript types
└── scripts/
    └── setup-dynamodb.ts           # Database setup
```

## Data Flow

### 1. Create Post Flow

```
User Input (Frontend)
    │
    ├─> Upload Media
    │       │
    │       └─> POST /api/posts
    │               │
    │               ├─> Upload to S3
    │               │       │
    │               │       └─> Get S3 URL
    │               │
    │               └─> Save to DynamoDB
    │                       │
    │                       └─> Return Post ID
    │
    └─> Generate Caption (Optional)
            │
            └─> POST /api/ai/generate-caption
                    │
                    └─> AWS Bedrock (Claude 3)
                            │
                            └─> Return AI Caption
```

### 2. Publish Post Flow

```
Scheduled Post (DynamoDB)
    │
    └─> POST /api/posts/:id/publish
            │
            ├─> Get Post Data
            │
            ├─> Get Media from S3
            │
            └─> Platform Service
                    │
                    ├─> Instagram: POST to Graph API
                    ├─> Twitter: POST to Twitter API
                    ├─> LinkedIn: POST to LinkedIn API
                    └─> YouTube: POST to YouTube API
                            │
                            └─> Update Post Status in DynamoDB
```

### 3. Sync Analytics Flow

```
User Request
    │
    └─> POST /api/analytics/sync
            │
            ├─> Platform Service
            │       │
            │       ├─> Instagram: GET insights
            │       ├─> Twitter: GET metrics
            │       ├─> LinkedIn: GET analytics
            │       └─> YouTube: GET statistics
            │
            └─> Parse & Store in DynamoDB
                    │
                    └─> Return Analytics Data
```

### 4. Content Library Sync Flow

```
User Request
    │
    └─> POST /api/content/sync
            │
            ├─> Platform Service
            │       │
            │       ├─> Instagram: GET media
            │       ├─> Twitter: GET tweets
            │       ├─> LinkedIn: GET posts
            │       └─> YouTube: GET videos
            │
            └─> Store in DynamoDB
                    │
                    └─> Return Content List
```

## AWS Services Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS CLOUD                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Amazon DynamoDB                        │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  • social_media_users                        │  │    │
│  │  │  • social_media_posts                        │  │    │
│  │  │  • social_media_scheduled_posts              │  │    │
│  │  │  • social_media_analytics                    │  │    │
│  │  │  • social_media_content_library              │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Amazon S3                              │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Bucket: social-media-content-bucket         │  │    │
│  │  │  ├── uploads/                                │  │    │
│  │  │  │   ├── user-id-1/                          │  │    │
│  │  │  │   │   ├── image1.jpg                      │  │    │
│  │  │  │   │   └── video1.mp4                      │  │    │
│  │  │  │   └── user-id-2/                          │  │    │
│  │  │  │       └── ...                             │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Amazon Bedrock                         │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Model: Claude 3 Haiku                       │  │    │
│  │  │  • Caption Generation                        │  │    │
│  │  │  • Content Analysis                          │  │    │
│  │  │  • Recommendations                           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Platform APIs Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM APIs                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Meta Graph API (Instagram/Facebook)               │    │
│  │  • POST /media (create container)                  │    │
│  │  • POST /media_publish (publish post)              │    │
│  │  • GET /media (fetch posts)                        │    │
│  │  • GET /insights (fetch analytics)                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Twitter API v2                                     │    │
│  │  • POST /tweets (create tweet)                     │    │
│  │  • GET /users/:id/tweets (fetch tweets)            │    │
│  │  • GET /tweets/:id (fetch metrics)                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  LinkedIn API v2                                    │    │
│  │  • POST /ugcPosts (create post)                    │    │
│  │  • GET /socialActions (fetch analytics)            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  YouTube Data API v3                                │    │
│  │  • POST /videos (upload video)                     │    │
│  │  • GET /channels (fetch stats)                     │    │
│  │  • GET /videos (fetch video data)                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### DynamoDB Tables

#### 1. social_media_users
```
{
  id: string (PK)
  email: string (GSI)
  name: string
  connectedPlatforms: {
    instagram: { connected: boolean, accountId: string, username: string }
    linkedin: { connected: boolean, accountId: string, username: string }
    twitter: { connected: boolean, accountId: string, username: string }
    youtube: { connected: boolean, channelId: string }
  }
  createdAt: string
  updatedAt: string
}
```

#### 2. social_media_posts
```
{
  id: string (PK)
  userId: string (GSI)
  platform: string
  caption: string
  mediaUrl: string
  mediaType: string
  videoTitle: string
  videoDescription: string
  videoTags: string
  status: string
  scheduledTime: string
  publishedTime: string
  platformPostId: string
  createdAt: string
  updatedAt: string
}
```

#### 3. social_media_scheduled_posts
```
{
  id: string (PK)
  userId: string (GSI)
  scheduledTime: string (GSI Range Key)
  [... same fields as posts ...]
}
```

#### 4. social_media_analytics
```
{
  id: string (PK)
  userId: string (GSI)
  platform: string
  date: string (GSI Range Key)
  engagement: number
  reach: number
  likes: number
  comments: number
  shares: number
  followers: number
}
```

#### 5. social_media_content_library
```
{
  id: string (PK)
  userId: string (GSI)
  caption: string
  thumbnail: string
  platform: string
  likes: number
  comments: number
  shares: number
  platformPostId: string
  createdAt: string
}
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
│                                                              │
│  1. Frontend Security                                        │
│     • HTTPS only in production                               │
│     • Environment variables for API URLs                     │
│     • No sensitive data in client code                       │
│                                                              │
│  2. Backend Security                                         │
│     • Environment variables for all secrets                  │
│     • CORS configuration                                     │
│     • Input validation                                       │
│     • Error handling (no sensitive data in errors)           │
│                                                              │
│  3. AWS Security                                             │
│     • IAM roles and policies                                 │
│     • S3 bucket policies                                     │
│     • DynamoDB encryption at rest                            │
│     • VPC (optional for production)                          │
│                                                              │
│  4. API Security                                             │
│     • OAuth 2.0 for platform APIs                            │
│     • Token refresh mechanisms                               │
│     • Rate limiting                                          │
│     • API key rotation                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Architecture (Development)
- Single backend server
- Direct AWS SDK calls
- Synchronous processing

### Production Recommendations
1. **Load Balancing**: Use AWS ALB or ELB
2. **Caching**: Add Redis for session/data caching
3. **Queue System**: Use SQS for async post publishing
4. **CDN**: Use CloudFront for static assets
5. **Auto-scaling**: Configure EC2 auto-scaling or use Lambda
6. **Database**: Consider DynamoDB on-demand billing
7. **Monitoring**: CloudWatch, X-Ray for tracing

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animation**: Framer Motion
- **Charts**: Recharts
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **AWS SDK**: v3
- **HTTP Client**: Axios
- **File Upload**: Multer

### Infrastructure
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **AI**: AWS Bedrock (Claude 3 Haiku)
- **Hosting**: Vercel (Frontend), AWS (Backend)

### Platform APIs
- **Instagram**: Meta Graph API v21.0
- **Twitter**: Twitter API v2
- **LinkedIn**: LinkedIn API v2
- **YouTube**: YouTube Data API v3

## Performance Metrics

### Target Metrics
- API Response Time: < 500ms
- Page Load Time: < 2s
- Time to Interactive: < 3s
- AI Caption Generation: < 5s
- Post Publishing: < 10s

### Monitoring
- AWS CloudWatch for backend metrics
- Vercel Analytics for frontend metrics
- Custom logging for API calls
- Error tracking and alerting

## Deployment Architecture

See DEPLOYMENT.md for detailed deployment options:
- AWS Lambda + API Gateway (Serverless)
- AWS Elastic Beanstalk (PaaS)
- EC2 + Nginx (Traditional)
- Vercel (Frontend)
- AWS Amplify (Frontend alternative)

---

**Last Updated**: March 2025
**Version**: 1.0.0
