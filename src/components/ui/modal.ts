import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ui-modal')
export class Modal extends LitElement {
  @property({ type: Boolean }) isVisible = false;
  @property({ type: String }) title = '';

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
      width: var(--modal-width, 800px);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      position: relative;
      border: 1px solid var(--border-color);
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
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
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
      transition: color var(--transition-quick);
    }

    .close-button:hover {
      color: var(--text-primary);
    }

    .modal-content {
      padding: 1rem;
    }
  `;

  render() {
    return html`
      <div class="modal" part="modal" ?hidden=${!this.isVisible}>
        <div class="modal-header">
          <h2 class="modal-title">${this.title}</h2>
          <button class="close-button" @click=${this.close}>×</button>
        </div>
        <div class="modal-content">
          <slot></slot>
        </div>
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
    'ui-modal': Modal;
  }
} 