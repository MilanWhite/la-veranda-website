import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contact_messages_emails_visitor" AS ENUM('not_sent', 'sent', 'failed', 'skipped');
  CREATE TYPE "public"."enum_contact_messages_emails_restaurant" AS ENUM('not_sent', 'sent', 'failed', 'skipped');
  ALTER TABLE "contact_messages" ADD COLUMN "emails_visitor" "enum_contact_messages_emails_visitor";
  ALTER TABLE "contact_messages" ADD COLUMN "emails_restaurant" "enum_contact_messages_emails_restaurant";
  ALTER TABLE "contact_messages" ADD COLUMN "emails_error" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_messages" DROP COLUMN "emails_visitor";
  ALTER TABLE "contact_messages" DROP COLUMN "emails_restaurant";
  ALTER TABLE "contact_messages" DROP COLUMN "emails_error";
  DROP TYPE "public"."enum_contact_messages_emails_visitor";
  DROP TYPE "public"."enum_contact_messages_emails_restaurant";`)
}
