import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The ID the visitor's copy of a contact message went out with (Cloudflare picks its own)
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "confirmation_message_id" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_messages" DROP COLUMN IF EXISTS "confirmation_message_id";`)
}
