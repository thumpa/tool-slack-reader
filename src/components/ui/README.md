# UI Components Library

This library provides a set of reusable UI components that follow consistent styling patterns. All components use the theme variables defined in `theme.css` for consistent appearance across the application.

## Components

### Button (`ui-button`)

A versatile button component with multiple variants.

```typescript
// Usage
html`
  <ui-button variant="primary">Primary Button</ui-button>
  <ui-button variant="secondary">Secondary Button</ui-button>
  <ui-button variant="text">Text Button</ui-button>
  <ui-button disabled>Disabled Button</ui-button>
`

// Properties
interface Button {
  variant: 'primary' | 'secondary' | 'text';
  disabled: boolean;
}

// Events
'click': CustomEvent<{ originalEvent: Event }>
```

### Modal (`ui-modal`)

A modal dialog component with header and content areas.

```typescript
// Usage
html`
  <ui-modal
    .title=${'Modal Title'}
    .isVisible=${true}
    @close=${() => {}}
  >
    <div>Modal content goes here</div>
  </ui-modal>
`

// Properties
interface Modal {
  title: string;
  isVisible: boolean;
}

// Methods
show(): void
close(): void

// Events
'close': CustomEvent<void>
```

### Select (`ui-select`)

A select dropdown component with consistent styling.

```typescript
// Usage
html`
  <ui-select
    .options=${[
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ]}
    .value=${selectedValue}
    .placeholder=${'Select an option'}
    @change=${(e) => handleChange(e.detail.value)}
  ></ui-select>
`

// Properties
interface Select {
  options: Array<{ value: string; label: string }>;
  value: string;
  placeholder: string;
  disabled: boolean;
}

// Events
'change': CustomEvent<{ value: string }>

// Important: When using select components, ensure font size is explicitly set in the parent component:
css`
  .your-selector select {
    font-size: var(--font-size-base);
  }
`
```

## Styling Patterns

All components follow these styling patterns:

1. **Theme Variables**
   - Use CSS variables from `theme.css` for colors, spacing, and typography
   - Support both light and dark themes automatically
   - Consistent border radius (4px) and transitions

2. **Interactive States**
   - Hover: Background color changes to `--bg-hover`
   - Focus: Border color changes to `--link-color` (except for select elements)
   - Disabled: 50% opacity and not-allowed cursor

3. **Typography**
   - Font family: `--font-family-base`
   - Base font size: `--font-size-base`
   - Text colors: `--text-primary` and `--text-secondary`
   - **Important**: Form elements may require explicit font size settings in parent components

4. **Spacing**
   - Consistent padding using `--spacing-*` variables
   - Margins follow the same pattern
   - Component spacing is standardized

5. **Transitions**
   - Quick transitions (0.2s) for hover/focus states
   - Base transitions (0.3s) for larger changes

## Form Element Styling

When working with form elements (select, input, textarea), follow these guidelines:

1. **Base Styles**
   - Define core styles in the UI component
   - Include font family, color, border, and background styles
   - Set default dimensions and padding

2. **Parent Component Overrides**
   - Set explicit font sizes in parent components where needed
   - Example:

     ```css
     .your-component select {
       font-size: var(--font-size-base);
     }
     ```

   - This ensures consistent text sizing across different browsers

3. **Browser Consistency**
   - Use `-webkit-appearance: none` and similar properties to reset browser defaults
   - Set explicit heights for form elements to maintain consistency
   - Use line-height: 1 to prevent sizing issues

## Usage Example

```typescript
import { html } from 'lit';
import { Button, Modal, Select } from './ui';

class MyComponent extends LitElement {
  private showModal = false;
  private selectedValue = '';

  static styles = css`
    /* Ensure consistent font sizing for form elements */
    .form-container select {
      font-size: var(--font-size-base);
    }
  `;

  render() {
    return html`
      <div class="form-container">
        <ui-button @click=${() => this.showModal = true}>
          Open Modal
        </ui-button>

        <ui-modal
          .title=${'Example Modal'}
          .isVisible=${this.showModal}
          @close=${() => this.showModal = false}
        >
          <ui-select
            .options=${[
              { value: '1', label: 'Option 1' },
              { value: '2', label: 'Option 2' }
            ]}
            .value=${this.selectedValue}
            @change=${(e) => this.selectedValue = e.detail.value}
          ></ui-select>
        </ui-modal>
      </div>
    `;
  }
}
```
