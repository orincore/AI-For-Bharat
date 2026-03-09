# Agentic Tool System for Orin AI

## Overview

The Orin AI platform now features a comprehensive agentic tool system that allows the LLM to autonomously call backend APIs to fetch analytics, post content, and manage social media accounts. This enables powerful workflows like WhatsApp-to-platform posting where the AI decides which tools to use based on user requests.

## Architecture

### Components

1. **Tool Definitions** (`src/types/tools.ts`)
   - Defines all available tools with schemas
   - Provides type safety for tool inputs/outputs
   - Used by Bedrock Converse API for function calling

2. **Tool Executor Service** (`src/services/tool-executor.service.ts`)
   - Executes tool calls requested by the LLM
   - Handles authentication and data fetching
   - Returns structured JSON responses

3. **Enhanced Bedrock Service** (`src/services/bedrock.service.ts`)
   - Supports Bedrock Converse API with tool calling
   - Manages multi-turn conversations with tool use
   - Handles tool execution loop (up to 5 iterations)

4. **AI Controller** (`src/controllers/ai.controller.ts`)
   - Wires tool executor to LLM responses
   - Provides user context for tool execution

## Available Tools

### Analytics Tools

#### `get_instagram_analytics`
Fetches Instagram analytics including recent posts, engagement metrics, likes, comments, and top performing content.

**Parameters:**
- `limit` (optional): Number of recent posts to fetch (default: 10, max: 50)

**Example Response:**
```json
{
  "success": true,
  "platform": "Instagram",
  "summary": {
    "totalPosts": 30,
    "totalEngagement": 10431,
    "averageEngagement": 348,
    "topPost": {
      "caption": "गणाधिपती २०२५🪷",
      "engagement": 4705
    }
  },
  "posts": [...]
}
```

#### `get_youtube_analytics`
Fetches YouTube analytics including recent videos, views, likes, comments, and top performing videos.

**Parameters:**
- `limit` (optional): Number of recent videos to fetch (default: 10, max: 50)

**Example Response:**
```json
{
  "success": true,
  "platform": "YouTube",
  "summary": {
    "totalVideos": 30,
    "totalViews": 15488,
    "averageViews": 516,
    "topVideo": {
      "title": "A PUBG MOBILE SONG | UMEED KI KIRAN",
      "views": 3139
    }
  },
  "videos": [...]
}
```

#### `get_all_analytics_summary`
Gets a comprehensive summary of analytics across all connected platforms.

**Parameters:** None

**Example Response:**
```json
{
  "success": true,
  "instagram": {
    "totalPosts": 30,
    "totalEngagement": 10431,
    "averageEngagement": 348
  },
  "youtube": {
    "totalVideos": 30,
    "totalViews": 15488,
    "averageViews": 516
  },
  "crossPlatform": {
    "totalContent": 60,
    "platforms": ["Instagram", "YouTube"]
  }
}
```

### Content Posting Tools

#### `post_to_instagram`
Posts an image to Instagram with a caption.

**Parameters:**
- `imageUrl` (required): URL of the image to post (must be publicly accessible)
- `caption` (required): Caption text for the Instagram post

**Example Response:**
```json
{
  "success": true,
  "platform": "Instagram",
  "postId": "123456789",
  "message": "Successfully posted to Instagram"
}
```

#### `post_to_youtube`
Uploads a video to YouTube.

**Parameters:**
- `videoUrl` (required): URL of the video file to upload
- `title` (required): Title of the YouTube video
- `description` (required): Description text for the YouTube video
- `tags` (optional): Array of tags/keywords for the video

**Example Response:**
```json
{
  "success": true,
  "platform": "YouTube",
  "videoId": "abc123xyz",
  "message": "Successfully uploaded to YouTube"
}
```

#### `post_to_multiple_platforms`
Posts content to multiple social media platforms simultaneously.

**Parameters:**
- `platforms` (required): Array of platforms to post to (e.g., ["instagram", "youtube"])
- `content` (required): Object containing content details (imageUrl, videoUrl, caption, title, description, tags)

**Example Response:**
```json
{
  "success": true,
  "results": [
    {
      "platform": "instagram",
      "result": { "success": true, "postId": "123" }
    },
    {
      "platform": "youtube",
      "result": { "success": true, "videoId": "abc" }
    }
  ],
  "message": "Posted to 2 out of 2 platforms"
}
```

### Content Generation Tools

#### `generate_caption`
Generates an AI-optimized caption for social media posts.

**Parameters:**
- `prompt` (required): Brief description or idea for the caption
- `platform` (required): Target platform (Instagram, YouTube, LinkedIn, Twitter)
- `tone` (optional): Desired tone (engaging, professional, casual, inspirational, humorous)

**Example Response:**
```json
{
  "success": true,
  "caption": "🌟 Embrace the journey, not just the destination...",
  "platform": "Instagram"
}
```

### Account Management Tools

#### `get_connected_accounts`
Gets list of all connected social media accounts and their status.

**Parameters:** None

