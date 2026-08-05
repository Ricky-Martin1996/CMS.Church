# Architecture

ChurchOS follows Clean Architecture with a multi-tenant boundary.

```
src/
  domain/                 # Pure business rules (roles, permissions, entities)
  application/            # Use-cases / services (ports + orchestration)
    people/               # Members CRM services + server actions
    households/           # Family & Household Management
    attendance/           # Attendance & Check-in
  infrastructure/         # Prisma, repositories
  server/                 # Next.js server helpers (auth, rbac, tenant scope)
  app/                    # Presentation (App Router)
  components/             # UI
  middleware.ts           # Clerk route protection
prisma/
  schema.prisma
  seed.ts
```

## Multi-tenancy

- Every domain record must include `organizationId`.
- Active organization is stored in the `churchos_org_id` httpOnly cookie.
- `requireTenantContext()` resolves user + org + role for server code.
- `withTenant(organizationId, data)` stamps writes with the tenant id.

## RBAC roles

Super Admin · Church Admin · Pastor · Cell Leader · Volunteer Leader ·
Finance Manager · Member · Guest

Permissions live in `src/domain/permissions/rbac.ts`.

CRM permissions: `people:read|write|export|import`, note visibility,
`people:documents`, `people:giving:view`.

Household permissions: `households:read|write|delete|merge|export|import`.

Attendance permissions: `attendance:read|write|manage|export|sessions`.

## Auth flow

1. Clerk authenticates the user (session JWT).
2. Middleware protects app + API routes.
3. `requireDbUser()` syncs Clerk → Prisma `User`.
4. Onboarding creates an Organization + Church Admin membership.
5. Org switcher updates the active org cookie.

## Members CRM

Congregant records live in `Member` (not platform `Membership`).

- List: `/people` — search, filters, table/grid/card/compact, infinite scroll, bulk, CSV
- Profile: `/people/[id]` — hero, timeline, family, docs, notes, analytics, AI insights
- QR check-in: `/people/check-in` (legacy) → links to full Attendance desk
- Server actions: `src/application/people/actions.ts`

Every mutating CRM action writes a `MemberActivity` timeline event.

## Family & Households

The **Household** is the pastoral-care unit. Members connect via
`HouseholdMembership` (table `family_members`) with relationships:
Head, Husband, Wife, Son, Daughter, Parent, Grandparent, Guardian, Relative, Other
(plus legacy Spouse / Child / Sibling for CRM compatibility).

- List: `/households` — search, filters, table/grid, infinite scroll, bulk, CSV
- Profile: `/households/[id]` — hero, family tree, members, timeline, analytics
- Operations: add/move members, assign relations, change head, merge, split
- Server actions: `src/application/households/actions.ts`

A member belongs to at most one household (`memberId` unique on membership).

## Attendance & Check-in

Service-day attendance platform with live sessions.

- Dashboard: `/attendance` — live counts, visitors, trends, ministry comparison
- Check-in desk: `/attendance/check-in` — QR, member search, household, manual, visitor
- Sessions: `/attendance/sessions` — create, start (LIVE), close, export CSV
- Models: `AttendanceSession`, `AttendanceRecord`, `Visitor`, `VisitorAttendance`
- Methods: QR · Search · Household · Manual · Visitor · Volunteer
- Duplicate prevention per session · activity timeline on check-in
- Legacy CRM attendance (no sessionId) still powers member/household trend charts
- Server actions: `src/application/attendance/actions.ts`

## Setup

```bash
cp .env.example .env.local
# fill DATABASE_URL + Clerk keys

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Webhook (optional but recommended): point Clerk to
`POST /api/webhooks/clerk` for user/org sync.
