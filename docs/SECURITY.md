# ChurchOS Security Report

Audit date: 2026-08-05  
Scope: Authentication, authorization/RBAC, API security, validation, rate limiting, CSRF, XSS, SQL injection, uploads, sessions, org isolation, Prisma, secrets/env.

## Summary

A full-application security review found several high-impact issues (org takeover via onboarding slug collision, cross-tenant QR check-in race, world-readable uploads, Clerk webhook role demotion). All identified issues in this report have been remediated without changing product workflows for legitimate users.

---

## Findings & remediations

### Critical

| ID | Finding | Remediation |
|----|---------|-------------|
| C1 | **Org takeover via slug collision** — `ensureOrganizationWithOwner` reused an existing org when a slug matched and upserted the caller as `CHURCH_ADMIN`. | Refuse slug collision unless the caller already has an active membership. Onboarding returns a clear conflict error. |
| C2 | **Cross-tenant QR write** — People QR check-in resolved members globally, wrote attendance to the member’s org, then compared orgs. | `findByQrToken` and `checkInByQr` are now organization-scoped; check-in never writes outside the active tenant. |

### High

| ID | Finding | Remediation |
|----|---------|-------------|
| H1 | **Public document uploads** — Files written under `public/uploads/` were world-readable; MIME checks were weak. | Files stored under private `.data/uploads/`. Served only via `/api/uploads/[kind]/[id]` after auth + permission + tenant checks. Extension/MIME allowlist + size cap. |
| H2 | **Clerk webhook role overwrite** — Membership sync forced roles to `CHURCH_ADMIN` / `MEMBER`, wiping PASTOR and other rich roles. | Sync only for “Clerk-syncable” roles (`CHURCH_ADMIN`, `MEMBER`, `GUEST`). Rich ChurchOS roles are preserved. |
| H3 | **Middleware allow-by-default** — Only listed app paths + `/api/*` called `auth.protect()`. | Deny-by-default: every non-public route requires Clerk auth. Public: `/`, sign-in/up, webhooks. |

### Medium

| ID | Finding | Remediation |
|----|---------|-------------|
| M1 | No rate limiting | In-memory limiter on onboard, CSV import, check-in, search, uploads, org switch, webhooks. |
| M2 | Unbounded CSV import | Cap 1000 rows + 2MB payload; service-layer enforcement. |
| M3 | Uncapped attendance search `limit` | Cap at 50 in actions and repository. |
| M4 | Writes accepting foreign `memberId` / `householdId` | `requireMemberInOrg` / `requireHouseholdInOrg` on write paths. |
| M5 | Executive dashboard usable by GUEST (`requireTenantContext` only) | Requires `PEOPLE_READ` (GUEST excluded; operational roles unchanged). |
| M6 | CSS `url(${userUrl})` injection on covers/heroes | `safeCssUrl` / `safeBackgroundImage`; hero URLs validated as http(s) only. |
| M7 | Zod gaps (visitor advance note, quick actions) | Added Zod validation for notes/details and IDs. |

### Low

| ID | Finding | Remediation |
|----|---------|-------------|
| L1 | `assertSameTenant` threw generic `Error` | Throws `forbidden()` (`AppError`). |
| L2 | No security headers / CSP | `next.config.ts`: CSP, HSTS, `X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy; `poweredByHeader: false`. |
| L3 | Hard delete on Clerk `user.deleted` | Soft-deactivate: suspend memberships, anonymize user row (preserves audit FKs). |
| L4 | CSRF on mutating org APIs | Origin check (`assertSameOrigin`) on onboard/switch POSTs. Server Actions retain Next.js origin protection. |

---

## Areas reviewed with no critical issues

| Area | Status |
|------|--------|
| **SQL injection** | No raw SQL; Prisma parameterized queries only. |
| **XSS (HTML)** | No `dangerouslySetInnerHTML` usage found. Remaining risk was CSS url injection (fixed). |
| **RBAC model** | Coarse permissions in `src/domain/permissions/rbac.ts` enforced via `requirePermission` on server actions. `MEMBER` breadth is intentional product design — not narrowed. |
| **Session / org cookie** | `churchos_org_id` is httpOnly, SameSite=lax, Secure in production; membership validated on resolve. |
| **Clerk webhook authenticity** | Svix signature verification present and retained. |
| **Secrets / env** | `.env*` gitignored; `.env.example` uses placeholders only; documented security notes. |
| **Prisma tenancy** | Repositories generally scope by `organizationId`; strengthened with explicit entity-in-org asserts on writes. |

---

## Operational notes

1. **Upload storage** — Ensure `.data/` is persisted and not web-accessible in deployment. Migrate any legacy `public/uploads` files if they exist in an environment.
2. **Rate limiting** — In-memory buckets are per-process. Use Redis (or edge rate limits) for multi-instance production.
3. **CSP + Clerk** — CSP allows Clerk script/frame/connect hosts. Tighten further per Clerk domain if you use a production Clerk frontend API host not covered by wildcards.
4. **Webhook roles** — Assign PASTOR / CELL_LEADER / etc. inside ChurchOS; Clerk org roles only drive admin vs member for syncable roles.

---

## Verification

Run: `npm run typecheck && npm run lint && npm run build`
