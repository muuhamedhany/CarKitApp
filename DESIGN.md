# CarKit Design System Guide

This document defines the design language, visual standards, and UX principles for the CarKit ecosystem.

## 1. Visual Identity (BEAUTIFUL)

CarKit uses a **Neon Obsidian** aesthetic: deep dark backgrounds punctuated by high-contrast neon purple and pink accents.

### Color Palette
- **Primary Accent**: Neon Pink (`#CD42A8`) - Used for CTAs and highlights.
- **Secondary Accent**: Deep Purple (`#5923A0`) - Used for backgrounds, gradients, and secondary interactions.
- **Base**: Obsidian Black (`#050505`) - The core canvas of the application.

### Typography
- **Primary Font**: Poppins (Sans-Serif)
- **Scale**:
  - `xl` (24px): Page headers
  - `lg` (18px): Section titles
  - `md` (16px): Standard body text
  - `sm` (14px): Captions/Secondary info

### Glassmorphism
Interactive cards should use glassmorphic styling:
- **Dark Mode**: `rgba(20, 20, 25, 0.6)` background with a `0.08` opacity white border.
- **Light Mode**: `rgba(255, 255, 255, 0.95)` with a `0.15` opacity pink border.

## 2. Component Standards (RIGHT)

### Buttons
- **Primary**: Gradient (`pink` to `purple`) with rounded corners (` BorderRadius.lg`).
- **Secondary**: Glassmorphic with border.
- **Feedback**: All buttons must trigger Haptic Feedback (Light/Medium) on press.

### Form Inputs
- No standard square borders. Use rounded corners and subtle background contrast.
- Focus states should use a pink glow shadow.

### Icons
- Use **Lucide** or **MaterialCommunityIcons** exclusively.
- **Rule**: Never use emojis as UI icons.

## 3. Micro-Interactions (SATISFYING)

- **Timing**: Standard transitions are `250ms` (`Animations.duration.normal`).
- **Scale**: Interactive elements should scale slightly (0.98x) on press to provide tactile feedback.
- **Loading**: Use shimmering skeleton screens instead of generic spinners where possible.

## 4. Narrative & Polish (PEAK)

- **Glow Effects**: Use subtle radial gradients (glows) behind major elements to create depth.
- **Empty States**: Use thematic illustrations or premium icon compositions, never just text.
- **Success Moments**: Use particle effects or unique animations for completed orders/bookings.
