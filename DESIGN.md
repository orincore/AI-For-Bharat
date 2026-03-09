# SocialOS - System Design & Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Component Design](#component-design)
5. [AI/ML Architecture](#aiml-architecture)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Scalability & Performance](#scalability--performance)

---

## System Overview

SocialOS is an intelligent social media management platform that leverages agentic AI to automate content creation, analytics, and multi-platform posting. The system is built on a modern microservices-inspired architecture with clear separation between frontend (AWS Amplify + Next.js), backend (Node.js + Express), and AI services (AWS Bedrock).

### Core Principles

- **Agentic AI First**: AI autonomously decides which tools to use
- **Platform Agnostic**: Unified interface for multiple social platforms
- **Conversation-Driven**: Natural language interaction with Orin AI
- **Real-Time**: Instant feedback and updates
- **Scalable**: Cloud-native architecture on AWS
- **Secure**: Multi-layer security with OAuth, JWT, and phone verification

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Web Browser    │  │   WhatsApp       │  │   Mobile App     │ │
│  │   (Amplify)      │  │   (MSG91)        │  │   (Future)       │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                         APPLICATION LAYER                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Express.js Backend                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
│  │  │Controllers │  │  Services  │  │ Middleware │            │   │
│  │  └────────────┘  └────────────┘  └────────────┘            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │

### Component Architecture

#### Layout Components

**Root Layout** (`app/layout.tsx`)
- Provides global providers (Theme, Auth, Analytics)
- Sets up metadata and viewport configuration
- Wraps entire application

**Dashboard Layout** (`app/dashboard/page.tsx`)
- Manages sidebar state (collapsed/expanded)
- Handles section navigation
- Implements command palette (Cmd+K)
- Provides consistent layout for all dashboard views

#### Feature Components

**Orin AI Chat** (`components/dashboard/orin-ai-chat.tsx`)
- Real-time conversational interface
- Streaming responses from AWS Bedrock
- Tool execution visualization
- Message history management
- Typing indicators and animations

**Create Post** (`components/dashboard/create-post.tsx`)
- Multi-platform post creation
- Media upload with S3 integration
- AI caption generation
- Platform-specific preview
- Scheduling interface

**Analytics Section** (`components/dashboard/analytics-section.tsx`)
- Real-time metrics display
- Interactive charts (Recharts)
- Platform comparison
- Date range filtering
- Export capabilities

### State Management

#### Authentication Context

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}
```

Manages:
- User session state
- OAuth token refresh
- Protected route access
- Login/logout flows

#### Local State Patterns

1. **Component State**: `useState` for UI-specific state
2. **Server State**: Direct API calls with loading/error states
3. **Optimistic Updates**: Immediate UI updates with rollback on error
4. **Form State**: React Hook Form for complex forms

### Routing Strategy

**App Router** (Next.js 16)
- File-based routing
- Server components by default
- Client components marked with `"use client"`
- API routes in `app/api/`

**Protected Routes**
```typescript
// Middleware pattern
useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push('/login')
  }
}, [isAuthenticated, loading, router])
```

### Styling Approach

**Tailwind CSS Configuration**
- Custom color palette (primary, neon-cyan, chart colors)
- Dark mode by default
- Responsive breakpoints
- Custom animations

**Component Styling Pattern**
```typescript
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "variant-classes"
)} />
```

## Backend Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4.21
- **Language**: TypeScript 5.7
- **Authentication**: Passport.js
- **File Upload**: Multer + Multer-S3
- **HTTP Client**: Axios
- **Testing**: Jest + fast-check (property-based testing)

### Directory Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── aws.ts              # AWS SDK configuration
│   │   ├── passport.ts         # Passport strategies
│   │   └── platforms.ts        # Platform API configs
│   ├── controllers/
│   │   ├── ai.controller.ts
│   │   ├── post.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── ...
│   ├── services/
│   │   ├── dynamodb.service.ts
│   │   ├── s3.service.ts
│   │   ├── bedrock.service.ts
│   │   ├── youtube.service.ts
│   │   ├── meta.service.ts
│   │   └── ...
│   ├── routes/
│   │   ├── ai.routes.ts
│   │   ├── post.routes.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── tools.ts
│   │   └── whatsapp.ts
│   └── server.ts
├── scripts/
│   └── setup-dynamodb.ts
└── package.json
```

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Routes Layer                 │
│  - Endpoint definitions              │
│  - Request validation                │
│  - Response formatting               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Controllers Layer              │
│  - Request handling                  │
│  - Business logic orchestration      │
│  - Error handling                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Services Layer                │
│  - Business logic implementation     │
│  - External API integration          │
│  - Data transformation               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Data Access Layer               │
│  - DynamoDB operations               │
│  - S3 operations                     │
│  - Caching (if applicable)           │
└──────────────────────────────────────┘
```

### Service Pattern

Each service encapsulates specific functionality:

**DynamoDB Service** (`services/dynamodb.service.ts`)
```typescript
class DynamoDBService {
  async put(tableName: string, item: any): Promise<void>
  async get(tableName: string, key: any): Promise<any>
  async query(tableName: string, ...): Promise<any[]>
  async update(tableName: string, ...): Promise<any>
  async delete(tableName: string, key: any): Promise<void>
}
```

**Bedrock Service** (`services/bedrock.service.ts`)
```typescript
class BedrockService {
  async generateCaption(prompt: string, platform: string): Promise<string>
  async generateVideoMetadata(prompt: string): Promise<VideoMetadata>
  async analyzeContent(content: string): Promise<Analysis>
  async answerQuestionWithTools(question: string, ...): Promise<string>
}
```

**Platform Services** (YouTube, Instagram, LinkedIn, Twitter)
```typescript
class YouTubeService {
  async uploadVideo(...): Promise<VideoUploadResponse>
  async getChannelStats(channelId: string): Promise<ChannelStats>
  async listChannelVideos(...): Promise<Video[]>
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse>
}
```

### Middleware Stack

1. **CORS**: Configured for frontend origin
2. **Body Parser**: JSON and URL-encoded
3. **Passport**: Authentication strategies
4. **Error Handler**: Centralized error handling

```typescript
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(passport.initialize())
app.use('/api', routes)
app.use(errorHandler)
```

### Error Handling

**Custom Error Classes**
```typescript
class YouTubeQuotaExceededError extends Error
class YouTubeInvalidCredentialsError extends Error
class YouTubeUploadFailedError extends Error
```

**Error Handler Middleware**
```typescript
export const errorHandler = (err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  })
}
```

## Data Models

### DynamoDB Tables

#### 1. social_media_users

```typescript
interface User {
  id: string                    // Partition key
  email: string                 // GSI
  name: string
  profilePicture?: string
  connectedPlatforms: {
    instagram?: PlatformConnection
    youtube?: PlatformConnection
    linkedin?: PlatformConnection
    twitter?: PlatformConnection
  }
  createdAt: string
  updatedAt: string
}

interface PlatformConnection {
  connected: boolean
  accountId: string
  username: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: string
}
```

#### 2. social_media_posts

```typescript
interface Post {
  id: string                    // Partition key
  userId: string                // GSI
  platform: 'instagram' | 'youtube' | 'linkedin' | 'twitter'
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'carousel'
  videoTitle?: string           // YouTube specific
  videoDescription?: string
  videoTags?: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledTime?: string
  publishedTime?: string
  platformPostId?: string
  createdAt: string
  updatedAt: string
}
```

#### 3. social_media_analytics

```typescript
interface Analytics {
  id: string                    // Partition key
  userId: string                // GSI
  platform: string
  date: string                  // GSI Range Key
  postId?: string
  engagement: number
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves?: number
  followers: number
  views?: number                // Video specific
  watchTime?: number
}
```

#### 4. chat_conversations

```typescript
interface Conversation {
  id: string                    // Partition key
  userId: string                // GSI
  title?: string
  createdAt: string
  updatedAt: string             // GSI Range Key
  metadata?: Record<string, any>
}
```

#### 5. chat_messages

```typescript
interface ChatMessage {
  id: string                    // Partition key
  conversationId: string        // GSI
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string             // GSI Range Key
  metadata?: {
    toolCalls?: ToolCall[]
    reasoning?: string
  }
}
```

### S3 Storage Structure

```
s3://social-media-content-bucket/
├── uploads/
│   ├── {userId}/
│   │   ├── {postId}/
│   │   │   ├── original.jpg
│   │   │   ├── thumbnail.jpg
│   │   │   └── video.mp4
│   │   └── ...
│   └── ...
└── temp/
    └── {uploadId}/
        └── ...
