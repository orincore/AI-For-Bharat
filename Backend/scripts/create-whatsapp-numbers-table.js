const { 
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const region = process.env.AWS_REGION || 'ap-south-1';
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'social_media_';
const tableName = `${tablePrefix}whatsapp_numbers`;

const client = new DynamoDBClient({ region });

async function createWhatsAppNumbersTable() {
  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      await client.send(describeCommand);
      console.log(`✅ Table ${tableName} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create the table
    const createCommand = new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'phoneNumber', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'PhoneNumberIndex',
          KeySchema: [
            { AttributeName: 'phoneNumber', KeyType: 'HASH' },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });

    await client.send(createCommand);
    console.log(`✅ Successfully created table: ${tableName}`);
    console.log('⏳ Waiting for table to become active...');

    // Wait for table to be active
    let tableActive = false;
    while (!tableActive) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const response = await client.send(describeCommand);
      tableActive = response.Table.TableStatus === 'ACTIVE';
      console.log(`   Table status: ${response.Table.TableStatus}`);
    }

    console.log('✅ Table is now active and ready to use!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

// Run the script
createWhatsAppNumbersTable()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
