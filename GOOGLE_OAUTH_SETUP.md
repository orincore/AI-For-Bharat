# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Social Media Management Platform.

## Prerequisites

- Google Cloud Console account
- Backend and Frontend applications running locally

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Project name: `SocialOS` or your preferred name
4. Click "Create"

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in the required information:
   - **App name**: SocialOS
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Add: `userinfo.email`
   - Add: `userinfo.profile`
7. Click "Save and Continue"
8. **Test users** (for development):
   - Add your Google account email
   - Add any other test user emails
9. Click "Save and Continue"
10. Review and click "Back to Dashboard"

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `SocialOS Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:3001`
6. **Authorized redirect URIs**:
   - `http://localhost:3001/api/auth/google/callback`
7. Click "Create"
8. **Save your credentials**:
   - Client ID: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-AbCdEfGhIjKlMnOpQrStUv`

## Step 4: Update Backend Environment Variables

Edit `Backend/.env`:

```env
# Authentication
JWT_SECRET=your-secure-random-jwt-secret-key-min-32-chars
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUv

# Server URLs
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

**Important**: Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Update Frontend Environment Variables

Edit `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Step 6: Start the Applications

### Backend
```bash
cd Backend
npm install
npm run build
npm run dev
```

Expected output:
```
🚀 Server is running on port 3001
📍 Environment: development
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

Expected output:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Ready in 2.3s
```

## Step 7: Test the Authentication Flow

1. Open browser: `http://localhost:3000`
2. You should be redirected to `/login`
3. Click "Continue with Google"
4. Select your Google account
5. Grant permissions
6. You should be redirected back to `/dashboard`

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verify the redirect URI in Google Cloud Console exactly matches: `http://localhost:3001/api/auth/google/callback`
- No trailing slashes
- Correct protocol (http vs https)

### Error: "Access blocked: This app's request is invalid"
- Make sure OAuth consent screen is configured
- Add your email as a test user
- Verify scopes are added (userinfo.email, userinfo.profile)

### Error: "Authentication failed"
- Check backend logs for errors
- Verify Google Client ID and Secret are correct
- Ensure DynamoDB users table exists
- Check CORS settings allow frontend URL

### Error: "Invalid or expired token"
- JWT_SECRET must be the same across backend restarts
- Token expires after 7 days by default
- Clear localStorage and login again

## Production Deployment

When deploying to production:

1. **Update OAuth Consent Screen**:
   - Change to "Internal" if using Google Workspace
   - Or complete verification process for "External"

2. **Add Production URLs**:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://api.yourdomain.com/api/auth/google/callback`

3. **Update Environment Variables**:
   ```env
   BACKEND_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   ```

4. **Security Best Practices**:
   - Use strong JWT_SECRET (minimum 32 characters)
   - Enable HTTPS only
   - Set secure cookie flags
   - Implement rate limiting
   - Add CSRF protection

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user (requires auth token)
- `POST /api/auth/logout` - Logout user

### Using the Auth Token

Include the token in API requests:

```javascript
fetch('http://localhost:3001/api/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
```

## Database Schema

The users table in DynamoDB stores:

```typescript
{
  id: string;              // Google user ID
  email: string;           // User email
  name: string;            // Display name
  profilePicture?: string; // Google profile picture URL
  createdAt: string;       // ISO timestamp
  lastLogin: string;       // ISO timestamp
  role: string;            // User role (default: 'user')
}
```

## Next Steps

1. Protect all API routes with `authenticateToken` middleware
2. Implement role-based access control
3. Add email verification (optional)
4. Set up session management
5. Add refresh token rotation
6. Implement account deletion

## Support

For issues:
- Check browser console for errors
- Check backend logs
- Verify all environment variables are set
- Ensure DynamoDB tables are created
- Test with Google OAuth Playground
