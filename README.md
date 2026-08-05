# ChurchOS

A premium Church Operating System for 2026 — calm, elegant, and trustworthy.

Built with **Next.js 15**, **React**, **TypeScript**, **Tailwind CSS**, **shadcn/ui patterns**, **Framer Motion**, and **Recharts**.

## Features

- Glassmorphism UI with aurora animated backgrounds
- Dark & light themes (system-aware)
- Command palette (`⌘K` / `Ctrl+K`)
- Animated dashboards for attendance & giving
- Modules: Dashboard, People, Events, Giving, Groups, Settings
- Premium loading, empty, error, and success states
- Smooth page transitions and micro-interactions
- WCAG AA–minded focus states, semantics, and reduced-motion support
- Responsive layout for desktop, tablet, and mobile

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |

## Design system

- **Typography:** Inter (UI) + Geist (display)
- **Spacing:** 8px rhythm
- **Radii:** 24–32px (`rounded-2xl` / `rounded-3xl`)
- **Accent:** Soft teal on slate neutrals — calm and trustworthy
- **Surfaces:** Frosted glass panels with backdrop blur

## Architecture

```
src/
  app/(app)/          # App routes (server pages + metadata)
  components/
    ui/               # shadcn/ui primitives
    layout/           # Shell, sidebar, topbar, theme
    dashboard/        # Charts, stats, activity
    command/          # Command palette
    motion/           # Aurora + transitions
    shared/           # Empty / loading / error / success
    people|events|…/  # Feature views
  hooks/              # Shared hooks
  lib/                # Utils + mock data
```

shadcn/ui is configured via `components.json` (New York style, CSS variables, Lucide icons).
