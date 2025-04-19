import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './components/channel-list'
import './components/message-list'
import './components/theme-switch'
import './components/workspace-selector'
import './components/user-table'
import { Channel } from './types/channel'

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
  date_range?: { start: number; end: number };
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
    this.messages = [];
    this.channels = [];
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
    const selectedChannel = this.channels.find(c => c.id === e.detail.channelId);
    if (selectedChannel) {
      await this.loadMessages(this.selectedWorkspace, e.detail.channelId);
    }
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
        <p class="workspace-description">Range: ${new Date(this.workspaceInfo.date_range?.start || '').toLocaleDateString()} to ${new Date(this.workspaceInfo.date_range?.end || '').toLocaleDateString()}</p>
        <p class="workspace-export">Exported: ${new Date(this.workspaceInfo.export_date).toLocaleDateString()}</p>
      </div>
    `;
  }

  private renderEmptyWorkspace() {
    return html`
      <div class="empty-workspace">
        <p>This workspace is empty.</p>
        <p>Please add your exported Slack workspace files to:</p>
        <code>/public/data/${this.selectedWorkspace}/</code>
        <p>Required files and structure:</p>
        <ul>
          <li>channels/ - Channel directories containing message JSON files</li>
          <li>users.json - User data from Slack export</li>
          <li>integration_logs.json - Integration activity logs</li>
        </ul>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-height: 100vh;
      color: var(--text-color);
      background-color: var(--bg-secondary);
      overflow: hidden;
      box-sizing: border-box;
    }

    *, *:before, *:after {
      box-sizing: inherit;
    }

    :host([dark]) {
      --background-color: #303337;
      --bg-secondary: #1a1d21;
      --bg-hover: #2c2e33;
      --bg-selected: #1164a3;
      --text-primary: #d1d2d3;
      --text-secondary: #9da2a6;
      --border-color: #5c5c5c;
    }

    :host(:not([dark])) {
      --background-color: #f0eeee;
      --bg-secondary: #e0dfdf;
      --bg-hover: #f0f0f0;
      --bg-selected: #e8f5fc;
      --text-primary: #1d1c1d;
      --text-secondary: #616061;
      --border-color: #b0b0b0;
    }

    .header {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      z-index: 10;
      height: var(--header-height);
    }

    .workspace-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .workspace-name {
      font-size: var(--font-size-lg);
      font-weight: bold;
      margin: 0;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .workspace-description {
      margin: 0;
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .workspace-export {
      margin: 0;
      font-size: var(--font-size-base);
      color: var(--text-secondary);
    }

    .content {
      flex: 1 1 auto;
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-rows: 1fr;
      min-height: 0;
      height: calc(100vh - var(--header-height));
      overflow: hidden;
    }

    channel-list {
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
    }

    message-list {
      background-color: var(--background-color);
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
    }

    .theme-switch {
      justify-self: end;
    }

    .workspace-selector {
      min-width: 120px;
    }

    .workspace-selector select {
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      width: 100%;
      font-size: var(--font-size-base);
    }

    .workspace-selector select:focus {
      outline: none;
      border-color: var(--link-color);
    }

    .empty-workspace {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-workspace code {
      background: var(--bg-secondary);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      margin: 1rem 0;
      font-family: monospace;
    }

    .empty-workspace ul {
      text-align: left;
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .empty-workspace li {
      margin: 0.5rem 0;
    }

    .header-button {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      font-size: var(--font-size-base);
    }

    .header-button:hover {
      background: var(--bg-hover);
    }
  `;

  render() {
    const selectedChannel = this.channels.find(c => c.id === this.selectedChannel);
    
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
        <button class="header-button" @click=${this.showUserTable}>
          View Users
        </button>
      </div>
      <user-table></user-table>
      <div class="content">
        <channel-list
          .channels=${this.channels}
          .workspace=${this.selectedWorkspace}
          .selectedChannelId=${this.selectedChannel}
          @channel-selected=${(e: CustomEvent<{channelId: string}>) => this.handleChannelSelect(e)}
        ></channel-list>
        ${this.channels.length === 0 && this.selectedWorkspace
          ? this.renderEmptyWorkspace()
          : html`
            <message-list
              .workspace=${this.selectedWorkspace}
              .channel=${selectedChannel || null}
              .messages=${this.messages}
            ></message-list>
          `}
      </div>
    `;
  }

  private async showUserTable() {
    const userTable = this.shadowRoot?.querySelector('user-table');
    if (userTable) {
      try {
        const response = await fetch(`/api/users?workspace=${this.selectedWorkspace}`);
        if (!response.ok) throw new Error('Failed to load users');
        const users = await response.json();
        (userTable as any).users = users;
        (userTable as any).show();
      } catch (error) {
        console.error('Error loading users:', error);
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slack-reader': SlackReader;
  }
}
