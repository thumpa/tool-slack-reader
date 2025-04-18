import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ui-button')
export class Button extends LitElement {
  @property({ type: String }) variant: 'primary' | 'secondary' | 'text' = 'primary';
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    :host {
      display: inline-block;
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
      font-family: var(--font-family-base);
      transition: all var(--transition-quick);
    }

    button:hover:not(:disabled) {
      background: var(--bg-hover);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.primary {
      background-color: var(--bg-selected);
      border-color: var(--link-color);
      color: var(--text-primary);
    }

    button.primary:hover:not(:disabled) {
      background-color: var(--link-color);
      color: white;
    }

    button.text {
      border: none;
      padding: 0.25rem 0.5rem;
    }

    button.text:hover:not(:disabled) {
      background: var(--bg-hover);
    }
  `;

  render() {
    return html`
      <button
        class=${this.variant}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  private handleClick(e: Event) {
    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('click', {
        detail: { originalEvent: e },
        bubbles: true,
        composed: true
      }));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': Button;
  }
} 