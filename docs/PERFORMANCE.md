# ChurchOS Performance Guide

Audit date: 2026-08-05  
Targets: Lighthouse 95+, strong Core Web Vitals, fast cold start, fast dashboard.

## Goals

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 95+ |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Dashboard TTFB (cached) | Low tens of ms after warm |
| Cold start | Minimal client JS before first paint |

---

## What we optimized

### Next.js rendering & route UX

- **SSR prefetch** for Dashboard and People list (data in the initial HTML; no hydrate → spinner → fetch waterfall).
- **`loading.tsx`** under `(app)` for instant navigation skeletons.
- **Deny client waterfalls** where profiles already SSR’d (people/households/visitors detail remain the pattern to copy).
- **`unstable_cache`** (45s) for executive dashboard snapshots, tagged `org:{id}:dashboard`.

### React / bundles / code splitting

- **`experimental.optimizePackageImports`** for `lucide-react`, `date-fns`, `recharts`, `framer-motion`, Radix packages.
- **`next/dynamic`** for:
  - Executive charts (recharts)
  - Command palette & notifications (shell)
  - Member / household QR dialogs (`qrcode`)
- **Split `MotionCard`** into `@/components/ui/motion-card` so static `Card` no longer pulls framer-motion.
- Removed unused **`papaparse`** dependency.
- Conditionally mount command palette / notifications only when open.

### Server Components & session

- **`React.cache()`** on `requireDbUser` and `requireTenantContext` — layout + page + actions share one resolution per request.
- App layout **passes memberships** into the shell so OrganizationSwitcher skips a duplicate `/api/organizations/switch` fetch on mount.

### Prisma / indexes / N+1

- Event list **party sizes** batched via `groupBy` (was N× `findMany`).
- Volunteer conflict detection **one query** for all volunteers (was N× `findFirst`).
- Care-signal birthday/anniversary filter simplified; household snapshot **parallelized**.
- Member growth buckets use **parallel counts** (not sequential).
- Profile includes **capped** (`take: 40`) for notes/documents/prayers/volunteers.
- Migration `20260805200000_performance_indexes` adds indexes for:
  - `members` lifecycle / createdAt / campus
  - `households` cellGroup / engagementScore / assignedCellLeaderId
  - `attendance_records` org + household + attendedAt
  - `visitors` stageEnteredAt / createdAt
  - `prayer_requests` org + status
  - `church_events` org + deletedAt + startsAt
  - `volunteer_ministry_preferences` org + ministryId

### Images & motion

- **`next/image`** for remote avatars (AVIF/WebP) with Clerk/Gravatar allowlists.
- Aurora: fewer blobs; reduced-motion disables animation and softens glass blur.
- `MotionCard` / mobile sidebar respect **`useReducedMotion`**.
- Live attendance polling **pauses when the tab is hidden**.

### Network

- People preferences no longer write-on-hydrate (debounced, skip first paint).
- Dashboard client refresh uses action cache (same tags as SSR).

---

## Core Web Vitals checklist (ops)

1. Deploy with CDN edge for static assets; keep `compress: true` (enabled in `next.config.ts`).
2. Run `npx prisma migrate deploy` so performance indexes exist in production.
3. Prefer SSR/`initialData` for any new list page (copy People/Dashboard).
4. Lazy-load any new chart/QR/DnD module with `next/dynamic`.
5. Measure with Lighthouse on `/dashboard` and `/people` after a warm cache.

---

## Remaining opportunities (not blocking)

| Item | Note |
|------|------|
| Households / attendance / events / communications list SSR | Same `initialData` pattern as People |
| Event analytics N+1 volunteer summaries for up to 20 events | Further batching possible |
| Redis rate limit / shared dashboard cache | Needed for multi-instance |
| Push birthday window into SQL (`EXTRACT`) | Better at very large member counts |
| Replace layout `layoutId` springs with CSS where possible | Extra INP headroom on low-end mobile |

---

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Apply indexes:

```bash
npx prisma migrate deploy
```
