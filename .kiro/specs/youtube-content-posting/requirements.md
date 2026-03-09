# Requirements Document

## Introduction

This document specifies the requirements for implementing YouTube content posting functionality in the SocialOS platform. The feature enables users to connect their YouTube channels via OAuth 2.0, manage multiple channel connections, upload videos with metadata, and post content to YouTube alongside other social platforms. The implementation follows the existing Instagram integration pattern, using a controller-service-routes architecture on the backend and a component-based UI on the frontend.

## Glossary

- **YouTube_OAuth_Service**: The backend service that handles Google OAuth 2.0 authentication flow for YouTube channel access
- **YouTube_Controller**: The backend controller that manages HTTP requests for YouTube channel operations
- **YouTube_Service**: The backend service that interacts with YouTube Data API v3 for video operations
- **YouTube_Accounts_Component**: The frontend React component that displays and manages connected YouTube channels
- **Channel**: A YouTube channel that a user owns and can post content to
- **Video_Upload**: The process of uploading a video file with metadata to YouTube
- **Active_Channel**: The currently selected YouTube channel for posting operations
- **Connected_Account**: A database record storing YouTube channel credentials and metadata
- **Access_Token**: A short-lived OAuth token for YouTube API authentication
- **Refresh_Token**: A long-lived token used to obtain new access tokens
- **Video_Metadata**: Information about a video including title, description, tags, and privacy settings
- **Privacy_Setting**: YouTube video visibility option (public, unlisted, private)
- **Multi_Platform_Post**: A content posting operation that publishes to multiple social platforms simultaneously

## Requirements

### Requirement 1: YouTube OAuth Connection

**User Story:** As a user, I want to connect my YouTube channel using Google OAuth, so that I can authorize the platform to post videos on my behalf.

#### Acceptance Criteria

1. WHEN a user initiates YouTube connection, THE YouTube_OAuth_Service SHALL generate an OAuth authorization URL with required YouTube Data API v3 scopes
2. WHEN the OAuth URL is generated, THE YouTube_OAuth_Service SHALL include youtube.upload, youtube.readonly, and youtube.force-ssl scopes
3. WHEN a user completes OAuth authorization, THE YouTube_OAuth_Service SHALL exchange the authorization code for access and refresh tokens
4. WHEN tokens are obtained, THE YouTube_OAuth_Service SHALL store them encrypted in the CONNECTED_ACCOUNTS table
5. WHEN the OAuth callback is processed, THE YouTube_OAuth_Service SHALL retrieve the channel information including channel ID, title, and thumbnail
6. WHEN channel information is retrieved, THE System SHALL create a Connected_Account record with platform set to 'youtube'
7. IF OAuth authorization fails, THEN THE System SHALL redirect the user with an appropriate error message
8. WHEN a user has no existing YouTube channels connected, THE System SHALL set the newly connected channel as active by default

### Requirement 2: Multiple YouTube Channel Management

**User Story:** As a user, I want to connect and manage multiple YouTube channels, so that I can post content to different channels from one dashboard.

#### Acceptance Criteria

1. WHEN a user connects a new YouTube channel, THE System SHALL check for existing channel connections using the channel ID
2. IF a channel is already connected, THEN THE System SHALL update the existing record with new tokens and metadata
3. IF a channel is not already connected, THEN THE System SHALL create a new Connected_Account record
4. WHEN multiple channels are connected, THE System SHALL maintain separate access and refresh tokens for each channel
5. WHEN displaying connected channels, THE System SHALL show channel title, thumbnail, and active status for each channel
6. WHEN a user has multiple channels, THE System SHALL allow only one channel to be active at a time
7. WHEN a user sets a channel as active, THE System SHALL deactivate all other YouTube channels for that user

### Requirement 3: YouTube Channel Disconnection

**User Story:** As a user, I want to disconnect YouTube channels I no longer use, so that I can manage my connected accounts.

#### Acceptance Criteria

1. WHEN a user requests to disconnect a channel, THE System SHALL delete the Connected_Account record from the database
2. WHEN a channel is disconnected, THE System SHALL remove all associated tokens from storage
3. IF the disconnected channel was active and other channels exist, THEN THE System SHALL set the first remaining channel as active
4. WHEN a channel is successfully disconnected, THE System SHALL return a success confirmation to the user
5. WHEN the last YouTube channel is disconnected, THE System SHALL update the user interface to show no connected channels

### Requirement 4: Active Channel Selection

**User Story:** As a user, I want to select which YouTube channel is active, so that I can control which channel receives my posts.

#### Acceptance Criteria

