import { LitElement, css, html } from 'lit'
import { customElement, state, property } from 'lit/decorators.js'
import './components/channel-list'
import './components/message-list'
import './components/theme-switch'
import './components/workspace-selector'

interface Channel {
  id: string;
  name: string;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  members: string[];
  topic: { value: string; creator: string; last_set: number };
  purpose: { value: string; creator: string; last_set: number };
}

interface Message {
  client_msg_id?: string;
  type: string;
  text: string;
  user: string;
  ts: string;
  team?: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  replies?: { user: string; ts: string }[];
  subscribed?: boolean;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  folder: string;
  description?: string;
  export_date: string;
}

/**
 * Main Slack Reader component that provides the layout structure
 */
@customElement('slack-reader')
export class SlackReader extends LitElement {
  @state() private channels: Channel[] = [];
  @state() private selectedChannel: string = '';
  @state() private messages: Message[] = [];
  @state() private selectedWorkspace: string = '';
  @state() private isDarkMode: boolean = false;
  @state() private workspaceInfo: WorkspaceInfo | null = null;
  @state() private workspaces: WorkspaceInfo[] = [];
  
  constructor() {
    super();
    this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkMode = e.matches;
      this.requestUpdate();
    });
  }

  async firstUpdated() {
    await this.loadWorkspaces();
  }

  private async loadWorkspaces() {
    try {
      const response = await fetch('/api/workspaces');
      const data = await response.json();
      this.workspaces = data.workspaces;
      if (this.workspaces.length > 0) {
        const firstWorkspace = this.workspaces[0];
        this.workspaceInfo = firstWorkspace;
        await this.handleWorkspaceChange(firstWorkspace.folder);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  }

  private async loadWorkspaceInfo(workspace: string) {
    try {
      const response = await fetch(`/api/workspace-info?workspace=${workspace}`);
      if (!response.ok) throw new Error('Failed to load workspace info');
      this.workspaceInfo = await response.json();
    } catch (error) {
      console.error('Error loading workspace info:', error);
      this.workspaceInfo = null;
    }
  }

  private async handleWorkspaceChange(workspace: string) {
    this.selectedWorkspace = workspace;
    this.selectedChannel = '';
    const selectedWorkspaceInfo = this.workspaces.find(w => w.folder === workspace);
    if (selectedWorkspaceInfo) {
      this.workspaceInfo = selectedWorkspaceInfo;
    }
    await this.loadChannels(workspace);
  }

  private async loadChannels(workspace: string) {
    try {
      const response = await fetch(`/api/channels?workspace=${workspace}`);
      if (!response.ok) throw new Error('Failed to load channels');
      const channels = await response.json();
      this.channels = channels;
      if (channels.length > 0) {
        this.handleChannelSelect(new CustomEvent('channel-selected', { 
          detail: { channelId: channels[0].id }
        }));
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      this.channels = [];
    }
  }

  private async handleChannelSelect(e: CustomEvent<{channelId: string}>) {
    this.selectedChannel = e.detail.channelId;
    await this.loadMessages(this.selectedWorkspace, e.detail.channelId);
  }

  private async loadMessages(workspace: string, channel: string) {
    if (!workspace || !channel) return;
    
    try {
      const response = await fetch(`/api/messages?workspace=${workspace}&channel=${channel}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const messages = await response.json();
      this.messages = messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      this.messages = [];
    }
  }

  private handleThemeChange(e: CustomEvent) {
    this.isDarkMode = e.detail.isDark;
    this.requestUpdate();
  }

  protected updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isDarkMode')) {
      if (this.isDarkMode) {
        this.setAttribute('dark', '');
        document.documentElement.classList.add('dark');
      } else {
        this.removeAttribute('dark');
        document.documentElement.classList.remove('dark');
      }
    }
  }

  private renderWorkspaceInfo() {
    if (!this.workspaceInfo) return html``;

    return html`
      <div class="workspace-info">
        <p class="workspace-name">Slack message viewer for ${this.workspaceInfo.name}</p>
        ${this.workspaceInfo.description && this.workspaceInfo.description !== this.workspaceInfo.name
          ? html`<p class="workspace-description">${this.workspaceInfo.description}</p>` 
          : ''}
        <p class="workspace-export">Exported: ${new Date(this.workspaceInfo.export_date).toLocaleDateString()}</p>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      height: 100vh;
      color: var(--text-color);
      background-color: var(--bg-secondary);
    }

    :host([dark]) {
      --background-color: #303337;
      --bg-secondary: #1a1d21;
      --bg-hover: #2c2e33;
      --bg-selected: #1164a3;
      --text-primary: #d1d2d3;
      --text-secondary: #9da2a6;
      --border-color: #5c5c5c;
      --link-color: #3d9bea;
      --reaction-count-color: #9da2a6;
    }

    :host(:not([dark])) {
      --background-color: #f0eeee;
      --bg-secondary: #e0dfdf;
      --bg-hover: #f0f0f0;
      --bg-selected: #e8f5fc;
      --text-primary: #1d1c1d;
      --text-secondary: #616061;
      --border-color: #b0b0b0;
      --link-color: #1264a3;
      --reaction-count-color: #616061;
    }

    .header {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .workspace-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .workspace-name {
      font-size: 1.2rem;
      font-weight: bold;
      margin: 0;
      color: var(--text-primary);
    }

    .workspace-description {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .workspace-export {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .content {
      display: grid;
      grid-template-columns: 250px 1fr;
      overflow: hidden;
    }

    channel-list {
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
    }

    message-list {
      background-color: var(--background-color);
    }

    .theme-switch {
      justify-self: end;
    }

    .workspace-selector select {
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .workspace-selector select:focus {
      outline: none;
      border-color: var(--link-color);
    }
  `;

  render() {
    return html`
      <div class="header">
        ${this.renderWorkspaceInfo()}
        <div class="workspace-selector">
          <select @change=${(e: Event) => this.handleWorkspaceChange((e.target as HTMLSelectElement).value)}>
            ${this.workspaces.map(workspace => html`
              <option value=${workspace.folder} ?selected=${workspace.folder === this.selectedWorkspace}>
                ${workspace.name}
              </option>
            `)}
          </select>
        </div>
        <div class="theme-switch">
          <theme-switch
            .isDark=${this.isDarkMode}
            @theme-changed=${this.handleThemeChange}
          ></theme-switch>
        </div>
      </div>
      <div class="content">
        <channel-list
          .channels=${this.channels}
          .workspace=${this.selectedWorkspace}
          .selectedChannelId=${this.selectedChannel}
          @channel-selected=${(e: CustomEvent<{channelId: string}>) => this.handleChannelSelect(e)}
        ></channel-list>
        <message-list
          .workspace=${this.selectedWorkspace}
          .channel=${this.selectedChannel}
          .messages=${this.messages}
        ></message-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slack-reader': SlackReader;
  }
}
