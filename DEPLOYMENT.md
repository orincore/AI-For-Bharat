# Deployment Guide

Complete guide for deploying the Social Media Management Platform to production.

## Prerequisites

- AWS Account with appropriate permissions
- Domain name (optional but recommended)
- Platform API credentials configured
- SSL certificate for HTTPS

## Backend Deployment Options

### Option 1: AWS Lambda + API Gateway (Recommended)

#### Advantages
- Serverless, auto-scaling
- Pay per request
- No server management
- Built-in high availability

#### Steps

1. **Install Serverless Framework**
```bash
npm install -g serverless
```

2. **Create serverless.yml in Backend/**
```yaml
service: social-media-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    AWS_REGION: ${env:AWS_REGION}
    S3_BUCKET_NAME: ${env:S3_BUCKET_NAME}
    DYNAMODB_TABLE_PREFIX: ${env:DYNAMODB_TABLE_PREFIX}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:*
        - s3:*
        - bedrock:*
      Resource: "*"

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

3. **Create lambda.ts wrapper**
```typescript
import serverless from 'serverless-http';
import app from './server';

export const handler = serverless(app);
```

4. **Deploy**
```bash
cd Backend
npm run build
serverless deploy
```

### Option 2: AWS Elastic Beanstalk

#### Steps

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize EB**
```bash
cd Backend
eb init -p node.js-18 social-media-api
```

3. **Create environment**
```bash
eb create production
```

4. **Configure environment variables**
```bash
eb setenv AWS_REGION=us-east-1 \
  S3_BUCKET_NAME=your-bucket \
  DYNAMODB_TABLE_PREFIX=social_media_
```

5. **Deploy**
```bash
npm run build
eb deploy
```

### Option 3: EC2 Instance

#### Steps

1. **Launch EC2 Instance**
- AMI: Amazon Linux 2
- Instance Type: t3.small or larger
- Security Group: Allow ports 22, 80, 443

2. **Connect and Setup**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <your-repo>
cd Backend
npm install
npm run build
```

3. **Configure PM2**
```bash
pm2 start dist/server.js --name social-media-api
pm2 startup
pm2 save
```

4. **Setup Nginx**
```bash
sudo yum install -y nginx

# Configure nginx
sudo nano /etc/nginx/conf.d/api.conf
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

5. **Setup SSL with Let's Encrypt**
```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### Steps

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd Frontend
vercel
```

3. **Configure Environment Variables**
In Vercel dashboard:
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_USER_ID`: Default user ID

4. **Setup Custom Domain**
- Add domain in Vercel dashboard
- Update DNS records

### Option 2: AWS Amplify

#### Steps

1. **Connect Repository**
- Go to AWS Amplify Console
- Connect your Git repository
- Select Frontend folder as root

2. **Configure Build Settings**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd Frontend
        - npm install
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
```

3. **Add Environment Variables**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_USER_ID`

### Option 3: Self-Hosted with Nginx

#### Steps

1. **Build Frontend**
```bash
cd Frontend
npm run build
```

2. **Setup PM2**
```bash
pm2 start npm --name "social-media-frontend" -- start
pm2 startup
pm2 save
```

3. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## AWS Infrastructure Setup

### 1. DynamoDB Tables

```bash
cd Backend
npm run build
node dist/scripts/setup-dynamodb.js
```

### 2. S3 Bucket

```bash
# Create bucket
aws s3 mb s3://your-production-bucket --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-production-bucket \
  --versioning-configuration Status=Enabled

# Configure CORS
aws s3api put-bucket-cors \
  --bucket your-production-bucket \
  --cors-configuration file://cors.json
```

cors.json:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://yourdomain.com"],
      "ExposeHeaders": []
    }
  ]
}
```

### 3. IAM Roles

Create IAM role with policies:
- DynamoDB full access
- S3 full access
- Bedrock invoke model access

### 4. CloudWatch Logs

Enable logging for monitoring:
```bash
aws logs create-log-group --log-group-name /aws/lambda/social-media-api
```

## Environment Configuration

### Production Environment Variables

#### Backend
```env
NODE_ENV=production
PORT=3001
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-production-bucket
DYNAMODB_TABLE_PREFIX=prod_social_media_

# Platform APIs
META_APP_ID=prod_app_id
META_APP_SECRET=prod_secret
META_ACCESS_TOKEN=prod_token

LINKEDIN_CLIENT_ID=prod_client_id
LINKEDIN_CLIENT_SECRET=prod_secret
LINKEDIN_ACCESS_TOKEN=prod_token

TWITTER_API_KEY=prod_key
TWITTER_API_SECRET=prod_secret
TWITTER_BEARER_TOKEN=prod_token

YOUTUBE_API_KEY=prod_key
YOUTUBE_CLIENT_ID=prod_client_id
YOUTUBE_CLIENT_SECRET=prod_secret
YOUTUBE_REFRESH_TOKEN=prod_token

FRONTEND_URL=https://yourdomain.com
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_USER_ID=production-user-id
```

## Post-Deployment

### 1. Health Checks

Test all endpoints:
```bash
curl https://api.yourdomain.com/health
```

### 2. Monitoring

Setup CloudWatch alarms:
- API error rate
- DynamoDB throttling
- S3 bucket size
- Lambda execution errors

### 3. Backup Strategy

- Enable DynamoDB point-in-time recovery
- Configure S3 lifecycle policies
- Regular database exports

### 4. Security Hardening

- Enable AWS WAF
- Configure rate limiting
- Setup CloudFront for DDoS protection
- Enable AWS Shield
- Regular security audits

## CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Deploy Backend
        run: |
          cd Backend
          npm install
          npm run build
          serverless deploy
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Deploy Frontend
        run: |
          cd Frontend
          npm install
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Rollback Strategy

### Backend
```bash
# Serverless
serverless rollback -t timestamp

# Elastic Beanstalk
eb deploy --version previous-version
```

### Frontend
```bash
# Vercel
vercel rollback
```

## Cost Optimization

1. **Use DynamoDB On-Demand** for variable workloads
2. **Enable S3 Intelligent-Tiering** for cost savings
3. **Use CloudFront CDN** to reduce data transfer costs
4. **Set up budget alerts** in AWS
5. **Monitor and optimize Lambda memory** allocation

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check S3 CORS configuration
   - Verify API Gateway CORS settings
   - Update frontend URL in backend env

2. **DynamoDB Throttling**
   - Increase provisioned capacity
   - Switch to on-demand billing
   - Implement exponential backoff

3. **S3 Upload Failures**
   - Check IAM permissions
   - Verify bucket policy
   - Check file size limits

## Support

For deployment issues, check:
- CloudWatch Logs
- AWS X-Ray traces
- Application logs
- Platform API status pages