1. WHEN a user selects a channel to activate, THE System SHALL set the isActive flag to true for that channel
2. WHEN a channel is activated, THE System SHALL set the isActive flag to false for all other YouTube channels belonging to that user
3. WHEN the active channel is updated, THE System SHALL persist the changes to the CONNECTED_ACCOUNTS table
4. WHEN the active channel changes, THE System SHALL return a success confirmation
5. WHEN displaying channels, THE System SHALL visually indicate which channel is currently active

### Requirement 5: Video Upload with Metadata

**User Story:** As a user, I want to upload videos to YouTube with title, description, tags, and privacy settings, so that I can publish complete video content.

#### Acceptance Criteria

1. WHEN a user uploads a video, THE YouTube_Service SHALL accept video file, title, description, tags array, and privacy setting as parameters
2. WHEN uploading a video, THE YouTube_Service SHALL use the resumable upload protocol for files larger than 5MB
3. WHEN video metadata is provided, THE YouTube_Service SHALL validate that title is not empty and does not exceed 100 characters
4. WHEN video metadata is provided, THE YouTube_Service SHALL validate that description does not exceed 5000 characters
5. WHEN tags are provided, THE YouTube_Service SHALL validate that no more than 500 characters total are used across all tags
6. WHEN privacy setting is provided, THE YouTube_Service SHALL validate it is one of: public, unlisted, or private
7. WHEN a video upload completes, THE YouTube_Service SHALL return the video ID and video URL
8. IF video upload fails, THEN THE YouTube_Service SHALL return a descriptive error message indicating the failure reason

### Requirement 6: Multi-Platform Posting Support

**User Story:** As a user, I want to post content to YouTube and other platforms simultaneously, so that I can efficiently manage cross-platform content distribution.

#### Acceptance Criteria

1. WHEN a user creates a multi-platform post including YouTube, THE System SHALL retrieve the active YouTube channel credentials
2. WHEN posting to multiple platforms, THE System SHALL execute YouTube video upload in parallel with other platform posts
3. WHEN a YouTube video is part of a multi-platform post, THE System SHALL use the video file for YouTube and image/video for other platforms as appropriate
4. WHEN a multi-platform post completes, THE System SHALL record the YouTube video ID in the post history
5. IF YouTube upload fails in a multi-platform post, THEN THE System SHALL continue posting to other platforms and record the YouTube failure
6. WHEN all platform posts complete, THE System SHALL return a summary indicating success or failure for each platform

### Requirement 7: Token Refresh and Expiry Handling

**User Story:** As a system, I want to automatically refresh expired access tokens, so that users maintain uninterrupted access to their YouTube channels.

#### Acceptance Criteria

1. WHEN an access token is expired, THE YouTube_Service SHALL use the refresh token to obtain a new access token
2. WHEN a new access token is obtained, THE System SHALL update the Connected_Account record with the new token and expiry time
3. WHEN a refresh token is invalid or expired, THE System SHALL mark the channel connection as requiring re-authentication
4. IF token refresh fails, THEN THE System SHALL return an error indicating the user needs to reconnect their channel
5. WHEN making API calls, THE YouTube_Service SHALL check token expiry before each request and refresh if necessary

### Requirement 8: YouTube Accounts UI Component

**User Story:** As a user, I want a settings interface to view and manage my connected YouTube channels, so that I can control my channel connections.

#### Acceptance Criteria

1. WHEN the YouTube accounts component loads, THE YouTube_Accounts_Component SHALL fetch and display all connected YouTube channels
2. WHEN displaying channels, THE YouTube_Accounts_Component SHALL show channel thumbnail, title, and active status
3. WHEN a user clicks "Connect Account", THE YouTube_Accounts_Component SHALL open the OAuth flow in a popup window
4. WHEN OAuth completes successfully, THE YouTube_Accounts_Component SHALL receive a postMessage event and refresh the channel list
5. WHEN a user clicks "Disconnect" on a channel, THE YouTube_Accounts_Component SHALL show a confirmation dialog before proceeding
6. WHEN a user confirms disconnection, THE YouTube_Accounts_Component SHALL call the disconnect API and refresh the channel list
7. WHEN a user clicks "Set Active" on a channel, THE YouTube_Accounts_Component SHALL call the activate API and update the UI
8. WHEN no channels are connected, THE YouTube_Accounts_Component SHALL display an empty state with a connect button

### Requirement 9: Frontend YouTube Service Layer

**User Story:** As a developer, I want a frontend service layer for YouTube operations, so that I can maintain consistent API interactions across components.

#### Acceptance Criteria

