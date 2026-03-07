import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from '../config/aws';

export class BedrockService {
  async generateCaption(prompt: string, platform: string): Promise<string> {
    const systemPrompt = `You are an expert social media content strategist specializing in ${platform}.
Create engaging, platform-optimized captions that drive engagement.`;

    const fullPrompt = `${systemPrompt}

${prompt}

Requirements:
- Add relevant emojis
- Improve storytelling
- Add 5-8 trending hashtags
- Keep it natural and engaging
- Optimize for ${platform} best practices`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    const decodedResponse = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(decodedResponse);

    return parsed?.content?.[0]?.text || 'AI could not generate a caption.';
  }

  async analyzeContent(content: string): Promise<any> {
    const prompt = `Analyze this social media content and provide insights:

Content: ${content}

Provide:
1. Sentiment analysis
2. Key topics
3. Engagement prediction
4. Improvement suggestions`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    const decodedResponse = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(decodedResponse);

    return parsed?.content?.[0]?.text || 'Analysis unavailable.';
  }
}

export const bedrockService = new BedrockService();
