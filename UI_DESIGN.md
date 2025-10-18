# Unified Operations Platform - UI Design System

This platform uses the professional design system from **DU Fulfill**, ensuring a consistent, modern, and accessible user experience across all three business units (SitePanda, Decisions Unlimited, Logic Inbound).

## Design Philosophy

**Professional • Clean • Accessible • Mobile-First**

The design system prioritizes:
- **Clarity**: Clear visual hierarchy and intuitive navigation
- **Consistency**: Unified design language across all modules
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios
- **Responsiveness**: Mobile-first approach with touch-optimized interactions
- **Performance**: Smooth animations and transitions

---

## Color System

All colors use **HSL format** for consistency and easy theme switching.

### Light Theme

**Primary Colors:**
- `--primary: 217 91% 60%` - Professional blue for primary actions
- `--primary-foreground: 0 0% 100%` - White text on primary
- `--primary-hover: 217 91% 55%` - Slightly darker on hover

**Neutral Colors:**
- `--background: 0 0% 100%` - Pure white background
- `--foreground: 217 19% 27%` - Dark blue-gray text
- `--muted: 217 10% 96%` - Light gray for muted elements
- `--muted-foreground: 217 10% 45%` - Medium gray text

**Semantic Colors:**
- `--success: 142 71% 45%` - Green for success states
- `--warning: 38 92% 50%` - Orange for warnings
- `--destructive: 0 84% 60%` - Red for errors/destructive actions
- `--info: 217 91% 60%` - Blue for informational messages

**UI Elements:**
- `--border: 217 10% 89%` - Subtle borders
- `--input: 217 10% 89%` - Input field borders
- `--ring: 217 91% 60%` - Focus ring color

### Dark Theme

Automatically switches with system preferences or manual toggle.

- `--background: 222.2 84% 4.9%` - Deep navy background
- `--foreground: 210 40% 98%` - Near-white text
- All other colors adapt for optimal contrast

---

## Typography

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Scale:**
- **Headings:** h1 (2xl), h2 (xl), h3 (lg)
- **Body:** base (16px on mobile, 14px on desktop)
- **Small:** sm (14px), xs (12px)

**Font Features:**
- Ligatures enabled: `"rlig" 1, "calt" 1`
- Optimized for readability

---

## Spacing System

Based on **Tailwind's 4px scale:**

- `0.5` = 2px
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `6` = 24px
- `8` = 32px
- `12` = 48px

---

## Components

### Buttons

**Primary Button:**
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary-hover px-4 py-2 rounded-lg transition-smooth">
  Primary Action
</button>
```

**Secondary Button:**
```tsx
<button className="bg-secondary text-secondary-foreground hover:bg-muted px-4 py-2 rounded-lg transition-smooth">
  Secondary Action
</button>
```

**Destructive Button:**
```tsx
<button className="bg-destructive text-destructive-foreground hover:opacity-90 px-4 py-2 rounded-lg transition-smooth">
  Delete
</button>
```

### Cards

**Standard Card:**
```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-smooth card-hover">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</div>
```

### Inputs

**Text Input:**
```tsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:outline-none"
  placeholder="Enter text..."
/>
```

### Badges

**Status Badges:**
```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
  Active
</span>
<span className="px-2 py-1 text-xs font-medium rounded-full bg-warning/10 text-warning">
  Pending
</span>
<span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
  Inactive
</span>
```

---

## Layout Structure

### Sidebar Navigation

**Width:** 256px (w-64)
**Background:** `gradient-surface`
**Border:** Right border with `border-border`

**Structure:**
```
┌─────────────────────────┐
│ Logo + Brand            │ Header (h-16)
├─────────────────────────┤
│                         │
│ Navigation Items        │ Scrollable
│ - Dashboard             │
│ - Clients               │
│ - Projects              │
│ ...                     │
│                         │
├─────────────────────────┤
│ User Profile            │ Footer (h-16)
└─────────────────────────┘
```

### Main Content Area

**Padding:** p-6 on desktop, p-4 on mobile
**Max Width:** Full width with responsive containers
**Background:** `background`

---

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, hsl(217 91% 60%), hsl(217 91% 70%));
```
**Usage:** Buttons, cards, feature highlights

### Surface Gradient
```css
background: linear-gradient(145deg, hsl(0 0% 100%), hsl(217 10% 98%));
```
**Usage:** Sidebar, elevated surfaces

