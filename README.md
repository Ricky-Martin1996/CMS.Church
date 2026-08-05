# Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for Clean Architecture,
multi-tenancy, RBAC, and Clerk auth details.

## Getting started

```bash
cp .env.example .env.local
# Set DATABASE_URL + Clerk keys

npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:seed` | Seed demo organizations & roles |
| `npm run db:studio` | Open Prisma Studio |

## SaaS foundation

- **Auth:** Clerk (sessions, sign-in/up, webhooks)
- **Tenancy:** PostgreSQL organizations — every record is org-scoped
- **RBAC:** Super Admin, Church Admin, Pastor, Cell Leader, Volunteer Leader, Finance Manager, Member, Guest
- **ORM:** Prisma
- **Org switching:** httpOnly `churchos_org_id` cookie + sidebar switcher

## Members CRM

- Flagship People module at `/people` and `/people/[id]`
- Org-scoped members, tags, family, notes, documents, attendance, giving, prayer, volunteers
- Activity timeline on every action · AI insights · QR check-in · CSV import/export
- Clean Architecture services + Prisma repositories + Server Actions

## Family & Households

- `/households` and `/households/[id]` — pastoral household management
- Interactive family tree, merge/split, relation assignment, household QR
- Engagement / attendance / giving analytics rolled up from members
- RBAC: `households:read|write|delete|merge|export|import`

## Attendance & Check-in

- `/attendance` dashboard · `/attendance/check-in` desk · `/attendance/sessions`
- QR, member search, household batch, visitor registration, manual entry
- Live session counters, duplicate prevention, visitor journey foundation
- RBAC: `attendance:read|write|manage|export|sessions`

## Visitor Journey & Follow-up

- `/visitors` dashboard · `/visitors/pipeline` Kanban · `/visitors/[id]` · `/visitors/tasks`
- Configurable pipeline from First Visit → Member with auto follow-up tasks
- Communication log (phone/email/WhatsApp/SMS) · convert to CRM member
- Automation-ready (`automationKey`, provider metadata hooks)
- RBAC: `visitor:read|write|assign|communicate|convert`

## Ministry & Volunteer Management

- `/ministries` · `/volunteers` · `/schedule` (drag-and-drop staffing board)
- Default + custom ministries; volunteer profiles with skills, certs, availability
- Assign / confirm / decline · conflict detection · check-in · messaging
- Analytics: coverage, hours, reliability, ministry growth
- RBAC: `ministry:read|write`, `volunteer:read|write`, `schedule:manage`

## Enterprise Events & Church Calendar

- `/events` hub · `/events/calendar` · `/events/[id]` · `/events/[id]/check-in`
- Full event ops: hero, recurrence, venue, capacity, registration, waitlist,
  speakers, ministries, volunteers, attachments, resources
- Secure QR tickets · QR / search / manual check-in · duplicate prevention
- Communication hooks (Email / WhatsApp / SMS / Push) · activity timeline
- Analytics: attendance, registration, no-show, volunteer coverage, capacity
- RBAC: `event:read|write|publish|manage|checkin`

## Product UI

- Glassmorphism UI with aurora animated backgrounds
- Dark & light themes + accent switching
- Command palette (`⌘K` / `Ctrl+K`)
- Modules: Dashboard, People, Events, Giving, Groups, Settings