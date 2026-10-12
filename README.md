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

4. Start the dev server:

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

## Database changes

Schema sync (`push`) is disabled. After changing a collection or global:

1. `npm run migrate:create`
2. `npm run migrate`
3. Commit the new file in `src/migrations/`.

## Project structure

```
src/
  app/(frontend)/   public website pages
  app/(payload)/    Payload admin + API (generated, rarely edited)
  collections/      Payload collections
  migrations/       database migrations
  payload.config.ts Payload configuration
```

Project progress is tracked in [docs/project_progress.md](docs/project_progress.md).
