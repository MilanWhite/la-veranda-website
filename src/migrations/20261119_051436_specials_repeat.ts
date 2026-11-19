import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_specials_repeat_frequency" AS ENUM('none', 'weekly', 'monthly');
  CREATE TYPE "public"."enum_specials_repeat_week" AS ENUM('first', 'second', 'third', 'fourth', 'last');
  CREATE TYPE "public"."enum_specials_repeat_weekday" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
  ALTER TABLE "specials" ADD COLUMN "show_time" boolean DEFAULT true;
  ALTER TABLE "specials" ADD COLUMN "repeat_frequency" "enum_specials_repeat_frequency" DEFAULT 'none';
  ALTER TABLE "specials" ADD COLUMN "repeat_week" "enum_specials_repeat_week";
  ALTER TABLE "specials" ADD COLUMN "repeat_weekday" "enum_specials_repeat_weekday";
  ALTER TABLE "specials" ADD COLUMN "repeat_until" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "specials" DROP COLUMN "show_time";
  ALTER TABLE "specials" DROP COLUMN "repeat_frequency";
  ALTER TABLE "specials" DROP COLUMN "repeat_week";
  ALTER TABLE "specials" DROP COLUMN "repeat_weekday";
  ALTER TABLE "specials" DROP COLUMN "repeat_until";
  DROP TYPE "public"."enum_specials_repeat_frequency";
  DROP TYPE "public"."enum_specials_repeat_week";
  DROP TYPE "public"."enum_specials_repeat_weekday";`)
}
