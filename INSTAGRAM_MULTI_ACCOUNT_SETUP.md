# Instagram Multi-Account Setup Guide

This guide explains how to connect and manage multiple Instagram accounts using Google OAuth for user authentication and Instagram OAuth for account connections.

## Features Implemented

✅ **Google OAuth for User Authentication** - Users log in with Google  
✅ **Instagram Multi-Account Support** - Connect multiple Instagram accounts per user  
✅ **New Window OAuth Flow** - Each Instagram connection opens in a new popup window  
✅ **Account Management** - Set active account, disconnect accounts  
✅ **Real-time Updates** - Instant UI updates when accounts are connected  
✅ **Secure Token Storage** - Access tokens stored in DynamoDB, never exposed to frontend  

## Architecture

### Backend
- **Authentication**: JWT tokens from Google OAuth
- **Instagram OAuth**: Separate flow for each Instagram account
- **Storage**: DynamoDB `connected_accounts` table
- **Endpoints**:
  - `GET /api/instagram/connect` - Initiate Instagram OAuth
  - `GET /api/instagram/callback` - Handle OAuth callback
  - `GET /api/instagram/accounts` - List connected accounts
  - `DELETE /api/instagram/accounts/:id` - Disconnect account
  - `PUT /api/instagram/accounts/:id/activate` - Set active account

### Frontend
- **New Window Flow**: Opens Instagram OAuth in popup (600x700px)
- **PostMessage API**: Communicates between popup and main window
- **UI Component**: `InstagramAccounts` in Settings section
- **Auto-close**: Popup closes automatically after successful connection

## Setup Instructions

### 1. Configure Meta App for Instagram OAuth

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create or select your app
3. Add **Instagram Basic Display** product
4. Configure OAuth settings:
   - **Valid OAuth Redirect URIs**:
     - Development: `http://localhost:3001/api/instagram/callback`
     - Production: `https://yourdomain.com/api/instagram/callback`
   - **Deauthorize Callback URL**: `https://yourdomain.com/api/instagram/deauthorize`
   - **Data Deletion Request URL**: `https://yourdomain.com/api/instagram/data-deletion`

5. Add required permissions:
   - `instagram_basic`
   - `instagram_content_publish`

6. Save your credentials:
   - **App ID**: Found in App Settings
   - **App Secret**: Found in App Settings

### 2. Update Backend Environment Variables

Edit `Backend/.env`:

```env
# Meta/Facebook/Instagram API
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here

# Backend and Frontend URLs
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### 3. Verify DynamoDB Table

The `connected_accounts` table should already be created. Verify:

```bash
aws dynamodb describe-table --table-name social_media_connected_accounts --region ap-south-1
```

Schema:
- **Primary Key**: `id` (String)
- **GSI**: `UserPlatformIndex` on `userId` (HASH) + `platform` (RANGE)

### 4. Start the Application

**Backend**:
```bash
cd Backend
npm run dev
```

**Frontend**:
```bash
cd Frontend
npm run dev
```

### 5. Test the Flow

1. **Login with Google**:
   - Navigate to `http://localhost:3000`
   - Click "Continue with Google"
   - Complete Google OAuth
   - You'll be redirected to `/dashboard`

2. **Connect Instagram Account**:
   - Go to Settings (gear icon in sidebar)
   - Scroll to "Instagram Accounts" section
   - Click "Connect Account"
   - A popup window opens with Instagram OAuth
   - Log in to Instagram account #1
   - Grant permissions
   - Popup closes automatically
   - Account appears in the list

3. **Connect Additional Accounts**:
   - Click "Connect Account" again
   - **Important**: The popup opens in a new window context
   - Log out of Instagram in the popup (or use incognito if needed)
   - Log in with Instagram account #2
   - Grant permissions
   - Second account appears in the list

4. **Manage Accounts**:
   - **Set Active**: Click "Set Active" on any account
   - **Disconnect**: Click trash icon to remove an account
   - **View Details**: See username, account ID, active status

## How It Works

### New Window OAuth Flow

The system opens Instagram OAuth in a popup window instead of redirecting the main page:

