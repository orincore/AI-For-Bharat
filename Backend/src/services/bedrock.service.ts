import axios from 'axios';
import { ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from '../config/aws';
import { AVAILABLE_TOOLS } from '../types/tools';

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
const BEDROCK_INFERENCE_PROFILE_ARN = process.env.BEDROCK_INFERENCE_PROFILE_ARN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export class BedrockService {
  private async invokeBedrock(prompt: string, maxTokens: number): Promise<string> {
    const targetModelId = BEDROCK_INFERENCE_PROFILE_ARN || BEDROCK_MODEL_ID;

    const commandInput: any = {
      modelId: targetModelId,
      inferenceConfig: {
        maxTokens,
        temperature: 0.7,
      },
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
    };

    const command = new ConverseCommand(commandInput);

    const response = await bedrockClient.send(command);
    const text = response?.output?.message?.content?.[0]?.text?.trim();
    if (!text) {
      throw new Error('Bedrock returned an empty response');
    }
    return text;
  }

  private async invokeOpenAI(prompt: string, maxTokens: number): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI fallback requested but OPENAI_API_KEY is not configured');
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are Orin AI, a helpful social media assistant focused on captions, analytics, and creator insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const text = response?.data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('OpenAI fallback returned an empty response');
    }
    return text;
  }

  private async invokeWithFallback(prompt: string, maxTokens: number): Promise<string> {
    try {
      return await this.invokeBedrock(prompt, maxTokens);
    } catch (error) {
      if (OPENAI_API_KEY) {
        console.warn('Bedrock invocation failed, falling back to OpenAI:', (error as Error)?.message);
        return await this.invokeOpenAI(prompt, maxTokens);
      }
      throw error;
    }
  }

  async generateCaption(
    prompt: string,
    platform: string,
    options?: {
      tone?: string;
      audience?: string;
      includeHashtags?: boolean;
      includeEmojis?: boolean;
      additionalContext?: string;
    }
  ): Promise<string> {
    const tone = options?.tone || 'engaging';
    const audience = options?.audience || 'general';
    const includeHashtags = options?.includeHashtags !== false;
    const includeEmojis = options?.includeEmojis !== false;
    const additionalContext = options?.additionalContext || '';

    const systemPrompt = `You are an expert social media content strategist specializing in ${platform}.
Create ${tone} captions optimized for ${audience} audience that drive engagement.`;

    const requirements = [];
    if (includeEmojis) requirements.push('Add relevant emojis to enhance visual appeal');
    requirements.push('Improve storytelling and narrative flow');
    if (includeHashtags) requirements.push('Add 5-8 trending, relevant hashtags');
    requirements.push('Keep it natural, authentic, and engaging');
    requirements.push(`Optimize for ${platform} best practices and character limits`);
    requirements.push(`Tone: ${tone}`);
    requirements.push(`Target audience: ${audience}`);

    const fullPrompt = `${systemPrompt}

Original Caption/Idea:
${prompt}

${additionalContext ? `Additional Context:
${additionalContext}

` : ''}Requirements:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Generate an optimized caption following all requirements above.`;
    
    return await this.invokeWithFallback(fullPrompt, 500);
  }

  async generateVideoMetadata(
    prompt: string,
    options?: {
      tone?: string;
      audience?: string;
      includeHashtags?: boolean;
      includeEmojis?: boolean;
      additionalContext?: string;
    }
  ): Promise<{ title: string; description: string; tags: string[] }> {
    const tone = options?.tone || 'engaging';
    const audience = options?.audience || 'general';
    const includeHashtags = options?.includeHashtags !== false;
    const includeEmojis = options?.includeEmojis !== false;
    const additionalContext = options?.additionalContext || '';

    const promptTemplate = `You are an elite YouTube growth strategist and SEO expert.

Content idea / rough caption:
${prompt}

${additionalContext ? `Additional context:
${additionalContext}

` : ''}Requirements:
1. Craft a compelling, ${tone} YouTube title (max 70 characters) optimized for ${audience} viewers.
2. Write a persuasive description (3 short paragraphs + bullet CTA) that highlights hooks, value, and next steps.
3. ${includeHashtags ? 'Include 8-12 high-intent tags/keywords (single words or short phrases).' : 'Focus on copy quality; tags optional.'}
4. ${includeEmojis ? 'Tastefully sprinkle relevant emojis in the description where it feels natural.' : 'Do not use emojis.'}
5. Emphasize discoverability, storytelling, and retention tactics.
6. Return ONLY valid JSON in the exact format: {"title": "...", "description": "...", "tags": ["tag1", "tag2"]} with double quotes.`;

    const rawResponse = await this.invokeWithFallback(promptTemplate, 700);
    try {
      const parsed = JSON.parse(rawResponse);
      return {
        title: parsed.title || 'Untitled Video',
        description: parsed.description || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      };
    } catch (error) {
      console.warn('Failed to parse video metadata response, returning fallback.', error);
      return {
        title: 'Untitled Video',
        description: rawResponse,
        tags: [],
      };
    }
  }

  async analyzeContent(content: string): Promise<any> {
    const prompt = `Analyze this social media content and provide insights:

Content: ${content}

Provide:
1. Sentiment analysis
2. Key topics
3. Engagement prediction
4. Improvement suggestions`;

    return await this.invokeWithFallback(prompt, 300);
  }

  async summarizeAnalytics(analyticsData: any): Promise<string> {
    const prompt = `You are Orin AI, an expert social media analytics assistant. Analyze the following social media analytics data and provide a comprehensive, actionable summary.

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}

Provide a detailed analysis covering:
1. Key Performance Metrics - Highlight the most important numbers (followers, engagement rate, reach, impressions)
2. Trends & Insights - Identify growth patterns, best-performing content types, peak engagement times
3. Platform Comparison - Compare performance across different platforms if multiple are present
4. Actionable Recommendations - Suggest 3-5 specific actions to improve performance
5. Content Strategy - Recommend what type of content to create more of based on the data

IMPORTANT: Format the response as plain text WITHOUT using markdown symbols like *, **, #, ##, or ###. Use clear paragraph breaks and bullet points with simple dashes (-) or numbers. Use emojis for visual appeal but avoid markdown formatting entirely.`;

    return await this.invokeWithFallback(prompt, 1500);
  }

  async researchTopic(question: string, context?: string): Promise<string> {
    const prompt = `You are Orin AI, a knowledgeable assistant. Answer the user's research question directly using your built-in knowledge. Provide a concise, factual response with clear structure.

Question:
${question}

${context ? `Additional context:
${context}

` : ''}Guidelines:
1. If the question is informational, summarize key facts and provide helpful background details.
2. If the user seeks recommendations, offer practical, actionable guidance.
3. Keep the response plain text (no markdown syntax) and conversational, using short paragraphs and optional bullet points with dashes.
4. Use emojis sparingly to keep things friendly.
5. If you are unsure, acknowledge the limitation and share what is known.`;

    return await this.invokeWithFallback(prompt, 800);
  }

  private detectAnalyticsQuery(question: string): { platforms: Array<'instagram' | 'youtube'> } | null {
    const lowerQ = question.toLowerCase();
    const analyticsKeywords = [
      'analytics',
      'performance',
      'performed',
      'insight',
      'insights',
      'metric',
      'metrics',
      'engagement',
      'best post',
      'top post',
      'which post',
      'stats',
      'statistics',
      'dashboard',
      'how are my posts',
    ];

    const isAnalyticsQuery = analyticsKeywords.some((keyword) => lowerQ.includes(keyword));
    if (!isAnalyticsQuery) return null;

    const platforms: Array<'instagram' | 'youtube'> = [];
    if (/(instagram|insta|ig)/i.test(question)) platforms.push('instagram');
    if (/(youtube|yt|channel|video)/i.test(question)) platforms.push('youtube');

    if (platforms.length === 0) {
      platforms.push('instagram', 'youtube');
    }

    return { platforms: Array.from(new Set(platforms)) };
  }

  private detectCommentQuery(question: string): { platform?: 'instagram' | 'youtube'; type: 'latest' | 'top' | 'specific'; count?: number } | null {
    const lowerQ = question.toLowerCase();
    
    // Check for comment-related keywords (including common typos)
    const isCommentQuery = /\b(comment|commented|commenting|comments)\b/i.test(question) ||
                          /\b(latest|last|lasr|recent|top|second|first|list)\s+(comment|comments|10 comment)/i.test(question) ||
                          /\b(list|show|tell|get|fetch)\s+.*\b(comment|comments)\b/i.test(question) ||
                          /\b(top|last)\s+\d+\s+(comment|comments)\b/i.test(question);
    
    if (!isCommentQuery) return null;
    
    const platform = /\b(instagram|insta|ig)\b/i.test(question) ? 'instagram' :
                    /\b(youtube|yt)\b/i.test(question) ? 'youtube' : undefined;
    
    const type = /\b(top|top\s+\d+|top\s+ten|list|show|all)\b/i.test(question) ? 'top' : 'latest';
    
    // Extract number if specified (e.g., "top 10", "list 5", "10 comments")
    const countMatch = question.match(/\b(\d+)\s*(?:comment|last|recent|top)?/i) || 
                       question.match(/\b(?:top|list|show)\s+(\d+)/i);
    const count = countMatch ? parseInt(countMatch[1], 10) : undefined;
    
    return platform ? { platform, type, count } : null;
  }

  async answerQuestionWithTools(
    question: string,
    context: any,
    toolExecutor: (toolName: string, toolInput: any) => Promise<string>,
    options?: { priorMessages?: Array<{ role: 'user' | 'assistant'; content: string }> }
  ): Promise<string> {
    const analyticsQuery = this.detectAnalyticsQuery(question);
    if (analyticsQuery) {
      try {
        if (analyticsQuery.platforms.length > 1) {
          const summaryResult = await toolExecutor('get_all_analytics_summary', {});
          const parsed = JSON.parse(summaryResult);

          if (!parsed.success) {
            return parsed.error || 'Unable to fetch analytics summary right now.';
          }

          const instagramSummary = parsed.instagram;
          const youtubeSummary = parsed.youtube;
          const parts: string[] = ['Here’s the latest cross-platform performance snapshot:'];

          if (instagramSummary && !instagramSummary.error) {
            parts.push(
              `📸 Instagram — Posts analyzed: ${instagramSummary.totalPosts ?? '—'}, ` +
                `avg engagement: ${instagramSummary.averageEngagement ?? '—'}.` +
                (instagramSummary.topPost
                  ? ` Top post is pulling ${instagramSummary.topPost.engagement ?? '—'} total interactions.`
                  : '')
            );
          } else {
            parts.push('📸 Instagram — Not connected yet or data unavailable.');
          }

          if (youtubeSummary && !youtubeSummary.error) {
            parts.push(
              `▶️ YouTube — Videos analyzed: ${youtubeSummary.totalVideos ?? '—'}, ` +
                `avg views: ${youtubeSummary.averageViews ?? '—'}.` +
                (youtubeSummary.topVideo
                  ? ` Top video is sitting at ${youtubeSummary.topVideo.views ?? '—'} views.`
                  : '')
            );
          } else {
            parts.push('▶️ YouTube — Not connected yet or data unavailable.');
          }

          return parts.join('\n');
        }

        const platform = analyticsQuery.platforms[0];
        const toolName = platform === 'instagram' ? 'get_instagram_analytics' : 'get_youtube_analytics';
        const result = await toolExecutor(toolName, { limit: 15 });
        const parsed = JSON.parse(result);

        if (!parsed.success) {
          return parsed.error || `Unable to fetch ${platform} analytics right now.`;
        }

        if (platform === 'instagram') {
          const summary = parsed.summary || {};
          const posts = parsed.posts || [];
          const topPost = summary.topPost || posts[0];

          return [
            `📸 Instagram performance overview:`,
            `- Posts analyzed: ${summary.totalPosts ?? posts.length ?? '—'}`,
            `- Total engagement: ${summary.totalEngagement ?? '—'}`,
            `- Average engagement per post: ${summary.averageEngagement ?? '—'}`,
            topPost
              ? `Top post: "${topPost.caption ?? 'No caption'}" with ${topPost.engagement ??
                  (topPost.likes || 0) + (topPost.comments || 0)} interactions (${topPost.likes ?? 0} likes / ${
                  topPost.comments ?? 0
                } comments).`
              : 'Top post data unavailable.',
            posts.length
              ? `Recent highlights: ${posts
                  .slice(0, 3)
                  .map(
                    (post: any) =>
                      `• ${new Date(post.timestamp).toLocaleDateString()} – ${
                        post.engagement ?? post.likes + post.comments
                      } interactions`
                  )
                  .join('\n')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n');
        }

        const summary = parsed.summary || {};
        const videos = parsed.videos || [];
        const topVideo = summary.topVideo || videos[0];

        return [
          `▶️ YouTube performance overview:`,
          `- Videos analyzed: ${summary.totalVideos ?? videos.length ?? '—'}`,
          `- Total views: ${summary.totalViews ?? '—'}`,
          `- Average views per video: ${summary.averageViews ?? '—'}`,
          topVideo
            ? `Top video: "${topVideo.title ?? 'Untitled'}" with ${topVideo.views ?? 0} views and ${
                topVideo.likes ?? 0
              } likes.`
            : 'Top video data unavailable.',
          videos.length
            ? `Recent highlights: ${videos
                .slice(0, 3)
                .map(
                  (video: any) =>
                    `• ${new Date(video.publishedAt).toLocaleDateString()} – ${video.views ?? 0} views`
                )
                .join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n');
      } catch (error: any) {
        console.error('❌ Analytics tool error:', error);
        return 'I tried to fetch your analytics but ran into an issue. Please try again in a moment.';
      }
    }

    const commentQuery = this.detectCommentQuery(question);
    if (commentQuery?.platform) {
      console.log(`🎯 Detected comment query for ${commentQuery.platform}, forcing tool call...`);
      const toolResult = await toolExecutor('get_latest_comment', {
        platform: commentQuery.platform,
        lookbackPosts: commentQuery.type === 'top' ? 50 : 5,
        requestedCount: commentQuery.count || 10,
      });
      
      const parsedResult = JSON.parse(toolResult);
      if (parsedResult.success && parsedResult.allComments) {
        const platformName = commentQuery.platform === 'instagram' ? 'Instagram' : 'YouTube';
        
        // Check if user wants multiple comments (top 10, list, etc.)
        if (commentQuery.type === 'top') {
          const requestedCount = commentQuery.count || 10;
          const commentsToShow = parsedResult.allComments.slice(0, requestedCount);
          let response = `Here are the top ${commentsToShow.length} most recent comments on your ${platformName} account:\n\n`;
          
          commentsToShow.forEach((comment: any, index: number) => {
            response += `${index + 1}. @${comment.username}: "${comment.text}"\n`;
            response += `   Posted: ${new Date(comment.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} | ${comment.likeCount} like${comment.likeCount !== 1 ? 's' : ''}\n\n`;
          });
          
          response += `Scanned ${parsedResult.totalCommentsScanned} comments across ${parsedResult.scannedPosts} posts.`;
          return response;
        } else {
          // Single latest comment
          const comment = parsedResult.latestComment;
          return `The latest comment on your ${platformName} account is from @${comment.username}: "${comment.text}". It was posted on ${new Date(comment.timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}. This comment received ${comment.likeCount} like${comment.likeCount !== 1 ? 's' : ''}.`;
        }
      } else {
        return parsedResult.message || 'No recent comments found on your posts.';
      }
    }

    const systemPrompt = `You are Orin AI, a helpful social media management assistant with access to powerful tools.

You can help users:
- Get analytics from Instagram and YouTube
- Post content to multiple platforms
- Generate optimized captions
- Manage their social media presence

Before taking any action, reason about the user's request:
- If the user simply greets you or asks something general, respond warmly, keep it concise, and ask what help they need. Do NOT fetch analytics or call tools unless the request explicitly requires data.
- When a user clearly asks for metrics, insights, posting, or content generation, choose the most relevant tool and only fetch the data you truly need.
- Summaries should be tailored to the question. Avoid dumping unnecessary account details.
- Never expose internal reasoning markers like <thinking>...</thinking> or any system notes in the reply. Keep responses natural and user-friendly.
- If the user asks about comments (latest, top comments, second last comment, etc.), you must call the most appropriate comment tool (prefer get_latest_comment for "latest" or "top" requests, or get_instagram_comments / get_youtube_comments if they reference a specific post/video). Do not fabricate comment data.

Always provide helpful, actionable insights based on the data you retrieve.`;

    const conversationHistory: any[] = [];

    if (options?.priorMessages?.length) {
      console.log(`📜 Loading ${options.priorMessages.length} prior messages into conversation history`);
      for (const msg of options.priorMessages) {
        conversationHistory.push({
          role: msg.role,
          content: [{ text: msg.content }],
        });
      }
    } else {
      console.log(`🆕 Starting fresh conversation (no prior messages)`);
    }

    const userContent = `${systemPrompt}\n\nUser Question: ${question}\n\nContext:\n${JSON.stringify(context, null, 2)}\n\nRemember: Only fetch new data via tools if it genuinely helps answer the question.`;

    conversationHistory.push({
      role: 'user',
      content: [{ text: userContent }],
    });

    let continueLoop = true;
    let maxIterations = 5;
    let iteration = 0;

    while (continueLoop && iteration < maxIterations) {
      iteration++;

      const toolSpecs = AVAILABLE_TOOLS.map(tool => ({
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: {
            json: tool.inputSchema,
          },
        },
      }));

      console.log(`🔧 Iteration ${iteration}: Passing ${AVAILABLE_TOOLS.length} tools to Bedrock:`, AVAILABLE_TOOLS.map(t => t.name).join(', '));

      const command = new ConverseCommand({
        modelId: BEDROCK_INFERENCE_PROFILE_ARN || BEDROCK_MODEL_ID,
        messages: conversationHistory,
        toolConfig: {
          tools: toolSpecs,
        },
        inferenceConfig: {
          maxTokens: 2000,
          temperature: 0.7,
        },
      });

      const response = await bedrockClient.send(command);
      const assistantMessage = response.output?.message;

      if (!assistantMessage) {
        throw new Error('No response from Bedrock');
      }

      conversationHistory.push(assistantMessage);

      const stopReason = response.stopReason;
      console.log(`🤖 Bedrock stopReason: ${stopReason}`);

      if (stopReason === 'tool_use') {
        const toolUseBlocks = assistantMessage.content?.filter(
          (block: any) => block?.toolUse
        ) || [];

        const toolResults: any[] = [];

        for (const block of toolUseBlocks) {
          const toolUse = block?.toolUse;
          if (!toolUse?.name) {
            console.warn('Received malformed toolUse block, skipping:', block);
            continue;
          }

          const toolName: string = toolUse.name;
          const toolInput = toolUse.input || {};
          const toolUseId = toolUse.toolUseId || `${toolName}-${Date.now()}`;

          console.log(`🔧 LLM requested tool: ${toolName}`, toolInput);

          const toolResult = await toolExecutor(toolName, toolInput);

          toolResults.push({
            toolResult: {
              toolUseId,
              content: [{ text: toolResult }],
            },
          });
        }

        conversationHistory.push({
          role: 'user',
          content: toolResults,
        });
      } else {
        continueLoop = false;

        const textBlocks = assistantMessage.content?.filter(
          (block: any) => block.text
        ) || [];
        const finalResponse = textBlocks.map((block: any) => block.text).join('\n');

        console.log(`✅ Final response generated (${finalResponse.length} chars), no tool calls made`);
        return finalResponse || 'I apologize, but I was unable to generate a response.';
      }
    }

    return 'I apologize, but I reached the maximum number of tool calls. Please try rephrasing your question.';
  }

  async answerQuestion(question: string, context: any): Promise<string> {
    const prompt = `You are Orin AI, a helpful social media management assistant. Answer the user's question based on their connected social media accounts data.

User Question: ${question}

Available Context (Connected Accounts & Data):
${JSON.stringify(context, null, 2)}

Provide a helpful, accurate, and concise answer. If the data needed to answer the question is not available in the context, politely explain what information is missing and suggest how the user can get it. Use emojis to make the response friendly and engaging.`;

    return await this.invokeWithFallback(prompt, 1000);
  }
}

export const bedrockService = new BedrockService();