```

                ┌───────────────┼───────────────┐
                │               │               │
┌───────────────▼────┐  ┌───────▼──────┐  ┌───▼──────────────┐
│   AI/ML LAYER      │  │  DATA LAYER  │  │  EXTERNAL APIs   │
│  ┌──────────────┐  │  │ ┌──────────┐ │  │ ┌──────────────┐ │
│  │AWS Bedrock   │  │  │ │DynamoDB  │ │  │ │Instagram API │ │
│  │(Nova Pro)    │  │  │ │          │ │  │ │YouTube API   │ │
│  │              │  │  │ │S3 Storage│ │  │ │LinkedIn API  │ │
│  │Tool Executor │  │  │ │          │ │  │ │Twitter API   │ │
│  └──────────────┘  │  │ └──────────┘ │  │ │MSG91 API     │ │
└────────────────────┘  └──────────────┘  │ └──────────────┘ │
                                          └──────────────────┘
```

---

## Architecture Patterns

### 1. Layered Architecture

The system follows a clean layered architecture:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  Next.js Components
│  (UI Components, Pages, Contexts)       │  React Hooks, State
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────┐
│         API Gateway Layer               │  Express Routes
│  (Routes, Controllers, Middleware)      │  Request Validation
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Business Logic Layer            │  Services
│  (Services, Tool Executor, AI Engine)   │  Business Rules
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Access Layer               │  DynamoDB Service
│  (Database, Storage, Cache)             │  S3 Service
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Infrastructure Layer            │  AWS Services
│  (DynamoDB, S3, Bedrock, CloudWatch)    │  External APIs
└─────────────────────────────────────────┘
```

### 2. Agentic AI Pattern

The AI system uses an autonomous agent pattern where the LLM decides which tools to execute:

```
User Query → LLM (Bedrock) → Tool Selection → Tool Execution → Result Synthesis
     ↑                                                               │
     └───────────────────── Iterative Loop ─────────────────────────┘
                         (Max 5 iterations)
```

### 3. Event-Driven Pattern

WhatsApp integration uses event-driven architecture:

```
WhatsApp Message → MSG91 Webhook → Event Handler → AI Processing → Response
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
┌──────┐                ┌──────────┐              ┌─────────┐
│Client│                │ Backend  │              │ Google  │
└──┬───┘                └────┬─────┘              └────┬────┘
   │                         │                         │
   │ 1. Click "Login"        │                         │
   ├────────────────────────>│                         │
   │                         │                         │
   │ 2. Redirect to Google   │                         │
   │<────────────────────────┤                         │
   │                         │                         │
   │ 3. Authenticate         │                         │
   ├─────────────────────────┼────────────────────────>│
   │                         │                         │
   │ 4. Auth Code            │                         │
   │<────────────────────────┼─────────────────────────┤
   │                         │                         │
   │ 5. Exchange for Token   │                         │
   ├────────────────────────>│                         │
   │                         │ 6. Verify with Google   │
   │                         ├────────────────────────>│
   │                         │                         │
   │                         │ 7. User Info            │
   │                         │<────────────────────────┤
   │                         │                         │
   │                         │ 8. Create/Update User   │
   │                         │ (DynamoDB)              │
   │                         │                         │
   │ 9. JWT Token            │                         │
   │<────────────────────────┤                         │
   │                         │                         │
   │ 10. Access Dashboard    │                         │
   ├────────────────────────>│                         │
```

### 2. AI Chat with Tool Execution Flow

```
┌──────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
│Client│    │ Backend │    │ Bedrock │    │   Tool   │    │ Platform │
│      │    │   API   │    │   LLM   │    │ Executor │    │   API    │
└──┬───┘    └────┬────┘    └────┬────┘    └────┬─────┘    └────┬─────┘
   │             │              │              │               │
   │ 1. Send     │              │              │               │
   │ Message     │              │              │               │
   ├────────────>│              │              │               │
   │             │              │              │               │
   │             │ 2. Load      │              │               │
   │             │ Conversation │              │               │
   │             │ History      │              │               │
   │             │ (DynamoDB)   │              │               │
   │             │              │              │               │
   │             │ 3. Send with │              │               │
   │             │ Tool Defs    │              │               │
   │             ├─────────────>│              │               │
   │             │              │              │               │
   │             │              │ 4. Decide    │               │
   │             │              │ Tool to Use  │               │
   │             │              │              │               │
   │             │ 5. Tool      │              │               │
   │             │ Request      │              │               │
   │             │<─────────────┤              │               │
   │             │              │              │               │
   │             │ 6. Execute   │              │               │
   │             │ Tool         │              │               │
   │             ├─────────────────────────────>│               │
   │             │              │              │               │
   │             │              │              │ 7. Fetch Data │
   │             │              │              ├──────────────>│
   │             │              │              │               │
   │             │              │              │ 8. Data       │
   │             │              │              │<──────────────┤
   │             │              │              │               │
   │             │ 9. Tool      │              │               │
   │             │ Result       │              │               │
   │             │<─────────────────────────────┤               │
   │             │              │              │               │
   │             │ 10. Send     │              │               │
   │             │ Result       │              │               │
   │             ├─────────────>│              │               │
   │             │              │              │               │
   │             │              │ 11. Synthesize│              │
   │             │              │ Response     │               │
   │             │              │              │               │
   │             │ 12. Final    │              │               │
   │             │ Answer       │              │               │
   │             │<─────────────┤              │               │
   │             │              │              │               │
   │             │ 13. Save     │              │               │
   │             │ Messages     │              │               │
   │             │ (DynamoDB)   │              │               │
   │             │              │              │               │
   │ 14. Display │              │              │               │
   │ Response    │              │              │               │
   │<────────────┤              │              │               │
```

## API Design

### RESTful Principles

- **Resource-based URLs**: `/api/posts`, `/api/analytics`
- **HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- **JSON Responses**: Consistent format with `success`, `data`, `error` fields

### API Response Format

**Success Response**
```json
{
  "success": true,
  "data": {
    "id": "post-123",
    "caption": "Amazing sunset!",
    "platform": "instagram"
  }
}
```

**Error Response**
```json
{
  "success": false,
  "error": "Invalid access token",
  "code": "INVALID_TOKEN"
}
```

### Endpoint Categories

#### Authentication Endpoints

```
POST   /api/auth/google              # Initiate Google OAuth
GET    /api/auth/google/callback     # OAuth callback
POST   /api/auth/logout              # Logout user
GET    /api/auth/me                  # Get current user
```

#### Post Management

```
POST   /api/posts                    # Create new post
GET    /api/posts/:id                # Get post by ID
PUT    /api/posts/:id                # Update post
DELETE /api/posts/:id                # Delete post
POST   /api/posts/:id/publish        # Publish scheduled post
GET    /api/posts/user/:userId       # Get user's posts
```

#### AI Operations

```
POST   /api/ai/generate-caption      # Generate AI caption
POST   /api/ai/generate-video-metadata  # Generate video metadata
POST   /api/ai/analyze-content       # Analyze content
POST   /api/ai/chat                  # Chat with Orin AI
GET    /api/ai/conversations         # Get chat conversations
POST   /api/ai/conversations         # Create conversation
GET    /api/ai/conversations/:id/messages  # Get messages
```

#### Analytics

```
GET    /api/analytics/instagram      # Instagram analytics
GET    /api/analytics/youtube        # YouTube analytics
GET    /api/analytics/summary        # Cross-platform summary
POST   /api/analytics/sync           # Sync from platforms
```

#### Platform-Specific

**Instagram**
```
GET    /api/instagram/profile        # Profile stats
GET    /api/instagram/posts          # Recent posts
GET    /api/instagram/comments/:postId  # Post comments
POST   /api/instagram/connect        # Connect account
```

**YouTube**
```
POST   /api/youtube/upload           # Upload video
GET    /api/youtube/channel          # Channel stats
GET    /api/youtube/videos           # Channel videos
GET    /api/youtube/comments/:videoId  # Video comments
POST   /api/youtube/connect          # Connect account
```

### Request/Response Examples

#### Create Post

**Request**
```http
POST /api/posts
Content-Type: application/json

{
  "userId": "user-123",
  "platform": "instagram",
  "caption": "Beautiful sunset at the beach 🌅",
  "mediaUrl": "https://s3.amazonaws.com/bucket/image.jpg",
  "mediaType": "image",
  "scheduledTime": "2025-03-10T18:00:00Z"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "post-456",
    "userId": "user-123",
    "platform": "instagram",
    "caption": "Beautiful sunset at the beach 🌅",
    "mediaUrl": "https://s3.amazonaws.com/bucket/image.jpg",
    "status": "scheduled",
    "scheduledTime": "2025-03-10T18:00:00Z",
    "createdAt": "2025-03-09T10:30:00Z"
  }
}
```

#### Generate Caption

**Request**
```http
POST /api/ai/generate-caption
Content-Type: application/json

