import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { youtubeService } from '../services/youtube.service';
import { dynamoDBService } from '../services/dynamodb.service';
import { TABLES } from '../config/aws';
import { ConnectedAccount } from '../types';
import { v4 as uuidv4 } from 'uuid';

class YouTubeController {
  initiateConnection = async (req: AuthRequest, res: Response) => {
    try {
      console.log('🎥 YouTube OAuth connection initiated');
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const clientId = process.env.YOUTUBE_CLIENT_ID;
      const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/youtube/callback`;
      
      if (!clientId) {
        console.error('YOUTUBE_CLIENT_ID missing from environment variables');
        return res.status(500).json({ success: false, error: 'YouTube configuration missing' });
      }

      const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${userId}`;

      console.log('🎥 Returning YouTube OAuth URL:', { userId, redirectUri });
      return res.json({
        success: true,
        data: {
          authUrl,
        },
      });
    } catch (error: any) {
      console.error('❌ YouTube connection error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  handleCallback = async (req: AuthRequest, res: Response) => {
    try {
      console.log('🎥 YouTube OAuth callback initiated');
      const { code, state: userId } = req.query;
      console.log('🎥 Callback params:', { hasCode: !!code, userId });

      if (!code || !userId) {
        console.error('❌ Missing code or userId in callback');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=youtube_auth_failed`);
      }

      const clientId = process.env.YOUTUBE_CLIENT_ID;
      const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
      const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/youtube/callback`;

      if (!clientId || !clientSecret) {
        console.error('YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET missing from environment variables');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=youtube_config_missing`);
      }

      console.log('🎥 Exchanging code for tokens...');
      const tokenData = await youtubeService.exchangeCodeForTokens(code as string, redirectUri);
      console.log('🎥 Token exchange response:', { hasAccessToken: !!tokenData.access_token, hasRefreshToken: !!tokenData.refresh_token });

      if (!tokenData.access_token) {
        console.error('❌ Failed to get access token:', tokenData);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=youtube_token_failed`);
      }

      console.log('🎥 Fetching channel info...');
      const channel = await this.fetchYouTubeChannel(tokenData.access_token);

      if (!channel) {
        console.error('❌ No YouTube channel found for this account');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_youtube_channel`);
      }
      const channelId = channel.id;
      const channelTitle = channel.snippet.title;
      const channelThumbnail = channel.snippet.thumbnails?.default?.url;
      const subscriberCount = channel.statistics?.subscriberCount;

      console.log('🎥 Channel found:', { channelId, channelTitle, subscriberCount });

      const userAccounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': 'youtube',
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      );

      const existingAccounts = (userAccounts as ConnectedAccount[]).filter(
        (acc) => acc.platformAccountId === channelId
      );
      const existing = existingAccounts[0];
      const hasAnyAccounts = (userAccounts as ConnectedAccount[]).length > 0;

      const tokenExpiry = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      const account: ConnectedAccount = {
        id: existing ? existing.id : uuidv4(),
        userId: userId as string,
        platform: 'youtube',
        platformAccountId: channelId,
        platformUsername: channelTitle,
        profilePicture: channelThumbnail,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry,
        isActive: existing ? existing.isActive : !hasAnyAccounts,
        metadata: {
          subscriberCount,
          channelId,
        },
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('🎥 Saving account to DynamoDB:', {
        id: account.id,
        userId: account.userId,
        channelTitle: account.platformUsername,
        table: TABLES.CONNECTED_ACCOUNTS,
      });

      await dynamoDBService.put(TABLES.CONNECTED_ACCOUNTS, account);
      console.log('✅ YouTube account saved successfully');

      const successHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>YouTube Connected</title>
            <script>
              window.opener?.postMessage({
                type: 'YOUTUBE_CONNECTED',
                channel: {
                  id: '${account.id}',
                  channelId: '${channelId}',
                  title: '${channelTitle.replace(/'/g, "\\'")}',
                  thumbnail: '${channelThumbnail || ''}',
                  subscribers: '${subscriberCount || ''}'
                }
              }, '${process.env.FRONTEND_URL}');
              setTimeout(() => window.close(), 1000);
            </script>
          </head>
          <body>
            <h2>YouTube channel connected successfully!</h2>
            <p>You can close this window.</p>
          </body>
        </html>
      `;

      res.send(successHtml);
    } catch (error: any) {
      console.error('❌ YouTube callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=youtube_callback_failed`);
    }
  }

  getConnectedChannel = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const accounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': 'youtube',
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      );

      const youtubeAccounts = accounts as ConnectedAccount[];
      const activeAccount = youtubeAccounts.find((acc) => acc.isActive) || youtubeAccounts[0];

      if (!activeAccount) {
        return res.json({ success: true, data: null });
      }

      const channelData = {
        channelId: activeAccount.platformAccountId,
        title: activeAccount.platformUsername,
        thumbnail: activeAccount.profilePicture,
        subscribers: activeAccount.metadata?.subscriberCount,
      };

      res.json({ success: true, data: channelData });
    } catch (error: any) {
      console.error('❌ Error fetching YouTube channel:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  disconnectChannel = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const accounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': 'youtube',
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      );

      const youtubeAccounts = accounts as ConnectedAccount[];

      for (const account of youtubeAccounts) {
        await dynamoDBService.delete(TABLES.CONNECTED_ACCOUNTS, { id: account.id });
        console.log('🎥 Deleted YouTube account:', account.id);
      }

      res.json({ success: true, message: 'YouTube channel disconnected successfully' });
    } catch (error: any) {
      console.error('❌ Error disconnecting YouTube channel:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  private fetchYouTubeChannel = async (accessToken: string) => {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/channels';

    const requestAttempts = [
      { part: 'snippet,statistics', mine: true },
      { part: 'snippet,statistics', mine: true, key: process.env.YOUTUBE_API_KEY },
    ];

    for (const params of requestAttempts) {
      try {
        const response = await axios.get(baseUrl, {
          params,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (response.data?.items?.length) {
          console.log('🎥 Channel data fetched successfully');
          return response.data.items[0];
        }

        console.warn('⚠️ YouTube channel request returned no items', { params, response: response.data });
      } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('❌ Failed to fetch YouTube channel info:', errorData);

        // If unauthorized, no need to retry with additional params
        if (error.response?.status === 401) {
          break;
        }
      }
    }

    return null;
  }
}

export const youtubeController = new YouTubeController();
