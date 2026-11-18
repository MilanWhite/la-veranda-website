import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_gallery_images_category" AS ENUM('food', 'events', 'restaurant');
  ALTER TABLE "gallery_images" ADD COLUMN "category" "enum_gallery_images_category" DEFAULT 'restaurant' NOT NULL;`)

  // Data: give the seeded old-site photos the categories they had on laverandaresto.com.
  // Rows with other images keep the default.
  await db.execute(sql`
  UPDATE "gallery_images" gi SET "category" = 'food'
    FROM "media" m WHERE gi."image_id" = m."id" AND m."filename" IN
    ('gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp','gallery-05.webp','gallery-06.webp');
  UPDATE "gallery_images" gi SET "category" = 'events'
    FROM "media" m WHERE gi."image_id" = m."id" AND m."filename" IN
    ('gallery-07.webp','gallery-08.webp','gallery-09.webp','gallery-10.webp','gallery-11.webp',
     'gallery-12.webp','gallery-13.webp','gallery-14.webp','gallery-15.webp');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gallery_images" DROP COLUMN "category";
  DROP TYPE "public"."enum_gallery_images_category";`)
}
