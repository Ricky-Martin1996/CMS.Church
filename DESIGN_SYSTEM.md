# ChurchOS Design System

Enterprise UI kit for a calm, trustworthy church operating system.

## Principles

1. **Clarity over chrome** — hierarchy first, decoration second  
2. **Glass with restraint** — blur + sheen, never noisy  
3. **8px rhythm** — spacing multiples of 4/8  
4. **24–32px radii** — `--radius` 24px, `--radius-lg` 32px  
5. **Motion with purpose** — Framer Motion only when it aids comprehension  
6. **WCAG AA** — contrast-safe muted text, visible focus rings  

## Tokens

Defined in `src/app/globals.css`:

- Color roles: background, foreground, primary, muted, success, warning, destructive  
- Glass: `--glass`, `--glass-strong`, `--glass-blur`, `--glass-sheen`  
- Elevation: `--shadow-soft`, `--shadow-float`, `--shadow-glow`, `--shadow-elevated`  
- Motion: `--motion-fast|base|slow`, `--ease-out`  
- Accents: `data-accent="ocean|sage|copper|indigo"`  

Shared motion helpers live in `src/lib/motion.ts`.

## Components

| Area | Path |
| --- | --- |
| Primitives | `src/components/ui/*` |
| Shell | `src/components/layout/*` |
| States | `src/components/shared/states.tsx` |
| Page header | `src/components/shared/page-header.tsx` |
| Toasts | `src/components/ui/toast.tsx` |
| Tables | `src/components/ui/table.tsx` |
| Dropdowns | `src/components/ui/dropdown-menu.tsx` |
| Context menus | `src/components/ui/context-menu.tsx` |

## Typography

- **UI:** Inter (`font-sans`) at 15px / 24px line-height  
- **Display:** Geist (`font-display`) for titles  
- Page titles: 30–36px (mobile) → 36–48px (desktop)  

## Interaction checklist

- Hover: subtle lift or background shift  
- Active: scale/press feedback on buttons  
- Focus: 2px ring with offset  
- Reduced motion: animations disabled via `prefers-reduced-motion`  
