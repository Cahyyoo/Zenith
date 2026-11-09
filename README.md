# Zenith

An offline-first PWA that separates **personal routines** (Personal mode) from **software project work** (Developer mode) for a single user.

- **Personal:** a task list with color tags and due dates, sorted by open tasks first, then by the nearest due date. Swipe left to delete, with undo.
- **Developer:** projects with issues (Feature / Bug / Chore / Refactor; Low → Critical priority) on a drag-and-drop Kanban board (Backlog / To Do / In Progress / Done). Issue descriptions support Markdown.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Auth + RLS) · TanStack Query (persisted to IndexedDB) · Zustand · Zod · dnd-kit · Serwist.

## Setup

1. **Install**
   ```bash
   pnpm install
   ```
2. **Create the database.** Run [`supabase/migrations/20261019000000_init.sql`](supabase/migrations/20261019000000_init.sql) against your Supabase project. Either paste it into the dashboard SQL editor, or run `pnpm supabase link --project-ref <ref>` and then `pnpm supabase db push`.
3. **Set environment variables.** Copy `.env.example` to `.env.local` and fill in the values from Project settings → API.
4. **Configure auth** in the Supabase dashboard under Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (your production URL once deployed).
   - Redirect URLs: add `http://localhost:3000/auth/callback**`, plus the production equivalent. The trailing `**` is needed because password reset links carry `?next=/reset-password`.
5. **Optional:** after changing the schema, regenerate the types with `SUPABASE_PROJECT_ID=<ref> pnpm db:types`.

## Authentication

Sign-in is email + password only.

- **Sign up:** Supabase emails a confirmation link. The link returns to `/auth/callback`, which exchanges the code for a session cookie.
- **Forgot password:** `/forgot-password` sends a reset email. Its link returns through `/auth/callback?next=/reset-password` and opens a short-lived recovery session, and `/reset-password` sets the new password. Open the link in the same browser that requested it, because the PKCE code verifier is stored there.
- **Errors:** an expired or invalid link lands on `/login` with an error toast.

The default Supabase email templates work as is. If you customize them, keep `{{ .ConfirmationURL }}` as the link.

## Reminders (push notifications)

Personal tasks can have a due time and a reminder (at the time, or 5 / 15 / 30 / 60 minutes before). The device computes `remind_at` in its own timezone. Every minute the `send-reminders` Edge Function sends due reminders as Web Push, so they arrive even when Zenith is closed.

One-time setup:

1. **Generate VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```
2. **Deploy the function and set its secrets.** `CRON_SECRET` is any long random string.
   ```bash
   pnpm supabase login
   pnpm supabase link --project-ref <project-ref>
   pnpm supabase functions deploy send-reminders --no-verify-jwt
   pnpm supabase secrets set VAPID_PUBLIC_KEY=<public> VAPID_PRIVATE_KEY=<private> VAPID_SUBJECT=mailto:you@example.com CRON_SECRET=<random>
   ```
3. **Schedule it.** Open [`supabase/setup/reminders-cron.sql`](supabase/setup/reminders-cron.sql), replace `<CRON_SECRET>`, and run it in the SQL Editor.
4. **Give the app the public key.** Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>` in `.env` and in Vercel, then rebuild.
5. **Turn it on per device.** In the app, go to Settings → Notifications → **Enable on this device**.

Notes:

- Push works only in a production build over HTTPS (the service worker is off in `pnpm dev`).
- On iPhone/iPad it works only after Add to Home Screen (iOS 16.4+).
- Reminders more than 12 hours late (e.g. after an outage) are skipped.
- Signing out removes this device's subscription.

## Repeating tasks

A task can repeat every N days, every N weeks on chosen weekdays, every N months or every year.

- **Next date:** completing an occurrence creates the next one on the fixed schedule, counted from the due date. Dates already in the past are skipped.
- **Where the rule lives:** it moves to the new occurrence, so reopening an old one never duplicates it.
- **Skip this time:** moves a task to its next date without completing it.

## Scripts

| Command | |
| --- | --- |
| `pnpm dev` | Dev server. The service worker is disabled in dev. |
| `pnpm build && pnpm start` | Production build. Use this to test PWA and offline behaviour. |
| `pnpm typecheck` | Checks the app and the service worker (`src/sw`). |
| `pnpm lint` | ESLint. `any` is an error. |
| `pnpm test` | Vitest unit tests: sorting, Kanban positions, drop resolution, schemas. |

## How offline works

- **Data:** every read goes through TanStack Query, and the cache is persisted to IndexedDB. Every write is optimistic and is defined once with `setMutationDefaults` ([`src/lib/query/define-mutation.ts`](src/lib/query/define-mutation.ts)). A write made offline can therefore be persisted, survive a reload, and replay when the connection returns.
- **Ordering:** all writes share one mutation scope, so they replay in the order you made them.
- **Ids:** rows get client-generated UUIDs, which makes replays idempotent.
- **Failures:** network failures retry until they succeed. Server errors roll back and show a toast.
- **Shell:** Serwist precaches every route's static shell. Pages hold no user data, so any screen opens offline, and `/d/board?project=…` uses one cached shell for every project.
- **Security:** Postgres Row Level Security is the security boundary (`user_id = auth.uid()` on every table). The client-side auth gate only handles navigation.

## Project layout

```
src/
  app/                 routes (static shells), providers, manifest, SW route, PWA icons
  components/ui/       shadcn primitives
  components/common/   shared presentational components
  components/layout/   app shell, sidebar, bottom nav, FAB, sync indicator
  features/personal/   api · mutations · hooks · schemas · components · containers
  features/developer/  same structure + Kanban (lib/board.ts, lib/position.ts)
  features/auth/       session context, auth gate, login
  lib/                 Supabase clients, query layer, domain enums, dates, routes
  stores/              Zustand (persisted workspace prefs, ephemeral UI state)
  sw/sw.ts             service worker (own tsconfig)
supabase/migrations/   schema, triggers, RLS
```

Containers own the data hooks. Components under `components/` receive everything through props.
