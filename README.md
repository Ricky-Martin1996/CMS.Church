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

## Product UI

- Glassmorphism UI with aurora animated backgrounds
- Dark & light themes + accent switching
- Command palette (`⌘K` / `Ctrl+K`)
- Modules: Dashboard, People, Events, Giving, Groups, Settings