{
  "prompt": "sunset at the beach",
  "platform": "instagram",
  "tone": "engaging",
  "includeHashtags": true,
  "includeEmojis": true
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "caption": "Golden hour magic at the beach 🌅✨ There's nothing quite like watching the sun paint the sky in shades of orange and pink. Nature's masterpiece! 🎨\n\n#SunsetVibes #BeachLife #GoldenHour #NaturePhotography #CoastalLiving"
  }
}
```

## AI Integration

### AWS Bedrock Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Bedrock Service                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Model: Amazon Nova Pro                        │    │
│  │  (amazon.nova-pro-v1:0)                        │    │
│  │  - Caption generation                           │    │
│  │  - Content analysis                             │    │
│  │  - Complex reasoning                            │    │
│  │  - Tool execution                               │    │
│  │  - 300K token context window                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Inference Profile: Cross-region routing       │    │
│  │  - Automatic failover                           │    │
│  │  - Load balancing                               │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Tool Integration Pattern

Orin AI uses AWS Bedrock's tool calling capability:

```typescript
interface Tool {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, any>
    required: string[]
  }
}

const AVAILABLE_TOOLS: Tool[] = [
  {
    name: "get_instagram_analytics",
    description: "Fetch Instagram post analytics and engagement metrics",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of posts to analyze" }
      },
      required: []
    }
  },
  {
    name: "get_youtube_analytics",
    description: "Fetch YouTube video analytics and channel stats",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of videos to analyze" }
      },
      required: []
    }
  },
  // ... more tools
]
```

### Conversation Flow with Tools

```
1. User: "How are my Instagram posts performing?"
   ↓
2. Bedrock (Nova Pro): Analyzes intent → Decides to use tool
   ↓
3. Tool Call: get_instagram_analytics({ limit: 10 })
   ↓
4. Backend: Executes tool → Fetches data from Instagram API
   ↓
5. Tool Result: Returns analytics data to Bedrock
   ↓
6. Bedrock: Processes data → Generates human-readable response
   ↓
7. Response: "Your Instagram posts are performing well! 
              Average engagement: 5.2%, Top post: 'Sunset' with 1.2K likes..."
```

### Prompt Engineering

**Caption Generation Prompt**
```typescript
const prompt = `Create a short, ${tone} ${platform} caption based on: "${userPrompt}"

Rules:
- Keep it concise (2-3 sentences max)
- ${includeEmojis ? 'Use 2-3 relevant emojis' : 'No emojis'}
- ${includeHashtags ? 'Add 3-5 relevant hashtags at the end' : 'No hashtags'}
- NO explanations, NO extra commentary
- Output ONLY the caption text itself
- Make it natural and engaging`
```

**Analytics Summarization Prompt**
```typescript
const prompt = `You are Orin AI, an expert social media analytics assistant. 
Analyze the following data and provide a comprehensive summary.

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}

Provide:
1. Key Performance Metrics
2. Trends & Insights
3. Platform Comparison
4. Actionable Recommendations
5. Content Strategy

Format as plain text without markdown symbols.`
```

### Fallback Strategy

```typescript
async invokeWithFallback(prompt: string, maxTokens: number): Promise<string> {
  try {
    return await this.invokeBedrock(prompt, maxTokens)
  } catch (error) {
    if (OPENAI_API_KEY) {
      console.warn('Bedrock failed, falling back to OpenAI')
      return await this.invokeOpenAI(prompt, maxTokens)
    }
    throw error
  }
}
```

## Authentication Flow

### OAuth 2.0 Implementation

#### Google OAuth Flow

```
1. User clicks "Login with Google"
   ↓
2. Frontend redirects to: /api/auth/google
   ↓
3. Backend redirects to Google OAuth consent screen
   ↓
4. User authorizes application
   ↓
5. Google redirects to: /api/auth/google/callback?code=...
   ↓
6. Backend exchanges code for tokens
   ↓
7. Backend creates/updates user in DynamoDB
   ↓
8. Backend sets session cookie
   ↓
9. Frontend redirects to /dashboard
```

#### Passport.js Configuration

```typescript
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user
  const user = await findOrCreateUser(profile)
  return done(null, user)
}))
```

### Platform Authentication

Each platform requires separate OAuth:

**Instagram (Meta)**
- OAuth 2.0 with Facebook Login
- Requires Business/Creator account
- Long-lived tokens (60 days)

**YouTube (Google)**
- OAuth 2.0 with Google
- Requires YouTube channel
- Refresh tokens for long-term access

**LinkedIn**
- OAuth 2.0
- Requires company page
- Access tokens expire after 60 days

**Twitter/X**
- OAuth 2.0
- Bearer tokens for API access
- User context tokens for posting

### Token Management

```typescript
interface TokenManager {
  async refreshToken(platform: string, refreshToken: string): Promise<string>
  async isTokenExpired(tokenExpiry: string): boolean
  async storeTokens(userId: string, platform: string, tokens: Tokens): Promise<void>
}
```

**Token Refresh Strategy**
- Check expiry before each API call
- Automatic refresh if expired
- Store new tokens in DynamoDB
- Retry failed requests with new token


### 3. WhatsApp Message Processing Flow

```
┌──────────┐   ┌────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ WhatsApp │   │ MSG91  │   │ Backend │   │ Orin AI │   │Platform │
│   User   │   │Webhook │   │ Webhook │   │ Engine  │   │   API   │
└────┬─────┘   └───┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
     │             │              │             │             │
     │ 1. Send     │              │             │             │
     │ Message     │              │             │             │
     ├────────────>│              │             │             │
     │             │              │             │             │
     │             │ 2. Webhook   │             │             │
     │             │ POST         │             │             │
     │             ├─────────────>│             │             │
     │             │              │             │             │
     │             │              │ 3. Verify   │             │
     │             │              │ Phone #     │             │
     │             │              │ (DynamoDB)  │             │
     │             │              │             │             │
     │             │              │ 4. Get/Create│            │
     │             │              │ User         │            │
     │             │              │             │             │
     │             │              │ 5. Load     │             │
     │             │              │ Conversation│             │
     │             │              │             │             │
     │             │              │ 6. Process  │             │
     │             │              │ with AI     │             │
     │             │              ├────────────>│             │
     │             │              │             │             │
     │             │              │             │ 7. Execute  │
     │             │              │             │ Tools       │
     │             │              │             ├────────────>│
     │             │              │             │             │
     │             │              │             │ 8. Results  │
     │             │              │             │<────────────┤
     │             │              │             │             │
     │             │              │ 9. AI       │             │
     │             │              │ Response    │             │
     │             │              │<────────────┤             │
     │             │              │             │             │
     │             │              │ 10. Save    │             │
     │             │              │ Messages    │             │
     │             │              │             │             │
     │             │ 11. Send     │             │             │
     │             │ via MSG91    │             │             │
     │             │<─────────────┤             │             │
     │             │              │             │             │
     │ 12. Receive │              │             │             │
     │ Response    │              │             │             │
     │<────────────┤              │             │             │
```

### 4. Post Publishing Flow

```
┌──────┐   ┌─────────┐   ┌─────────┐   ┌─────┐   ┌──────────┐
│Client│   │ Backend │   │   S3    │   │ AI  │   │ Platform │
└──┬───┘   └────┬────┘   └────┬────┘   └──┬──┘   └────┬─────┘
   │            │              │           │           │
   │ 1. Upload  │              │           │           │
   │ Media      │              │           │           │
   ├───────────>│              │           │           │
   │            │              │           │           │
   │            │ 2. Store     │           │           │
   │            │ in S3        │           │           │
   │            ├─────────────>│           │           │
   │            │              │           │           │
   │            │ 3. S3 URL    │           │           │
   │            │<─────────────┤           │           │
   │            │              │           │           │
   │ 4. Request │              │           │           │
   │ Caption    │              │           │           │
   ├───────────>│              │           │           │
   │            │              │           │           │
   │            │ 5. Generate  │           │           │
   │            │ Caption      │           │           │
   │            ├──────────────────────────>│           │
   │            │              │           │           │
   │            │ 6. AI Caption│           │           │
   │            │<──────────────────────────┤           │
   │            │              │           │           │
   │ 7. Caption │              │           │           │
   │<───────────┤              │           │           │
   │            │              │           │           │
   │ 8. Publish │              │           │           │
   │ Post       │              │           │           │
   ├───────────>│              │           │           │
   │            │              │           │           │
   │            │ 9. Save Post │           │           │
   │            │ (DynamoDB)   │           │           │
   │            │              │           │           │
   │            │ 10. Publish  │           │           │
   │            │ to Platform  │           │           │
   │            ├──────────────────────────────────────>│
   │            │              │           │           │
   │            │              │           │ 11. Post  │
   │            │              │           │ ID        │
   │            │<──────────────────────────────────────┤
   │            │              │           │           │
   │            │ 12. Update   │           │           │
   │            │ Status       │           │           │
   │            │ (DynamoDB)   │           │           │
   │            │              │           │           │
   │ 13. Success│              │           │           │
   │<───────────┤              │           │           │
