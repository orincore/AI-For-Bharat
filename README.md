# SocialOS - AI Creator Operating System

An intelligent social media management platform powered by agentic AI, built with Next.js, Node.js, AWS services, and AWS Amplify. SocialOS features Orin AI, an autonomous assistant that can analyze analytics, generate content, post to platforms, and interact via WhatsApp.

## 🌟 Key Features

### 🤖 Orin AI - Agentic Assistant
- **Autonomous Tool Execution**: AI decides which tools to use based on user requests
- **Multi-Platform Analytics**: Fetch and analyze Instagram, YouTube, LinkedIn, and Twitter data
- **Content Generation**: AI-powered caption and content creation
- **Direct Posting**: Post content to multiple platforms through natural conversation
- **WhatsApp Integration**: Interact with Orin AI via WhatsApp messaging
- **Conversation Memory**: Maintains context across multiple messages
- **Web Research**: Get answers to general questions using integrated search

### 📱 Platform Support
- **Instagram**: Posts, Reels, Stories, Analytics, Comments
- **YouTube**: Video uploads, Channel analytics, Comments
- **LinkedIn**: Posts, Articles, Company pages
- **Twitter/X**: Tweets, Analytics, Engagement metrics

### 🎨 Frontend (Next.js 16 + AWS Amplify)
- Modern, responsive UI with Tailwind CSS and Radix UI
- Real-time AI chat interface with Orin
- Post scheduling and content calendar
- Analytics dashboard with interactive charts
- Content library management
- Dark/Light mode support
- Google OAuth authentication
- Deployed on AWS Amplify for scalability

### ⚙️ Backend (Node.js + Express + TypeScript)
- RESTful API with comprehensive endpoints
- AWS DynamoDB for data persistence
- AWS S3 for media storage
- AWS Bedrock (Amazon Nova Pro) for AI capabilities
- Agentic tool system with 13+ tools
- WhatsApp Cloud API integration via MSG91
- JWT authentication with Passport.js
- HTTPS support with SSL certificates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │   WhatsApp   │  │  Mobile App  │         │
│  │ (Amplify)    │  │  (MSG91)     │  │  (Future)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend API    │
                    │  (Express.js)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │  Orin AI  │     │    AWS    │     │ Platform  │
    │  Engine   │     │  Services │     │   APIs    │
    └───────────┘     └───────────┘     └───────────┘
```

### Project Structure

```
├── Frontend/                    # Next.js 16 application (AWS Amplify)
│   ├── app/                    # App router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── login/              # Authentication
│   │   └── auth/callback/      # OAuth callback
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── orin-ai-chat.tsx      # AI chat interface
│   │   │   ├── create-post.tsx       # Post creation
│   │   │   ├── analytics-section.tsx # Analytics view
│   │   │   └── whatsapp-settings.tsx # WhatsApp config
│   │   └── ui/                 # Reusable UI components (57 files)
│   ├── contexts/               # React contexts
│   └── lib/                    # Utilities and API client
│
├── Backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # AWS and platform configurations
│   │   │   ├── aws.ts         # AWS SDK setup
│   │   │   ├── passport.ts    # Authentication config
│   │   │   └── platforms.ts   # Platform API configs
│   │   ├── controllers/       # Request handlers (10 controllers)
│   │   │   ├── ai.controller.ts        # AI chat & tools
│   │   │   ├── whatsapp.controller.ts  # WhatsApp webhook
│   │   │   ├── analytics.controller.ts # Analytics
│   │   │   └── ...
│   │   ├── services/          # Business logic (10 services)
│   │   │   ├── bedrock.service.ts      # AI/LLM integration
│   │   │   ├── tool-executor.service.ts # Agentic tools
│   │   │   ├── whatsapp-workflow.service.ts
│   │   │   ├── dynamodb.service.ts     # Database
│   │   │   ├── s3.service.ts           # File storage
│   │   │   └── ...
│   │   ├── routes/            # API routes (10 route files)
│   │   ├── middleware/        # Express middleware
│   │   ├── types/             # TypeScript definitions
│   │   │   ├── index.ts       # Core types
│   │   │   ├── tools.ts       # Tool definitions
│   │   │   └── whatsapp.ts    # WhatsApp types
│   │   └── server.ts          # Main server file
│   ├── scripts/               # Setup scripts
│   │   ├── setup-dynamodb.ts  # Database initialization
│   │   └── create-whatsapp-numbers-table.js
│   └── certs/                 # SSL certificates
│
├── ARCHITECTURE.md            # Detailed architecture documentation
├── API_SETUP_GUIDE.md        # Complete API setup guide
├── DEPLOYMENT.md             # Deployment instructions
├── CHAT_IMPROVEMENTS.md      # Chat feature documentation
└── WHATSAPP_INTEGRATION.md   # WhatsApp setup guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS Account with credentials
- Platform API credentials (Meta, Twitter, LinkedIn, YouTube)
- MSG91 account (for WhatsApp integration)

