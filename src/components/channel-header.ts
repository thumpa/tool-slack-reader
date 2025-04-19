import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChannelService } from '../utils/channel-service';

interface Channel {
  id: string;
  name: string;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
}

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

  private getChannelDescription(): string {
    console.log('[ChannelHeader] Getting description for channel:', this._channel);
    if (!this._channel) return '';
    const description = this._channel.topic?.value || this._channel.purpose?.value || 'No description available';
    console.log('[ChannelHeader] Returning description:', description);
    return description;
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
  `;

  render() {
    console.log('[ChannelHeader] Rendering with channel:', this._channel);
    if (!this._channel) return html``;

    return html`
      <div class="header-content">
        <div class="channel-info">
          <h1 class="channel-name">${this._channel.name}</h1>
          <p class="channel-description">${this.getChannelDescription()}</p>
        </div>
        <button>Channel Info</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'channel-header': ChannelHeader;
  }
} 