```

---

## Component Design

### Frontend Architecture (Next.js + AWS Amplify)

```
Frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing/redirect page
│   ├── login/                   # Authentication pages
│   ├── dashboard/               # Main dashboard
│   └── auth/callback/           # OAuth callback
│
├── components/
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── orin-ai-chat.tsx    # AI chat interface
│   │   │   ├── State: messages, conversationId, loading
│   │   │   ├── Features: Tool result parsing, comment highlighting
│   │   │   └── API: POST /ai/chat
│   │   │
│   │   ├── create-post.tsx      # Post creation form
│   │   │   ├── State: media, caption, platform
│   │   │   ├── Features: Media upload, AI caption generation
│   │   │   └── API: POST /api/posts
│   │   │
│   │   ├── analytics-section.tsx # Analytics dashboard
│   │   │   ├── State: analytics data, date range
│   │   │   ├── Features: Charts, metrics, comparisons
│   │   │   └── API: GET /api/analytics/:userId
│   │   │
│   │   ├── whatsapp-settings.tsx # WhatsApp configuration
│   │   │   ├── State: phoneNumber, verified
│   │   │   ├── Features: Link/unlink phone number
│   │   │   └── API: POST /api/user/whatsapp/link
│   │   │
│   │   └── sidebar.tsx          # Navigation sidebar
│   │
│   └── ui/                      # Reusable UI components (57 files)
│       ├── button.tsx           # Button component
│       ├── card.tsx             # Card component
│       ├── dialog.tsx           # Modal dialog
│       └── ...                  # Other Radix UI components
│
├── contexts/
│   └── AuthContext.tsx          # Authentication context
│       ├── State: user, isAuthenticated, loading
│       ├── Methods: login, logout, checkAuth
│       └── Provider: Wraps entire app
│
├── lib/
│   ├── api.ts                   # API client with axios
│   └── utils.ts                 # Utility functions
│
└── public/                      # Static assets
```

### Backend Architecture (Node.js + Express)

```
Backend/src/
├── server.ts                    # Express app initialization
│   ├── Middleware: CORS, JSON parser, Passport
│   ├── Routes: Mount all route modules
│   └── Error Handler: Global error handling
│
├── config/
│   ├── aws.ts                   # AWS SDK configuration
│   │   ├── DynamoDB client
│   │   ├── S3 client
│   │   └── Bedrock client
│   │
│   ├── passport.ts              # Passport.js configuration
│   │   ├── Google OAuth strategy
│   │   └── JWT strategy
│   │
│   └── platforms.ts             # Platform API configs
│       ├── Instagram/Meta config
│       ├── YouTube config
│       ├── LinkedIn config
│       └── Twitter config
│
├── controllers/                 # Request handlers
│   ├── ai.controller.ts         # AI chat endpoints
│   │   ├── POST /ai/chat       # Main chat with tools
│   │   ├── POST /ai/generate-caption
│   │   └── POST /ai/analyze
│   │
│   ├── whatsapp.controller.ts   # WhatsApp webhook
│   │   ├── POST /webhooks/msg91/whatsapp
│   │   └── GET /webhooks/msg91/whatsapp/health
│   │
│   ├── post.controller.ts       # Post management
│   ├── analytics.controller.ts  # Analytics endpoints
│   ├── auth.controller.ts       # Authentication
│   └── ...                      # Other controllers
│
├── services/                    # Business logic
│   ├── bedrock.service.ts       # AWS Bedrock integration
│   │   ├── chat(): Main chat method
│   │   ├── generateCaption(): Caption generation
│   │   └── Supports tool calling with Converse API
│   │
│   ├── tool-executor.service.ts # Agentic tool execution
│   │   ├── execute(): Main execution method
│   │   ├── 13+ tool implementations
│   │   └── Returns structured JSON results
│   │
│   ├── whatsapp-workflow.service.ts # WhatsApp AI processing
│   │   ├── processMessage(): Main workflow
│   │   ├── Conversation management
│   │   └── Tool execution integration
│   │
│   ├── dynamodb.service.ts      # Database operations
│   │   ├── CRUD operations for all tables
│   │   ├── Query and scan operations
│   │   └── Batch operations
│   │
│   ├── s3.service.ts            # File storage
│   │   ├── uploadFile(): Upload to S3
│   │   ├── getSignedUrl(): Generate presigned URLs
│   │   └── deleteFile(): Remove files
│   │
│   ├── msg91.service.ts         # WhatsApp messaging
│   │   ├── sendMessage(): Send WhatsApp message
│   │   └── parseWebhook(): Parse incoming webhooks
│   │
│   └── [platform].service.ts    # Platform-specific services
│       ├── meta.service.ts      # Instagram/Facebook
│       ├── youtube.service.ts   # YouTube
│       ├── linkedin.service.ts  # LinkedIn
│       └── twitter.service.ts   # Twitter/X
│
├── routes/                      # API routes
│   ├── ai.routes.ts            # AI endpoints
│   ├── whatsapp.routes.ts      # WhatsApp webhook
│   ├── post.routes.ts          # Post management
│   ├── analytics.routes.ts     # Analytics
│   ├── auth.routes.ts          # Authentication
│   └── ...                     # Other routes
│
├── middleware/
│   ├── auth.ts                 # JWT authentication
│   └── errorHandler.ts         # Error handling
│
└── types/
    ├── index.ts                # Core type definitions
    ├── tools.ts                # Tool definitions
    └── whatsapp.ts             # WhatsApp types
```

---

## AI/ML Architecture

### Agentic AI System Design

The AI system is built on AWS Bedrock with Amazon Nova Pro model, implementing an agentic pattern where the LLM autonomously decides which tools to execute.

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTIC AI ENGINE                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Bedrock Service                        │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Amazon Nova Pro (amazon.nova-pro-v1:0)     │  │    │
│  │  │  - Converse API with Tool Support            │  │    │
│  │  │  - Max 5 tool execution iterations           │  │    │
│  │  │  - Context window: 300K tokens               │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Tool Executor Service                  │    │
│  │                                                     │    │
│  │  Analytics Tools (6):                              │    │
│  │  ├─ get_instagram_analytics                        │    │
│  │  ├─ get_youtube_analytics                          │    │
│  │  ├─ get_all_analytics_summary                      │    │
│  │  ├─ get_instagram_comments                         │    │
│  │  ├─ get_youtube_comments                           │    │
│  │  └─ get_latest_comment                             │    │
│  │                                                     │    │
│  │  Content Tools (4):                                │    │
│  │  ├─ generate_caption                               │    │
│  │  ├─ post_to_instagram                              │    │
│  │  ├─ post_to_youtube                                │    │
│  │  └─ post_to_multiple_platforms                     │    │
│  │                                                     │    │
│  │  Account Tools (3):                                │    │
│  │  ├─ get_connected_accounts                         │    │
│  │  ├─ get_instagram_profile_stats                    │    │
│  │  └─ get_youtube_channel_stats                      │    │
│  │                                                     │    │
│  │  Research Tools (1):                               │    │
│  │  └─ web_research (Serper.dev API)                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Platform Integrations

### Instagram (Meta Graph API)

#### Post Publishing Flow

```
1. Upload media to S3
   ↓
2. Create media container
   POST https://graph.facebook.com/v21.0/{ig-user-id}/media
   {
     "image_url": "https://s3.../image.jpg",
     "caption": "Amazing sunset! #sunset",
     "access_token": "..."
   }
   ↓
3. Publish media container
   POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
   {
     "creation_id": "{container-id}",
     "access_token": "..."
   }
   ↓
4. Store platform post ID in DynamoDB
```

#### Analytics Fetching

```typescript
async getInstagramAnalytics(userId: string, limit: number) {
  // 1. Get user's posts
  const posts = await this.getRecentPosts(userId, limit)
  
  // 2. For each post, fetch insights
  for (const post of posts) {
    const insights = await this.getPostInsights(post.id)
    // insights: likes, comments, saves, reach, impressions
  }
  
  // 3. Aggregate and return
  return {
    totalEngagement: sum(likes + comments + saves),
    averageEngagement: totalEngagement / posts.length,
    topPost: maxBy(posts, 'engagement')
  }
}
```

#### Rate Limits
- 200 calls per hour per user
- 4800 calls per day per app

### YouTube (Data API v3)

#### Video Upload Flow

```
1. Upload video to S3
   ↓
