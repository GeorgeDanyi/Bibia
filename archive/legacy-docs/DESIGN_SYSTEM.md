# Bibia Design System

A comprehensive design system for the Bibia physiotherapy platform, ensuring consistency, accessibility, and maintainability across all components.

## 🎨 Colors

### Seafoam Palette
```css
--seafoam-900: #153b36  /* Darkest - Headers, important text */
--seafoam-700: #1c4a44  /* Dark - Secondary text, borders */
--seafoam-600: #225f56  /* Primary - Buttons, links, accents */
--seafoam-500: #2e8b75  /* Primary hover - Button hover states */
--seafoam-400: #3da188  /* Medium - Focus rings, highlights */
--seafoam-300: #7fd1bf  /* Light - Placeholders, disabled */
--seafoam-200: #bfe9df  /* Lighter - Backgrounds, borders */
--seafoam-100: #e9f6f3  /* Lightest - Backgrounds, cards */
```

### Neutral Colors
```css
--white: #ffffff  /* Pure white - Cards, backgrounds */
--ink: #0e1a18   /* Darkest - High contrast text */
```

### Usage Guidelines
- **Primary Actions**: Use `seafoam-600` for buttons and primary links
- **Text Hierarchy**: Use `seafoam-900` for headings, `seafoam-700` for body text
- **Backgrounds**: Use `seafoam-100` for subtle backgrounds, `white` for cards
- **Focus States**: Use `seafoam-400` for focus rings and highlights

## 📐 Border Radius

```css
--radius-xs: 8px   /* Small elements - badges, tags */
--radius-sm: 12px  /* Inputs, small buttons */
--radius-md: 16px  /* Buttons, cards */
--radius-lg: 24px  /* Large cards, modals */
--radius-xl: 32px  /* Hero sections, major containers */
```

## 🌟 Shadows

```css
--shadow-soft: 0 10px 30px rgba(0,0,0,.08)  /* Subtle depth */
--shadow-glow: 0 0 24px rgba(61,161,136,.35) /* Seafoam glow effect */
```

## ✍️ Typography

### Font Family
- **Primary**: Inter (clean, modern)
- **Fallback**: Manrope, system-ui, sans-serif

### Type Scale
```css
/* H1 - Hero headlines */
font-size: 48px
line-height: 56px
font-weight: 700

/* H2 - Section headlines */
font-size: 32px
line-height: 40px
font-weight: 700

/* Body - Main content */
font-size: 16px
line-height: 26px
font-weight: 500

/* Small - Captions, labels */
font-size: 14px
line-height: 22px
font-weight: 400
```

## 🎭 Motion

### Duration
- **Fast**: 200ms (micro-interactions)
- **Normal**: 300ms (standard transitions)
- **Slow**: 500ms (page transitions)

### Easing
```css
cubic-bezier(0.22,1,0.36,1)  /* Smooth, natural feel */
```

### Animations
- **Fade Up**: Elements fade in with 8px upward translation
- **Hover Lift**: 2-4px upward translation on hover
- **Reduced Motion**: All animations respect `prefers-reduced-motion`

## 🧩 Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--seafoam-600) 0%, var(--seafoam-500) 100%);
  color: var(--white);
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-weight: 600;
  transition: all var(--motion-duration-normal) var(--motion-easing);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--seafoam-600);
  border: 2px solid var(--seafoam-600);
  border-radius: var(--radius-md);
  padding: 10px 24px;
  font-weight: 600;
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--seafoam-600);
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-weight: 500;
}
```

### Cards

#### Glassy Card
```css
.card-glassy {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  transition: all var(--motion-duration-normal) var(--motion-easing);
}

.card-glassy:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
}
```

### Inputs

#### Base Input
```css
.input-base {
  background: var(--white);
  border: 1px solid var(--seafoam-200);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: 16px;
  line-height: 26px;
  font-weight: 500;
  transition: all var(--motion-duration-normal) var(--motion-easing);
}

.input-base:focus {
  outline: none;
  border-color: var(--seafoam-400);
  box-shadow: 0 0 0 2px rgba(61, 161, 136, 0.2);
}
```

## ♿ Accessibility

### Color Contrast
- **AA Compliance**: All text meets WCAG AA standards
- **AAA Preferred**: Body text on dark backgrounds meets AAA standards
- **Focus Indicators**: 2px seafoam-400 focus rings on all interactive elements

### Focus Management
- **Visible Focus**: All interactive elements have clear focus indicators
- **Keyboard Navigation**: Full keyboard support for all components
- **Screen Readers**: Proper ARIA labels and semantic HTML

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .animate-float,
  .animate-pulse-glow {
    animation: none;
  }
  
  .btn-primary:hover,
  .btn-secondary:hover,
  .card-glassy:hover {
    transform: none;
  }
}
```

## 🚀 Usage

### Import the Design System
```typescript
import designSystem from '@/lib/design-system'
```

### Use CSS Classes
```html
<button class="btn-primary">Primary Action</button>
<div class="card-glassy">Glassy Card</div>
<input class="input-base" placeholder="Enter text..." />
```

### Use CSS Variables
```css
.custom-component {
  background: var(--seafoam-100);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
}
```

## 📱 Responsive Design

The design system is mobile-first and includes responsive utilities:

- **Mobile**: Optimized touch targets (44px+)
- **Tablet**: Balanced spacing and typography
- **Desktop**: Full feature set with hover states

## 🔧 Customization

### Adding New Colors
1. Add to `colors` object in `design-system.ts`
2. Add CSS variable to `design-system.css`
3. Update documentation

### Adding New Components
1. Define styles in `components` object
2. Add CSS classes to `design-system.css`
3. Include accessibility considerations
4. Update documentation

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font](https://rsms.me/inter/)
- [Manrope Font](https://fonts.google.com/specimen/Manrope)
- [Cubic Bezier Easing](https://cubic-bezier.com/#.22,1,.36,1)
