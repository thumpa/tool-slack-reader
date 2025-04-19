import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ChannelService } from '../utils/channel-service';
import { UserService } from '../utils/user-service';
import { Channel } from '../types/channel';
import './ui/modal';

@customElement('channel-header')
export class ChannelHeader extends LitElement {
  @property({ type: Object }) 
  set channel(value: Channel | null) {
    const oldValue = this._channel;
    this._channel = value;
    console.log('[ChannelHeader] Channel property set:', value);
    this.loadFullChannelData();
    this.requestUpdate('channel', oldValue);
  }
  get channel() {
    return this._channel;
  }

  @property({ type: String }) 
  set workspace(value: string) {
    const oldValue = this._workspace;
    this._workspace = value;
    console.log('[ChannelHeader] Workspace property set:', value);
    this.loadFullChannelData();
    this.requestUpdate('workspace', oldValue);
  }
  get workspace() {
    return this._workspace;
  }

  private _channel: Channel | null = null;
  private _workspace: string = '';
  private channelService = ChannelService.getInstance();
  private userService = UserService.getInstance();

  private async loadFullChannelData() {
    console.log('[ChannelHeader] Loading full channel data. Current state:', {
      workspace: this._workspace,
      channel: this._channel
    });
    
    if (this._workspace && this._channel?.id) {
      try {
        const channelData = await this.channelService.getChannel(this._workspace, this._channel.id);
        console.log('[ChannelHeader] Loaded full channel data:', channelData);
        if (channelData) {
          this._channel = channelData;
          this.requestUpdate();
        }
      } catch (error) {
        console.error('[ChannelHeader] Error loading channel data:', error);
      }
    }
  }

  static styles = css`
    :host {
      display: block;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    ui-modal {
      --modal-width: 500px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .channel-info {
      flex-grow: 1;
      min-width: 0;
    }

    .channel-name {
      font-size: 1.125rem;
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .channel-name::before {
      content: '#';
      opacity: 0.5;
      margin-right: 0.25rem;
    }

    .channel-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0.25rem 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    button {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      font-size: var(--font-size-base);
    }

    button:hover {
      background: var(--bg-hover);
    }

    .info-section {
      margin-bottom: 1.5rem;
    }

    .info-section:last-child {
      margin-bottom: 0;
    }

    .info-title {
      font-size: 1rem;
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .info-label {
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .info-value {
      color: var(--text-primary);
    }

    .members-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .member-item {
      background-color: var(--bg-tertiary);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
  `;

  private getChannelDescription(): string {
    console.log('[ChannelHeader] Getting description for channel:', this._channel);
    if (!this._channel) return '';
    const description = this._channel.topic?.value || this._channel.purpose?.value || 'No description available';
    console.log('[ChannelHeader] Returning description:', description);
    return description;
  }

  private formatDate(timestamp: number): string {
    if (!timestamp) return 'Invalid Date';
    return new Date(timestamp * 1000).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getUserName(userId: string): string {
    return this.userService.getUserName(userId) || userId;
  }

  private showChannelInfo() {
    const modal = this.shadowRoot?.querySelector('ui-modal');
    if (modal) {
      modal.show();
    }
  }

  render() {
    console.log('[ChannelHeader] Rendering with channel:', this._channel);
    if (!this._channel) return html``;

    return html`
      <div class="header-content">
        <div class="channel-info">
          <h1 class="channel-name">${this._channel.name}</h1>
          <p class="channel-description">${this.getChannelDescription()}</p>
        </div>
        <button @click=${this.showChannelInfo}>Channel Info</button>
      </div>

      <ui-modal title="Channel Information">
        <div class="info-section">
          <h3 class="info-title">Basic Information</h3>
          <div class="info-grid">
            <span class="info-label">Channel Name:</span>
            <span class="info-value">#${this._channel.name}</span>
            
            <span class="info-label">Channel ID:</span>
            <span class="info-value">${this._channel.id}</span>
            
            <span class="info-label">Created:</span>
            <span class="info-value">${this.formatDate(this._channel.created)}</span>
            
            <span class="info-label">Created by:</span>
            <span class="info-value">${this.getUserName(this._channel.creator)}</span>
            
            <span class="info-label">Status:</span>
            <span class="info-value">${this._channel.is_archived ? 'Archived' : 'Active'}</span>
            
            <span class="info-label">Type:</span>
            <span class="info-value">${this._channel.is_general ? 'General' : 'Standard'}</span>
          </div>
        </div>

        <div class="info-section">
          <h3 class="info-title">Topic</h3>
          <div class="info-grid">
            <span class="info-label">Value:</span>
            <span class="info-value">${this._channel.topic?.value || 'No topic set'}</span>
            
            <span class="info-label">Set by:</span>
            <span class="info-value">${this._channel.topic?.creator ? this.getUserName(this._channel.topic.creator) : 'N/A'}</span>
            
            <span class="info-label">Last updated:</span>
            <span class="info-value">${this._channel.topic?.last_set ? this.formatDate(this._channel.topic.last_set) : 'N/A'}</span>
          </div>
        </div>

        <div class="info-section">
          <h3 class="info-title">Purpose</h3>
          <div class="info-grid">
            <span class="info-label">Value:</span>
            <span class="info-value">${this._channel.purpose?.value || 'No purpose set'}</span>
            
            <span class="info-label">Set by:</span>
            <span class="info-value">${this._channel.purpose?.creator ? this.getUserName(this._channel.purpose.creator) : 'N/A'}</span>
            
            <span class="info-label">Last updated:</span>
            <span class="info-value">${this._channel.purpose?.last_set ? this.formatDate(this._channel.purpose.last_set) : 'N/A'}</span>
          </div>
        </div>

        <div class="info-section">
          <h3 class="info-title">Members (${this._channel.members?.length || 0})</h3>
          <ul class="members-list">
            ${this._channel.members?.map(userId => html`
              <li class="member-item">${this.getUserName(userId)}</li>
            `)}
          </ul>
        </div>
      </ui-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'channel-header': ChannelHeader;
  }
} 