---

## Shadows

**Small:** `shadow-sm` - Subtle elevation
```css
box-shadow: 0 1px 2px 0 hsl(217 19% 27% / 0.05);
```

**Medium:** `shadow-md` - Standard cards
```css
box-shadow: 0 4px 6px -1px hsl(217 19% 27% / 0.1), 0 2px 4px -1px hsl(217 19% 27% / 0.06);
```

**Large:** `shadow-lg` - Modals, popovers
```css
box-shadow: 0 10px 15px -3px hsl(217 19% 27% / 0.1), 0 4px 6px -2px hsl(217 19% 27% / 0.05);
```

---

## Animations & Transitions

### Standard Transition
```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```
**Class:** `transition-smooth`

### Button Press Effect
```css
button:active {
  transform: scale(0.98);
}
```

### Card Hover
```css
.card-hover:hover {
  box-shadow: var(--shadow-md);
}
```

---

## Mobile Optimizations

### Touch Targets
**Minimum size:** 44x44px (Apple HIG standard)

All interactive elements (buttons, links, inputs) have minimum touch target sizes.

### Responsive Typography
- **Mobile:** 16px base font (prevents iOS zoom on input focus)
- **Desktop:** 14px base font

### Viewport Handling
- Prevents horizontal scroll
- Ensures dropdowns don't overflow
- Sticky headers stay visible

### iOS-Specific
- Smooth scrolling: `-webkit-overflow-scrolling: touch`
- No input zoom: `font-size: 16px !important` on mobile
- Touch feedback on all buttons

---

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```css
*:focus-visible {
  outline: none;
  ring: 2px solid var(--ring);
  ring-offset: 2px;
}
```

### Color Contrast
All text meets WCAG 2.1 AA standards:
- **Normal text:** 4.5:1 minimum
- **Large text:** 3:1 minimum

### Keyboard Navigation
- Tab order follows visual order
- All actions accessible via keyboard
- Skip links for screen readers

---

## Dark Mode

Automatically switches based on system preferences or manual toggle.

**Toggle Component:**
```tsx
<ThemeToggle />
```

**CSS Variables:** Automatically update when theme changes.

---

## Custom Utility Classes

### Gradient Classes
```css
.gradient-primary { background: var(--gradient-primary); }
.gradient-surface { background: var(--gradient-surface); }
```

### Shadow Classes
```css
.shadow-smooth { box-shadow: var(--shadow-md); }
```

### Transition Classes
```css
.transition-smooth { transition: var(--transition-smooth); }
```

### Scrollbar Hide
```css
.scrollbar-hide { /* Hides scrollbars while maintaining scroll */ }
```

---

## Organization-Specific Branding

Each business unit has its own branded experience while maintaining design consistency:

### SitePanda (sitepandaseo.com)
- **Primary Color:** Blue (default)
- **Logo:** Site Panda branding
- **Accent:** Professional blue tones

### Decisions Unlimited (ducrm.com)
- **Primary Color:** Blue (default)
- **Logo:** DU branding
- **Accent:** Professional blue tones

### Logic Inbound (my.logicinbound.com)
- **Primary Color:** Blue (default)
- **Logo:** Logic Inbound branding
- **Accent:** Professional blue tones

**Note:** While colors are currently consistent, the system supports per-organization theming via CSS variables.

---

## Implementation Guidelines

### Using the Design System

1. **Always use CSS variables** instead of hardcoded colors
2. **Use Tailwind classes** for spacing and layout
3. **Apply `transition-smooth`** to interactive elements
4. **Test on mobile** for every new component
5. **Ensure 44x44px** minimum touch targets
6. **Verify color contrast** with accessibility tools

### Adding New Components

1. Follow existing component patterns
2. Use semantic HTML elements
3. Include proper ARIA labels
4. Test keyboard navigation
5. Verify dark mode appearance
6. Document usage in this file

---

## Resources

**Tailwind CSS:** https://tailwindcss.com/docs
**shadcn/ui:** https://ui.shadcn.com (component library)
**Lucide Icons:** https://lucide.dev (icon system)
**WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

## Version History

**v1.0** - Initial design system based on DU Fulfill
- Professional color palette
- Mobile-first responsive design
- Accessibility compliance
- Dark mode support
- Organization-specific branding

---

**Last Updated:** October 18, 2025
**Maintained By:** Unified Operations Platform Team