2. Initiate resumable upload
   POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable
   Headers:
     Authorization: Bearer {access_token}
     X-Upload-Content-Length: {file_size}
     X-Upload-Content-Type: video/mp4
   Body:
     {
       "snippet": {
         "title": "My Video",
         "description": "Description",
         "tags": ["tag1", "tag2"]
       },
       "status": { "privacyStatus": "public" }
     }
   ↓
3. Get upload URL from Location header
   ↓
4. Stream video to upload URL
   PUT {upload_url}
   Body: video stream
   ↓
5. Receive video ID in response
   ↓
6. Store video ID in DynamoDB
```

#### Token Refresh

```typescript
async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await axios.post(
    'https://oauth2.googleapis.com/token',
    {
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token'
    }
  )
  
  return {
    access_token: response.data.access_token,
    expires_in: response.data.expires_in,
    token_type: response.data.token_type
  }
}
```

#### Quota Management
- 10,000 units per day (default)
- Video upload: 1,600 units
- List videos: 1 unit
- Get video details: 1 unit

### LinkedIn (API v2)

#### Post Creation

```typescript
async createPost(accessToken: string, personUrn: string, content: string) {
  const response = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  )
  
  return response.data
}
```

#### Media Upload (Images)

```
1. Register upload
   POST https://api.linkedin.com/v2/assets?action=registerUpload
   {
     "registerUploadRequest": {
       "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
       "owner": "{person-urn}",
       "serviceRelationships": [{
         "relationshipType": "OWNER",
         "identifier": "urn:li:userGeneratedContent"
       }]
     }
   }
   ↓
2. Upload image to provided URL
   PUT {upload_url}
   Body: image binary
   ↓
3. Create post with media URN
```

### Twitter/X (API v2)

#### Tweet Creation

```typescript
async createTweet(accessToken: string, text: string, mediaIds?: string[]) {
  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    {
      text: text,
      ...(mediaIds && { media: { media_ids: mediaIds } })
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return response.data
}
```

#### Media Upload

```
1. INIT: Initialize upload
   POST https://upload.twitter.com/1.1/media/upload.json
   {
     command: 'INIT',
     total_bytes: file_size,
     media_type: 'image/jpeg'
   }
   ↓
2. APPEND: Upload chunks
   POST https://upload.twitter.com/1.1/media/upload.json
   {
     command: 'APPEND',
     media_id: media_id,
     segment_index: 0,
     media: base64_chunk
   }
   ↓
3. FINALIZE: Complete upload
   POST https://upload.twitter.com/1.1/media/upload.json
   {
     command: 'FINALIZE',
     media_id: media_id
   }
   ↓
4. Use media_id in tweet
```

## State Management

### Frontend State Architecture

```
┌─────────────────────────────────────────────────────┐
│              Application State                       │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Global State (React Context)              │    │
│  │  - Authentication (user, tokens)           │    │
│  │  - Theme (dark/light mode)                 │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Component State (useState)                │    │
│  │  - UI state (modals, dropdowns)            │    │
│  │  - Form inputs                             │    │
│  │  - Loading states                          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Server State (API calls)                  │    │
│  │  - Posts data                              │    │
│  │  - Analytics data                          │    │
│  │  - User profile                            │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### State Update Patterns

#### Optimistic Updates

```typescript
const handlePublishPost = async (postId: string) => {
  // 1. Optimistically update UI
  setPosts(prev => prev.map(p => 
    p.id === postId ? { ...p, status: 'published' } : p
  ))
  
  try {
    // 2. Make API call
    await api.publishPost(postId)
  } catch (error) {
    // 3. Rollback on error
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, status: 'scheduled' } : p
    ))
    toast.error('Failed to publish post')
  }
}
```

#### Loading States

```typescript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const fetchData = async () => {
  setLoading(true)
  setError(null)
  
  try {
    const result = await api.getData()
    setData(result)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

### Backend State Management

**Stateless Design**
- No session state stored in memory
- All state in DynamoDB or client
- Horizontal scaling ready

**Caching Strategy** (Future Enhancement)
```typescript
// Redis cache for frequently accessed data
const cache = {
  async get(key: string): Promise<any>
  async set(key: string, value: any, ttl: number): Promise<void>
  async invalidate(key: string): Promise<void>
}

// Example usage
async getUserProfile(userId: string) {
  const cached = await cache.get(`user:${userId}`)
  if (cached) return cached
  
  const user = await dynamodb.get('users', { id: userId })
  await cache.set(`user:${userId}`, user, 3600) // 1 hour TTL
  return user
}
```

## Performance Optimization

### Frontend Optimizations

#### Code Splitting

```typescript
// Dynamic imports for heavy components
const AnalyticsSection = dynamic(
  () => import('@/components/dashboard/analytics-section'),
  { loading: () => <Skeleton /> }
)

const OrinAIChat = dynamic(
  () => import('@/components/dashboard/orin-ai-chat'),
  { ssr: false } // Client-side only
)
```

#### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Load immediately
  placeholder="blur"
  blurDataURL="data:image/..." // Low-quality placeholder
/>
```

#### Lazy Loading

```typescript
// Intersection Observer for lazy loading
const { ref, inView } = useInView({
  triggerOnce: true,
  threshold: 0.1
})

return (
  <div ref={ref}>
    {inView && <HeavyComponent />}
  </div>
)
```

### Backend Optimizations

#### Database Query Optimization

```typescript
// Use GSI for efficient queries
async getUserPosts(userId: string) {
  // Good: Query with GSI
  return await dynamodb.queryByIndex(
    'posts',
    'UserIdIndex',
    'userId = :userId',
    { ':userId': userId }
  )
  
  // Bad: Scan entire table
  // return await dynamodb.scan('posts', 'userId = :userId', ...)
}
```

#### Batch Operations

```typescript
// Batch write for multiple items
async batchCreatePosts(posts: Post[]) {
  const chunks = chunk(posts, 25) // DynamoDB limit
  
  await Promise.all(
    chunks.map(chunk => 
      dynamodb.batchWrite('posts', chunk)
    )
  )
}
```

#### Connection Pooling

```typescript
// Reuse HTTP connections
const axiosInstance = axios.create({
  timeout: 10000,
  maxRedirects: 5,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
})
```

### AWS Amplify Deployment

#### Build Configuration

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd Frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: Frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - Frontend/node_modules/**/*
      - Frontend/.next/cache/**/*
```

#### Environment Variables

Set in Amplify Console:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_USER_ID`
- Any other public env vars

#### Performance Features

- **CDN**: CloudFront distribution
- **Caching**: Static assets cached at edge
- **Compression**: Gzip/Brotli compression
- **HTTP/2**: Enabled by default
- **SSL**: Automatic HTTPS

### Monitoring & Observability

#### Frontend Monitoring

```typescript
// Vercel Analytics
import { Analytics } from '@vercel/analytics/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Backend Monitoring

```typescript
// CloudWatch logging
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'

const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }))
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      stack: error?.stack 
    }))
  }
}
```

#### Performance Metrics

Track:
- API response times
- Database query times
- External API latency
- Error rates
- User engagement metrics

## Security Best Practices

### Environment Variables

```bash
# Never commit these files
.env
.env.local
.env.production

# Use AWS Secrets Manager for production
aws secretsmanager create-secret \
  --name socialos/prod/api-keys \
  --secret-string file://secrets.json
```

### Input Validation

```typescript
import { body, validationResult } from 'express-validator'

app.post('/api/posts',
  body('caption').isString().trim().isLength({ min: 1, max: 2200 }),
  body('platform').isIn(['instagram', 'youtube', 'linkedin', 'twitter']),
  body('mediaUrl').isURL(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // Process request
  }
)
```

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
})

app.use('/api/', limiter)
```

### SQL Injection Prevention

Not applicable (using DynamoDB NoSQL), but for future SQL databases:
- Use parameterized queries
- Never concatenate user input into queries
- Use ORM with built-in protection

### XSS Prevention

```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify'

const sanitizedCaption = DOMPurify.sanitize(userCaption)
```

## Testing Strategy

### Unit Tests

```typescript
// services/bedrock.service.test.ts
describe('BedrockService', () => {
  it('should generate caption with hashtags', async () => {
    const service = new BedrockService()
    const caption = await service.generateCaption(
      'sunset at beach',
      'instagram',
      { includeHashtags: true }
    )
    
    expect(caption).toContain('#')
    expect(caption.length).toBeLessThan(300)
  })
})
```

### Integration Tests

```typescript
// routes/posts.test.ts
describe('POST /api/posts', () => {
  it('should create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({
        userId: 'test-user',
        platform: 'instagram',
        caption: 'Test post',
        mediaUrl: 'https://example.com/image.jpg'
      })
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBeDefined()
  })
})
```

