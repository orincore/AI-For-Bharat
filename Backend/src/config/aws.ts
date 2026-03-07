import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || 'us-east-1';

// DynamoDB Client
const dynamoClient = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

// S3 Client
export const s3Client = new S3Client({ region });

// Bedrock Client
export const bedrockClient = new BedrockRuntimeClient({ region });

// Table names
export const TABLES = {
  USERS: `${process.env.DYNAMODB_TABLE_PREFIX}users`,
  POSTS: `${process.env.DYNAMODB_TABLE_PREFIX}posts`,
  SCHEDULED_POSTS: `${process.env.DYNAMODB_TABLE_PREFIX}scheduled_posts`,
  ANALYTICS: `${process.env.DYNAMODB_TABLE_PREFIX}analytics`,
  CONTENT_LIBRARY: `${process.env.DYNAMODB_TABLE_PREFIX}content_library`,
};

export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'social-media-content-bucket';
