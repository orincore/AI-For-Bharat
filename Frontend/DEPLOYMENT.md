# SocialOS Frontend Deployment Guide

## AWS Amplify Deployment

### Prerequisites
1. AWS Account with Amplify access
2. GitHub repository connected to AWS Amplify
3. Backend API deployed and accessible

### Step 1: Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** as your repository provider
4. Authorize AWS Amplify to access your GitHub account
5. Select your repository: `AI-For-Bharat`
6. Select branch: `main` (or your production branch)

### Step 2: Configure Build Settings

1. Amplify will auto-detect Next.js and suggest build settings
2. **Important**: Use the provided `amplify.yml` file (already in the repository)
3. Verify the build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
   - **Node version**: 18.x or higher

### Step 3: Set Environment Variables

Go to **App settings** → **Environment variables** and add the following:

#### Required Variables
```
NEXT_PUBLIC_API_URL=https://api.socialos.orincore.com/api
NEXT_PUBLIC_USER_ID=110275627289055227495
```

#### Optional Variables (if using authentication)
```
NEXTAUTH_URL=https://your-app.amplifyapp.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

#### Optional Variables (if using AWS Bedrock AI)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

### Step 4: Deploy

1. Click **"Save and deploy"**
2. Amplify will:
   - Clone your repository
   - Install dependencies
   - Create `.env.production` file from environment variables
   - Build the Next.js application
   - Deploy to CloudFront CDN

3. Monitor the build logs for any errors
4. Once complete, you'll get a URL like: `https://main.d1234567890.amplifyapp.com`

### Step 5: Configure Custom Domain (Optional)

1. Go to **App settings** → **Domain management**
2. Click **"Add domain"**
3. Enter your domain (e.g., `socialos.orincore.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (5-10 minutes)

### Step 6: Verify Deployment

1. Visit your Amplify app URL
2. Check that the dashboard loads correctly
3. Verify API connection by checking:
   - Dashboard stats loading
   - Instagram/YouTube data displaying
   - WhatsApp integration working

### Troubleshooting

#### Build Fails with "NEXT_PUBLIC_API_URL is not set"
- Go to Environment variables and ensure `NEXT_PUBLIC_API_URL` is set
- Redeploy the app

#### API Requests Fail (CORS errors)
- Ensure your backend API has CORS enabled for your Amplify domain
- Update backend CORS configuration to include: `https://your-app.amplifyapp.com`

#### Environment Variables Not Available at Runtime
- The `amplify.yml` file creates a `.env.production` file during build
- This makes variables available at runtime
- If issues persist, check build logs for `.env.production` creation

#### Build Fails with Dependency Errors
- The build uses `npm ci --legacy-peer-deps` for compatibility
- If issues persist, check `package.json` for conflicting dependencies

### Continuous Deployment

Once set up, Amplify will automatically:
- Deploy on every push to the connected branch
- Run build and tests
- Update the live site if build succeeds
- Rollback if build fails

### Monitoring

1. **Build history**: View all deployments and their status
2. **Logs**: Check build and runtime logs
3. **Metrics**: Monitor traffic, errors, and performance
4. **Alarms**: Set up CloudWatch alarms for errors

### Cost Optimization

- **Free tier**: 1000 build minutes/month, 15 GB storage, 15 GB served
- **Caching**: Amplify automatically caches static assets
- **CDN**: Global distribution via CloudFront

### Security Best Practice

1. Never commit `.env.local` or `.env.production` to Git
2. Use environment variables for all secrets
3. Rotate secrets regularly
4. Enable AWS WAF for DDoS protection (optional)
5. Use custom domain with SSL/TLS

### Rollback

If a deployment breaks production:
1. Go to **Deployments** in Amplify Console
2. Find the last working deployment
3. Click **"Redeploy this version"**

---

## Local Development

For local development, use `.env.local`:

```bash
# Copy example file
cp .env.example .env.local

# Edit with your local values
NEXT_PUBLIC_API_URL=https://localhost:3443/api
NEXT_PUBLIC_USER_ID=110275627289055227495

# Run development server
npm run dev
```

---

## Support

For issues:
1. Check Amplify build logs
2. Verify environment variables are set
3. Check backend API is accessible
4. Review CORS configuration
5. Contact AWS Support if needed
