# Social Media Management Platform

A comprehensive social media management platform with AI-powered features, built with Next.js, Node.js, and AWS services.

## Features

### Frontend (Next.js 16)
- 🎨 Modern UI with Tailwind CSS and Radix UI
- 🤖 AI-powered caption generation
- 📅 Post scheduling across multiple platforms
- 📊 Analytics dashboard with real-time insights
- 📚 Content library management
- 🎯 Platform-specific optimizations
- 🌙 Dark/Light mode support

### Backend (Node.js + Express)
- 🚀 RESTful API with TypeScript
- 📦 AWS DynamoDB for data storage
- 🪣 AWS S3 for media storage
- 🤖 AWS Bedrock for AI features
- 📱 Meta Graph API (Instagram/Facebook)
- 🐦 Twitter/X API v2
- 💼 LinkedIn API
- 📺 YouTube Data API v3

### Supported Platforms
- Instagram (Posts & Reels)
- LinkedIn (Posts & Articles)
- Twitter/X (Tweets)
- YouTube (Videos & Shorts)

## Architecture

```
├── Frontend/              # Next.js 16 application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   └── public/           # Static assets
│
├── Backend/              # Node.js Express API
│   ├── src/
│   │   ├── config/      # AWS and platform configs
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   └── types/       # TypeScript types
│   └── scripts/         # Setup scripts
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS Account with credentials configured
- Platform API credentials (Meta, Twitter, LinkedIn, YouTube)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd social-media-platform
```

### 2. Setup Backend

```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run build
node dist/scripts/setup-dynamodb.js
npm run dev
```

### 3. Setup Frontend

```bash
cd Frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URL
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Configuration

### AWS Services Setup

#### 1. DynamoDB Tables
Run the setup script to create required tables:
```bash
cd Backend
npm run build
node dist/scripts/setup-dynamodb.js
```

#### 2. S3 Bucket
Create a bucket for media storage:
```bash
aws s3 mb s3://social-media-content-bucket --region us-east-1
```

Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

#### 3. AWS Bedrock
Enable Claude 3 Haiku model in your AWS region.

### Platform API Setup

#### Meta (Instagram/Facebook)
1. Create app at https://developers.facebook.com
2. Add Instagram Graph API product
3. Get long-lived access token
4. Add credentials to `.env`

#### Twitter/X
1. Create app at https://developer.twitter.com
2. Enable OAuth 2.0
3. Get API keys and bearer token
4. Add credentials to `.env`

#### LinkedIn
1. Create app at https://www.linkedin.com/developers
2. Request Share on LinkedIn API access
3. Get OAuth 2.0 credentials
4. Add credentials to `.env`

#### YouTube
1. Create project in Google Cloud Console
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Get refresh token
5. Add credentials to `.env`

## API Endpoints

### Posts
- `POST /api/posts` - Create a new post
- `POST /api/posts/:postId/publish` - Publish to platform
- `GET /api/posts/user/:userId` - Get user posts
- `GET /api/posts/scheduled/:userId` - Get scheduled posts
- `DELETE /api/posts/:postId` - Delete post

### AI
- `POST /api/ai/generate-caption` - Generate AI caption
- `POST /api/ai/analyze` - Analyze content
- `GET /api/ai/recommendations/:userId` - Get recommendations

### Analytics
- `POST /api/analytics/sync` - Sync from platforms
- `GET /api/analytics/:userId` - Get analytics
- `GET /api/analytics/dashboard/:userId` - Dashboard stats

### Content Library
- `POST /api/content/sync` - Sync from platforms
- `GET /api/content/:userId` - Get content library
- `DELETE /api/content/:contentId` - Delete content

## Environment Variables

### Backend (.env)
```env
PORT=3001
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=social-media-content-bucket
DYNAMODB_TABLE_PREFIX=social_media_

META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_token

LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_ACCESS_TOKEN=your_token

TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_token

YOUTUBE_API_KEY=your_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_REFRESH_TOKEN=your_token
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USER_ID=demo-user-123
```

## Deployment

### Backend (AWS)
- Deploy to AWS Lambda with API Gateway
- Use AWS Elastic Beanstalk
- Deploy to EC2 instance

### Frontend (Vercel)
```bash
cd Frontend
vercel deploy
```

## Development

### Backend
```bash
cd Backend
npm run dev  # Development with hot reload
npm run build  # Build TypeScript
npm start  # Production
```

### Frontend
```bash
cd Frontend
npm run dev  # Development server
npm run build  # Production build
npm start  # Production server
```

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Framer Motion
- Recharts

### Backend
- Node.js
- Express
- TypeScript
- AWS SDK v3
- Axios

### AWS Services
- DynamoDB
- S3
- Bedrock (Claude 3)
- IAM

## Security

- Store all API keys in environment variables
- Use IAM roles for AWS services in production
- Implement rate limiting
- Add authentication middleware
- Enable HTTPS in production
- Validate all user inputs
- Sanitize data before storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
