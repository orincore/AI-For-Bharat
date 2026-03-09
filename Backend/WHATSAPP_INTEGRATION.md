# WhatsApp Integration via MSG91

## Overview

Orin AI now supports WhatsApp messaging through MSG91's WhatsApp Cloud API. Users can interact with Orin AI directly via WhatsApp, with full access to all features including analytics, posting, and content generation.

**🔒 Security Feature:** Users must link their WhatsApp number in the dashboard before they can access their account data via WhatsApp. This ensures that only authorized phone numbers can retrieve sensitive information.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
MSG91_AUTH_KEY=477938AL12N7TG4r69ae8e98P1
MSG91_WHATSAPP_NUMBER=15558335359
MSG91_BASE_URL=https://control.msg91.com/api/v5
```

### MSG91 Dashboard Setup

1. **Configure Webhook in MSG91 Dashboard:**
   - Go to MSG91 Dashboard → WhatsApp → Webhook (New)
   - Create a new webhook with the following settings:
     - **Webhook Name:** Orin AI Inbound Messages
     - **Service:** WhatsApp
     - **Event:** On Inbound Message
     - **Method:** POST
     - **URL:** `https://your-backend-domain.com/webhooks/msg91/whatsapp`
     - **Content-Type:** JSON

2. **Select Webhook Parameters:**
   - Enable the following fields in the webhook payload:
     - `customer_number`
     - `content`
     - `message_type`
     - `direction`
     - `integrated_number`
     - `message_uuid`
     - `text`

## Architecture

### Components

1. **MSG91 Service** (`src/services/msg91.service.ts`)
   - Handles sending WhatsApp messages
   - Parses inbound webhook payloads
   - Supports text and template messages

2. **WhatsApp Controller** (`src/controllers/whatsapp.controller.ts`)
   - Processes incoming messages from MSG91 webhook
   - Creates/retrieves WhatsApp users automatically
   - Routes messages through Orin AI pipeline
   - Sends AI responses back via WhatsApp

3. **WhatsApp Routes** (`src/routes/whatsapp.routes.ts`)
   - `POST /webhooks/msg91/whatsapp` - Main webhook endpoint
   - `GET /webhooks/msg91/whatsapp/health` - Health check

### Message Flow

```
User sends WhatsApp message
    ↓
MSG91 receives message
    ↓
MSG91 webhook → POST /webhooks/msg91/whatsapp
    ↓
WhatsApp Controller:
  - Parse message
  - Get/create user by phone number
  - Get/create conversation
  - Load conversation history
  - Process through Orin AI (with tool execution)
  - Save AI response
  - Send response via MSG91
    ↓
User receives AI response on WhatsApp
```

## Features

### Automatic User Management

- WhatsApp users are automatically created when they first message
- Users are identified by phone number
- Each user gets a persistent conversation with memory
- User format: `whatsapp_<phone_number>@orin.ai`

### Full Orin AI Capabilities

WhatsApp users have access to all Orin AI features:

1. **Analytics Queries**
   - "Show me my Instagram analytics"
   - "What's my YouTube performance?"
   - "Get all analytics summary"

2. **Comment Management**
   - "What was the last comment on my Instagram?"
   - "Show me top 10 comments"
   - "List recent YouTube comments"

3. **Content Generation**
   - "Generate a caption for my post"
   - "Create content ideas"

4. **General Research**
   - "Tell me about social media trends"
   - Any general knowledge questions

### Conversation Memory

- Each WhatsApp user maintains conversation history
- Last 6 messages are used for context
- Conversations persist across sessions
- Memory stored in DynamoDB

## API Endpoints

### Webhook Endpoint

**POST** `/webhooks/msg91/whatsapp`

Receives inbound messages from MSG91.

**Expected Payload:**
```json
{
  "customer_number": "919876543210",
  "content": {},
  "message_type": "text",
  "direction": "inbound",
  "integrated_number": "15558335359",
  "message_uuid": "abc123",
  "text": "Hello Orin AI"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "abc123"
}
```

