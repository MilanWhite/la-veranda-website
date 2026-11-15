import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_event_requests_extras_unit" AS ENUM('event', 'adult');
  CREATE TYPE "public"."enum_event_requests_status" AS ENUM('pending', 'approved', 'declined', 'cancelled');
  CREATE TYPE "public"."enum_event_requests_emails_customer" AS ENUM('not_sent', 'sent', 'failed', 'skipped');
  CREATE TYPE "public"."enum_event_requests_emails_owner" AS ENUM('not_sent', 'sent', 'failed', 'skipped');
  CREATE TYPE "public"."enum_event_requests_calendar_status" AS ENUM('not_synced', 'synced', 'removed', 'failed', 'skipped');
  CREATE TYPE "public"."enum_event_menu_extra_notes_position" AS ENUM('top', 'afterBase', 'afterFee', 'afterExtras', 'end');
  CREATE TYPE "public"."enum_event_menu_sections_selection" AS ENUM('single', 'multiple');
  CREATE TYPE "public"."enum_event_menu_sections_price_tag" AS ENUM('adult', 'kids');
  CREATE TYPE "public"."enum_event_menu_extras_unit" AS ENUM('event', 'adult');
  CREATE TABLE "event_requests_internal_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar NOT NULL,
  	"author" varchar,
  	"added_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "event_requests_selections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"upcharge" numeric
  );
  
  CREATE TABLE "event_requests_selections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"to_be_decided" boolean,
  	"text_label" varchar,
  	"text" varchar,
  	"text_upcharge" numeric
  );
  
  CREATE TABLE "event_requests_extras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric,
  	"unit" "enum_event_requests_extras_unit"
  );
  
  CREATE TABLE "event_requests_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "event_requests_activity" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"by" varchar,
  	"message" varchar
  );
  
  CREATE TABLE "event_requests_pricing_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "event_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"request_number" numeric,
  	"status" "enum_event_requests_status" DEFAULT 'pending' NOT NULL,
  	"title" varchar,
  	"status_order" numeric,
  	"customer_name" varchar,
  	"starts_on" varchar,
  	"occasion" varchar,
  	"guests" varchar,
  	"customer_name_or_company" varchar NOT NULL,
  	"customer_contact_person" varchar,
  	"customer_email" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_address" varchar,
  	"event_type" varchar NOT NULL,
  	"event_date" varchar NOT NULL,
  	"event_start_time" varchar NOT NULL,
  	"event_end_time" varchar NOT NULL,
  	"event_adults" numeric NOT NULL,
  	"event_kids" numeric DEFAULT 0,
  	"deposit_acknowledged" boolean,
  	"notes" varchar,
  	"pricing_adult_price" numeric,
  	"pricing_kid_price" numeric,
  	"pricing_space_fee_percent" numeric,
  	"pricing_included_hours" numeric,
  	"pricing_extra_hour_price" numeric,
  	"emails_customer" "enum_event_requests_emails_customer",
  	"emails_owner" "enum_event_requests_emails_owner",
  	"emails_sent_at" timestamp(3) with time zone,
  	"emails_error" varchar,
  	"calendar_status" "enum_event_requests_calendar_status",
  	"calendar_event_id" varchar,
  	"calendar_synced_at" timestamp(3) with time zone,
  	"calendar_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_menu_extra_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"position" "enum_event_menu_extra_notes_position" DEFAULT 'end' NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "event_menu_event_types" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "event_menu_sections_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"upcharge" numeric DEFAULT 0,
  	"available" boolean DEFAULT true
  );
  
  CREATE TABLE "event_menu_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"description" varchar,
  	"selection" "enum_event_menu_sections_selection" DEFAULT 'multiple' NOT NULL,
  	"min" numeric DEFAULT 0,
  	"max" numeric,
  	"allow_to_be_decided" boolean,
  	"for_kids" boolean,
  	"price_tag" "enum_event_menu_sections_price_tag",
  	"text_option_label" varchar,
  	"text_option_upcharge" numeric,
  	"text_option_placeholder" varchar
  );
  
  CREATE TABLE "event_menu_extras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"unit" "enum_event_menu_extras_unit" DEFAULT 'event' NOT NULL,
  	"available" boolean DEFAULT true
  );
  
  CREATE TABLE "event_menu_choices_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "event_menu_choices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "event_menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"adult_price" numeric NOT NULL,
  	"kid_price" numeric NOT NULL,
  	"space_fee_percent" numeric NOT NULL,
  	"included_hours" numeric NOT NULL,
  	"extra_hour_price" numeric NOT NULL,
  	"time_limit_note" varchar,
  	"earliest_start" varchar DEFAULT '09:00' NOT NULL,
  	"latest_start" varchar DEFAULT '22:00' NOT NULL,
  	"start_step_minutes" numeric DEFAULT 30 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_requests_id" integer;
  ALTER TABLE "event_requests_internal_notes" ADD CONSTRAINT "event_requests_internal_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_requests_selections_items" ADD CONSTRAINT "event_requests_selections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests_selections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_requests_selections" ADD CONSTRAINT "event_requests_selections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_requests_extras" ADD CONSTRAINT "event_requests_extras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_requests_details" ADD CONSTRAINT "event_requests_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_requests_activity" ADD CONSTRAINT "event_requests_activity_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_requests_pricing_notes" ADD CONSTRAINT "event_requests_pricing_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_extra_notes" ADD CONSTRAINT "event_menu_extra_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_event_types" ADD CONSTRAINT "event_menu_event_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_sections_options" ADD CONSTRAINT "event_menu_sections_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_sections" ADD CONSTRAINT "event_menu_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_extras" ADD CONSTRAINT "event_menu_extras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_choices_options" ADD CONSTRAINT "event_menu_choices_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu_choices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_menu_choices" ADD CONSTRAINT "event_menu_choices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "event_requests_internal_notes_order_idx" ON "event_requests_internal_notes" USING btree ("_order");
  CREATE INDEX "event_requests_internal_notes_parent_id_idx" ON "event_requests_internal_notes" USING btree ("_parent_id");
  CREATE INDEX "event_requests_selections_items_order_idx" ON "event_requests_selections_items" USING btree ("_order");
  CREATE INDEX "event_requests_selections_items_parent_id_idx" ON "event_requests_selections_items" USING btree ("_parent_id");
  CREATE INDEX "event_requests_selections_order_idx" ON "event_requests_selections" USING btree ("_order");
  CREATE INDEX "event_requests_selections_parent_id_idx" ON "event_requests_selections" USING btree ("_parent_id");
  CREATE INDEX "event_requests_extras_order_idx" ON "event_requests_extras" USING btree ("_order");
  CREATE INDEX "event_requests_extras_parent_id_idx" ON "event_requests_extras" USING btree ("_parent_id");
  CREATE INDEX "event_requests_details_order_idx" ON "event_requests_details" USING btree ("_order");
  CREATE INDEX "event_requests_details_parent_id_idx" ON "event_requests_details" USING btree ("_parent_id");
  CREATE INDEX "event_requests_activity_order_idx" ON "event_requests_activity" USING btree ("_order");
  CREATE INDEX "event_requests_activity_parent_id_idx" ON "event_requests_activity" USING btree ("_parent_id");
  CREATE INDEX "event_requests_pricing_notes_order_idx" ON "event_requests_pricing_notes" USING btree ("_order");
  CREATE INDEX "event_requests_pricing_notes_parent_id_idx" ON "event_requests_pricing_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "event_requests_request_number_idx" ON "event_requests" USING btree ("request_number");
  CREATE INDEX "event_requests_status_idx" ON "event_requests" USING btree ("status");
  CREATE INDEX "event_requests_status_order_idx" ON "event_requests" USING btree ("status_order");
  CREATE INDEX "event_requests_starts_on_idx" ON "event_requests" USING btree ("starts_on");
  CREATE INDEX "event_requests_updated_at_idx" ON "event_requests" USING btree ("updated_at");
  CREATE INDEX "event_requests_created_at_idx" ON "event_requests" USING btree ("created_at");
  CREATE INDEX "event_menu_extra_notes_order_idx" ON "event_menu_extra_notes" USING btree ("_order");
  CREATE INDEX "event_menu_extra_notes_parent_id_idx" ON "event_menu_extra_notes" USING btree ("_parent_id");
  CREATE INDEX "event_menu_event_types_order_idx" ON "event_menu_event_types" USING btree ("_order");
  CREATE INDEX "event_menu_event_types_parent_id_idx" ON "event_menu_event_types" USING btree ("_parent_id");
  CREATE INDEX "event_menu_sections_options_order_idx" ON "event_menu_sections_options" USING btree ("_order");
  CREATE INDEX "event_menu_sections_options_parent_id_idx" ON "event_menu_sections_options" USING btree ("_parent_id");
  CREATE INDEX "event_menu_sections_order_idx" ON "event_menu_sections" USING btree ("_order");
  CREATE INDEX "event_menu_sections_parent_id_idx" ON "event_menu_sections" USING btree ("_parent_id");
  CREATE INDEX "event_menu_extras_order_idx" ON "event_menu_extras" USING btree ("_order");
  CREATE INDEX "event_menu_extras_parent_id_idx" ON "event_menu_extras" USING btree ("_parent_id");
  CREATE INDEX "event_menu_choices_options_order_idx" ON "event_menu_choices_options" USING btree ("_order");
  CREATE INDEX "event_menu_choices_options_parent_id_idx" ON "event_menu_choices_options" USING btree ("_parent_id");
  CREATE INDEX "event_menu_choices_order_idx" ON "event_menu_choices" USING btree ("_order");
  CREATE INDEX "event_menu_choices_parent_id_idx" ON "event_menu_choices" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_requests_fk" FOREIGN KEY ("event_requests_id") REFERENCES "public"."event_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_event_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("event_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "event_requests_internal_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests_selections_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests_selections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests_extras" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests_details" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests_activity" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests_pricing_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_extra_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_event_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_sections_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_extras" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_choices_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu_choices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_menu" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "event_requests_internal_notes" CASCADE;
  DROP TABLE "event_requests_selections_items" CASCADE;
  DROP TABLE "event_requests_selections" CASCADE;
  DROP TABLE "event_requests_extras" CASCADE;
  DROP TABLE "event_requests_details" CASCADE;
  DROP TABLE "event_requests_activity" CASCADE;
  DROP TABLE "event_requests_pricing_notes" CASCADE;
  DROP TABLE "event_requests" CASCADE;
  DROP TABLE "event_menu_extra_notes" CASCADE;
  DROP TABLE "event_menu_event_types" CASCADE;
  DROP TABLE "event_menu_sections_options" CASCADE;
  DROP TABLE "event_menu_sections" CASCADE;
  DROP TABLE "event_menu_extras" CASCADE;
  DROP TABLE "event_menu_choices_options" CASCADE;
  DROP TABLE "event_menu_choices" CASCADE;
  DROP TABLE "event_menu" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_event_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_requests_id";
  DROP TYPE "public"."enum_event_requests_extras_unit";
  DROP TYPE "public"."enum_event_requests_status";
  DROP TYPE "public"."enum_event_requests_emails_customer";
  DROP TYPE "public"."enum_event_requests_emails_owner";
  DROP TYPE "public"."enum_event_requests_calendar_status";
  DROP TYPE "public"."enum_event_menu_extra_notes_position";
  DROP TYPE "public"."enum_event_menu_sections_selection";
  DROP TYPE "public"."enum_event_menu_sections_price_tag";
  DROP TYPE "public"."enum_event_menu_extras_unit";`)
}