### 1. Clone and Install

```bash
git clone <repository-url>
cd socialos

# Backend setup
cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend setup
cd ../Frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

### 2. Configure AWS Services

```bash
# Configure AWS CLI
aws configure

# Create DynamoDB tables
cd Backend
npm run build
node dist/scripts/setup-dynamodb.js

# Create S3 bucket
aws s3 mb s3://socialos-content-$(date +%s) --region us-east-1
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## � Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development
HTTPS_ENABLED=false

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your-bucket
DYNAMODB_TABLE_PREFIX=social_media_

# AWS Bedrock (AI)
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
BEDROCK_REGION=us-east-1

# Meta/Instagram
META_APP_ID=your_app_id
META_APP_SECRET=your_secret
META_ACCESS_TOKEN=your_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_ACCESS_TOKEN=your_token

# Twitter/X
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_token

# YouTube
YOUTUBE_API_KEY=your_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_REFRESH_TOKEN=your_token

# WhatsApp (MSG91)
MSG91_AUTH_KEY=your_auth_key
MSG91_WHATSAPP_NUMBER=your_number
MSG91_BASE_URL=https://control.msg91.com/api/v5

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Web Research (Optional)
SERPER_API_KEY=your_serper_key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🤖 Orin AI - Agentic Tool System

Orin AI features 13+ autonomous tools that the LLM can call based on user intent:

### Analytics Tools
- `get_instagram_analytics` - Fetch Instagram metrics and posts
- `get_youtube_analytics` - Fetch YouTube video performance
- `get_all_analytics_summary` - Cross-platform analytics overview
- `get_instagram_comments` - Fetch comments for specific posts
- `get_youtube_comments` - Fetch video comments
- `get_latest_comment` - Get most recent comment across platforms
- `get_instagram_profile_stats` - Follower counts and profile metrics
- `get_youtube_channel_stats` - Subscriber and channel statistics

### Content Tools
- `generate_caption` - AI-powered caption generation
- `post_to_instagram` - Publish to Instagram
- `post_to_youtube` - Upload videos to YouTube
- `post_to_multiple_platforms` - Cross-post to multiple platforms

### Account Tools
- `get_connected_accounts` - List connected social media accounts
- `web_research` - Search the web for general information

### Example Conversations

**User:** "Show me my Instagram analytics"
**Orin:** *Calls `get_instagram_analytics` tool, analyzes data, provides insights*

**User:** "Post this image to Instagram with a caption about sunset"
**Orin:** *Calls `generate_caption` and `post_to_instagram` tools*

**User:** "What was my last comment?"
**Orin:** *Calls `get_latest_comment` tool, displays comment in highlighted card*

## 📱 WhatsApp Integration

Interact with Orin AI directly through WhatsApp:

### Features
- **Automatic User Management**: Users created on first message
- **Conversation Memory**: Persistent chat history
- **Full AI Capabilities**: Access all Orin AI features via WhatsApp
- **Security**: Phone number verification required in dashboard

### Setup
1. Configure MSG91 credentials in `.env`
2. Set up webhook in MSG91 dashboard
3. Users link WhatsApp number in dashboard settings
4. Start chatting with Orin via WhatsApp

See [WHATSAPP_INTEGRATION.md](Backend/WHATSAPP_INTEGRATION.md) for detailed setup.

## 📊 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user

### AI & Chat
- `POST /ai/chat` - Chat with Orin AI (with tool execution)
- `POST /ai/generate-caption` - Generate AI caption
- `POST /ai/analyze` - Analyze content

### Posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/publish` - Publish to platform
- `GET /api/posts/user/:userId` - Get user posts
- `DELETE /api/posts/:id` - Delete post

### Analytics
- `POST /api/analytics/sync` - Sync from platforms
- `GET /api/analytics/:userId` - Get analytics data
- `GET /api/analytics/dashboard/:userId` - Dashboard stats

### Instagram
- `GET /api/instagram/accounts` - Get connected accounts
- `POST /api/instagram/connect` - Connect new account
- `GET /api/instagram/posts/:accountId` - Get posts
- `GET /api/instagram/comments/:mediaId` - Get comments

