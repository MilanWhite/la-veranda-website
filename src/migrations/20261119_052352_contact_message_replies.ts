import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contact_messages_replies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"message" varchar,
  	"sent_by" varchar,
  	"sent_at" timestamp(3) with time zone,
  	"message_id" varchar
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "internal_reply_from_email" varchar DEFAULT 'booking@laverandaresto.com';
  ALTER TABLE "contact_messages_replies" ADD CONSTRAINT "contact_messages_replies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "contact_messages_replies_order_idx" ON "contact_messages_replies" USING btree ("_order");
  CREATE INDEX "contact_messages_replies_parent_id_idx" ON "contact_messages_replies" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "contact_messages_replies" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "internal_reply_from_email";`)
}
