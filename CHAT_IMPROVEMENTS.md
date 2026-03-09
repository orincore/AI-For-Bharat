# Chat Memory & UI Improvements

## Overview
This document outlines the improvements made to fix chat memory persistence and enhance the visual presentation of AI responses.

## Issues Fixed

### 1. Chat Memory Issue
**Problem**: The LLM was unable to maintain context between messages. Each message was treated as a new conversation.

**Root Cause**: The frontend was not passing the `conversationId` back to the backend in subsequent messages.

**Solution**:
- Added `conversationId` state tracking in the frontend (`orin-ai-chat.tsx`)
- Modified `handleSendMessage` to include `conversationId` in the request body
- Backend already had conversation persistence implemented, but frontend wasn't utilizing it

**Files Modified**:
- `Frontend/components/dashboard/orin-ai-chat.tsx` (lines 183, 257-260, 266-268)

### 2. Comment Highlighting
**Problem**: Comments and quoted text were displayed as plain text, making them hard to distinguish from regular AI responses.

**Solution**:
- Created `CommentHighlight` interface to structure comment data
- Added regex parsing to extract comments with format: `comment reads: "text"`
- Implemented `CommentHighlightCard` component with:
  - Left border accent in primary color
  - Message circle icon
  - Italic quoted text
  - Author username and timestamp metadata
  - Distinct background color (`bg-primary/5`)

**Files Modified**:
- `Frontend/components/dashboard/orin-ai-chat.tsx` (lines 34-38, 51-52, 85-96, 105-131, 423-429)

### 3. Web Research Tool
**Problem**: Users had to leave Orin AI to get answers to general questions not related to social media.

**Solution**:
- Added `web_research` tool definition to `AVAILABLE_TOOLS`
- Implemented `webResearch` method in `ToolExecutorService` using Serper.dev API
- Provides seamless experience for users to get all information from Orin AI
- Returns structured search results with:
  - Knowledge graph data (if available)
  - Top 5 organic search results
  - Title, snippet, and link for each result

**Files Modified**:
- `Backend/src/types/tools.ts` (lines 212-229)
- `Backend/src/services/tool-executor.service.ts` (lines 54-55, 414-472)
- `Backend/.env` (lines 55-56)

## Visual Improvements

### Comment Display
Comments are now rendered in a visually distinct card with:
```
┌─────────────────────────────────────┐
│ 💬  "Comment text here..."          │
│     @username • Feb 27, 2026        │
└─────────────────────────────────────┘
```

### Post Preview Cards
Posts continue to be displayed with:
- Thumbnail image or placeholder
- Platform badge
- Like and comment counts
- "View post" link

## Configuration Required

### Serper API Key
To enable web research functionality, you need to:
1. Sign up at https://serper.dev
2. Get your API key
3. Add it to `Backend/.env`:
   ```
   SERPER_API_KEY=your_actual_api_key
   ```

Without this key, the web research tool will gracefully fail and inform users that the feature is not configured.

## Testing Checklist

- [x] Backend builds successfully
- [ ] Frontend renders comment highlights correctly
- [ ] Conversation context is maintained across multiple messages
- [ ] Web research tool works when API key is configured
- [ ] Web research tool gracefully handles missing API key
- [ ] Post previews continue to work as before

## Next Steps

1. **Restart Backend**: Run `npm run dev` to start the backend with new changes
2. **Test Conversation Memory**: 
   - Ask: "what last comment i received in my instagram account?"
   - Then ask: "what do you think was this comment positive or negative?"
   - Verify the LLM remembers the previous comment
3. **Test Comment Highlighting**: Verify comments are displayed in the special card format
4. **Test Web Research** (optional): Configure Serper API key and ask a general question
5. **Verify Post Cards**: Ensure post previews still render correctly

## Architecture Notes

### Conversation Flow
```
User Message → Frontend (with conversationId)
              ↓
           Backend AI Controller
              ↓
        Load Prior Messages from DynamoDB
              ↓
        Pass to Bedrock with Context
              ↓
        Save Assistant Response
              ↓
        Return conversationId + Answer
              ↓
        Frontend (stores conversationId for next message)
```

### Content Parsing Flow
```
AI Response Text
    ↓
parseAssistantContent()
    ↓
Extract: Posts, Comments, Clean Text
    ↓
Render: PostPreviewCard, CommentHighlightCard, ReactMarkdown
```