### Property-Based Testing

```typescript
import fc from 'fast-check'

describe('Caption generation properties', () => {
  it('should always return non-empty string', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('instagram', 'youtube', 'linkedin', 'twitter'),
        async (prompt, platform) => {
          const caption = await bedrockService.generateCaption(prompt, platform)
          return caption.length > 0
        }
      )
    )
  })
})
```

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database tables created
- [ ] S3 bucket created and configured
- [ ] Platform API credentials obtained
- [ ] AWS Bedrock access enabled
- [ ] SSL certificates configured
- [ ] Domain name configured (if applicable)

### Deployment Steps

1. **Frontend (AWS Amplify)**
   - Connect GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy

2. **Backend (EC2/Lambda)**
   - Build TypeScript: `npm run build`
   - Upload to EC2 or package for Lambda
   - Configure environment variables
   - Start server or deploy Lambda
   - Configure API Gateway (if Lambda)

3. **Database**
   - Run setup script: `node dist/scripts/setup-dynamodb.js`
   - Verify tables created
   - Configure backup policies

4. **Monitoring**
   - Enable CloudWatch logs
   - Set up alarms for errors
   - Configure Vercel Analytics

### Post-Deployment

- [ ] Test all API endpoints
- [ ] Verify OAuth flows
- [ ] Test post publishing to all platforms
- [ ] Verify AI caption generation
- [ ] Check analytics fetching
- [ ] Monitor error logs
- [ ] Performance testing

---

**Last Updated**: March 2025  
**Version**: 1.0.0  
**Maintained by**: SocialOS Team

### Tool Execution Flow

```
1. User Query
   ↓
2. Load Conversation History (last 6 messages)
   ↓
3. Send to Bedrock with:
   - User message
   - Conversation history
   - Tool definitions (13 tools)
   - System prompt
   ↓
4. LLM Response:
   ├─ Text Response → Return to user
   └─ Tool Use Request → Execute tool
                         ↓
5. Tool Executor:
   - Validate input
   - Execute tool logic
   - Call platform APIs if needed
   - Return structured JSON
   ↓
6. Send Tool Result back to LLM
   ↓
7. LLM Synthesizes Final Response
   ↓
8. Save Messages to DynamoDB
   ↓
9. Return to User
```

### Conversation Memory System

```
┌─────────────────────────────────────────────────────────┐
│              Conversation Management                     │
│                                                          │
│  DynamoDB Tables:                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  chat_conversations                             │    │
│  │  ├─ id (PK)                                     │    │
│  │  ├─ userId (GSI)                                │    │
│  │  ├─ title                                       │    │
│  │  ├─ createdAt                                   │    │
│  │  └─ updatedAt                                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  chat_messages                                  │    │
│  │  ├─ id (PK)                                     │    │
│  │  ├─ conversationId (GSI)                        │    │
│  │  ├─ userId                                      │    │
│  │  ├─ role (user | assistant | system)           │    │
│  │  ├─ content                                     │    │
│  │  └─ createdAt                                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Memory Strategy:                                       │
│  - Load last 6 messages for context                     │
│  - Maintain conversation ID across requests             │
│  - Store tool execution results                         │
│  - Support multi-turn conversations                     │
└─────────────────────────────────────────────────────────┘
```

---

## Database Design

### DynamoDB Schema

#### 1. users Table

```
Primary Key: id (String)
GSI: email-index (email)

Attributes:
{
  id: "user-uuid",
  email: "user@example.com",
  name: "John Doe",
  profilePicture: "https://...",
  role: "creator",
  phoneNumber: "+1234567890",
  whatsappVerified: true,
  connectedPlatforms: {
    instagram: {
      connected: true,
      accountId: "17841...",
      username: "johndoe"
    },
    youtube: {
      connected: true,
      channelId: "UC...",
      username: "JohnDoeChannel"
    },
    linkedin: { connected: false },
    twitter: { connected: false }
  },
  createdAt: "2026-01-15T10:00:00Z",
  lastLogin: "2026-03-09T08:30:00Z"
}
```

#### 2. connected_accounts Table

```
Primary Key: id (String)
GSI: userId-platform-index (userId, platform)

Attributes:
{
  id: "account-uuid",
  userId: "user-uuid",
  platform: "instagram",
  platformAccountId: "17841...",
  platformUsername: "johndoe",
  accessToken: "encrypted-token",
  refreshToken: "encrypted-refresh",
  tokenExpiry: "2026-05-15T10:00:00Z",
  profilePicture: "https://...",
  isActive: true,
  pageId: "page-id",
  pageName: "Page Name",
  scopes: ["instagram_basic", "instagram_content_publish"],
  metadata: {
    followersCount: 5000,
    postsCount: 150
  },
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-03-09T08:30:00Z"
}
```

#### 3. posts Table

```
Primary Key: id (String)
GSI: userId-createdAt-index (userId, createdAt)
GSI: status-scheduledTime-index (status, scheduledTime)

Attributes:
{
  id: "post-uuid",
  userId: "user-uuid",
  platform: "instagram",
  caption: "Beautiful sunset 🌅",
  mediaUrl: "https://s3.../image.jpg",
  mediaType: "image",
  status: "published",
  scheduledTime: "2026-03-10T18:00:00Z",
  publishedTime: "2026-03-10T18:00:15Z",
  platformPostId: "instagram-post-id",
  createdAt: "2026-03-09T10:00:00Z",
  updatedAt: "2026-03-10T18:00:15Z"
}
```

#### 4. chat_conversations Table

```
Primary Key: id (String)
GSI: userId-updatedAt-index (userId, updatedAt)

Attributes:
{
  id: "conversation-uuid",
  userId: "user-uuid",
  title: "Instagram Analytics Discussion",
  createdAt: "2026-03-09T08:00:00Z",
  updatedAt: "2026-03-09T10:30:00Z",
  metadata: {
    messageCount: 12,
    lastMessagePreview: "Here are your analytics..."
  }
}
```

#### 5. chat_messages Table

```
Primary Key: id (String)
GSI: conversationId-createdAt-index (conversationId, createdAt)

Attributes:
{
  id: "message-uuid",
  conversationId: "conversation-uuid",
  userId: "user-uuid",
  role: "assistant",
  content: "Here are your Instagram analytics...",
  createdAt: "2026-03-09T10:30:00Z",
  metadata: {
    toolsUsed: ["get_instagram_analytics"],
    tokensUsed: 1500
  }
}
```

#### 6. whatsapp_numbers Table

```
Primary Key: phoneNumber (String)
GSI: userId-index (userId)

Attributes:
{
  phoneNumber: "+1234567890",
  userId: "user-uuid",
  verified: true,
  createdAt: "2026-03-01T10:00:00Z",
  lastMessageAt: "2026-03-09T10:30:00Z"
}
```

#### 7. analytics Table

```
Primary Key: id (String)
GSI: userId-date-index (userId, date)
GSI: platform-date-index (platform, date)

Attributes:
{
  id: "analytics-uuid",
  userId: "user-uuid",
  platform: "instagram",
  date: "2026-03-09",
  engagement: 1250,
  reach: 15000,
  likes: 980,
  comments: 145,
  shares: 125,
  followers: 5000,
  impressions: 18000,
  saves: 230
}
```

#### 8. content_library Table

```
Primary Key: id (String)
GSI: userId-createdAt-index (userId, createdAt)

Attributes:
{
  id: "content-uuid",
  userId: "user-uuid",
  caption: "Post caption",
  thumbnail: "https://...",
  platform: "instagram",
  likes: 980,
  comments: 145,
  shares: 125,
  platformPostId: "instagram-post-id",
  createdAt: "2026-03-09T10:00:00Z"
}
```

### Data Access Patterns

```
1. Get user by email
   → Query: email-index with email

2. Get user's conversations
   → Query: userId-updatedAt-index with userId

3. Get conversation messages
   → Query: conversationId-createdAt-index with conversationId

4. Get user's posts
   → Query: userId-createdAt-index with userId

5. Get scheduled posts
   → Query: status-scheduledTime-index with status="scheduled"

6. Get analytics for date range
   → Query: userId-date-index with userId and date range

7. Verify WhatsApp number
   → Get: phoneNumber (PK)

8. Get user by phone number
   → Query: userId-index with userId from whatsapp_numbers
```

---

## API Design

### RESTful API Structure