### YouTube
- `GET /api/youtube/channels` - Get connected channels
- `POST /api/youtube/upload` - Upload video
- `GET /api/youtube/videos/:channelId` - Get videos

### WhatsApp
- `POST /webhooks/msg91/whatsapp` - Webhook for inbound messages
- `GET /webhooks/msg91/whatsapp/health` - Health check
- `POST /api/user/whatsapp/link` - Link WhatsApp number
- `DELETE /api/user/whatsapp/unlink` - Unlink number

### Dashboard
- `GET /api/dashboard/:userId` - Get dashboard overview

## �️ Database Schema

### DynamoDB Tables

#### users
```typescript
{
  id: string (PK)
  email: string (GSI)
  name: string
  phoneNumber?: string
  whatsappVerified?: boolean
  connectedPlatforms: {
    instagram: { connected, accountId, username }
    youtube: { connected, channelId }
    linkedin: { connected, accountId }
    twitter: { connected, accountId }
  }
  createdAt: string
  updatedAt: string
}
```

#### posts
```typescript
{
  id: string (PK)
  userId: string (GSI)
  platform: 'instagram' | 'youtube' | 'linkedin' | 'twitter'
  caption: string
  mediaUrl: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledTime?: string
  platformPostId?: string
  createdAt: string
}
```

#### chat_conversations
```typescript
{
  id: string (PK)
  userId: string (GSI)
  title?: string
  createdAt: string
  updatedAt: string
}
```

#### chat_messages
```typescript
{
  id: string (PK)
  conversationId: string (GSI)
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}
```

#### whatsapp_numbers
```typescript
{
  phoneNumber: string (PK)
  userId: string (GSI)
  verified: boolean
  createdAt: string
}
```

## 🚀 Deployment

### Frontend (AWS Amplify)

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
cd Frontend
amplify init

# Deploy
amplify publish
```

Or connect your Git repository in AWS Amplify Console for automatic deployments.

### Backend Options

1. **AWS Lambda + API Gateway** (Serverless)
2. **AWS Elastic Beanstalk** (PaaS)
3. **EC2 + Nginx** (Traditional)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔒 Security

- JWT authentication for API endpoints
- Google OAuth for user login
- WhatsApp phone number verification
- AWS IAM roles for service access
- Environment variables for secrets
- HTTPS support with SSL certificates
- CORS configuration
- Input validation and sanitization

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.2
- **UI Components**: Radix UI
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Deployment**: AWS Amplify

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: Passport.js + JWT
- **Testing**: Jest

### AWS Services
- **Database**: DynamoDB
- **Storage**: S3
- **AI**: Bedrock (Amazon Nova Pro)
- **Hosting**: Amplify (Frontend), Lambda/EC2 (Backend)
- **Monitoring**: CloudWatch

### Platform APIs
- **Instagram**: Meta Graph API v21.0
- **Twitter**: Twitter API v2
- **LinkedIn**: LinkedIn API v2
- **YouTube**: YouTube Data API v3
- **WhatsApp**: MSG91 WhatsApp Cloud API
- **AI Model**: Amazon Nova Pro (amazon.nova-pro-v1:0)

### External Services
- **Web Search**: Serper.dev API
- **WhatsApp**: MSG91

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed system architecture
- [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md) - Complete API credential setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [WHATSAPP_INTEGRATION.md](Backend/WHATSAPP_INTEGRATION.md) - WhatsApp setup
- [AGENTIC_TOOLS.md](Backend/AGENTIC_TOOLS.md) - AI tool system documentation
- [CHAT_IMPROVEMENTS.md](CHAT_IMPROVEMENTS.md) - Chat feature enhancements

## 🧪 Testing

```bash
# Backend tests
cd Backend
npm test

# Run specific test
npm test -- youtube.service.test.ts

# Frontend tests (when implemented)
cd Frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check documentation in `/docs` folder
- Review [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md) for configuration help
- Open an issue on GitHub
- Check CloudWatch logs for backend errors
- Review browser console for frontend issues

## 🎯 Roadmap

- [ ] TikTok integration
- [ ] Advanced analytics with AI insights
- [ ] Content scheduling calendar view
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] A/B testing for posts
- [ ] Automated content workflows
- [ ] Multi-language support
- [ ] Voice commands for Orin AI

---

**Built with ❤️ by the SocialOS Team**

**Version**: 1.0.0  
**Last Updated**: March 2026
