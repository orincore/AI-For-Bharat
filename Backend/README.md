# Social Media Management Backend

Backend API for the Social Media Management Platform with AWS integration.

## Features

- 🚀 Node.js + Express + TypeScript
- 📦 AWS DynamoDB for data storage
- 🪣 AWS S3 for media storage
- 🤖 AWS Bedrock for AI features
- 📱 Meta Graph API (Instagram/Facebook)
- 🐦 Twitter/X API v2
- 💼 LinkedIn API
- 📺 YouTube Data API v3

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Setup AWS Resources

#### DynamoDB Tables

Run the setup script to create DynamoDB tables:

```bash
npm run build
node dist/scripts/setup-dynamodb.js
```

#### S3 Bucket

Create an S3 bucket for media storage:

```bash
aws s3 mb s3://social-media-content-bucket --region us-east-1
```

Configure CORS for the bucket:

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

### 4. Platform API Setup

#### Meta (Instagram/Facebook)

1. Create a Meta App at https://developers.facebook.com
2. Add Instagram Graph API product
3. Get a long-lived access token
4. Get your Instagram Business Account ID

#### Twitter/X

1. Create an app at https://developer.twitter.com
2. Enable OAuth 2.0
3. Get API keys and bearer token

#### LinkedIn

1. Create an app at https://www.linkedin.com/developers
2. Request access to Share on LinkedIn API
3. Get OAuth 2.0 credentials

#### YouTube

1. Create a project in Google Cloud Console
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Get refresh token

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Posts

- `POST /api/posts` - Create a new post
- `POST /api/posts/:postId/publish` - Publish a post to platform
- `GET /api/posts/user/:userId` - Get all posts for a user
- `GET /api/posts/scheduled/:userId` - Get scheduled posts
- `DELETE /api/posts/:postId` - Delete a post

### AI

- `POST /api/ai/generate-caption` - Generate AI caption
- `POST /api/ai/analyze` - Analyze content
- `GET /api/ai/recommendations/:userId` - Get AI recommendations

### Analytics

- `POST /api/analytics/sync` - Sync analytics from platforms
- `GET /api/analytics/:userId` - Get analytics data
- `GET /api/analytics/dashboard/:userId` - Get dashboard stats

### Content Library

- `POST /api/content/sync` - Sync content from platforms
- `GET /api/content/:userId` - Get content library
- `DELETE /api/content/:contentId` - Delete content

## Architecture

```
Backend/
├── src/
│   ├── config/          # AWS and platform configurations
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic and external APIs
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript types
│   └── server.ts        # Main server file
├── scripts/             # Setup and utility scripts
└── package.json
```

## AWS Services Used

- **DynamoDB**: NoSQL database for posts, analytics, users
- **S3**: Object storage for images and videos
- **Bedrock**: AI model for caption generation and content analysis

## Security Notes

- Store all API keys in environment variables
- Use IAM roles for AWS services in production
- Implement rate limiting for API endpoints
- Add authentication middleware before deployment
- Enable HTTPS in production

## License

MIT
