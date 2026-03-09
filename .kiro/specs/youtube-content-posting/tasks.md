# Implementation Plan: YouTube Content Posting

## Overview

This implementation plan breaks down the YouTube content posting feature into discrete, incremental coding tasks. The approach follows the established Instagram integration pattern, implementing backend services first, then controllers and routes, followed by frontend components. Each task builds on previous work, with testing integrated throughout to validate functionality early.

## Tasks

- [x] 1. Set up TypeScript types and interfaces
  - Extend PlatformType union to include 'youtube'
  - Create YouTubeChannel, YouTubeVideo, VideoMetadata, TokenResponse, ChannelInfo, and VideoUploadResponse interfaces
  - Update ConnectedAccount interface to support YouTube metadata fields
  - Create YouTube-specific error types
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 2. Implement YouTube Service (Backend)
  - [x] 2.1 Create youtube.service.ts with OAuth token exchange methods
    - Implement exchangeCodeForTokens method for OAuth code exchange
    - Implement refreshAccessToken method for token refresh
    - Add token expiry checking logic
    - _Requirements: 1.3, 7.1, 7.2_

  - [-] 2.2 Write property test for token exchange
    - **Property 2: Token Exchange and Storage**
    - **Validates: Requirements 1.3, 1.4**

  - [~] 2.3 Write property test for automatic token refresh
    - **Property 28: Automatic Token Refresh**
    - **Validates: Requirements 7.1, 7.5**

  - [~] 2.4 Implement channel information retrieval methods
    - Implement getChannelInfo method to fetch channel data from YouTube API
    - Implement getChannelStatistics method for analytics
    - Add error handling for API failures
    - _Requirements: 1.5, 13.1, 13.2, 13.3_

  - [~] 2.5 Write property test for channel info retrieval
    - **Property 3: Channel Information Retrieval**
    - **Validates: Requirements 1.5, 1.6**

  - [~] 2.6 Implement video upload methods
    - Implement uploadVideo method with resumable upload support
    - Implement validateVideoMetadata method
    - Add file size checking for protocol selection (>5MB uses resumable)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [~] 2.7 Write property tests for metadata validation
    - **Property 16: Title Validation**
    - **Property 17: Description Validation**
    - **Property 18: Tags Validation**
    - **Property 19: Privacy Status Validation**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6**

  - [~] 2.8 Write property test for resumable upload protocol
    - **Property 15: Resumable Upload Protocol Selection**
    - **Validates: Requirements 5.2**

  - [~] 2.9 Write unit tests for video upload error scenarios
    - Test quota exceeded errors
    - Test invalid metadata errors
    - Test network failure handling
    - _Requirements: 5.8, 12.2, 12.3_

- [ ] 3. Implement YouTube Controller (Backend)
  - [~] 3.1 Create youtube.controller.ts with OAuth connection methods
    - Implement initiateConnection method to generate OAuth URL
    - Implement handleCallback method for OAuth callback processing
    - Add environment variable validation for Google OAuth credentials
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [~] 3.2 Write property test for OAuth URL generation
    - **Property 1: OAuth URL Generation**
    - **Validates: Requirements 1.1, 1.2**

  - [~] 3.3 Write property test for OAuth error handling
    - **Property 4: OAuth Error Handling**
    - **Validates: Requirements 1.7, 12.1**

  - [~] 3.4 Implement account management methods
    - Implement getConnectedAccounts method with token sanitization
    - Implement disconnectAccount method with active channel reassignment
    - Implement setActiveAccount method with single active channel enforcement
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

  - [~] 3.5 Write property tests for account management
    - **Property 6: Duplicate Channel Detection**
    - **Property 7: Channel Update vs Create**
    - **Property 10: Single Active Channel Invariant**
    - **Property 11: Active Channel Switching**
    - **Property 13: Active Channel Reassignment**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6, 2.7, 3.3, 4.1, 4.2**

  - [~] 3.6 Write property test for token sanitization
    - **Property 35: Response Token Sanitization**
    - **Validates: Requirements 11.4**

  - [~] 3.7 Implement video upload controller method
    - Implement uploadVideo method with multipart file handling
    - Add active channel credential retrieval
    - Add post history recording
    - _Requirements: 5.1, 5.2, 5.7, 5.8, 6.1, 6.4_

  - [~] 3.8 Write property test for upload response
    - **Property 20: Video Upload Response**
    - **Validates: Requirements 5.7**

