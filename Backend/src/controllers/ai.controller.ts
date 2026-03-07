import { Request, Response } from 'express';
import { bedrockService } from '../services/bedrock.service';

export class AIController {
  // Generate caption using AI
  async generateCaption(req: Request, res: Response) {
    try {
      const { caption, platform } = req.body;

      if (!caption) {
        return res.status(400).json({
          success: false,
          error: 'Caption is required',
        });
      }

      const generatedCaption = await bedrockService.generateCaption(
        caption,
        platform || 'Instagram'
      );

      res.json({
        success: true,
        caption: generatedCaption,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        caption: 'AI generation failed. Please try again.',
      });
    }
  }

  // Analyze content
  async analyzeContent(req: Request, res: Response) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
        });
      }

      const analysis = await bedrockService.analyzeContent(content);

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get AI recommendations
  async getRecommendations(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Mock recommendations - in production, this would use historical data
      const recommendations = {
        bestPostingTime: 'Tue & Sat, 6 - 8 PM',
        topPerformingPlatform: 'Instagram Reels',
        suggestedContentType: 'Behind-the-scenes video',
        trendingHashtags: ['#ContentCreator', '#SocialMedia', '#DigitalMarketing'],
        engagementTips: [
          'Post consistently at optimal times',
          'Use trending audio in Reels',
          'Engage with comments within first hour',
        ],
      };

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const aiController = new AIController();
