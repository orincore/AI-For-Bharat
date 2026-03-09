import axios from 'axios';
import * as fc from 'fast-check';
import { YouTubeService } from '../services/youtube.service';
import {
  YouTubeInvalidCredentialsError,
  YouTubeTokenRefreshError,
  TokenResponse,
} from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YouTubeService - OAuth Token Management', () => {
  let youtubeService: YouTubeService;

  beforeEach(() => {
    youtubeService = new YouTubeService();
    jest.clearAllMocks();
  });

  describe('exchangeCodeForTokens', () => {
    it('should successfully exchange authorization code for tokens', async () => {
      const mockTokenResponse = {
        access_token: 'ya29.test_access_token',
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      const result = await youtubeService.exchangeCodeForTokens(
        'test_auth_code',
        'http://localhost:3001/api/youtube/callback'
      );

      expect(result).toEqual(mockTokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          code: 'test_auth_code',
          grant_type: 'authorization_code',
        }),
        expect.any(Object)
      );
    });

    it('should throw YouTubeInvalidCredentialsError on failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'invalid_grant' } },
      });

      await expect(
        youtubeService.exchangeCodeForTokens('invalid_code', 'http://localhost:3001/api/youtube/callback')
      ).rejects.toThrow(YouTubeInvalidCredentialsError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockTokenResponse = {
        access_token: 'ya29.new_access_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      const result = await youtubeService.refreshAccessToken('test_refresh_token');

      expect(result).toEqual(mockTokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          refresh_token: 'test_refresh_token',
          grant_type: 'refresh_token',
        }),
        expect.any(Object)
      );
    });

    it('should throw YouTubeTokenRefreshError on failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'invalid_grant' } },
      });

      await expect(
        youtubeService.refreshAccessToken('invalid_refresh_token')
      ).rejects.toThrow(YouTubeTokenRefreshError);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      expect(youtubeService.isTokenExpired(pastDate)).toBe(true);
    });

    it('should return true for token expiring within 5 minutes', () => {
      const soonDate = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes from now
      expect(youtubeService.isTokenExpired(soonDate)).toBe(true);
    });

    it('should return false for valid token with time remaining', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
      expect(youtubeService.isTokenExpired(futureDate)).toBe(false);
    });
  });
});

// Property-Based Tests
describe('YouTubeService - Property-Based Tests', () => {
  let youtubeService: YouTubeService;

  beforeEach(() => {
    youtubeService = new YouTubeService();
    jest.clearAllMocks();
  });

  // Feature: youtube-content-posting, Property 2: Token Exchange and Storage
  // **Validates: Requirements 1.3, 1.4**
  describe('Property 2: Token Exchange and Storage', () => {
    it('should successfully exchange any valid authorization code for access and refresh tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            authCode: fc.string({ minLength: 10, maxLength: 100 }),
            redirectUri: fc.webUrl(),
            accessToken: fc.string({ minLength: 20, maxLength: 200 }),
            refreshToken: fc.string({ minLength: 20, maxLength: 200 }),
            expiresIn: fc.integer({ min: 300, max: 7200 }), // 5 minutes to 2 hours
            scope: fc.constantFrom(
              'https://www.googleapis.com/auth/youtube.upload',
              'https://www.googleapis.com/auth/youtube.readonly',
              'https://www.googleapis.com/auth/youtube.force-ssl',
              'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
            ),
          }),
          async ({ authCode, redirectUri, accessToken, refreshToken, expiresIn, scope }) => {
            // Arrange: Mock the token response from Google OAuth
            const mockTokenResponse: TokenResponse = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_in: expiresIn,
              token_type: 'Bearer',
              scope: scope,
            };

            mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

            // Act: Exchange the authorization code for tokens
            const result = await youtubeService.exchangeCodeForTokens(authCode, redirectUri);

            // Assert: Verify the token response structure and content
            // Property: For any valid authorization code, the system should return tokens
            expect(result).toBeDefined();
            expect(result.access_token).toBe(accessToken);
            expect(result.refresh_token).toBe(refreshToken);
            expect(result.expires_in).toBe(expiresIn);
            expect(result.token_type).toBe('Bearer');
            expect(result.scope).toBe(scope);

            // Verify the OAuth endpoint was called with correct parameters
            expect(mockedAxios.post).toHaveBeenCalledWith(
              'https://oauth2.googleapis.com/token',
              expect.objectContaining({
                code: authCode,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
              }),
              expect.objectContaining({
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              })
            );

            // Property: The response should always contain required token fields
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('expires_in');
            expect(result).toHaveProperty('token_type');
            expect(result).toHaveProperty('scope');

            // Property: Access token should be a non-empty string
            expect(typeof result.access_token).toBe('string');
            expect(result.access_token.length).toBeGreaterThan(0);

            // Property: Refresh token should be present for offline access
            expect(result.refresh_token).toBeDefined();
            expect(typeof result.refresh_token).toBe('string');
            expect(result.refresh_token!.length).toBeGreaterThan(0);

            // Property: Expires_in should be a positive integer
            expect(typeof result.expires_in).toBe('number');
            expect(result.expires_in).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle token exchange failures consistently for any invalid authorization code', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            invalidCode: fc.string({ minLength: 1, maxLength: 50 }),
            redirectUri: fc.webUrl(),
            errorType: fc.constantFrom('invalid_grant', 'invalid_request', 'unauthorized_client'),
          }),
          async ({ invalidCode, redirectUri, errorType }) => {
            // Arrange: Mock OAuth error response
            mockedAxios.post.mockRejectedValueOnce({
              response: {
                data: {
                  error: errorType,
                  error_description: 'Authorization code is invalid or expired',
                },
              },
            });

            // Act & Assert: Verify error handling
            // Property: For any invalid authorization code, the system should throw YouTubeInvalidCredentialsError
            await expect(
              youtubeService.exchangeCodeForTokens(invalidCode, redirectUri)
            ).rejects.toThrow(YouTubeInvalidCredentialsError);

            // Verify the OAuth endpoint was called
            expect(mockedAxios.post).toHaveBeenCalledWith(
              'https://oauth2.googleapis.com/token',
              expect.objectContaining({
                code: invalidCode,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
              }),
              expect.any(Object)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
