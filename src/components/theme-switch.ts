import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('theme-switch')
export class ThemeSwitch extends LitElement {
  @property({ type: Boolean }) isDark = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    .theme-switch {
      display: flex;
      align-items: center;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 32px;
      height: 20px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      transition: .2s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: var(--text-primary);
      transition: .2s;
      border-radius: 50%;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>');
      background-size: 10px;
      background-repeat: no-repeat;
      background-position: center;
    }

    input:checked + .slider {
      background-color: var(--bg-selected);
    }

    input:checked + .slider:before {
      transform: translateX(12px);
    }

    .switch:hover .slider {
      border-color: var(--text-secondary);
    }
  `;

  private handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.isDark = target.checked;
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { isDark: this.isDark },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="theme-switch">
        <label class="switch">
          <input
            type="checkbox"
            .checked=${this.isDark}
            @change=${this.handleChange}
          >
          <span class="slider"></span>
        </label>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'theme-switch': ThemeSwitch;
  }
} 