- [~] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Implement YouTube Routes (Backend)
  - Create youtube.routes.ts with all API endpoints
  - Add GET /youtube/connect route with authentication
  - Add GET /youtube/callback route without authentication
  - Add GET /youtube/accounts route with authentication
  - Add DELETE /youtube/accounts/:accountId route with authentication
  - Add PUT /youtube/accounts/:accountId/activate route with authentication
  - Add POST /youtube/upload route with authentication and multipart support
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [~] 5.1 Write property test for route authentication
  - **Property 33: Route Authentication**
  - **Validates: Requirements 10.7**

- [~] 5.2 Write unit tests for each route endpoint
  - Test /connect returns OAuth URL
  - Test /callback processes OAuth and stores credentials
  - Test /accounts returns sanitized channel list
  - Test /accounts/:accountId DELETE removes channel
  - Test /accounts/:accountId/activate sets active channel
  - Test /upload handles video upload
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [~] 6. Integrate YouTube routes into main server
  - Import youtube routes in server.ts
  - Register routes with /api prefix
  - Test route registration with curl or Postman
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 7. Implement Frontend YouTube Service
  - [~] 7.1 Create lib/youtube.ts with service methods
    - Define YouTubeAccount interface
    - Implement connectAccount method with popup window
    - Implement getConnectedAccounts method
    - Implement disconnectAccount method
    - Implement setActiveAccount method
    - Implement uploadVideo method with multipart form data
    - Add JWT token inclusion in all requests
    - Add error handling with descriptive messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [~] 7.2 Write property test for authentication header inclusion
    - **Property 31: Authentication Header Inclusion**
    - **Validates: Requirements 9.5**

  - [~] 7.3 Write property test for error propagation
    - **Property 32: Frontend Error Propagation**
    - **Validates: Requirements 9.6**

  - [~] 7.4 Write unit tests for each service method
    - Test connectAccount opens popup with correct URL
    - Test getConnectedAccounts returns channel array
    - Test disconnectAccount calls correct endpoint
    - Test setActiveAccount calls correct endpoint
    - Test uploadVideo sends multipart form data
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8. Implement YouTube Accounts Component (Frontend)
  - [~] 8.1 Create youtube-accounts.tsx component
    - Set up component state (accounts, loading, disconnectingId)
    - Implement loadAccounts function
    - Add useEffect for initial load and postMessage listener
    - _Requirements: 8.1, 8.4_

  - [~] 8.2 Implement component UI
    - Add Card with header and "Connect Account" button
    - Add channel list with Avatar, title, subscriber count, active badge
    - Add "Set Active" and "Disconnect" buttons for each channel
    - Add empty state with connect button
    - Add loading state
    - _Requirements: 2.5, 8.2, 8.8_

  - [~] 8.3 Implement event handlers
    - Implement handleConnect to open OAuth popup
    - Implement handleDisconnect with confirmation dialog
    - Implement handleSetActive to activate channel
    - Implement handleMessage for OAuth completion
    - Add toast notifications for success/error
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 12.7_

  - [~] 8.4 Write unit tests for component
    - Test component renders channel list
    - Test connect button opens OAuth popup
    - Test disconnect shows confirmation dialog
    - Test set active calls API
    - Test postMessage updates channel list
    - Test empty state displays correctly
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [~] 9. Add YouTube Accounts Component to Settings Page
  - Import YouTubeAccounts component in settings page
  - Add component to settings layout alongside Instagram accounts
  - Test component renders and functions correctly
  - _Requirements: 8.1, 8.2_

- [~] 10. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Multi-Platform Posting Integration
  - [~] 11.1 Update multi-platform post component to support YouTube
    - Add YouTube checkbox to platform selection
    - Add video file input for YouTube posts
    - Add YouTube-specific metadata fields (title, description, tags, privacy)
    - _Requirements: 6.1, 6.2, 6.3_

  - [~] 11.2 Update post submission logic
    - Retrieve active YouTube channel when YouTube selected
    - Execute YouTube upload in parallel with other platforms
    - Handle YouTube-specific media routing (video vs image)
    - Record YouTube video ID in post history
    - Handle YouTube upload failures gracefully
    - Return multi-platform summary with per-platform status
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 11.3 Write property tests for multi-platform posting
    - **Property 22: Active Channel Credential Retrieval**
    - **Property 23: Parallel Platform Posting**
    - **Property 24: Media Type Routing**
    - **Property 25: Post History Recording**
    - **Property 26: Failure Isolation**
    - **Property 27: Multi-Platform Summary**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

  - [~] 11.4 Write integration tests for multi-platform posting
    - Test posting to YouTube + Instagram
    - Test YouTube failure doesn't block other platforms
    - Test post history records all platform results
    - _Requirements: 6.2, 6.5, 6.6_

