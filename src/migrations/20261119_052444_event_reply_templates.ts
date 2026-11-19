import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "event_menu_reply_templates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  ALTER TABLE "event_requests" ADD COLUMN "emails_confirmation_message_id" varchar;
  ALTER TABLE "event_menu_reply_templates" ADD CONSTRAINT "event_menu_reply_templates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_menu_reply_templates_order_idx" ON "event_menu_reply_templates" USING btree ("_order");
  CREATE INDEX "event_menu_reply_templates_parent_id_idx" ON "event_menu_reply_templates" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "event_menu_reply_templates" CASCADE;
  ALTER TABLE "event_requests" DROP COLUMN "emails_confirmation_message_id";`)
}
