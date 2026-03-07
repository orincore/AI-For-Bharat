# Quick Start Checklist

Use this checklist to track your setup progress.

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or pnpm installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 1. AWS Setup (30-45 minutes)

### AWS Account & IAM
- [ ] Created AWS account
- [ ] Created IAM user: `social-media-app-user`
- [ ] Attached policies: DynamoDB, S3, Bedrock
- [ ] Generated Access Key ID
- [ ] Generated Secret Access Key
- [ ] Saved credentials securely

### AWS CLI
- [ ] Installed AWS CLI
- [ ] Ran `aws configure`
- [ ] Entered Access Key ID
- [ ] Entered Secret Access Key
- [ ] Set region to `us-east-1`
- [ ] Verified with `aws sts get-caller-identity`

### AWS Bedrock
- [ ] Opened AWS Bedrock console
- [ ] Clicked "Model access"
- [ ] Requested access to Claude 3 Haiku
- [ ] Verified approval

### S3 Bucket
- [ ] Created S3 bucket with unique name
- [ ] Saved bucket name
- [ ] Configured CORS policy
- [ ] Verified bucket exists with `aws s3 ls`

**Credentials to Save:**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

---

## 2. Meta/Instagram API (20-30 minutes)

### Developer Account
- [ ] Created Meta Developer account
- [ ] Verified email

### Create App
- [ ] Created new app (Business type)
- [ ] Saved App ID
- [ ] Saved App Secret
- [ ] Added Instagram Graph API product

### Instagram Setup
- [ ] Converted Instagram to Business account
- [ ] Connected Instagram to Facebook Page
- [ ] Verified connection

### Access Token
- [ ] Generated short-lived token in Graph API Explorer
- [ ] Exchanged for long-lived token
- [ ] Saved long-lived token
- [ ] Got Instagram Business Account ID
- [ ] Tested token with curl

**Credentials to Save:**
```
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=
```

---

## 3. Twitter/X API (15-20 minutes)

### Developer Account
- [ ] Applied for Twitter Developer account
- [ ] Completed application form
- [ ] Verified email
- [ ] Account approved

### Create Project & App
- [ ] Created new project
- [ ] Created new app
- [ ] Saved API Key
- [ ] Saved API Secret

### Authentication
- [ ] Generated Access Token
- [ ] Generated Access Secret
- [ ] Generated Bearer Token
- [ ] Got User ID
- [ ] Enabled OAuth 2.0
- [ ] Added redirect URL
- [ ] Tested with curl

**Credentials to Save:**
```
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=
TWITTER_BEARER_TOKEN=
TWITTER_USER_ID=
```

---

## 4. LinkedIn API (20-30 minutes + approval wait)

### Developer Account
- [ ] Created LinkedIn Developer account
- [ ] Created company page (if needed)

### Create App
- [ ] Created new app
- [ ] Uploaded app logo
- [ ] Added privacy policy URL
- [ ] Saved Client ID
- [ ] Saved Client Secret

### API Access
- [ ] Requested "Share on LinkedIn" product access
- [ ] Filled in use case form
- [ ] Waiting for approval (1-2 days)
- [ ] ✅ Approval received

### Authentication
- [ ] Added redirect URL
- [ ] Generated access token via OAuth
- [ ] Got Person URN
- [ ] Tested with curl

**Credentials to Save:**
```
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_PERSON_URN=
```

---

## 5. YouTube API (20-30 minutes)

### Google Cloud Project
- [ ] Created Google Cloud account
- [ ] Created new project
- [ ] Enabled YouTube Data API v3

### API Key
- [ ] Created API key
- [ ] Restricted API key to YouTube Data API
- [ ] Saved API key

### OAuth Credentials
- [ ] Configured OAuth consent screen
- [ ] Added test users
- [ ] Created OAuth 2.0 Client ID
- [ ] Saved Client ID
- [ ] Saved Client Secret
- [ ] Added redirect URL

### Refresh Token
- [ ] Used OAuth Playground
- [ ] Selected YouTube scopes
- [ ] Authorized APIs
- [ ] Got refresh token
- [ ] Got Channel ID
- [ ] Tested with curl

**Credentials to Save:**
```
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_CHANNEL_ID=
```

---

## 6. Backend Setup (10-15 minutes)

### Installation
- [ ] Cloned repository
- [ ] Navigated to Backend folder
- [ ] Ran `npm install`
- [ ] Copied `.env.example` to `.env`

### Configuration
- [ ] Filled in all AWS credentials
- [ ] Filled in all Meta credentials
- [ ] Filled in all Twitter credentials
- [ ] Filled in all LinkedIn credentials
- [ ] Filled in all YouTube credentials
- [ ] Set PORT=3001
- [ ] Set NODE_ENV=development
- [ ] Set FRONTEND_URL=http://localhost:3000