**Example Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "platform": "instagram",
      "username": "ig_orincore",
      "isActive": true,
      "connectedAt": "2024-01-15T10:30:00Z"
    },
    {
      "platform": "youtube",
      "username": "OrinCore",
      "isActive": true,
      "connectedAt": "2024-01-16T14:20:00Z"
    }
  ],
  "totalConnected": 2
}
```

## How It Works

### Agentic Workflow

1. **User sends a question** to the chat endpoint
2. **AI Controller** prepares context and creates tool executor
3. **Bedrock Service** sends request to LLM with tool definitions
4. **LLM decides** which tools to call based on user intent
5. **Tool Executor** executes the requested tools
6. **Results are sent back** to LLM for synthesis
7. **LLM generates** final response with insights
8. **User receives** comprehensive answer with data

### Example Conversation Flow

**User:** "Show me my Instagram analytics"

**LLM Internal Process:**
1. Recognizes need for Instagram data
2. Calls `get_instagram_analytics` tool with limit=10
3. Receives analytics data
4. Synthesizes insights from the data
5. Returns formatted response to user

**User Response:**
```
📊 Instagram Analytics Summary

Your Instagram account has been performing well! Here's what I found:

Total Posts Analyzed: 30
Total Engagement: 10,431 (likes + comments)
Average Engagement per Post: 348

🏆 Top Performing Post:
"गणाधिपती २०२५🪷" with 4,705 total engagements!

📈 Insights:
- Your cultural and artistic content generates the highest engagement
- Posts featuring sculptures and traditional themes resonate strongly with your audience
- Consider creating more content around cultural events and collaborations

Would you like me to analyze specific posts or suggest content strategies?
```

## WhatsApp Integration (Future)

The agentic tool system is designed to support WhatsApp Cloud API integration:

1. User sends message via WhatsApp
2. WhatsApp webhook triggers AI processing
3. LLM autonomously:
   - Fetches analytics if requested
   - Generates captions for content
   - Posts to platforms if media is provided
   - Provides insights and recommendations
4. Response sent back to WhatsApp

## Configuration

### Environment Variables

```bash
# Bedrock Configuration
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
BEDROCK_INFERENCE_PROFILE_ARN=arn:aws:bedrock:us-east-1:xxx:inference-profile/us.amazon.nova-pro-v1:0
BEDROCK_REGION=us-east-1

# OpenAI Fallback (optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Tool Configuration

Tools are defined in `src/types/tools.ts`. To add a new tool:

1. Add tool definition to `AVAILABLE_TOOLS` array
2. Implement tool execution in `ToolExecutorService`
3. Tool will automatically be available to the LLM

## API Endpoints

### Chat with Tool Support

**POST** `/ai/chat`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Body:**
```json
{
  "question": "Show me my top performing Instagram posts"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "📊 Here are your top performing Instagram posts...",
  "context": {
    "totalConnectedAccounts": 2,
    "platforms": ["instagram", "youtube"],
    "totalPosts": 45
  }
}
```

## Testing

### Test Analytics Retrieval

```bash
curl -X POST https://localhost:3443/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are my Instagram analytics?"}'
```

### Test Content Posting

```bash
curl -X POST https://localhost:3443/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Post this image to Instagram: https://example.com/image.jpg with caption: Amazing sunset 🌅"}'
```

### Test Multi-Platform Analytics

```bash
curl -X POST https://localhost:3443/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Compare my Instagram and YouTube performance"}'
```

## Security Considerations

1. **Authentication**: All tool executions require valid JWT authentication
2. **Authorization**: Tools only access data for the authenticated user
3. **Rate Limiting**: Consider implementing rate limits for tool calls
4. **Input Validation**: Tool inputs are validated before execution
5. **Error Handling**: Graceful error responses prevent information leakage

## Performance

- **Max Tool Iterations**: 5 per conversation (prevents infinite loops)
- **Concurrent Tool Calls**: Tools can be called in parallel when possible
- **Caching**: Consider caching analytics data for frequently accessed metrics
- **Timeout**: Each tool execution has a timeout to prevent hanging

## Future Enhancements

1. **More Platforms**: Add LinkedIn, Twitter/X, TikTok support
2. **Advanced Analytics**: Sentiment analysis, trend detection, competitor analysis
3. **Scheduling**: Schedule posts via tool calls
4. **Content Library**: Search and manage content library via tools
5. **A/B Testing**: Test different captions and post times
6. **Automated Workflows**: Create multi-step workflows (e.g., "analyze → generate → post")

## Troubleshooting

### Tool Not Being Called

- Check tool definition schema matches expected input
- Verify tool description clearly explains when to use it
- Ensure LLM has sufficient context to understand user intent

### Tool Execution Errors

- Check authentication tokens are valid
- Verify platform accounts are properly connected
- Review tool executor logs for detailed error messages

### Incomplete Responses

- Increase `maxIterations` if complex multi-tool workflows are needed
- Check if tool responses are properly formatted JSON
- Verify LLM has enough tokens for synthesis

## Support

For issues or questions about the agentic tool system, please refer to:
- Backend logs: Check console for tool execution details
- API documentation: Review endpoint specifications
- Tool definitions: See `src/types/tools.ts` for available tools
