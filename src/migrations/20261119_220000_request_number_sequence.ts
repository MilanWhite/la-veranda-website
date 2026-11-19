import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Request numbers come from a database counter that only goes up, so a deleted request's
// number is never given out again (and two requests sent at the same moment can't clash).
// Starts after the highest number already used, and never below #4834 (the old site ended
// at #4833).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS "event_request_number_seq";
    SELECT setval(
      'event_request_number_seq'::regclass,
      GREATEST((SELECT COALESCE(MAX("request_number"), 0) FROM "event_requests"), 4833)::bigint
    );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SEQUENCE IF EXISTS "event_request_number_seq";`)
}