### Database Setup
- [ ] Ran `npm run build`
- [ ] Ran `node dist/scripts/setup-dynamodb.js`
- [ ] Verified 5 tables created
- [ ] Checked with `aws dynamodb list-tables`

### Testing
- [ ] Started server with `npm run dev`
- [ ] Server running on port 3001
- [ ] Tested health endpoint
- [ ] No errors in console

---

## 7. Frontend Setup (5-10 minutes)

### Installation
- [ ] Navigated to Frontend folder
- [ ] Ran `npm install`
- [ ] Copied `.env.local.example` to `.env.local`

### Configuration
- [ ] Set NEXT_PUBLIC_API_URL=http://localhost:3001/api
- [ ] Set NEXT_PUBLIC_USER_ID=demo-user-123

### Testing
- [ ] Started server with `npm run dev`
- [ ] Server running on port 3000
- [ ] Opened http://localhost:3000 in browser
- [ ] Dashboard loads successfully
- [ ] No errors in browser console

---

## 8. Integration Testing (10-15 minutes)

### AI Features
- [ ] Navigated to "Create Post"
- [ ] Entered test caption
- [ ] Clicked "Generate with Orin AI"
- [ ] AI caption generated successfully

### Post Scheduling
- [ ] Selected platform
- [ ] Entered caption
- [ ] Selected date and time
- [ ] Clicked "Schedule Post"
- [ ] Post appears in scheduled list

### Content Library
- [ ] Navigated to "Content Library"
- [ ] Clicked "Refresh"
- [ ] Content loads (may be empty initially)

### Analytics
- [ ] Navigated to "Dashboard"
- [ ] Stats cards display
- [ ] Charts render correctly
- [ ] Platform performance shows

### Platform APIs
- [ ] Tested Instagram API with curl
- [ ] Tested Twitter API with curl
- [ ] Tested LinkedIn API with curl
- [ ] Tested YouTube API with curl

---

## 9. Final Verification

### Backend
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] All routes responding
- [ ] Database connected
- [ ] S3 accessible
- [ ] Bedrock accessible

### Frontend
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] All pages load
- [ ] API calls working
- [ ] UI responsive

### Documentation
- [ ] Read README.md
- [ ] Read API_SETUP_GUIDE.md
- [ ] Read SETUP_GUIDE.md
- [ ] Bookmarked DEPLOYMENT.md for later

---

## Common Issues & Solutions

### ❌ AWS Credentials Error
**Solution:** Run `aws configure` again and verify credentials

### ❌ DynamoDB Tables Not Created
**Solution:** Check IAM permissions, verify region is us-east-1

### ❌ Instagram "Invalid Token"
**Solution:** Regenerate long-lived token, check expiration

### ❌ Twitter "Unauthorized"
**Solution:** Verify Bearer Token, check app permissions

### ❌ LinkedIn "Access Denied"
**Solution:** Wait for "Share on LinkedIn" approval, regenerate token

### ❌ YouTube "Quota Exceeded"
**Solution:** Check quota in Google Cloud Console, wait for reset

### ❌ Backend Won't Start
**Solution:** Check .env file, verify all required variables set

### ❌ Frontend Can't Connect to Backend
**Solution:** Verify backend is running, check NEXT_PUBLIC_API_URL

---

## Time Estimates

| Task | Estimated Time |
|------|----------------|
| AWS Setup | 30-45 minutes |
| Meta/Instagram API | 20-30 minutes |
| Twitter API | 15-20 minutes |
| LinkedIn API | 20-30 minutes + wait |
| YouTube API | 20-30 minutes |
| Backend Setup | 10-15 minutes |
| Frontend Setup | 5-10 minutes |
| Testing | 10-15 minutes |
| **Total** | **2-3 hours** (excluding LinkedIn approval wait) |

---

## Next Steps After Setup

1. [ ] Test posting to each platform
2. [ ] Schedule your first post
3. [ ] Sync content from platforms
4. [ ] Review analytics data
5. [ ] Customize UI/branding
6. [ ] Add authentication (optional)
7. [ ] Deploy to production
8. [ ] Set up monitoring
9. [ ] Configure backups
10. [ ] Share with team

---

## Support

If you get stuck:
1. Check the detailed API_SETUP_GUIDE.md
2. Review error messages carefully
3. Verify all credentials are correct
4. Check platform API status pages
5. Review AWS CloudWatch logs

---

**Progress Tracker:**
- [ ] All prerequisites installed
- [ ] All APIs configured
- [ ] Backend running successfully
- [ ] Frontend running successfully
- [ ] All tests passing
- [ ] Ready for production deployment

**Completion Date:** _______________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
