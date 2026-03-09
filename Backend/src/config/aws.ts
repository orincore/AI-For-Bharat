import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const s3Region = process.env.AWS_S3_REGION || region;
const bedrockRegion = process.env.BEDROCK_REGION || region;

// DynamoDB Client
const dynamoClient = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

// S3 Client
export const s3Client = new S3Client({ region: s3Region });

// Bedrock Client (can live in different region)
export const bedrockClient = new BedrockRuntimeClient({ region: bedrockRegion });

// Table names
export const TABLES = {
  USERS: `${process.env.DYNAMODB_TABLE_PREFIX}users`,
  POSTS: `${process.env.DYNAMODB_TABLE_PREFIX}posts`,
  SCHEDULED_POSTS: `${process.env.DYNAMODB_TABLE_PREFIX}scheduled_posts`,
  ANALYTICS: `${process.env.DYNAMODB_TABLE_PREFIX}analytics`,
  CONTENT_LIBRARY: `${process.env.DYNAMODB_TABLE_PREFIX}content_library`,
  CONNECTED_ACCOUNTS: `${process.env.DYNAMODB_TABLE_PREFIX}connected_accounts`,
  POST_HISTORY: `${process.env.DYNAMODB_TABLE_PREFIX}post_history`,
  CHAT_CONVERSATIONS: `${process.env.DYNAMODB_TABLE_PREFIX}chat_conversations`,
  CHAT_MESSAGES: `${process.env.DYNAMODB_TABLE_PREFIX}chat_messages`,
};

export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'social-media-content-bucket';
export const S3_BUCKET_REGION = s3Region;
