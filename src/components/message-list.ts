import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { UserService } from '../utils/user-service'
import { EmojiService } from '../utils/emoji-service'

interface Reaction {
  name: string
  count: number
  users: string[]
}

interface FileAttachment {
  id: string
  name: string
  mimetype: string
  filetype: string
  title: string
  url_private?: string
  permalink?: string
  thumb_360?: string
  thumb_360_w?: number
  thumb_360_h?: number
  created?: string
}

interface Message {
  client_msg_id?: string
  type: string
  user: string
  text: string
  ts: string
  team?: string
  thread_ts?: string
  reply_count?: number
  reactions?: Reaction[]
  files?: FileAttachment[]
}

@customElement('message-list')
export class MessageList extends LitElement {
  @property({ type: Array }) 
  set messages(value: Message[]) {
    const oldValue = this._messages;
    // Filter out messages with invalid timestamps
    this._messages = value.filter(msg => {
      // Handle messages with files that might have 'created' instead of 'ts'
      if (!msg.ts && msg.files?.[0]?.created) {
        msg.ts = msg.files[0].created.toString();
        return true;
      }
      if (!msg.ts) {
        console.warn('Message missing timestamp:', msg);
        return false;
      }
      return true;
    });
    this.loadData();
    this.requestUpdate('messages', oldValue);
  }
  get messages(): Message[] {
    return this._messages;
  }
  private _messages: Message[] = [];
  
  @property({ type: String }) workspace: string = '';
  private userService = UserService.getInstance()
  private emojiService = EmojiService.getInstance()
  @state() private isDataLoaded = false;

  private async loadData() {
    if (this._messages.length > 0 && this.workspace) {
      await Promise.all([
        this.userService.loadUsers(`/data/${this.workspace}/members.csv`),
        this.emojiService.initializeEmojiMap()
      ]);
      this.isDataLoaded = true;
      this.requestUpdate();
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('workspace') && this.workspace && this._messages.length > 0) {
      this.loadData();
    }
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      contain: strict;
      padding: 1rem;
      color: var(--text-primary);
    }

    .message {
      margin-bottom: 1rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .message:hover {
      background-color: var(--bg-secondary);
    }

    .message-header {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .username {
      font-weight: 600;
      color: var(--text-primary);
    }

    .timestamp {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .message-text {
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--text-primary);
    }

    .reactions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
      position: relative;
    }

    .reaction {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      background-color: var(--bg-secondary);
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
      position: relative;
    }

    .reaction:hover {
      background-color: var(--bg-hover);
    }

    .reactions {
      position: relative;
    }

    .reaction-tooltip {
      display: none;
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 50%;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      padding: 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-color);
      width: 150px;
    }

    .reaction:hover .reaction-tooltip {
      display: block;
    }

    .reaction-users {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      text-align: center;
    }

    .reaction-user {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      padding: 0.125rem 0;
    }

    .reaction-count {
      color: var(--reaction-count-color);
    }

    .message-text a {
      color: var(--link-color, #0066cc);
      text-decoration: none;
    }

    .message-text a:hover {
      text-decoration: underline;
    }

    .message-text img {
      max-width: 400px;
      max-height: 300px;
      border-radius: 4px;
      margin: 0.5rem 0;
      display: block;
    }

    .message-text .image-container {
      display: block;
      margin: 0.5rem 0;
    }

    .message-attachments {
      margin-top: 0.5rem;
    }
  `

  private formatTimestamp(ts: string): string {
    if (!ts) {
      console.warn('Timestamp is undefined or empty');
      return 'No date';
    }

    try {
      // Ensure we have a valid timestamp
      const timestamp = parseFloat(ts);
      if (isNaN(timestamp) || timestamp <= 0) {
        console.warn('Invalid timestamp value:', ts);
        return 'Invalid date';
      }

      const date = new Date(timestamp * 1000);
      // Validate the date is within reasonable range
      if (date.getFullYear() < 1970 || date.getFullYear() > 2100) {
        console.warn('Timestamp out of reasonable range:', ts);
        return 'Invalid date';
      }

      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.warn('Error formatting timestamp:', ts, error);
      return 'Invalid date';
    }
  }

  private getUserName(userId: string): string {
    return this.userService.getUserName(userId) || userId;
  }

  private formatReactionUsers(users: string[]): string[] {
    return users.map(userId => this.getUserName(userId));
  }

  private renderReactions(reactions: Reaction[] = []): unknown {
    if (!reactions.length) return null;

    return html`
      <div class="reactions">
        ${reactions.map(reaction => html`
          <div class="reaction">
            <span>${this.emojiService.convertShortcodeToEmoji(reaction.name)}</span>
            <span class="reaction-count">${reaction.count}</span>
            <div class="reaction-tooltip">
              <div class="reaction-users">
                ${this.formatReactionUsers(reaction.users).map(
                  userName => html`<div class="reaction-user">${userName}</div>`
                )}
              </div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderFileAttachments(files?: FileAttachment[]): unknown {
    if (!files?.length) return null;

    return html`
      <div class="message-attachments">
        ${files.map(file => {
          if (file.mimetype?.startsWith('image/')) {
            return html`
              <a href="#" class="image-container" title="${file.name}">
                <img src="/No-Image-Placeholder.png" alt="${file.title || 'Image'}" />
              </a>
            `;
          }
          return null;
        })}
      </div>
    `;
  }

  private processMessageText(text: string): string {
    // First handle file upload messages
    if (text.includes('uploaded a file:')) {
      return text.replace(
        /(<@[A-Z0-9]+>) uploaded a file: <([^|]+)\|([^>]+)>/g,
        (match, userMention, url, fileName) => {
          const userName = this.getUserName(userMention.slice(2, -1));
          return `${userName} uploaded ${fileName}`;
        }
      );
    }

    // Clean up HTML entities
    let processedText = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    // Replace user mentions
    processedText = processedText.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
      return `@${this.getUserName(userId)}`;
    });

    // Handle URLs - make them clickable but show clean URL text
    processedText = processedText.replace(
      /<(https?:\/\/[^|>]+)(?:\|([^>]+))?>/g,
      (match, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );

    // Convert emoji shortcodes
    return this.emojiService.convertTextWithEmoji(processedText);
  }

  private cleanupURL(url: string): string {
    // Remove tracking parameters and clean up the URL for display
    try {
      const urlObj = new URL(url);
      // For YouTube URLs, show a cleaner format
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return 'YouTube: ' + (urlObj.searchParams.get('v') || urlObj.pathname.slice(1));
      }
      // For other URLs, show without query parameters if they're tracking-related
      const cleanURL = urlObj.origin + urlObj.pathname;
      return cleanURL.replace(/^https?:\/\//, '');
    } catch {
      // If URL parsing fails, return the original but without the protocol
      return url.replace(/^https?:\/\//, '');
    }
  }

  render() {
    return html`
      ${this._messages.map(message => html`
        <div class="message">
          <div class="message-header">
            <span class="username">${this.getUserName(message.user)}</span>
            <span class="timestamp">${this.formatTimestamp(message.ts)}</span>
          </div>
          ${message.text ? html`
            <div class="message-text">${unsafeHTML(this.processMessageText(message.text))}</div>
          ` : null}
          ${this.renderFileAttachments(message.files)}
          ${this.renderReactions(message.reactions)}
        </div>
      `)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'message-list': MessageList
  }
}