- [ ] 12. Implement Token Encryption/Decryption
  - [~] 12.1 Create encryption utility functions
    - Implement encrypt function using crypto library
    - Implement decrypt function
    - Use environment variable for encryption key
    - _Requirements: 1.4, 11.1, 11.2, 11.3_

  - [~] 12.2 Update controller to encrypt tokens before storage
    - Encrypt access tokens before DynamoDB put
    - Encrypt refresh tokens before DynamoDB put
    - _Requirements: 1.4, 11.1, 11.2_

  - [~] 12.3 Update service to decrypt tokens before use
    - Decrypt access tokens when retrieved from database
    - Decrypt refresh tokens when retrieved from database
    - _Requirements: 11.3_

  - [~] 12.4 Write property test for encryption round-trip
    - **Property 34: Token Decryption for Use**
    - **Validates: Requirements 11.3**

- [ ] 13. Implement Analytics Caching
  - [~] 13.1 Add caching layer for channel statistics
    - Create in-memory cache with 1-hour TTL
    - Check cache before making YouTube API calls
    - Store analytics in cache after fetching
    - _Requirements: 13.6_

  - [~] 13.2 Update getChannelStatistics to use cache
    - Check cache for existing analytics
    - Fetch from API if cache miss or expired
    - Update cache with fresh data
    - _Requirements: 13.6_

  - [~] 13.3 Write property test for analytics caching
    - **Property 39: Analytics Caching**
    - **Validates: Requirements 13.6**

  - [~] 13.4 Write unit tests for cache behavior
    - Test cache hit returns cached data
    - Test cache miss fetches from API
    - Test cache expiry after 1 hour
    - _Requirements: 13.6_

- [ ] 14. Add Error Handling and User Feedback
  - [~] 14.1 Implement comprehensive error handling in controller
    - Add specific error messages for quota exceeded
    - Add specific error messages for invalid metadata
    - Add specific error messages for token refresh failures
    - Add specific error messages for network errors
    - Add specific error messages for rate limits
    - _Requirements: 12.2, 12.3, 12.5, 12.6_

  - [~] 14.2 Update frontend to display error notifications
    - Add toast notifications for all error types
    - Add success notifications for all operations
    - Include relevant details in notifications
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [~] 14.3 Write property test for validation error specificity
    - **Property 36: Validation Error Specificity**
    - **Validates: Requirements 12.3**

  - [~] 14.4 Write unit tests for error scenarios
    - Test quota exceeded error message
    - Test invalid metadata error messages
    - Test token refresh failure message
    - Test network error message
    - Test rate limit error message
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6_

- [~] 15. Add Environment Variables and Configuration
  - Add GOOGLE_CLIENT_ID to backend .env
  - Add GOOGLE_CLIENT_SECRET to backend .env
  - Add YOUTUBE_REDIRECT_URI to backend .env
  - Add ENCRYPTION_KEY to backend .env
  - Update .env.example files with new variables
  - Document environment variables in README
  - _Requirements: 1.1, 1.3, 11.1, 11.2_

- [ ] 16. Final Integration Testing
  - [~] 16.1 Test complete OAuth flow end-to-end
    - Test connecting first YouTube channel
    - Test connecting additional channels
    - Test reconnecting existing channel
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.1, 2.2, 2.3_

  - [~] 16.2 Test account management flows
    - Test viewing connected channels
    - Test setting active channel
    - Test disconnecting channels
    - Test active channel reassignment
    - _Requirements: 2.5, 2.6, 2.7, 3.1, 3.3, 4.1, 4.2, 4.3_

  - [~] 16.3 Test video upload flow
    - Test uploading video with valid metadata
    - Test uploading large video (>5MB)
    - Test validation errors
    - Test upload success notification
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [~] 16.4 Test multi-platform posting
    - Test posting to YouTube + Instagram simultaneously
    - Test YouTube failure isolation
    - Test post history recording
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 16.5 Test token refresh flow
    - Test automatic token refresh on expiry
    - Test token update persistence
    - Test invalid refresh token handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [~] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows the Instagram pattern for consistency
- Token encryption is critical for security and must be implemented
- Analytics caching reduces API quota usage
- Error handling provides clear user feedback for all failure scenarios
