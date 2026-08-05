# Architecture

ChurchOS follows Clean Architecture with a multi-tenant boundary.

```
src/
  domain/                 # Pure business rules (roles, permissions, entities)
  application/            # Use-cases / services (ports + orchestration)
  infrastructure/         # Prisma, Clerk adapters, repositories
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

## Auth flow

1. Clerk authenticates the user (session JWT).
2. Middleware protects app + API routes.
3. `requireDbUser()` syncs Clerk → Prisma `User`.
4. Onboarding creates an Organization + Church Admin membership.
5. Org switcher updates the active org cookie.

## Setup

```bash
cp .env.example .env.local
# fill DATABASE_URL + Clerk keys

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Webhook (optional but recommended): point Clerk to
`POST /api/webhooks/clerk` for user/org sync.
