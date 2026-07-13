# Glassmorphism Redesign Design

## Overview

Full application redesign implementing the "Obsidian Glass" design system with glassmorphism effects, Material Symbols icons, and a fixed sidebar layout.

## Design System

### Color Palette

**Background & Surface:**
- Background: `#08080a` (deep obsidian)
- Surface: `rgba(255,255,255,0.01)` with `backdrop-filter: blur(12px)`
- Surface Container: `#14141a`
- Surface Container Low: `#1b1b22`
- Surface Container High: `#2a2931`

**Primary Colors:**
- Primary: `#d0bcff` (vibrant violet)
- Primary Container: `#a078ff`
- On Primary: `#3c0091`

**Secondary Colors:**
- Secondary: `#c4c1fb` (soft lavender)
- Secondary Container: `#444173`

**Tertiary Colors:**
- Tertiary: `#ffb869` (warm amber)
- Tertiary Container: `#ca801e`

**Error Colors:**
- Error: `#ffb4ab` (soft red)
- Error Container: `#93000a`

**Text Colors:**
- On Surface: `#ffffff` (pure white)
- On Surface Variant: `#cbc3d7` (muted lavender)
- On Background: `#e4e1ec`

### Typography

**Font Family:** Inter

**Hierarchy:**
- Display LG: 48px, 700 weight, 56px line-height, -0.02em letter-spacing
- Headline LG: 32px, 600 weight, 40px line-height, -0.01em letter-spacing
- Headline MD: 24px, 600 weight, 32px line-height
- Body LG: 16px, 400 weight, 24px line-height
- Body MD: 14px, 400 weight, 20px line-height
- Label MD: 12px, 500 weight, 16px line-height, 0.05em letter-spacing

### Spacing System

**Base Unit:** 4px

**Scale:**
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 40px
- Gutter: 20px
- Margin: 32px

### Border Radius

- SM: 0.25rem (4px)
- DEFAULT: 0.5rem (8px)
- MD: 0.75rem (12px)
- LG: 1rem (16px)
- XL: 1.5rem (24px)
- FULL: 9999px

## Layout Structure

### Fixed Sidebar Layout

- **Sidebar Width:** 264px fixed
- **Main Content:** flex1, scrollable
- **Header Height:** 60px
- **Content Padding:** 32px

### Grid System

- **Columns:** 12-column fluid grid
- **Card Minimum Width:** 270px
- **Gap:** 20px between grid items
- **Responsive:** Collapses to 4 columns on smaller viewports

## Components

### Sidebar

**Structure:**
- Logo/branding area at top
- Navigation items with icons and labels
- Active state with purple accent bar
- System status indicator at bottom
- "New Project" button

**Styling:**
- Glass effect with `backdrop-filter: blur(24px)`
- 1px right border with `rgba(255,255,255,0.06)`
- Navigation items: 10px padding, 12px border-radius
- Active state: `rgba(208,188,255,0.1)` background, 3px left accent bar

### Preset Cards

**Structure:**
- Icon with glow effect
- Status badge (Ready/Idle/High Power)
- Title and description
- Launch button with arrow

**Styling:**
- Glass card with `backdrop-filter: blur(12px)`
- 1px border with `rgba(255,255,255,0.05)`
- Hover: `translateY(-4px) scale(1.01)`
- Border color change to `rgba(208,188,255,0.3)` on hover
- Purple bloom: `box-shadow: 0 12px 40px -12px rgba(208,188,255,0.15)`

### Input Fields

**Styling:**
- Background: `rgba(0,0,0,0.2)`
- 1px bottom border
- Focus state: border illuminates to purple
- Placeholder text at 30% opacity

### Buttons

**Primary:**
- Solid purple gradient background
- White text, 600 weight
- Hover: `box-shadow: 0 0 20px rgba(208,188,255,0.2)`

**Secondary (Ghost Glass):**
- Transparent background
- 1px white border at 10% opacity
- Hover: background opacity increases to 8%

## Effects & Interactions

### Glassmorphism Effects

- **Backdrop Blur:** 24px for cards, 40px for modals
- **Inner Glow:** 1px internal border (`rgba(255,255,255,0.08)`)
- **Purple Bloom:** Soft outer glow (`rgba(208,188,255,0.2)`) with 30px spread

### Hover Effects

- **Cards:** `translateY(-4px) scale(1.01)`
- **Border:** Color changes to purple with 30% opacity
- **Background:** Opacity increases to 3%

### Transitions

- **Duration:** 0.3s
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)`

### Scrollbars

- **Width:** 3px
- **Track:** Transparent
- **Thumb:** `rgba(255,255,255,0.1)` with 10px border-radius

## Implementation Scope

### Full Application Redesign

1. **Global Styles:** Update CSS variables and base styles
2. **Sidebar Component:** Rewrite with glassmorphism effects
3. **PresetsPage:** Rewrite with card grid and glass effects
4. **NotesPage:** Apply new design system
5. **SettingsPage:** Apply new design system
6. **Modals:** Update with high-intensity blur (40px)
7. **Titlebar:** Update with new design system

### Icon Library

- Replace Phosphor icons with Material Symbols
- Use Material Symbols Outlined variant
- Font weight: 300-700

## Success Criteria

1. All pages match the "Obsidian Glass" design system
2. Glassmorphism effects work correctly across all components
3. Material Symbols icons are properly integrated
4. Responsive layout works on different viewport sizes
5. Performance remains acceptable with glass effects
6. All existing functionality is preserved