### Health Check

**GET** `/webhooks/msg91/whatsapp/health`

Verify webhook is operational.

**Response:**
```json
{
  "success": true,
  "service": "WhatsApp Webhook",
  "timestamp": "2026-03-09T09:00:00.000Z"
}
```

## Testing

### 1. Test Webhook Connectivity

```bash
curl -X GET https://your-backend-domain.com/webhooks/msg91/whatsapp/health
```

### 2. Test Inbound Message Processing

Send a WhatsApp message to your MSG91 integrated number (15558335359) and check backend logs:

```
📱 Received WhatsApp webhook: {...}
💬 Processing message from 919876543210: "Hello"
👤 Found existing user for 919876543210
💬 Found existing conversation: abc-123
🤖 Processing message through Orin AI...
📤 Sending AI response back to WhatsApp...
✅ WhatsApp message processed successfully
```

### 3. Test AI Capabilities

Try these messages via WhatsApp:
- "Show me my Instagram analytics"
- "What was my last comment?"
- "Generate a caption for my post"
- "Tell me about social media trends"

## Troubleshooting

### Webhook Not Receiving Messages

1. Verify webhook URL is publicly accessible
2. Check MSG91 dashboard webhook status
3. Ensure webhook is not paused (auto-pause feature)
4. Check backend logs for incoming requests

### Messages Not Being Sent

1. Verify MSG91 credentials in `.env`
2. Check if WhatsApp session is active (24-hour window)
3. For first message, may need to use template message
4. Check MSG91 API logs in dashboard

### User Creation Issues

1. Check DynamoDB `users` table permissions
2. Verify table prefix in environment variables
3. Check backend logs for error messages

### Conversation Memory Not Working

1. Verify `chat_conversations` and `chat_messages` tables exist
2. Check DynamoDB indexes (UserIdUpdatedAtIndex)
3. Ensure conversation IDs are being persisted

## Limitations

1. **24-Hour Session Window:** After a template message initiates conversation, you have 24 hours to send custom messages
2. **Template Messages:** First message to user must use approved template
3. **Media Support:** Currently supports text messages (media support can be added)
4. **Rate Limits:** Subject to MSG91 API rate limits

## Future Enhancements

- [ ] Media message support (images, videos)
- [ ] Interactive buttons and lists
- [ ] Template message management
- [ ] Broadcast messaging
- [ ] WhatsApp Business Profile integration
- [ ] Rich media responses (cards, carousels)

## Security

### Phone Number Verification

**Required Setup:** Users must link their WhatsApp number in the dashboard before accessing data via WhatsApp.

**How it works:**
1. User logs into dashboard and navigates to WhatsApp settings
2. User enters their WhatsApp number (with country code)
3. System validates and links the number to their account
4. Only messages from this verified number will receive responses with user data

**Security Benefits:**
- ✅ Prevents unauthorized access to user data via WhatsApp
- ✅ One phone number per account (prevents sharing)
- ✅ Users can unlink/relink numbers anytime
- ✅ Unverified numbers receive a message directing them to link their number

### API Security

- Webhook endpoint is public but validates MSG91 payload structure
- Phone number verification required before data access
- User phone numbers are stored securely in DynamoDB
- All API calls use HTTPS
- Auth key is stored in environment variables
- JWT authentication for dashboard API endpoints

### User Management API

**Link WhatsApp Number:**
```bash
POST /api/user/whatsapp/link
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

**Unlink WhatsApp Number:**
```bash
DELETE /api/user/whatsapp/unlink
Authorization: Bearer <token>
```

**Check WhatsApp Status:**
```bash
GET /api/user/whatsapp/status
Authorization: Bearer <token>
```

## Support

For issues or questions:
- Check backend logs: `npm run dev` in Backend/
- Review MSG91 dashboard for webhook delivery status
- Verify DynamoDB tables and data
- Test with health check endpoint first