1. THE Frontend YouTube Service SHALL provide a connectAccount method that initiates the OAuth flow
2. THE Frontend YouTube Service SHALL provide a getConnectedAccounts method that retrieves all connected channels
3. THE Frontend YouTube Service SHALL provide a disconnectAccount method that removes a channel connection
4. THE Frontend YouTube Service SHALL provide a setActiveAccount method that activates a specific channel
5. WHEN making API calls, THE Frontend YouTube Service SHALL include the JWT authentication token in request headers
6. WHEN API calls fail, THE Frontend YouTube Service SHALL throw errors with descriptive messages
7. THE Frontend YouTube Service SHALL use the NEXT_PUBLIC_API_URL environment variable for API endpoint construction

### Requirement 10: Backend API Routes

**User Story:** As a developer, I want RESTful API routes for YouTube operations, so that the frontend can interact with YouTube functionality.

#### Acceptance Criteria

1. THE System SHALL provide a GET /api/youtube/connect route that returns the OAuth authorization URL
2. THE System SHALL provide a GET /api/youtube/callback route that handles OAuth callback and token exchange
3. THE System SHALL provide a GET /api/youtube/accounts route that returns all connected YouTube channels for the authenticated user
4. THE System SHALL provide a DELETE /api/youtube/accounts/:accountId route that disconnects a specific channel
5. THE System SHALL provide a PUT /api/youtube/accounts/:accountId/activate route that sets a channel as active
6. THE System SHALL provide a POST /api/youtube/upload route that handles video upload with metadata
7. WHEN routes are accessed, THE System SHALL require JWT authentication via the authenticateToken middleware
8. WHEN the callback route is accessed without authentication, THE System SHALL allow the request to proceed for OAuth completion

### Requirement 11: Secure Credential Storage

**User Story:** As a system administrator, I want YouTube credentials stored securely, so that user data is protected.

#### Acceptance Criteria

1. WHEN storing access tokens, THE System SHALL encrypt them before writing to DynamoDB
2. WHEN storing refresh tokens, THE System SHALL encrypt them before writing to DynamoDB
3. WHEN retrieving tokens for API calls, THE System SHALL decrypt them before use
4. WHEN returning channel data to the frontend, THE System SHALL exclude access tokens and refresh tokens from the response
5. WHEN a channel is disconnected, THE System SHALL permanently delete all associated tokens from the database

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when YouTube operations fail, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN OAuth authorization fails, THE System SHALL display a user-friendly error message indicating the failure
2. WHEN video upload fails due to quota limits, THE System SHALL inform the user about YouTube API quota restrictions
3. WHEN video upload fails due to invalid metadata, THE System SHALL specify which metadata field is invalid
4. WHEN token refresh fails, THE System SHALL prompt the user to reconnect their YouTube channel
5. WHEN network errors occur, THE System SHALL display a message indicating connectivity issues
6. WHEN API rate limits are hit, THE System SHALL inform the user to try again later
7. WHEN operations succeed, THE System SHALL display success notifications with relevant details

### Requirement 13: Channel Analytics and Statistics

**User Story:** As a user, I want to view basic statistics for my connected YouTube channels, so that I can monitor channel performance.

#### Acceptance Criteria

1. WHEN displaying a connected channel, THE System SHALL fetch and display subscriber count
2. WHEN displaying a connected channel, THE System SHALL fetch and display total video count
3. WHEN displaying a connected channel, THE System SHALL fetch and display total view count
4. WHEN analytics data is unavailable, THE System SHALL gracefully handle the absence and display placeholder values
5. WHEN analytics API calls fail, THE System SHALL log the error but continue displaying channel information without statistics
6. WHEN analytics are displayed, THE System SHALL cache the data for 1 hour to minimize API calls

### Requirement 14: TypeScript Type Definitions

**User Story:** As a developer, I want comprehensive TypeScript types for YouTube entities, so that I have type safety and better development experience.

#### Acceptance Criteria

1. THE System SHALL define a YouTubeChannel interface with id, title, description, thumbnailUrl, subscriberCount, videoCount, and viewCount fields
2. THE System SHALL define a YouTubeVideo interface with id, title, description, tags, privacyStatus, and publishedAt fields
3. THE System SHALL define a YouTubeUploadRequest interface with videoFile, title, description, tags, and privacyStatus fields
4. THE System SHALL define a YouTubeUploadResponse interface with videoId, videoUrl, and status fields
5. THE System SHALL extend the PlatformType union type to include 'youtube'
6. THE System SHALL extend the ConnectedAccount interface to support YouTube-specific metadata fields
7. THE System SHALL define error types for YouTube-specific errors including quota exceeded, invalid credentials, and upload failures