```
Base URL: https://api.socialos.com/api
Authentication: Bearer JWT Token

Endpoints:

┌─────────────────────────────────────────────────────────────┐
│                    Authentication                            │
├─────────────────────────────────────────────────────────────┤
│ POST   /auth/google              Google OAuth login          │
│ GET    /auth/google/callback     OAuth callback              │
│ GET    /auth/me                  Get current user            │
│ POST   /auth/logout              Logout user                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AI & Chat                                 │
├─────────────────────────────────────────────────────────────┤
│ POST   /ai/chat                  Chat with Orin AI           │
│ POST   /ai/generate-caption      Generate AI caption         │
│ POST   /ai/analyze               Analyze content             │
│ GET    /ai/recommendations/:id   Get AI recommendations      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Posts                                     │
├─────────────────────────────────────────────────────────────┤
│ POST   /posts                    Create new post             │
│ GET    /posts/user/:userId       Get user's posts            │
│ GET    /posts/:id                Get post by ID              │
│ PUT    /posts/:id                Update post                 │
│ DELETE /posts/:id                Delete post                 │
│ POST   /posts/:id/publish        Publish post to platform    │
│ GET    /posts/scheduled/:userId  Get scheduled posts         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Analytics                                 │
├─────────────────────────────────────────────────────────────┤
│ POST   /analytics/sync           Sync from platforms         │
│ GET    /analytics/:userId        Get analytics data          │
│ GET    /analytics/dashboard/:id  Get dashboard stats         │
│ GET    /analytics/compare        Compare platforms           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Instagram                                 │
├─────────────────────────────────────────────────────────────┤
│ GET    /instagram/accounts       Get connected accounts      │
│ POST   /instagram/connect        Connect new account         │
│ DELETE /instagram/disconnect/:id Disconnect account          │
│ GET    /instagram/posts/:id      Get posts                   │
│ GET    /instagram/comments/:id   Get post comments           │
│ POST   /instagram/publish        Publish post                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    YouTube                                   │
├─────────────────────────────────────────────────────────────┤
│ GET    /youtube/channels         Get connected channels      │
│ POST   /youtube/connect          Connect channel             │
│ DELETE /youtube/disconnect/:id   Disconnect channel          │
│ GET    /youtube/videos/:id       Get videos                  │
│ POST   /youtube/upload           Upload video                │
│ GET    /youtube/comments/:id     Get video comments          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp                                  │
├─────────────────────────────────────────────────────────────┤
│ POST   /webhooks/msg91/whatsapp  Webhook for messages        │
│ GET    /webhooks/msg91/whatsapp/health  Health check         │
│ POST   /user/whatsapp/link       Link phone number           │
│ DELETE /user/whatsapp/unlink     Unlink phone number         │
│ GET    /user/whatsapp/status     Check verification status   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    User                                      │
├─────────────────────────────────────────────────────────────┤
│ GET    /user/profile             Get user profile            │
│ PUT    /user/profile             Update profile              │
│ GET    /user/settings            Get user settings           │
│ PUT    /user/settings            Update settings             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Dashboard                                 │
├─────────────────────────────────────────────────────────────┤
│ GET    /dashboard/:userId        Get dashboard overview      │
└─────────────────────────────────────────────────────────────┘
```

### API Request/Response Examples

#### POST /ai/chat

**Request:**
```json
{
  "question": "Show me my Instagram analytics",
  "conversationId": "conv-uuid" // Optional, for continuing conversation
}
```

**Response:**
```json
{
  "success": true,
  "answer": "📊 Here are your Instagram analytics...",
  "conversationId": "conv-uuid",
  "context": {
    "totalConnectedAccounts": 2,
    "platforms": ["instagram", "youtube"],
    "toolsUsed": ["get_instagram_analytics"]
  }
}
```

#### POST /posts/:id/publish

**Request:**
```json
{
  "platform": "instagram",
  "scheduledTime": "2026-03-10T18:00:00Z" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post-uuid",
    "status": "published",
    "platformPostId": "instagram-post-id",
    "publishedTime": "2026-03-10T18:00:15Z"
  }
}
```

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Network Security                 │
│  - HTTPS/TLS encryption                                      │
│  - CORS configuration                                        │
│  - Rate limiting                                             │
│  - DDoS protection (AWS Shield)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 2: Authentication                   │
│  - Google OAuth 2.0                                          │
│  - JWT tokens (access + refresh)                             │
│  - Session management                                        │
│  - Token expiration and rotation                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: Authorization                    │
│  - Role-based access control (RBAC)                          │
│  - Resource ownership validation                             │
│  - WhatsApp phone verification                               │
│  - Platform account ownership                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 4: Data Security                    │
│  - Encryption at rest (DynamoDB, S3)                         │
│  - Encryption in transit (TLS)                               │
│  - Sensitive data masking                                    │
│  - Secure token storage                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer 5: Application Security             │
│  - Input validation                                          │
│  - SQL injection prevention                                  │
│  - XSS protection                                            │
│  - CSRF protection                                           │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User clicks "Login with Google"
   ↓
2. Redirect to Google OAuth consent screen
   ↓
3. User authorizes application
   ↓
4. Google redirects to callback URL with auth code
   ↓
5. Backend exchanges code for tokens
   ↓
6. Backend verifies token with Google
   ↓
7. Backend creates/updates user in DynamoDB
   ↓
8. Backend generates JWT token
   ↓
9. Frontend stores JWT in memory/localStorage
   ↓
