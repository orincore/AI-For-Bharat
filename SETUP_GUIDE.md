# Complete Setup Guide

Step-by-step guide to get your Social Media Management Platform up and running.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Setup](#aws-setup)
3. [Platform API Setup](#platform-api-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Node.js 18+ ([Download](https://nodejs.org/))
- npm or pnpm
- Git
- AWS CLI ([Install Guide](https://aws.amazon.com/cli/))
- Code editor (VS Code recommended)

### Required Accounts
- AWS Account
- Meta Developer Account
- Twitter Developer Account
- LinkedIn Developer Account
- Google Cloud Account (for YouTube)

## AWS Setup

### 1. Install and Configure AWS CLI

```bash
# Install AWS CLI
# macOS
brew install awscli

# Windows
# Download from https://aws.amazon.com/cli/

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter default output format (json)
```

### 2. Create IAM User

1. Go to AWS Console → IAM
2. Click "Users" → "Add users"
3. Username: `social-media-app`
4. Select "Programmatic access"
5. Attach policies:
   - AmazonDynamoDBFullAccess
   - AmazonS3FullAccess
   - AmazonBedrockFullAccess
6. Save Access Key ID and Secret Access Key

### 3. Setup DynamoDB

```bash
# Clone the repository first
git clone <your-repo-url>
cd social-media-platform/Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your AWS credentials
nano .env

# Build and run setup script
npm run build
node dist/scripts/setup-dynamodb.js
```

Expected output:
```
🚀 Starting DynamoDB table creation...

✅ Created table: social_media_users
✅ Created table: social_media_posts
✅ Created table: social_media_scheduled_posts
✅ Created table: social_media_analytics
✅ Created table: social_media_content_library

✨ DynamoDB setup complete!
```

### 4. Setup S3 Bucket

```bash
# Create bucket
aws s3 mb s3://social-media-content-bucket-$(date +%s) --region us-east-1

# Note the bucket name and add it to .env
# S3_BUCKET_NAME=social-media-content-bucket-1234567890

# Create CORS configuration file
cat > cors.json << EOF
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
    "ExposeHeaders": []
  }
]
EOF

# Apply CORS configuration
aws s3api put-bucket-cors \
  --bucket social-media-content-bucket-1234567890 \
  --cors-configuration file://cors.json

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket social-media-content-bucket-1234567890 \
  --versioning-configuration Status=Enabled
```

### 5. Enable AWS Bedrock

1. Go to AWS Console → Bedrock
2. Select your region (us-east-1 recommended)
3. Click "Model access"
4. Request access to "Claude 3 Haiku"
5. Wait for approval (usually instant)

## Platform API Setup

### Meta (Instagram/Facebook)

#### Step 1: Create Meta App
1. Go to https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. App Name: "Social Media Manager"
5. Contact Email: your email
6. Click "Create App"

#### Step 2: Add Instagram Graph API
1. In your app dashboard, click "Add Product"
2. Find "Instagram Graph API" and click "Set Up"
3. Follow the setup wizard

#### Step 3: Get Access Token
1. Go to Graph API Explorer
2. Select your app
3. Add permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
4. Generate Access Token
5. Use Access Token Tool to get long-lived token:
   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

#### Step 4: Get Instagram Business Account ID
1. Connect your Instagram account to a Facebook Page
2. Get Page ID from Graph API Explorer:
   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_TOKEN"
   ```
3. Get Instagram Business Account ID:
   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_TOKEN"
   ```

#### Step 5: Add to .env
```env
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
```

### Twitter/X API

#### Step 1: Create Twitter App
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Click "Create Project"
3. Project Name: "Social Media Manager"
4. Use Case: "Making a bot"
5. Project Description: "Social media management tool"

#### Step 2: Create App
1. App Name: "Social Media Manager App"
2. Get API Keys and save them

#### Step 3: Setup OAuth 2.0
1. In app settings, enable OAuth 2.0
2. Add callback URL: `http://localhost:3001/auth/twitter/callback`
3. Get Bearer Token from "Keys and tokens" tab

#### Step 4: Add to .env
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

### LinkedIn API

#### Step 1: Create LinkedIn App
1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. App Name: "Social Media Manager"
4. LinkedIn Page: Select or create a page
5. Privacy Policy URL: Your URL
6. App Logo: Upload logo
7. Click "Create app"

#### Step 2: Request API Access
1. Go to "Products" tab
2. Request access to "Share on LinkedIn"
3. Wait for approval (can take 1-2 days)

#### Step 3: Get OAuth Credentials
1. Go to "Auth" tab
2. Note Client ID and Client Secret
3. Add Redirect URL: `http://localhost:3001/auth/linkedin/callback`

#### Step 4: Get Access Token
Use OAuth 2.0 flow or use this quick method:
1. Go to https://www.linkedin.com/developers/tools/oauth
2. Select your app
3. Select scopes: `w_member_social`, `r_liteprofile`
4. Generate token

#### Step 5: Add to .env
```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
```

### YouTube API

#### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project: "Social Media Manager"
3. Enable YouTube Data API v3:
   - Go to "APIs & Services" → "Library"
   - Search "YouTube Data API v3"
   - Click "Enable"

#### Step 2: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Social Media Manager"
5. Authorized redirect URIs: `http://localhost:3001/auth/youtube/callback`
6. Save Client ID and Client Secret

#### Step 3: Get Refresh Token
1. Use OAuth 2.0 Playground: https://developers.google.com/oauthplayground
2. Settings (gear icon) → Use your own OAuth credentials
3. Enter Client ID and Client Secret
4. Select scopes:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.upload`
5. Authorize APIs
6. Exchange authorization code for tokens
7. Save Refresh Token

#### Step 4: Get API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. Save API key

#### Step 5: Add to .env
```env
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token
YOUTUBE_CHANNEL_ID=your_channel_id
```

## Backend Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Complete .env file:
```env
# Server
PORT=3001
NODE_ENV=development

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=social-media-content-bucket-1234567890
DYNAMODB_TABLE_PREFIX=social_media_

# Meta/Instagram
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_PERSON_URN=urn:li:person:your_person_id

# Twitter/X
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_USER_ID=your_user_id

# YouTube
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token
YOUTUBE_CHANNEL_ID=your_channel_id

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Build and Run

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Or run in production mode
npm start
```

Expected output:
```
🚀 Server is running on port 3001
📍 Environment: development
```

### 4. Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"success":true,"message":"Server is running","timestamp":"2025-03-07T..."}
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
nano .env.local
```

.env.local file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USER_ID=demo-user-123
```

### 3. Run Development Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Ready in 2.3s
```

### 4. Access Application

Open browser and go to: http://localhost:3000

## Testing

### 1. Test AI Caption Generation

1. Go to "Create Post" section
2. Select a platform
3. Enter a caption
4. Click "Generate with Orin AI"
5. Verify AI-generated caption appears

### 2. Test Post Scheduling

1. Go to "Schedule Post"
2. Select platform
3. Enter caption
4. Select date and time
5. Click "Schedule Post"
6. Verify post appears in scheduled list

### 3. Test Content Library

1. Go to "Content Library"
2. Click "Refresh" button
3. Verify content loads (may be empty initially)

### 4. Test Analytics

1. Go to "Dashboard"
2. Verify stats cards display
3. Check weekly engagement chart
4. Verify platform performance section

## Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

#### AWS Credentials Error
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

#### DynamoDB Table Not Found
```bash
# List tables
aws dynamodb list-tables

# Recreate tables
cd Backend
npm run build
node dist/scripts/setup-dynamodb.js
```

### Frontend Issues

#### API Connection Error
- Verify backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in .env.local
- Check CORS configuration in backend

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Platform API Issues

#### Instagram: "Invalid Access Token"
- Token may have expired
- Generate new long-lived token
- Update META_ACCESS_TOKEN in .env

#### Twitter: "Unauthorized"
- Verify Bearer Token is correct
- Check app permissions in Twitter Developer Portal
- Regenerate tokens if needed

#### LinkedIn: "Access Denied"
- Verify "Share on LinkedIn" product is approved
- Check access token hasn't expired
- Regenerate token if needed

#### YouTube: "Quota Exceeded"
- YouTube API has daily quota limits
- Check quota usage in Google Cloud Console
- Request quota increase if needed

## Next Steps

1. **Add Authentication**: Implement user authentication system
2. **Setup Monitoring**: Configure CloudWatch or similar
3. **Add Tests**: Write unit and integration tests
4. **Deploy to Production**: Follow DEPLOYMENT.md guide
5. **Setup CI/CD**: Automate deployments
6. **Add More Features**: Extend functionality

## Support

- Check logs in `Backend/` for backend errors
- Check browser console for frontend errors
- Review AWS CloudWatch logs
- Check platform API status pages

## Additional Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api)
- [Twitter API](https://developer.twitter.com/en/docs)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [YouTube API](https://developers.google.com/youtube/v3)
