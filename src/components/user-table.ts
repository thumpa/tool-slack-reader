import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  deleted: boolean;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  profile: {
    display_name: string;
    email: string;
    status_text: string;
    first_name: string;
    last_name: string;
  };
}

@customElement('user-table')
export class UserTable extends LitElement {
  @property({ type: Array }) users: SlackUser[] = [];
  @property({ type: Boolean }) isVisible = false;

  static styles = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      padding: 2rem;
    }

    :host([visible]) {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .modal {
      background-color: var(--bg-secondary);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      position: relative;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      background-color: var(--bg-secondary);
      z-index: 1;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--text-primary);
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0.5rem;
    }

    .close-button:hover {
      color: var(--text-primary);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    th {
      background-color: var(--bg-secondary);
      font-weight: 600;
      position: sticky;
      top: 57px;
      z-index: 1;
    }

    tr:hover td {
      background-color: var(--bg-hover);
    }

    .status-active {
      color: #2ecc71;
    }

    .status-deleted {
      color: #e74c3c;
    }
  `

  render() {
    return html`
      <div class="modal" ?hidden=${!this.isVisible}>
        <div class="modal-header">
          <h2 class="modal-title">Workspace Users</h2>
          <button class="close-button" @click=${this.close}>×</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Display Name</th>
              <th>Real Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            ${this.users.map(user => html`
              <tr>
                <td>${user.profile?.display_name || '-'}</td>
                <td>${user.real_name || '-'}</td>
                <td>${user.name}</td>
                <td>${user.profile?.email || '-'}</td>
                <td>
                  <span class=${user.deleted ? 'status-deleted' : 'status-active'}>
                    ${user.deleted ? 'Deactivated' : 'Active'}
                  </span>
                </td>
                <td>
                  ${user.is_admin ? 'Admin' : ''}
                  ${user.is_owner ? 'Owner' : ''}
                  ${user.is_primary_owner ? 'Primary Owner' : ''}
                  ${!user.is_admin && !user.is_owner && !user.is_primary_owner ? 'Member' : ''}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  show() {
    this.isVisible = true;
    this.setAttribute('visible', '');
  }

  close() {
    this.isVisible = false;
    this.removeAttribute('visible');
    this.dispatchEvent(new CustomEvent('close'));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-table': UserTable;
  }
} 