import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface SelectOption {
  value: string;
  label: string;
}

@customElement('ui-select')
export class Select extends LitElement {
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = 'Select an option';
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: var(--font-size-base);
      font-family: var(--font-family-base);
      line-height: 1;  /* Prevent line height from affecting sizing */
      height: 36px;    /* Match button height */
      cursor: pointer;
      transition: all var(--transition-quick);
      outline: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Prevent any focus/active state color changes */
    select:focus,
    select:active,
    select:-webkit-autofill {
      outline: none;
      border-color: var(--border-color);
      box-shadow: none;
      -webkit-box-shadow: none;
    }

    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    select:hover:not(:disabled) {
      border-color: var(--text-secondary);
    }
  `;

  render() {
    return html`
      <select
        .value=${this.value}
        ?disabled=${this.disabled}
        @change=${this.handleChange}
      >
        <option value="" disabled selected>${this.placeholder}</option>
        ${this.options.map(option => html`
          <option
            value=${option.value}
            ?selected=${option.value === this.value}
          >
            ${option.label}
          </option>
        `)}
      </select>
    `;
  }

  private handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-select': Select;
  }
} 