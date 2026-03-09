import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '../config/aws';
import { PostHistory } from '../types';

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

  async query(tableName: string, keyConditionExpression: string, expressionAttributeValues: any, expressionAttributeNames?: any) {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  async queryByIndex(
    tableName: string,
    indexName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any,
    expressionAttributeNames?: any
  ) {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
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

  async update(
    tableName: string,
    key: any,
    updateExpression: string,
    expressionAttributeValues: any,
    expressionAttributeNames?: any
  ) {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW',
    });
    const result = await docClient.send(command);
    return result.Attributes;
  }

  async queryByEmail(tableName: string, email: string) {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });
    const result = await docClient.send(command);
    return result.Items || [];
  }

  async updateAttributes(tableName: string, key: any, attributes: any) {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    Object.keys(attributes).forEach((attr, index) => {
      const placeholder = `:val${index}`;
      const namePlaceholder = `#attr${index}`;
      updateExpressions.push(`${namePlaceholder} = ${placeholder}`);
      expressionAttributeValues[placeholder] = attributes[attr];
      expressionAttributeNames[namePlaceholder] = attr;
    });

    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
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

  async logPostHistory(entry: PostHistory) {
    const command = new PutCommand({
      TableName: TABLES.POST_HISTORY,
      Item: entry,
    });
    await docClient.send(command);
    return entry;
  }

  async listPostHistory(userId: string, limit: number = 50) {
    try {
      const command = new QueryCommand({
        TableName: TABLES.POST_HISTORY,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false,
        Limit: limit,
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.warn('UserIdIndex missing on post_history, falling back to scan');
        const fallback = await docClient.send(
          new ScanCommand({
            TableName: TABLES.POST_HISTORY,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId,
            },
            Limit: limit,
          })
        );
        return fallback.Items || [];
      }
      throw error;
    }
  }

  async createConversation(conversation: {
    id: string;
    userId: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
  }) {
    await this.put(TABLES.CHAT_CONVERSATIONS, conversation);
    return conversation;
  }

  async updateConversationTimestamp(conversationId: string, updatedAt: string) {
    return await this.update(
      TABLES.CHAT_CONVERSATIONS,
      { id: conversationId },
      'SET updatedAt = :updatedAt',
      { ':updatedAt': updatedAt }
    );
  }

  async getConversation(conversationId: string) {
    return await this.get(TABLES.CHAT_CONVERSATIONS, { id: conversationId });
  }

  async listConversations(userId: string, limit: number = 20) {
    try {
      const items = await this.queryByIndex(
        TABLES.CHAT_CONVERSATIONS,
        'UserIdUpdatedAtIndex',
        '#userId = :userId',
        { ':userId': userId },
        { '#userId': 'userId' }
      );
      return items
        .sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        .slice(0, limit);
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        const fallback = await this.scan(
          TABLES.CHAT_CONVERSATIONS,
          'userId = :userId',
          { ':userId': userId }
        );
        return fallback
          .sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
          .slice(0, limit);
      }
      throw error;
    }
  }

  async createChatMessage(message: {
    id: string;
    conversationId: string;
    userId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    metadata?: Record<string, any>;
  }) {
    await this.put(TABLES.CHAT_MESSAGES, message);
    return message;
  }

  async listChatMessages(conversationId: string, limit: number = 50) {
    try {
      const items = await this.queryByIndex(
        TABLES.CHAT_MESSAGES,
        'ConversationCreatedAtIndex',
        '#conversationId = :conversationId',
        { ':conversationId': conversationId },
        { '#conversationId': 'conversationId' }
      );
      return items
        .sort((a: any, b: any) => (a.createdAt || '').localeCompare(b.createdAt || ''))
        .slice(-limit);
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        const fallback = await this.scan(
          TABLES.CHAT_MESSAGES,
          'conversationId = :conversationId',
          { ':conversationId': conversationId }
        );
        return fallback
          .sort((a: any, b: any) => (a.createdAt || '').localeCompare(b.createdAt || ''))
          .slice(-limit);
      }
      throw error;
    }
  }
}

export const dynamoDBService = new DynamoDBService();
