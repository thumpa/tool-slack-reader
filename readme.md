# Slack Export Viewer

A browser-based viewer for Slack export data, built with Lit.

## Table of Contents

- [1. Features](#1-features)
- [2. User Table Implementation](#2-user-table-implementation)
- [3. Project Structure](#3-project-structure)
- [4. Data Structure](#4-data-structure)
  - [4.1. Workspace Metadata](#41-workspace-metadata)
  - [4.2. Channel Data](#42-channel-data)
  - [4.3. User Data](#43-user-data)
- [5. Implementation Details](#5-implementation-details)
  - [5.1. Layout Structure](#51-layout-structure)
  - [5.2. Components](#52-components)
  - [5.3. Services](#53-services)
  - [5.4. Performance Optimisations](#54-performance-optimisations)
  - [5.5. Theming](#55-theming)
  - [5.6. Message Formatting](#56-message-formatting)
- [6. Development](#6-development)
- [7. References](#7-references)
- [8. License](#8-license)

## 1. Features

- Multi-workspace support with easy workspace switching
- Two-column layout with channels list and message view
- Dark/light theme support using system preferences
- Chronological message display with proper formatting
- Channel navigation
- Thread support:
  - Expandable/collapsible thread views
  - Visual distinction for parent messages
  - Chronological ordering within threads
  - Thread reply counts and indicators
- User name resolution:
  - Display names in message headers
  - Resolve @mentions in message content
  - Fallback chain: display_name → real_name → username → user ID
- Timestamp formatting in UK English format
- Support for message reactions
- Clean sidebar with only channel folders visible
- Persistent workspace state between sessions
- Automatic theme switching based on system preferences
- View user information in a sortable table including:
  - Display name
  - Real name
  - Username
  - Email
  - Status (Active/Deactivated)
  - Role (Admin/Owner/Member)

## 2. User Table Implementation

The user table component displays member information from the workspace's `users.json` file. The table provides a sortable view of all workspace members with key information about each user. Note that while the table shows whether users are active or deactivated, the Slack export data does not include historical information about when users were activated or deactivated - only their current status is available.

## 3. Project Structure

``` markdown
├── public/
│   └── data/
│       ├── workspace1/        # First workspace directory
│       │   ├── users.json     # User data from Slack export
│       │   ├── pet-tax/       # Channel export files by date
│       │   └── pitches/       # Channel export files by date
│       └── workspace2/        # Second workspace directory
│           ├── users.json
│           └── channels/
├── src/
│   ├── components/
│   │   ├── channel-list.ts    # Channel list component
│   │   ├── message-list.ts    # Message display component
│   │   ├── theme-switch.ts    # Theme toggling component
│   │   └── workspace-selector.ts # Workspace selection component
│   ├── utils/
│   │   ├── data-loader.ts     # Channel and message loading
│   │   └── user-service.ts    # User data management
│   └── slack-reader.ts        # Main application component
└── index.html                # Entry point with theme variables
```

## 4. Data Structure

### 4.1. Workspace Metadata

Each workspace requires a `workspace.json` file in its directory:

```json
{
  "id": "unique-workspace-id",
  "name": "Workspace Display Name",
  "folder": "workspace-folder-name",
  "description": "Slack message viewer for Workspace",
  "date_range": {
    "start": "2014-04-14",
    "end": "2025-04-14"
  },
  "export_date": "2025-04-14"
}
```

The application supports multiple workspaces, each with their own:

- Separate channel structure
- Independent user data
- Isolated message history
- Unique workspace metadata

### 4.2. Channel Data

- Each channel has its own directory under `public/data/`
- Messages are split into daily JSON files named `YYYY-MM-DD.json`
- Each JSON file contains an array of message objects with:
  - `type`: Message type
  - `user`: User ID
  - `text`: Message content (including @mentions)
  - `ts`: Timestamp
  - `thread_ts`: Thread identifier (matches parent message timestamp)
  - `reply_count`: Number of replies in thread (for parent messages)
  - `parent_user_id`: ID of parent message author (for thread replies)
  - `reactions`: Array of reactions (optional)

### 4.3. User Data

The application uses the Slack export's `users.json` file for user data. This file contains detailed user information in JSON format:

```json
{
  "id": "U01EXAMPLE1",
  "name": "username",
  "real_name": "Full Name",
  "deleted": false,
  "profile": {
    "display_name": "Display Name",
    "email": "user@example.com",
    "status_text": "Status message",
    "first_name": "First",
    "last_name": "Last"
  }
}
```

Key user data fields:

- `id`: Unique user identifier
- `name`: Username
- `real_name`: User's full name
- `deleted`: Whether the user has been deactivated
- `profile.display_name`: User's chosen display name
- `profile.email`: User's email address
- `profile.status_text`: User's status message

The application uses a fallback chain for displaying user names:

1. `profile.display_name`
2. `real_name`
3. `name`
4. User ID

## 5. Implementation Details

### 5.1. Layout Structure

The application follows a three-section layout design:

``` markdown
+----------------+------------------+
| Workspace Info | Workspace Select | Theme
| [Description]  | [Dropdown     ▼] | [☀/☾]
| [Date Range]   |                  |
+----------------+------------------+
|                |                 |
|   Channel      |    Message      |
|    List        |     Area        |
|                |                 |
|   [3dmodel]    |  Jane         |
|   [pet-tax]    |  10 Oct 2017   |
|   [pitches]    |  > Message text |
|                |                 |
|                |  John          |
|                |  10 Oct 2017    |
|                |  > Another msg  |
|                |                 |
+----------------+------------------+
```

Key layout features:

- Header section with:
  - Workspace information display
  - Workspace selector dropdown
  - Theme toggle switch
- Fixed-width sidebar (250px) for channel navigation
- Flexible-width message area that fills remaining space
- Scrollable message list with newest at bottom
- Channel list shows folders only
- Messages include author, timestamp, and formatted content

### 5.2. Components

#### Core Components

1. `slack-reader`: Main component providing the layout structure
   - Grid-based layout with header and content areas
   - Theme variable management
   - Workspace state management
   - Component composition

2. `workspace-selector`: Workspace switching component
   - Dropdown for workspace selection
   - Handles workspace changes
   - Updates channel list and messages

3. `channel-list`: Channel navigation component
   - Displays available channels (directories only)
   - Handles channel selection
   - Visual feedback for selected state
   - Updates based on selected workspace

4. `channel-header`: Channel information display component
   - Fixed positioning at top of message area
   - Displays channel name with # prefix
   - Shows channel topic/purpose from channels.json
   - Channel Info button for detailed information
   - Sticky behaviour during message scrolling

5. `message-list`: Message display component
   - Chronological message rendering
   - Thread management:
     - Parent messages with distinct styling
     - Indented thread replies
     - Expand/collapse functionality
     - Chronological ordering within threads
   - User name resolution for message authors
   - @mention resolution in message content
   - Timestamp formatting
   - Reaction display
   - Auto-scroll to latest message

6. `theme-switch`: Theme toggle component
   - Switches between light and dark modes
   - Respects system preferences
   - Persists theme selection

#### UI Components

For detailed implementation and styling information about UI components, see the [UI Components Documentation](src/components/README.md). Key UI components include:

- Message Display:
  - `message-item`: Individual message rendering with support for threading
  - `message-reactions`: Displays emoji reactions with counts
  - `message-attachments`: Handles file attachments and previews
  
- Navigation:
  - `channel-folder`: Collapsible channel category display
  - `breadcrumb-nav`: Workspace and channel navigation trail
  
- User Interface:
  - `user-avatar`: Circular user avatar with status indicator
  - `loading-spinner`: Animated loading indicator
  - `error-boundary`: Graceful error state handling

### 5.3. Services

1. `UserService`: Singleton service for user data management
   - CSV parsing for user data
   - Name resolution with fallback chain
   - Caching of user information

2. `DataLoader`: Data loading and caching service
   - Channel directory filtering
   - Message loading and parsing
   - Message caching for performance

3. `ChannelService`: Channel data management service
   - Loads and caches channel information from channels.json
   - Provides channel details including topics and purposes
   - Case-insensitive channel matching
   - Efficient channel data retrieval

4. `ChannelMetadataService`: Channel metadata management service
   - Efficient message counting with persistent caching
   - Automatic metadata loading on startup
   - Channel statistics persistence
   - Normalized channel name handling
   - JSON-based metadata storage structure:

     ```json
     {
       "channels": {
         "channel-name": {
           "messageCount": 1234,
           "lastCounted": "2024-03-20T12:34:56.789Z"
         }
       }
     }
     ```

### 5.4. Performance Optimisations

1. **Metadata Caching**
   - Channel message counts are cached to avoid unnecessary recounting
   - Metadata is loaded once at startup and persisted between sessions
   - Channel names are normalised for consistent cache hits
   - Cached data includes timestamp of last count for auditing

2. **Efficient Data Loading**
   - Initial metadata load happens immediately on service instantiation
   - Asynchronous loading with promise tracking
   - Prevents duplicate loading requests
   - Uses normalised channel names for cache consistency

3. **State Management**
   - Singleton pattern ensures consistent state across components
   - Promise-based initialization tracking
   - Robust error handling with fallback strategies
   - Clear logging for debugging and monitoring

### 5.5. Theming

The application uses CSS custom properties for theming:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e1e4e8;
}
```

Dark mode is automatically applied based on system preferences using `@media (prefers-color-scheme: dark)`.

### 5.6. Message Formatting

The application includes robust message formatting features:

1. **URL Handling**
   - Clean URL display without tracking parameters
   - URLs are clickable and open in new tabs
   - Security attributes (`rel="noopener noreferrer"`) for external links

2. **Timestamp Handling**
   - Supports multiple timestamp formats:
     - Standard Slack timestamps (`ts` field)
     - File upload timestamps (`created` field)
   - Graceful fallback for invalid timestamps
   - UK English date format (DD MMM YYYY, HH:mm)
   - Validation to ensure timestamps are within reasonable range

3. **User Mentions**
   - @mentions are resolved to display names
   - Fallback to user ID if name cannot be resolved

4. **File Uploads**
   - Support for file attachments
   - Proper handling of image previews
   - Clean display of file upload messages

5. **Error Handling**
   - Graceful handling of missing or invalid data
   - Console warnings for debugging
   - Fallback display options for edge cases

6. **Thread Handling**
   - Visual distinction for parent messages with threads
   - Expandable/collapsible thread views
   - Indented replies for better visual hierarchy
   - Thread reply counts and indicators
   - Chronological ordering within threads
   - Clear parent-reply relationships
   - Thread context preservation (Reply to [username])

### 5.7. Thread Implementation

The application implements a sophisticated threading system:

1. **Thread Structure**
   - Parent messages contain:
     - `thread_ts` matching their own timestamp
     - `reply_count` indicating number of replies
   - Reply messages contain:
     - `thread_ts` linking to parent message
     - `parent_user_id` for context

2. **Display Logic**
   - Main timeline shows:
     - Regular messages
     - Thread parent messages
     - Distinct styling for messages with replies
   - Thread replies:
     - Appear under parent when expanded
     - Maintain chronological order within thread
     - Indented for visual hierarchy
     - Include "Reply to [username]" context

3. **Visual Design**
   - Parent messages:
     - Distinct background colour
     - Left accent border
     - Reply count indicator
   - Thread replies:
     - Indented layout
     - Left border for thread grouping
     - Clear reply context
     - Maintained within thread container

4. **Interaction Model**
   - Click thread indicator to expand/collapse
   - Threads expand in place
   - Parent messages remain in timeline
   - Reply visibility tied to thread state
   - Clear expand/collapse feedback

## 6. Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start all development servers:

   ```bash
   npm run dev:all
   ```

   This will start:
   - Web server on [http://localhost:5174](http://localhost:5174)
   - API server on [http://localhost:3002](http://localhost:3002)

   Individual servers can be started with:
   - `npm run dev:web` - Starts only the web server
   - `npm run dev:api` - Starts only the API server

3. Set up workspace data:
   - Create workspace directories in `public/data/`
   - Add `workspace.json` to each workspace directory
   - Create channel directories within each workspace
   - Place JSON files in their respective channel directories
   - Add `users.json` to each workspace directory
   - Message files should be named `YYYY-MM-DD.json`

4. Access the application:
   - Open [http://localhost:5174](http://localhost:5174) in your browser
   - Select a workspace from the dropdown
   - Choose a channel from the sidebar
   - Messages will load and display chronologically with resolved usernames

## 7. References

Relevant Slack documentation:

- [Exporting your workspace data](https://slack.com/intl/en-gb/help/articles/201658943-Export-your-workspace-data)
- [How to read Slack data exports](https://slack.com/intl/en-gb/help/articles/220556107-How-to-read-Slack-data-exports#json-files-1)
- [Understanding Slack Messages](https://api.slack.com/surfaces/messages)

## 8. License

[Add your license information here]
