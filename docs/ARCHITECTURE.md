# Architecture

ChurchOS follows Clean Architecture with a multi-tenant boundary.

```
src/
  domain/                 # Pure business rules (roles, permissions, entities)
  application/            # Use-cases / services (ports + orchestration)
    people/               # Members CRM services + server actions
    households/           # Family & Household Management
    attendance/           # Attendance & Check-in
    visitors/             # Visitor Journey & Follow-up
    ministries/           # Ministry & Volunteer Management
    events/               # Enterprise Events & Church Calendar
    communications/       # Enterprise Communication Hub
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

Visitor permissions: `visitor:read|write|assign|communicate|convert`.

Ministry permissions: `ministry:read|write`, `volunteer:read|write`,
`schedule:manage` (plus legacy `volunteers:read|write`).

Event permissions: `event:read|write|publish|manage|checkin`
(plus legacy `events:read|write`).

Communication permissions: `communication:read|write|send|templates`.

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
- Server actions: `src/application/people/actions.ts`

Legacy CRM `VolunteerAssignment` (roleName/team on a member) remains for People profiles
and is separate from the Ministry platform `VolunteerProfile`.

## Family & Households

- `/households` — pastoral household management, family tree, merge/split
- Server actions: `src/application/households/actions.ts`

## Attendance & Check-in

- `/attendance` · `/attendance/check-in` · `/attendance/sessions`
- Server actions: `src/application/attendance/actions.ts`

## Visitor Journey & Follow-up

- `/visitors` · `/visitors/pipeline` · `/visitors/[id]` · `/visitors/tasks`
- Server actions: `src/application/visitors/actions.ts`

## Ministry & Volunteer Management

Operational staffing for church ministries.

Default ministries: Worship · Media · Hospitality · Kids · Youth · Prayer ·
Parking · Security · Administration (custom ministries supported).

- Dashboard: `/ministries` — list, ensure defaults, coverage analytics
- Detail: `/ministries/[id]` — roles, volunteers, upcoming events
- Roster: `/volunteers` · `/volunteers/[id]` — skills, certs, availability,
  preferred ministries, training, messaging, check-in
- Scheduler: `/schedule` — week calendar + drag-and-drop board
  (assign, confirm/decline, conflict detection, create events/slots)
- Models: `Ministry`, `MinistryRole`, `VolunteerProfile`, skills/certs/availability,
  `ScheduleEvent`, `ScheduleSlot`, `ScheduleAssignment`, `ScheduleSwapRequest`,
  `VolunteerCheckIn`, `VolunteerMessage`, `VolunteerActivity`
- Analytics: coverage, hours, reliability, check-in rate, ministry growth
- Server actions: `src/application/ministries/actions.ts`

`/groups` remains the life-groups mock module (separate from ministries).

## Enterprise Events & Church Calendar

Operational hub for every church gathering (distinct from ministry `ScheduleEvent`
staffing). Optional `scheduleEventId` links calendar events to volunteer boards.

Event types: Sunday Service · Youth · Prayer · Bible Study · Cell Group ·
Conference · Retreat · Wedding · Funeral · Outreach · Training · Children ·
Volunteer Meeting · Custom.

- Hub: `/events` — hero, analytics, create, capacity
- Detail: `/events/[id]` — registration, waitlist, speakers, ministries,
  resources, attachments, activity timeline, communication hooks
- Calendar: `/events/calendar` — month / week / agenda / timeline + drag-and-drop
  reschedule
- Check-in: `/events/[id]/check-in` — QR tickets, search, manual; duplicate
  scan prevention
- Models: `ChurchEvent`, `EventRegistration`, `EventTicket`, `EventCheckIn`,
  `EventSpeaker`, `EventAttachment`, `EventResource`, `EventMinistry`,
  `EventWaitlistEntry`, `EventActivity`, `EventMessage`
- Analytics: attendance, registration, no-show rate, volunteer coverage,
  capacity usage
- Communication: Email / WhatsApp / SMS / Push / In-app queued with
  `{ provider: null, queued: false }` provider metadata
- Server actions: `src/application/events/actions.ts`

## Enterprise Communication Hub

Connects People, Households, Visitors, Events, Ministries, and Volunteers.

Channels: Email · WhatsApp · SMS · Push · Internal.

- Hub: `/communications` — inbox/outbox, campaign builder, scheduling calendar,
  delivery analytics
- Templates: `/communications/templates` — reusable copy with `{{FirstName}}`,
  `{{FamilyName}}`, `{{EventName}}`, `{{ServiceTime}}`, etc.
- Campaigns: `/communications/campaigns` — audience targeting + send
- Automations: `/communications/automations` — triggers (new visitor, birthday,
  anniversary, event reminder, volunteer assignment, attendance missed,
  prayer assigned, membership approved, follow-up due)
- Message detail: `/communications/[id]` — deliveries + open/click simulation
- Audiences: all members, visitors, households, cell groups, volunteers,
  ministries, event registrants, custom filters
- Provider adapters (stubbed, env-ready): Resend, Twilio, WhatsApp Business,
  Firebase Push, Internal
- Timeline fan-out: Member · Household · Visitor activities + visitor
  `CommunicationLog`
- Models: `CommunicationTemplate`, `CommunicationCampaign`,
  `CommunicationMessage`, `CommunicationDelivery`, `CommunicationAutomation`,
  `CommunicationActivity`, `CommunicationProviderConfig`
- Server actions: `src/application/communications/actions.ts`

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
