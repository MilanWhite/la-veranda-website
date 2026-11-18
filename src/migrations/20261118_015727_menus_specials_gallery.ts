import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_menus_sections_items_featured" AS ENUM('popular', 'recommendation');
  CREATE TYPE "public"."enum_menus_slug" AS ENUM('dinner', 'brunch');
  CREATE TABLE "menus_sections_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "menus_sections_items_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "menus_sections_items_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "menus_sections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"price" numeric,
  	"price_label" varchar,
  	"available" boolean DEFAULT true,
  	"featured" "enum_menus_sections_items_featured"
  );
  
  CREATE TABLE "menus_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"is_subgroup" boolean,
  	"description" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "menus" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" "enum_menus_slug" NOT NULL,
  	"intro" varchar,
  	"pdf_id" integer,
  	"pdf_label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "specials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone,
  	"description" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"show_on_events_page" boolean
  );
  
  CREATE TABLE "gallery" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menus_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "specials_id" integer;
  ALTER TABLE "menus_sections_add_ons" ADD CONSTRAINT "menus_sections_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_sections_items_variants" ADD CONSTRAINT "menus_sections_items_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus_sections_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_sections_items_add_ons" ADD CONSTRAINT "menus_sections_items_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus_sections_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_sections_items" ADD CONSTRAINT "menus_sections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_sections" ADD CONSTRAINT "menus_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus" ADD CONSTRAINT "menus_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "specials" ADD CONSTRAINT "specials_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menus_sections_add_ons_order_idx" ON "menus_sections_add_ons" USING btree ("_order");
  CREATE INDEX "menus_sections_add_ons_parent_id_idx" ON "menus_sections_add_ons" USING btree ("_parent_id");
  CREATE INDEX "menus_sections_items_variants_order_idx" ON "menus_sections_items_variants" USING btree ("_order");
  CREATE INDEX "menus_sections_items_variants_parent_id_idx" ON "menus_sections_items_variants" USING btree ("_parent_id");
  CREATE INDEX "menus_sections_items_add_ons_order_idx" ON "menus_sections_items_add_ons" USING btree ("_order");
  CREATE INDEX "menus_sections_items_add_ons_parent_id_idx" ON "menus_sections_items_add_ons" USING btree ("_parent_id");
  CREATE INDEX "menus_sections_items_order_idx" ON "menus_sections_items" USING btree ("_order");
  CREATE INDEX "menus_sections_items_parent_id_idx" ON "menus_sections_items" USING btree ("_parent_id");
  CREATE INDEX "menus_sections_order_idx" ON "menus_sections" USING btree ("_order");
  CREATE INDEX "menus_sections_parent_id_idx" ON "menus_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "menus_slug_idx" ON "menus" USING btree ("slug");
  CREATE INDEX "menus_pdf_idx" ON "menus" USING btree ("pdf_id");
  CREATE INDEX "menus_updated_at_idx" ON "menus" USING btree ("updated_at");
  CREATE INDEX "menus_created_at_idx" ON "menus" USING btree ("created_at");
  CREATE INDEX "specials_image_idx" ON "specials" USING btree ("image_id");
  CREATE INDEX "specials_updated_at_idx" ON "specials" USING btree ("updated_at");
  CREATE INDEX "specials_created_at_idx" ON "specials" USING btree ("created_at");
  CREATE INDEX "gallery_images_order_idx" ON "gallery_images" USING btree ("_order");
  CREATE INDEX "gallery_images_parent_id_idx" ON "gallery_images" USING btree ("_parent_id");
  CREATE INDEX "gallery_images_image_idx" ON "gallery_images" USING btree ("image_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menus_fk" FOREIGN KEY ("menus_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_specials_fk" FOREIGN KEY ("specials_id") REFERENCES "public"."specials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_menus_id_idx" ON "payload_locked_documents_rels" USING btree ("menus_id");
  CREATE INDEX "payload_locked_documents_rels_specials_id_idx" ON "payload_locked_documents_rels" USING btree ("specials_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menus_sections_add_ons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menus_sections_items_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menus_sections_items_add_ons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menus_sections_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menus_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menus" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "specials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gallery" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "menus_sections_add_ons" CASCADE;
  DROP TABLE "menus_sections_items_variants" CASCADE;
  DROP TABLE "menus_sections_items_add_ons" CASCADE;
  DROP TABLE "menus_sections_items" CASCADE;
  DROP TABLE "menus_sections" CASCADE;
  DROP TABLE "menus" CASCADE;
  DROP TABLE "specials" CASCADE;
  DROP TABLE "gallery_images" CASCADE;
  DROP TABLE "gallery" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_menus_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_specials_fk";
  
  DROP INDEX "payload_locked_documents_rels_menus_id_idx";
  DROP INDEX "payload_locked_documents_rels_specials_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "menus_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "specials_id";
  DROP TYPE "public"."enum_menus_sections_items_featured";
  DROP TYPE "public"."enum_menus_slug";`)
}
