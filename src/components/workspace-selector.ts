import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WorkspaceService } from '../utils/workspace-service';

interface Workspace {
  id: string;
  name: string;
  folder: string;
  description: string;
  export_date: string;
}

@customElement('workspace-selector')
export class WorkspaceSelector extends LitElement {
  private workspaceService = WorkspaceService.getInstance();
  
  @state() private workspaces: Workspace[] = [];
  @state() private isLoading = true;
  @state() private error: string | null = null;

  @property({ type: String }) 
  selectedWorkspace = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 1rem;
    }

    .selector {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 1rem;
    }

    .selector:focus {
      outline: none;
      border-color: var(--focus-color);
    }

    .error {
      color: var(--error-color, #ff0000);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .loading {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadWorkspaces();
  }

  private async loadWorkspaces() {
    try {
      const data = await this.workspaceService.getWorkspaces();
      this.workspaces = data.workspaces;
      
      // If we have workspaces and none is selected, select the first one
      if (this.workspaces.length > 0 && !this.selectedWorkspace) {
        this.handleWorkspaceChange(this.workspaces[0].folder);
      }
      
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load workspaces';
      this.isLoading = false;
    }
  }

  private handleWorkspaceChange(folder: string) {
    this.selectedWorkspace = folder;
    this.dispatchEvent(new CustomEvent('workspace-changed', {
      detail: { workspace: folder },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (this.isLoading) {
      return html`<div class="loading">Loading workspaces...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (!this.workspaces.length) {
      return html`<div class="error">No workspaces found</div>`;
    }

    return html`
      <select 
        class="selector"
        .value=${this.selectedWorkspace}
        @change=${(e: Event) => this.handleWorkspaceChange((e.target as HTMLSelectElement).value)}
      >
        ${this.workspaces.map(workspace => html`
          <option 
            value=${workspace.folder}
            ?selected=${workspace.folder === this.selectedWorkspace}
          >
            ${workspace.name}
          </option>
        `)}
      </select>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workspace-selector': WorkspaceSelector;
  }
} 