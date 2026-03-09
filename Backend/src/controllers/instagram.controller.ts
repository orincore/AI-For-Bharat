import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBService } from '../services/dynamodb.service';
import { TABLES } from '../config/aws';
import { AuthRequest } from '../middleware/auth';
import { ConnectedAccount } from '../types';

export class InstagramController {
  async initiateConnection(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const clientId = process.env.META_APP_ID;
      const redirectUri = `${process.env.BACKEND_URL}/api/instagram/callback`;

      if (!clientId || !process.env.META_APP_SECRET) {
        console.error('META_APP_ID or META_APP_SECRET missing from environment variables');
        return res.status(500).json({
          success: false,
          error: 'Instagram integration not configured. Please set META_APP_ID and META_APP_SECRET.',
        });
      }

      const scopeList = [
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'instagram_manage_messages',
        'instagram_manage_insights',
        'instagram_manage_comments',
        'instagram_content_publish',
        'instagram_basic',
        'business_management',
      ];
      const scopes = encodeURIComponent(scopeList.join(','));

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${userId}` +
        `&response_type=code` +
        `&scope=${scopes}`;

      res.json({
        success: true,
        data: { authUrl },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async handleCallback(req: AuthRequest, res: Response) {
    try {
      console.log('📸 Instagram OAuth callback initiated');
      const { code, state: userId } = req.query;
      console.log('📸 Callback params:', { hasCode: !!code, userId });

      if (!code || !userId) {
        console.error('❌ Missing code or userId in callback');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_auth_failed`);
      }

      const clientId = process.env.META_APP_ID;
      const clientSecret = process.env.META_APP_SECRET;
      const redirectUri = `${process.env.BACKEND_URL}/api/instagram/callback`;

      if (!clientId || !clientSecret) {
        console.error('META_APP_ID or META_APP_SECRET missing from environment variables');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_config_missing`);
      }

      const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' +
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code as string,
        })
      );

      const tokenData = await tokenResponse.json() as any;
      console.log('📸 Token exchange response:', { hasAccessToken: !!tokenData.access_token, error: tokenData.error });
      if (!tokenData.access_token) {
        console.error('❌ Failed to get access token:', tokenData);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_token_failed`);
      }

      // Exchange short-lived user token for long-lived token
      const longLivedTokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: tokenData.access_token,
        })
      );
      const longLivedToken = await longLivedTokenResponse.json() as any;
      console.log('📸 Long-lived token response:', { hasAccessToken: !!longLivedToken.access_token, expiresIn: longLivedToken.expires_in });

      if (!longLivedToken.access_token) {
        console.error('❌ Failed to get long-lived token:', longLivedToken);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_long_token_failed`);
      }

      // Get user pages (needs pages_show_list permission)
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken.access_token}` +
        `&fields=id,name,access_token,instagram_business_account`
      );
      const pagesData = await pagesResponse.json() as any;
      console.log('📸 Pages response:', { 
        totalPages: pagesData.data?.length || 0, 
        error: pagesData.error,
        pages: pagesData.data?.map((p: any) => ({ id: p.id, name: p.name, hasIG: !!p.instagram_business_account }))
      });

      const pagesWithInstagram = pagesData.data?.filter((page: any) => page?.instagram_business_account) || [];
      console.log('📸 Pages with Instagram:', pagesWithInstagram.length);

      if (!pagesWithInstagram.length) {
        console.error('❌ No pages with Instagram business accounts found');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_instagram_pages`);
      }

      const connections = [];

      for (const page of pagesWithInstagram) {
        const instagramAccount = page.instagram_business_account;
        if (!instagramAccount) continue;

        const igProfileResponse = await fetch(
          `https://graph.facebook.com/v19.0/${instagramAccount.id}?fields=name,username,profile_picture_url&access_token=${page.access_token}`
        );
        const igProfile = await igProfileResponse.json() as any;
        console.log('📸 IG Profile fetched:', { id: instagramAccount.id, username: igProfile.username, error: igProfile.error });

        const userAccounts = await dynamoDBService.queryByIndex(
          TABLES.CONNECTED_ACCOUNTS,
          'UserPlatformIndex',
          '#userId = :userId AND #platform = :platform',
          {
            ':userId': userId,
            ':platform': 'instagram',
          },
          {
            '#userId': 'userId',
            '#platform': 'platform',
          }
        );

        const existingAccounts = (userAccounts as ConnectedAccount[]).filter(
          (acc) => acc.platformAccountId === instagramAccount.id
        );
        const existing = existingAccounts[0];
        const hasAnyAccounts = (userAccounts as ConnectedAccount[]).length > 0;

        const account: ConnectedAccount = {
          id: existing ? existing.id : uuidv4(),
          userId: userId as string,
          platform: 'instagram',
          platformAccountId: instagramAccount.id,
          platformUsername: igProfile.username,
          profilePicture: igProfile.profile_picture_url,
          accessToken: page.access_token,
          refreshToken: longLivedToken.access_token,
          tokenExpiry: new Date(Date.now() + (longLivedToken.expires_in || 0) * 1000).toISOString(),
          isActive: existing ? existing.isActive : !hasAnyAccounts,
          pageId: page.id,
          pageName: page.name,
          scopes: tokenData.granted_scopes || [],
          metaAccessToken: longLivedToken.access_token,
          createdAt: existing ? existing.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('📸 Saving account to DynamoDB:', { 
          id: account.id, 
          userId: account.userId,
          username: account.platformUsername,
          table: TABLES.CONNECTED_ACCOUNTS
        });
        await dynamoDBService.put(TABLES.CONNECTED_ACCOUNTS, account);
        console.log('✅ Account saved successfully');
        connections.push({
          id: account.id,
          username: account.platformUsername,
          platformAccountId: account.platformAccountId,
        });
      }

      if (!connections.length) {
        console.error('❌ No connections were created');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=no_instagram_accounts`);
      }

      console.log('✅ Instagram connection successful. Total accounts:', connections.length);
      console.log('📸 Sending postMessage with accounts:', connections);

      res.send(`
        <html>
          <head><title>Instagram Connected</title></head>
          <body>
            <script>
              window.opener.postMessage({ type: 'INSTAGRAM_CONNECTED', accounts: ${JSON.stringify(connections)} }, '${process.env.FRONTEND_URL}');
              window.close();
            </script>
            <p>Instagram account connected successfully! This window will close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Instagram callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_connection_failed`);
    }
  }

  async getConnectedAccounts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const accounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': 'instagram',
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      );

      const sanitizedAccounts = (accounts as ConnectedAccount[]).map((acc: ConnectedAccount) => ({
        id: acc.id,
        platformAccountId: acc.platformAccountId,
        platformUsername: acc.platformUsername,
        profilePicture: acc.profilePicture,
        isActive: acc.isActive,
        createdAt: acc.createdAt,
        pageName: acc.pageName,
      }));

      res.json({
        success: true,
        data: sanitizedAccounts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async disconnectAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { accountId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      await dynamoDBService.delete(TABLES.CONNECTED_ACCOUNTS, { id: accountId });

      res.json({
        success: true,
        message: 'Instagram account disconnected successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async setActiveAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { accountId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const allAccounts = await dynamoDBService.queryByIndex(
        TABLES.CONNECTED_ACCOUNTS,
        'UserPlatformIndex',
        '#userId = :userId AND #platform = :platform',
        {
          ':userId': userId,
          ':platform': 'instagram',
        },
        {
          '#userId': 'userId',
          '#platform': 'platform',
        }
      );

      for (const account of allAccounts) {
        await dynamoDBService.updateAttributes(
          TABLES.CONNECTED_ACCOUNTS,
          { id: account.id },
          { isActive: account.id === accountId }
        );
      }

      res.json({
        success: true,
        message: 'Active Instagram account updated',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const instagramController = new InstagramController();
