import { 
  CreateTableCommand, 
  DynamoDBClient,
  BillingMode 
} from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'social_media_';

const tables = [
  {
    name: `${tablePrefix}users`,
    schema: {
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },
  {
    name: `${tablePrefix}posts`,
    schema: {
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },
  {
    name: `${tablePrefix}scheduled_posts`,
    schema: {
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'scheduledTime', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserScheduleIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'scheduledTime', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },
  {
    name: `${tablePrefix}analytics`,
    schema: {
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'date', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserDateIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'date', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },
  {
    name: `${tablePrefix}content_library`,
    schema: {
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
  },
];

async function createTables() {
  console.log('🚀 Starting DynamoDB table creation...\n');

  for (const table of tables) {
    try {
      const command = new CreateTableCommand({
        TableName: table.name,
        ...table.schema,
        BillingMode: BillingMode.PAY_PER_REQUEST,
      });

      await client.send(command);
      console.log(`✅ Created table: ${table.name}`);
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log(`⚠️  Table already exists: ${table.name}`);
      } else {
        console.error(`❌ Error creating table ${table.name}:`, error.message);
      }
    }
  }

  console.log('\n✨ DynamoDB setup complete!');
}

createTables();