```typescript
// Frontend opens popup
const width = 600, height = 700;
const left = window.screen.width / 2 - width / 2;
const top = window.screen.height / 2 - height / 2;

window.open(
  authUrl,
  'Instagram OAuth',
  `width=${width},height=${height},left=${left},top=${top}`
);
```

### PostMessage Communication

After successful OAuth, the backend sends a script that posts a message to the opener:

```javascript
window.opener.postMessage({
  type: 'INSTAGRAM_CONNECTED',
  account: { id, username, platformAccountId }
}, frontendUrl);
window.close();
```

Frontend listens for this message:

```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'INSTAGRAM_CONNECTED') {
    // Show success toast
    // Reload accounts list
  }
});
```

### Multiple Accounts Per User

Each user can connect multiple Instagram accounts:

```typescript
interface ConnectedAccount {
  id: string;
  userId: string;              // Links to Google OAuth user
  platform: 'instagram';
  platformAccountId: string;   // Instagram account ID
  platformUsername: string;    // @username
  accessToken: string;         // Long-lived token (60 days)
  tokenExpiry: string;
  isActive: boolean;           // Only one active at a time
}
```

## Token Management

### Access Token Flow

1. **Short-lived token** (1 hour) obtained from OAuth callback
2. **Exchange for long-lived token** (60 days):
   ```
   GET https://graph.instagram.com/access_token
     ?grant_type=ig_exchange_token
     &client_secret={secret}
     &access_token={short_token}
   ```
3. **Store in DynamoDB** with expiry timestamp
4. **Refresh before expiry** (implement token refresh logic as needed)

### Security

- ✅ Access tokens never sent to frontend
- ✅ JWT authentication required for all endpoints
- ✅ User can only access their own connected accounts
- ✅ Tokens encrypted at rest in DynamoDB

## API Reference

### Connect Instagram Account

```http
GET /api/instagram/connect
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "authUrl": "https://api.instagram.com/oauth/authorize?..."
  }
}
```

### Get Connected Accounts

```http
GET /api/instagram/accounts
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "platformAccountId": "17841405793187218",
      "platformUsername": "johndoe",
      "isActive": true,
      "createdAt": "2026-03-08T11:30:00.000Z"
    }
  ]
}
```

### Set Active Account

```http
PUT /api/instagram/accounts/{accountId}/activate
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Active Instagram account updated"
}
```

### Disconnect Account

```http
DELETE /api/instagram/accounts/{accountId}
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Instagram account disconnected successfully"
}
```

## Troubleshooting

### "Redirect URI mismatch"
- Verify `BACKEND_URL` in `.env` matches the redirect URI in Meta App settings
- Must be exact match including protocol (http/https) and port

### "Invalid client_id"
- Check `META_APP_ID` in `.env`
- Verify app is in "Live" mode (not Development mode) in Meta dashboard

### Popup blocked
- Browser may block popups by default
- User must allow popups for your domain
- Add instructions in UI if needed

### Account already connected
- Backend checks for existing account by `platformAccountId`
- Updates token if account already exists
- No duplicate accounts created

### Token expired
- Implement token refresh logic (not included in this version)
- Long-lived tokens last 60 days
- Prompt user to reconnect when expired

## Production Deployment

### Meta App Configuration

1. Switch app to "Live" mode
2. Update redirect URIs to production URLs
3. Complete App Review if needed for additional permissions

### Environment Variables

```env
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
META_APP_ID=production_app_id
META_APP_SECRET=production_app_secret
```

### HTTPS Required

- Instagram OAuth requires HTTPS in production
- Use SSL certificates for your domain
- Update CORS settings to match production URLs

## Next Steps

1. **Token Refresh**: Implement automatic token refresh before expiry
2. **Webhooks**: Set up Instagram webhooks for real-time updates
3. **Rate Limiting**: Add rate limiting to OAuth endpoints
4. **Analytics**: Track which accounts are most used
5. **Bulk Actions**: Post to multiple accounts simultaneously
6. **Account Switching**: Quick switch between accounts in UI

## Support

For issues:
- Check browser console for errors
- Verify all environment variables are set
- Test OAuth flow in Meta App dashboard
- Ensure DynamoDB table exists and has correct schema
- Check backend logs for detailed error messages
