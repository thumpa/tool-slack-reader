import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Channel } from '../utils/data-loader';
import { ChannelMetadataService } from '../utils/channel-metadata-service';

@customElement('channel-list')
export class ChannelList extends LitElement {
  @property({ type: Array }) channels: Channel[] = [];
  @property({ type: String }) selectedChannelId: string = '';
  @property({ type: String }) workspace: string = '';
  @state() private channelCounts: { [key: string]: number | null } = {};
  private metadataService = ChannelMetadataService.getInstance();

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }

    .channel {
      padding: 8px 16px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-primary);
    }

    .channel:hover {
      background-color: var(--bg-hover);
    }

    .channel.selected {
      background-color: var(--bg-selected);
    }

    .channel-name {
      flex-grow: 1;
    }

    .channel-name::before {
      content: '#';
      opacity: 0.5;
      margin-right: 4px;
    }

    .message-count {
      font-size: 0.85em;
      color: var(--text-secondary);
      margin-left: 8px;
    }

    .counting {
      font-style: italic;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    if (this.channels.length > 0 && this.workspace) {
      await this.loadAllMessageCounts();
    }
  }

  willUpdate(changedProperties: Map<string, any>) {
    if ((changedProperties.has('channels') || changedProperties.has('workspace')) && 
        this.channels.length > 0 && this.workspace) {
      this.loadAllMessageCounts();
    }
  }

  async loadAllMessageCounts() {
    if (!this.workspace) {
      console.warn('Cannot load message counts without a workspace');
      return;
    }

    try {
      // Load all channel counts in parallel
      const countPromises = this.channels.map(async (channel) => {
        try {
          const count = await this.metadataService.getMessageCount(this.workspace, channel.id);
          this.channelCounts = {
            ...this.channelCounts,
            [channel.id]: count
          };
          this.requestUpdate();
        } catch (error) {
          console.error(`Error loading count for channel ${channel.id} in workspace ${this.workspace}:`, error);
          this.channelCounts = {
            ...this.channelCounts,
            [channel.id]: null
          };
        }
      });

      await Promise.all(countPromises);
    } catch (error) {
      console.error('Error loading message counts:', error);
    }
  }

  async handleChannelClick(channel: Channel) {
    this.selectedChannelId = channel.id;
    this.dispatchEvent(new CustomEvent('channel-selected', {
      detail: { channelId: channel.id },
      bubbles: true,
      composed: true
    }));

    // Refresh message count if needed
    if (!this.workspace) {
      console.warn('Cannot refresh message count without a workspace');
      return;
    }

    if (this.channelCounts[channel.id] === undefined || this.channelCounts[channel.id] === null) {
      try {
        const count = await this.metadataService.getMessageCount(this.workspace, channel.id);
        this.channelCounts = {
          ...this.channelCounts,
          [channel.id]: count
        };
        this.requestUpdate();
      } catch (error) {
        console.error(`Error refreshing count for channel ${channel.id} in workspace ${this.workspace}:`, error);
      }
    }
  }

  private renderMessageCount(channelId: string) {
    const count = this.channelCounts[channelId];
    if (count === undefined) {
      return '';
    }
    if (count === null) {
      return html`<span class="message-count counting">(counting...)</span>`;
    }
    return html`<span class="message-count">(${count})</span>`;
  }

  render() {
    return html`
      ${this.channels.map(channel => html`
        <div
          class="channel ${channel.id === this.selectedChannelId ? 'selected' : ''}"
          @click=${() => this.handleChannelClick(channel)}
        >
          <span class="channel-name">${channel.name}</span>
          ${this.renderMessageCount(channel.id)}
        </div>
      `)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'channel-list': ChannelList;
  }
} 