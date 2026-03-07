# Complete API Setup & Database Configuration Guide

This guide will walk you through getting all API credentials and setting up your database step-by-step.

## Table of Contents
1. [AWS Setup (DynamoDB, S3, Bedrock)](#1-aws-setup)
2. [Meta/Instagram API](#2-metainstagram-api)
3. [Twitter/X API](#3-twitterx-api)
4. [LinkedIn API](#4-linkedin-api)
5. [YouTube API](#5-youtube-api)
6. [Environment Configuration](#6-environment-configuration)
7. [Database Setup](#7-database-setup)
8. [Testing Your Setup](#8-testing-your-setup)

---

## 1. AWS Setup

### Step 1.1: Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the registration process (requires credit card, but we'll use free tier)

### Step 1.2: Create IAM User
1. Log into AWS Console
2. Search for "IAM" in the search bar
3. Click "Users" in the left sidebar
4. Click "Create user"
5. Username: `social-media-app-user`
6. Click "Next"
7. Select "Attach policies directly"
8. Search and select these policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonBedrockFullAccess` (or create custom policy if not available)
9. Click "Next" → "Create user"

### Step 1.3: Create Access Keys
1. Click on the user you just created
2. Go to "Security credentials" tab
3. Scroll to "Access keys"
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next" → "Create access key"
7. **IMPORTANT**: Copy both:
   - Access Key ID
   - Secret Access Key
8. Save these securely (you won't see the secret again)

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...
```

### Step 1.4: Install AWS CLI
**macOS:**
```bash
brew install awscli
```

**Windows:**
Download from: https://aws.amazon.com/cli/

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Step 1.5: Configure AWS CLI
```bash
aws configure
```
Enter:
- AWS Access Key ID: [Your Access Key]
- AWS Secret Access Key: [Your Secret Key]
- Default region: `us-east-1`
- Default output format: `json`

### Step 1.6: Enable AWS Bedrock
1. Go to AWS Console → Bedrock
2. Select region: `us-east-1`
3. Click "Model access" in left sidebar
4. Click "Manage model access"
5. Find "Anthropic" → Check "Claude 3 Haiku"
6. Click "Request model access"
7. Wait for approval (usually instant)

### Step 1.7: Create S3 Bucket
```bash
# Create bucket with unique name
aws s3 mb s3://social-media-content-$(date +%s) --region us-east-1

# Note the bucket name, e.g., social-media-content-1709827200
```

Save this bucket name:
```
S3_BUCKET_NAME=social-media-content-1709827200
```

---

## 2. Meta/Instagram API

### Step 2.1: Create Meta Developer Account
1. Go to https://developers.facebook.com
2. Click "Get Started"
3. Log in with your Facebook account
4. Complete the registration

### Step 2.2: Create Meta App
1. Click "My Apps" → "Create App"
2. Select "Business" as app type
3. Click "Next"
4. Fill in:
   - App name: `Social Media Manager`
   - App contact email: [your email]
5. Click "Create App"
6. **Save your App ID and App Secret**

```
META_APP_ID=123456789012345
META_APP_SECRET=abcdef1234567890abcdef1234567890
```

### Step 2.3: Add Instagram Graph API
1. In your app dashboard, find "Add Products"
2. Find "Instagram Graph API"
3. Click "Set Up"

### Step 2.4: Connect Instagram Business Account
**Prerequisites:**
- Instagram account must be a Business or Creator account
- Instagram account must be connected to a Facebook Page

**Steps:**
1. Go to your Instagram app
2. Settings → Account → Switch to Professional Account
3. Choose Business or Creator
4. Connect to a Facebook Page (create one if needed)

### Step 2.5: Get Access Token

**Option A: Using Graph API Explorer (Quick Test)**
1. Go to https://developers.facebook.com/tools/explorer
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Select permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
5. Click "Generate Access Token"
6. Copy the token (this is short-lived)

**Option B: Get Long-Lived Token (Recommended)**
```bash
# Exchange short-lived token for long-lived token
curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

Response will contain:
```json
{
  "access_token": "EAABsbCS1iHgBO...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

Save this:
```
META_ACCESS_TOKEN=EAABsbCS1iHgBO...
```

### Step 2.6: Get Instagram Business Account ID
```bash
# First, get your Facebook Page ID
curl -i -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"

# Then get Instagram Business Account ID
curl -i -X GET "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_ACCESS_TOKEN"
```

Save this:
```
INSTAGRAM_ACCOUNT_ID=17841400008460056
```

---

## 3. Twitter/X API

### Step 3.1: Create Twitter Developer Account
1. Go to https://developer.twitter.com
2. Click "Sign up" or "Apply"
3. Log in with your Twitter account
4. Complete the application:
   - Select "Hobbyist" → "Exploring the API"
   - Describe your use case: "Building a social media management tool"
   - Accept terms

### Step 3.2: Create Project and App
1. Go to Developer Portal: https://developer.twitter.com/en/portal/dashboard
2. Click "Create Project"
3. Fill in:
   - Project name: `Social Media Manager`
   - Use case: `Making a bot`
   - Description: `Social media management and scheduling tool`
4. Click "Next"
5. App name: `Social Media Manager App`
6. Click "Complete"

### Step 3.3: Get API Keys
1. You'll see your API keys immediately
2. **Save these securely:**

```
TWITTER_API_KEY=abcdefghijklmnopqrstuvwx
TWITTER_API_SECRET=1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd
```

### Step 3.4: Generate Access Token and Secret
1. Go to your app settings
2. Click "Keys and tokens" tab
3. Under "Authentication Tokens"
4. Click "Generate" for Access Token and Secret
5. **Save these:**

```
TWITTER_ACCESS_TOKEN=1234567890-AbCdEfGhIjKlMnOpQrStUvWxYz
TWITTER_ACCESS_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### Step 3.5: Get Bearer Token
1. Still in "Keys and tokens" tab
2. Find "Bearer Token"
3. Click "Generate"
4. **Save this:**

```
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAA...
```

### Step 3.6: Enable OAuth 2.0
1. Go to app settings
2. Click "User authentication settings"
3. Click "Set up"
4. Enable OAuth 2.0
5. Type of App: `Web App`
6. Callback URL: `http://localhost:3001/auth/twitter/callback`
7. Website URL: `http://localhost:3000`
8. Click "Save"

### Step 3.7: Get Your User ID
```bash
curl -X GET "https://api.twitter.com/2/users/me" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

Save this:
```
TWITTER_USER_ID=1234567890
```

---

## 4. LinkedIn API

### Step 4.1: Create LinkedIn Developer Account
1. Go to https://www.linkedin.com/developers
2. Click "Create app"
3. Sign in with LinkedIn

### Step 4.2: Create LinkedIn App
1. Fill in app details:
   - App name: `Social Media Manager`
   - LinkedIn Page: Select or create a company page
   - Privacy policy URL: `http://localhost:3000/privacy`
   - App logo: Upload any logo (1000x1000px)
   - Legal agreement: Check the box
2. Click "Create app"

### Step 4.3: Request API Access
1. Go to "Products" tab
2. Find "Share on LinkedIn"
3. Click "Request access"
4. Fill in the form explaining your use case
5. Wait for approval (can take 1-2 business days)

### Step 4.4: Get Client Credentials
1. Go to "Auth" tab
2. You'll see:

```
LINKEDIN_CLIENT_ID=86abcdefghijklmn
LINKEDIN_CLIENT_SECRET=AbCdEfGh12345678
```

### Step 4.5: Add Redirect URL
1. Still in "Auth" tab
2. Under "Redirect URLs"
3. Add: `http://localhost:3001/auth/linkedin/callback`
4. Click "Update"

### Step 4.6: Get Access Token

**Option A: Using OAuth 2.0 Playground**
1. Go to https://www.linkedin.com/developers/tools/oauth
2. Select your app
3. Select scopes:
   - `w_member_social`
   - `r_liteprofile`
   - `r_emailaddress`
4. Click "Request access token"
5. Authorize the app
6. Copy the access token

```
LINKEDIN_ACCESS_TOKEN=AQV8...
```

**Option B: Manual OAuth Flow**
```bash
# Step 1: Get authorization code
# Open in browser:
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3001/auth/linkedin/callback&scope=w_member_social%20r_liteprofile

# Step 2: Exchange code for token
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3001/auth/linkedin/callback"
```

### Step 4.7: Get Person URN
```bash
curl -X GET https://api.linkedin.com/v2/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "id": "AbCdEfGhIj"
}
```

Save as:
```
LINKEDIN_PERSON_URN=urn:li:person:AbCdEfGhIj
```

---

## 5. YouTube API

### Step 5.1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Project name: `Social Media Manager`
4. Click "Create"

### Step 5.2: Enable YouTube Data API
1. In the project, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it
4. Click "Enable"

### Step 5.3: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. Copy the API key
4. Click "Restrict Key" (recommended)
5. Under "API restrictions", select "Restrict key"
6. Select "YouTube Data API v3"
7. Click "Save"

```
YOUTUBE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
```

### Step 5.4: Create OAuth 2.0 Credentials
1. Still in "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: `Social Media Manager`
   - User support email: [your email]
   - Developer contact: [your email]
   - Click "Save and Continue"
   - Scopes: Add `../auth/youtube` and `../auth/youtube.upload`
   - Test users: Add your Google account email
   - Click "Save and Continue"
4. Back to Create OAuth client ID:
   - Application type: "Web application"
   - Name: `Social Media Manager`
   - Authorized redirect URIs: `http://localhost:3001/auth/youtube/callback`
5. Click "Create"
6. **Save these:**

```
YOUTUBE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUv
```

### Step 5.5: Get Refresh Token

**Using OAuth 2.0 Playground:**
1. Go to https://developers.google.com/oauthplayground
2. Click settings (gear icon) in top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. Close settings
6. In "Step 1", find "YouTube Data API v3"
7. Select:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.upload`
8. Click "Authorize APIs"
9. Sign in with your Google account
10. Click "Allow"
11. In "Step 2", click "Exchange authorization code for tokens"
12. Copy the "Refresh token"

```
YOUTUBE_REFRESH_TOKEN=1//0gAbCdEfGhIjKlMnOpQrStUvWxYz...
```

### Step 5.6: Get Channel ID
1. Go to YouTube Studio: https://studio.youtube.com
2. Click on your profile icon
3. Click "Settings"
4. Click "Channel" → "Advanced settings"
5. Copy your Channel ID

Or use API:
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&key=YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

```
YOUTUBE_CHANNEL_ID=UCAbCdEfGhIjKlMnOpQrStUv
```

---

## 6. Environment Configuration

### Step 6.1: Create Backend .env File
```bash
cd Backend
cp .env.example .env
nano .env  # or use your preferred editor
```

### Step 6.2: Fill in All Values
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...
S3_BUCKET_NAME=social-media-content-1709827200
DYNAMODB_TABLE_PREFIX=social_media_

# Meta/Facebook/Instagram API
META_APP_ID=123456789012345
META_APP_SECRET=abcdef1234567890abcdef1234567890
META_ACCESS_TOKEN=EAABsbCS1iHgBO...
INSTAGRAM_ACCOUNT_ID=17841400008460056

# LinkedIn API
LINKEDIN_CLIENT_ID=86abcdefghijklmn
LINKEDIN_CLIENT_SECRET=AbCdEfGh12345678
LINKEDIN_ACCESS_TOKEN=AQV8...
LINKEDIN_PERSON_URN=urn:li:person:AbCdEfGhIj

# Twitter/X API
TWITTER_API_KEY=abcdefghijklmnopqrstuvwx
TWITTER_API_SECRET=1234567890abcdefghijklmnopqrstuvwxyz1234567890abcd
TWITTER_ACCESS_TOKEN=1234567890-AbCdEfGhIjKlMnOpQrStUvWxYz
TWITTER_ACCESS_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAA...
TWITTER_USER_ID=1234567890

# YouTube API
YOUTUBE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456
YOUTUBE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUv
YOUTUBE_REFRESH_TOKEN=1//0gAbCdEfGhIjKlMnOpQrStUvWxYz...
YOUTUBE_CHANNEL_ID=UCAbCdEfGhIjKlMnOpQrStUv

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Step 6.3: Create Frontend .env.local File
```bash
cd Frontend
cp .env.local.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USER_ID=demo-user-123
```

---

## 7. Database Setup

### Step 7.1: Install Backend Dependencies
```bash
cd Backend
npm install
```

### Step 7.2: Build TypeScript
```bash
npm run build
```

### Step 7.3: Create DynamoDB Tables
```bash
node dist/scripts/setup-dynamodb.js
```

**Expected Output:**
```
🚀 Starting DynamoDB table creation...

✅ Created table: social_media_users
✅ Created table: social_media_posts
✅ Created table: social_media_scheduled_posts
✅ Created table: social_media_analytics
✅ Created table: social_media_content_library

✨ DynamoDB setup complete!
```

### Step 7.4: Verify Tables Created
```bash
aws dynamodb list-tables
```

You should see:
```json
{
  "TableNames": [
    "social_media_analytics",
    "social_media_content_library",
    "social_media_posts",
    "social_media_scheduled_posts",
    "social_media_users"
  ]
}
```

### Step 7.5: Configure S3 CORS
Create `cors.json`:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
    "ExposeHeaders": []
  }
]
```

Apply CORS:
```bash
aws s3api put-bucket-cors \
  --bucket YOUR_BUCKET_NAME \
  --cors-configuration file://cors.json
```

### Step 7.6: Verify S3 Bucket
```bash
aws s3 ls
```

---

## 8. Testing Your Setup

### Step 8.1: Start Backend Server
```bash
cd Backend
npm run dev
```

**Expected Output:**
```
🚀 Server is running on port 3001
📍 Environment: development
```

### Step 8.2: Test Health Endpoint
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-03-07T..."
}
```

### Step 8.3: Test AI Caption Generation
```bash
curl -X POST http://localhost:3001/api/ai/generate-caption \
  -H "Content-Type: application/json" \
  -d '{"caption": "Beautiful sunset at the beach", "platform": "Instagram"}'
```

### Step 8.4: Start Frontend
```bash
cd Frontend
npm install
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Ready in 2.3s
```

### Step 8.5: Test Frontend
1. Open browser: http://localhost:3000
2. Navigate to "Create Post"
3. Enter a caption
4. Click "Generate with Orin AI"
5. Verify AI-generated caption appears

### Step 8.6: Test Platform APIs

**Test Instagram:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_TOKEN"
```

**Test Twitter:**
```bash
curl -X GET "https://api.twitter.com/2/users/me" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

**Test LinkedIn:**
```bash
curl -X GET "https://api.linkedin.com/v2/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Test YouTube:**
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&key=YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### AWS Issues

**"Access Denied" Error:**
- Verify IAM user has correct permissions
- Check AWS credentials in .env file
- Run `aws sts get-caller-identity` to verify credentials

**DynamoDB Table Creation Failed:**
- Check AWS region is correct
- Verify IAM permissions include DynamoDB
- Check if tables already exist: `aws dynamodb list-tables`

### Meta/Instagram Issues

**"Invalid Access Token":**
- Token may have expired (60 days for long-lived)
- Regenerate long-lived token
- Verify token has correct permissions

**"Instagram Account Not Found":**
- Ensure Instagram is a Business/Creator account
- Verify Instagram is connected to Facebook Page
- Check Instagram Account ID is correct

### Twitter Issues

**"Unauthorized" Error:**
- Verify Bearer Token is correct
- Check app has correct permissions
- Regenerate tokens if needed

**"Rate Limit Exceeded":**
- Twitter has strict rate limits
- Wait for rate limit to reset
- Consider upgrading to higher tier

### LinkedIn Issues

**"Access Denied":**
- Verify "Share on LinkedIn" product is approved
- Check access token hasn't expired (60 days)
- Regenerate token if needed

### YouTube Issues

**"Quota Exceeded":**
- YouTube API has daily quota (10,000 units)
- Check quota in Google Cloud Console
- Request quota increase if needed

**"Invalid Credentials":**
- Verify OAuth credentials are correct
- Check refresh token is valid
- Re-authorize if needed

---

## Quick Reference

### All Environment Variables Checklist

```
✅ AWS_REGION
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ S3_BUCKET_NAME
✅ DYNAMODB_TABLE_PREFIX
✅ META_APP_ID
✅ META_APP_SECRET
✅ META_ACCESS_TOKEN
✅ INSTAGRAM_ACCOUNT_ID
✅ LINKEDIN_CLIENT_ID
✅ LINKEDIN_CLIENT_SECRET
✅ LINKEDIN_ACCESS_TOKEN
✅ LINKEDIN_PERSON_URN
✅ TWITTER_API_KEY
✅ TWITTER_API_SECRET
✅ TWITTER_ACCESS_TOKEN
✅ TWITTER_ACCESS_SECRET
✅ TWITTER_BEARER_TOKEN
✅ TWITTER_USER_ID
✅ YOUTUBE_API_KEY
✅ YOUTUBE_CLIENT_ID
✅ YOUTUBE_CLIENT_SECRET
✅ YOUTUBE_REFRESH_TOKEN
✅ YOUTUBE_CHANNEL_ID
```

### Useful Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# List DynamoDB tables
aws dynamodb list-tables

# List S3 buckets
aws s3 ls

# Test backend health
curl http://localhost:3001/health

# View backend logs
cd Backend && npm run dev

# View frontend logs
cd Frontend && npm run dev
```

---

## Next Steps

Once everything is set up:

1. ✅ Test posting to each platform
2. ✅ Test scheduling posts
3. ✅ Test content library sync
4. ✅ Test analytics fetching
5. ✅ Deploy to production (see DEPLOYMENT.md)

## Support Resources

- AWS Documentation: https://docs.aws.amazon.com
- Meta Graph API: https://developers.facebook.com/docs/graph-api
- Twitter API: https://developer.twitter.com/en/docs
- LinkedIn API: https://docs.microsoft.com/en-us/linkedin
- YouTube API: https://developers.google.com/youtube/v3

---

**Congratulations! Your social media management platform is now fully configured! 🎉**