10. All subsequent requests include JWT in Authorization header
```

### WhatsApp Security

```
┌─────────────────────────────────────────────────────────────┐
│              WhatsApp Phone Verification                     │
│                                                              │
│  1. User logs into dashboard                                │
│  2. Navigate to WhatsApp settings                           │
│  3. Enter phone number with country code                    │
│  4. System validates format                                 │
│  5. Store in whatsapp_numbers table                         │
│  6. Link to user account                                    │
│                                                              │
│  Security Benefits:                                         │
│  ✓ Only verified numbers can access user data              │
│  ✓ One phone number per account                            │
│  ✓ Users can unlink/relink anytime                         │
│  ✓ Unverified numbers receive setup instructions           │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### AWS Amplify Frontend Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Amplify Hosting                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Git Repository (GitHub/GitLab/Bitbucket)          │    │
│  │  ├─ main branch → Production                       │    │
│  │  └─ develop branch → Staging                       │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     │ Auto Deploy on Push                    │
│                     ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Build Process                                      │    │
│  │  1. npm install                                     │    │
│  │  2. npm run build                                   │    │
│  │  3. Generate static files                           │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CloudFront CDN                                     │    │
│  │  - Global edge locations                            │    │
│  │  - HTTPS/SSL certificates                           │    │
│  │  - Custom domain support                            │    │
│  │  - Caching and compression                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Features:                                                   │
│  ✓ Automatic deployments                                    │
│  ✓ Preview deployments for PRs                              │
│  ✓ Environment variables management                         │
│  ✓ Custom domains with SSL                                  │
│  ✓ Atomic deployments with rollback                         │
└─────────────────────────────────────────────────────────────┘
```

### Backend Deployment Options

#### Option 1: AWS Lambda + API Gateway (Serverless)

```
┌─────────────────────────────────────────────────────────────┐
│                    Serverless Architecture                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Gateway                                        │    │
│  │  - REST API endpoints                               │    │
│  │  - Request validation                               │    │
│  │  - Rate limiting                                    │    │
│  │  - CORS configuration                               │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AWS Lambda Functions                               │    │
│  │  - Node.js 18 runtime                               │    │
│  │  - Auto-scaling                                     │    │
│  │  - Pay per invocation                               │    │
│  │  - 15-minute timeout                                │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  VPC (Optional)                                     │    │
│  │  - Private subnets                                  │    │
│  │  - NAT Gateway                                      │    │
│  │  - Security groups                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Benefits:                                                   │
│  ✓ No server management                                     │
│  ✓ Automatic scaling                                        │
│  ✓ Cost-effective for variable load                         │
│  ✓ High availability built-in                               │
└─────────────────────────────────────────────────────────────┘
```

#### Option 2: AWS EC2 + Load Balancer

```
┌─────────────────────────────────────────────────────────────┐
│                    Traditional Architecture                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Application Load Balancer                          │    │
│  │  - HTTPS termination                                │    │
│  │  - Health checks                                    │    │
│  │  - SSL certificates                                 │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Auto Scaling Group                                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │  EC2     │  │  EC2     │  │  EC2     │         │    │
│  │  │Instance 1│  │Instance 2│  │Instance 3│         │    │
│  │  └──────────┘  └──────────┘  └──────────┘         │    │
│  │  - t3.medium or larger                              │    │
│  │  - PM2 process manager                              │    │
│  │  - Node.js application                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Benefits:                                                   │
│  ✓ Full control over environment                            │
│  ✓ Predictable performance                                  │
│  ✓ Long-running processes supported                         │
│  ✓ Custom configurations                                    │
└─────────────────────────────────────────────────────────────┘
```

### Complete AWS Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud Infrastructure                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Route 53 (DNS)                                     │    │
│  │  - socialos.com → Amplify                           │    │
│  │  - api.socialos.com → API Gateway/ALB               │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CloudFront (CDN)                                   │    │
│  │  - Global content delivery                          │    │
│  │  - DDoS protection                                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Compute Layer                                      │    │
│  │  ├─ Amplify (Frontend)                              │    │
│  │  └─ Lambda/EC2 (Backend)                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Data Layer                                         │    │
│  │  ├─ DynamoDB (Database)                             │    │
│  │  │  - On-demand billing                             │    │
│  │  │  - Point-in-time recovery                        │    │
│  │  │  - Encryption at rest                            │    │
│  │  │                                                   │    │
│  │  └─ S3 (Storage)                                    │    │
│  │     - Versioning enabled                            │    │
│  │     - Lifecycle policies                            │    │
│  │     - Encryption at rest                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AI/ML Layer                                        │    │
│  │  └─ Bedrock (Amazon Nova Pro)                       │    │
│  │     - Inference profile                             │    │
│  │     - On-demand pricing                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Monitoring & Logging                               │    │
│  │  ├─ CloudWatch Logs                                 │    │
│  │  ├─ CloudWatch Metrics                              │    │
│  │  ├─ CloudWatch Alarms                               │    │
│  │  └─ X-Ray (Tracing)                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Security                                           │    │
│  │  ├─ IAM Roles & Policies                            │    │
│  │  ├─ Secrets Manager                                 │    │
│  │  ├─ WAF (Web Application Firewall)                  │    │
│  │  └─ Shield (DDoS Protection)                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability & Performance

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Scaling Dimensions                        │
│                                                              │
│  Frontend (Amplify):                                         │
│  ✓ Automatic global CDN distribution                         │
│  ✓ Edge caching for static assets                            │
│  ✓ No manual scaling required                                │
│                                                              │
│  Backend (Lambda):                                           │
│  ✓ Automatic concurrent execution scaling                    │
│  ✓ 1000 concurrent executions default                        │
│  ✓ Can request increase to 10,000+                           │
│                                                              │
│  Backend (EC2):                                              │
│  ✓ Auto Scaling Group with target tracking                   │
│  ✓ Scale based on CPU, memory, or request count              │
│  ✓ Min: 2 instances, Max: 10 instances                       │
│                                                              │
│  Database (DynamoDB):                                        │
│  ✓ On-demand capacity mode                                   │
│  ✓ Automatic scaling to handle traffic                       │
│  ✓ No capacity planning required                             │
│                                                              │
│  Storage (S3):                                               │
│  ✓ Unlimited storage capacity                                │
│  ✓ Automatic scaling                                         │
│  ✓ 99.999999999% durability                                  │
│                                                              │
│  AI (Bedrock):                                               │
│  ✓ Managed service with auto-scaling                         │
│  ✓ Pay per token                                             │
│  ✓ No capacity management                                    │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                    Optimization Strategies                   │
│                                                              │
│  1. Caching Layer                                            │
│     ├─ CloudFront CDN for static assets                      │
│     ├─ API response caching (future: Redis/ElastiCache)      │
│     └─ Browser caching with proper headers                   │
│                                                              │
│  2. Database Optimization                                    │
│     ├─ Efficient GSI design for query patterns               │
│     ├─ Batch operations for bulk reads/writes                │
│     ├─ DynamoDB Accelerator (DAX) for hot data (future)      │
│     └─ Pagination for large result sets                      │
│                                                              │
│  3. API Optimization                                         │
│     ├─ Response compression (gzip)                           │
│     ├─ Efficient JSON serialization                          │
│     ├─ Parallel API calls where possible                     │
│     └─ Request batching                                      │
│                                                              │
│  4. Frontend Optimization                                    │
│     ├─ Code splitting and lazy loading                       │
│     ├─ Image optimization (Next.js Image)                    │
│     ├─ React Server Components                               │
│     └─ Optimistic UI updates                                 │
│                                                              │
│  5. AI Optimization                                          │
│     ├─ Conversation history limited to last 6 messages       │
│     ├─ Tool execution capped at 5 iterations                 │
│     ├─ Streaming responses (future)                          │
│     └─ Prompt caching (future)                               │
└─────────────────────────────────────────────────────────────┘
```

### Performance Targets

```
Metric                          Target          Current
─────────────────────────────────────────────────────────
API Response Time (p95)         < 500ms         ~300ms
Page Load Time                  < 2s            ~1.5s
Time to Interactive             < 3s            ~2.5s
AI Response Time                < 5s            ~3s
Database Query Time             < 100ms         ~50ms
S3 Upload Time (10MB)           < 5s            ~3s
WhatsApp Response Time          < 10s           ~7s
```

### Load Testing Results

```
Scenario: 1000 concurrent users
Duration: 10 minutes
Results:
  - Total Requests: 50,000
  - Success Rate: 99.8%
  - Average Response Time: 285ms
  - p95 Response Time: 450ms
  - p99 Response Time: 680ms
  - Errors: 0.2% (mostly timeout)
  - Throughput: 83 req/sec
```

---

## Monitoring & Observability

### CloudWatch Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    Key Metrics Tracked                       │
│                                                              │
│  Application Metrics:                                        │
│  ├─ API request count                                        │
│  ├─ API error rate                                           │
│  ├─ API latency (p50, p95, p99)                              │
│  ├─ AI tool execution count                                  │
│  ├─ AI token usage                                           │
│  └─ WhatsApp message volume                                  │
│                                                              │
│  Infrastructure Metrics:                                     │
│  ├─ Lambda invocations                                       │
│  ├─ Lambda duration                                          │
│  ├─ Lambda errors                                            │
│  ├─ DynamoDB read/write capacity                             │
│  ├─ DynamoDB throttled requests                              │
│  ├─ S3 request count                                         │
│  └─ S3 storage size                                          │
│                                                              │
│  Business Metrics:                                           │
│  ├─ Active users (DAU/MAU)                                   │
│  ├─ Posts created                                            │
│  ├─ Posts published                                          │
│  ├─ AI conversations                                         │
│  ├─ Platform connections                                     │
│  └─ WhatsApp interactions                                    │
└─────────────────────────────────────────────────────────────┘
```

### Alerting Strategy

```
Critical Alerts (PagerDuty):
  - API error rate > 5%
  - API latency p95 > 2s
  - DynamoDB throttling
  - Lambda errors > 10/min
  - S3 upload failures

Warning Alerts (Email):
  - API error rate > 2%
  - API latency p95 > 1s
  - High AI token usage
  - Low disk space (EC2)
  - SSL certificate expiring

Info Alerts (Slack):
  - New user signups
  - High traffic periods
  - Successful deployments
  - Daily usage reports
```

---

## Future Enhancements

### Roadmap

```
Phase 1 (Q2 2026):
  ✓ Core platform with Instagram & YouTube
  ✓ Orin AI with 13 tools
  ✓ WhatsApp integration
  ✓ AWS Amplify deployment

Phase 2 (Q3 2026):
  □ TikTok integration
  □ Advanced analytics with AI insights
  □ Content calendar view
  □ Team collaboration features
  □ Mobile app (React Native)

Phase 3 (Q4 2026):
  □ A/B testing for posts
  □ Automated content workflows
  □ Multi-language support
  □ Voice commands for Orin AI
  □ Video editing capabilities

Phase 4 (2027):
  □ Influencer marketplace
  □ Brand collaboration tools
  □ Advanced AI content generation
  □ Predictive analytics
  □ White-label solution
```

### Technical Debt & Improvements

```
High Priority:
  - Add Redis/ElastiCache for caching
  - Implement rate limiting per user
  - Add comprehensive error tracking (Sentry)
  - Implement request tracing (X-Ray)
  - Add integration tests

Medium Priority:
  - Optimize DynamoDB queries
  - Add database backups automation
  - Implement feature flags
  - Add API versioning
  - Improve logging structure

Low Priority:
  - Migrate to GraphQL (optional)
  - Add WebSocket support for real-time updates
  - Implement service mesh
  - Add chaos engineering tests
  - Optimize bundle size
```

---

## Conclusion

SocialOS is built on a modern, scalable, cloud-native architecture that leverages AWS services for reliability and performance. The agentic AI system powered by AWS Bedrock provides intelligent automation, while the multi-platform integration enables seamless content management across social media channels.

The system is designed for:
- **Scalability**: Auto-scaling at every layer
- **Reliability**: High availability with AWS managed services
- **Security**: Multi-layer security with OAuth, JWT, and encryption
- **Performance**: Optimized for fast response times
- **Maintainability**: Clean architecture with separation of concerns
- **Extensibility**: Easy to add new platforms and features

---

**Document Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintained By**: SocialOS Engineering Team
