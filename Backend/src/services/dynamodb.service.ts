import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../config/aws';

export class DynamoDBService {
  async put(tableName: string, item: any) {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    return await docClient.send(command);
  }

  async get(tableName: string, key: any) {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });
    const result = await docClient.send(command);
    return result.Item;
  }

  async query(tableName: string, keyConditionExpression: string, expressionAttributeValues: any) {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  async scan(tableName: string, filterExpression?: string, expressionAttributeValues?: any) {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  async update(tableName: string, key: any, updateExpression: string, expressionAttributeValues: any) {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });
    const result = await docClient.send(command);
    return result.Attributes;
  }

  async delete(tableName: string, key: any) {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    return await docClient.send(command);
  }
}

export const dynamoDBService = new DynamoDBService();
