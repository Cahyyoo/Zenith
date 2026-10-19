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
