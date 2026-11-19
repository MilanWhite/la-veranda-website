# La Veranda Website

Next.js + Payload CMS + PostgreSQL.

## Local setup

Requirements: Node.js 20+, PostgreSQL running locally.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your local Postgres connection string. The `laveranda` database is created automatically if it doesn't exist.
   - `PAYLOAD_SECRET` — any long random string.

3. Apply database migrations:

   ```bash
   npm run migrate
   ```

4. Fill the database with placeholder content (menus, gallery, specials, site settings):

   ```bash
   npm run seed
   ```

   Safe to re-run: it only adds what is missing and never overwrites admin edits.

5. Start the dev server:

   ```bash
   npm run dev
   ```

   - Site: http://localhost:3000
   - Admin: http://localhost:3000/admin (create the first admin user on first visit)

## First admin account

On a fresh database, `/admin` shows a "Create first user" screen — the account created there is the administrator. After that, new admins can only be added by a signed-in admin (Users → Create New).

V1 has one role: every user is an administrator. Access rules live in `src/access/`.

## Scripts

| Command                  | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Start the dev server                         |
| `npm run build`          | Production build                             |
| `npm run lint`           | Run ESLint                                   |
| `npm run format`         | Format code with Prettier                    |
| `npm run migrate`        | Apply pending migrations                     |
| `npm run migrate:create` | Create a migration after changing the schema |
| `npm run generate:types` | Regenerate `src/payload-types.ts`            |
| `npm run seed`           | Add placeholder content (idempotent)         |
| `npm run db:reset`       | Wipe dev DB + uploads, migrate, seed         |
| `npm run db:test:setup`  | Create/reset the test DB, migrate, seed      |

## Databases

| Database         | Used by         | Uploads folder | How to (re)create       |
| ---------------- | --------------- | -------------- | ----------------------- |
| `laveranda`      | `npm run dev`   | `media/`       | `npm run db:reset`      |
| `laveranda_test` | automated tests | `media-test/`  | `npm run db:test:setup` |

- Both are created automatically if they don't exist.
- `db:reset` asks you to type `reset` first and **deletes everything, including admin users**. Set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` to have the seed recreate an admin, or create one at `/admin` again.
- The reset script refuses to run against a non-localhost database or with `NODE_ENV=production`.
- The test database defaults to the dev database name + `_test`; override with `DATABASE_URL_TEST`.
- Seed content lives in `src/seed/` (`menus.ts` for menu data, `images/` and `files/` for uploads).

## Database changes

Schema sync (`push`) is disabled. After changing a collection or global:

1. `npm run migrate:create`
2. `npm run migrate`
3. Commit the new file in `src/migrations/`.

## Project structure

```
src/
  app/(frontend)/   public website pages, components/ and lib/ (data loaders)
  app/(payload)/    Payload admin + API (generated, rarely edited)
  collections/      Payload collections (Menus, Specials, Media, Users)
  globals/          Payload globals (Site Settings, Gallery)
  hooks/            shared Payload hooks (page revalidation)
  components/admin/ custom admin UI components
  migrations/       database migrations
  seed/             placeholder content + seed script
  payload.config.ts Payload configuration
scripts/            db reset / test-db setup
```

Public pages are prerendered. Editing content in the admin clears the cached pages
(`src/hooks/revalidateSite.ts`), so changes appear immediately. Changes made outside the
running site (e.g. `npm run seed`) show up after the next restart or rebuild.

Project progress is tracked in [docs/project_progress.md](docs/project_progress.md).

## Event requests, email and Google Calendar

- Customers send event requests from the form on `/events`. Each request is saved as
  **Pending** first, then the customer gets a confirmation email with the booking summary PDF
  and the restaurant gets a notification (Reply-To = the customer).
- Staff manage requests in **Admin → Events → Event Requests**: the **Overview** tab has
  Approve / Decline / Cancel, the PDF, and email/calendar status; **History** lists every change.
- Approving adds the event to Google Calendar, edits update it, cancelling removes it.
- Prices, menu choices and form rules live in **Admin → Events → Event Menu & Form**.
- Settings (see `.env.example`): `SMTP_*` for email, `GOOGLE_*` for the calendar,
  `TURNSTILE_*` for spam protection. Anything not configured is skipped and recorded on the
  request instead of failing.
