import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Event types in the request form become singular ("Birthday", not "Birthdays"), so reply
// templates read "your Birthday on …". Only the original names are renamed; any type added or
// renamed in the admin is left alone. Saved requests keep the name they were sent with.
const RENAMES: [string, string][] = [
  ['Corporate Events', 'Corporate Event'],
  ['Weddings', 'Wedding'],
  ['Confirmations', 'Confirmation'],
  ['Engagements', 'Engagement'],
  ['Communions', 'Communion'],
  ['Bridal Showers', 'Bridal Shower'],
  ["Sweet 16's", 'Sweet 16'],
  ['Baptisms', 'Baptism'],
  ['Birthdays', 'Birthday'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [from, to] of RENAMES) {
    await db.execute(sql`UPDATE "event_menu_event_types" SET "name" = ${to} WHERE "name" = ${from}`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [from, to] of RENAMES) {
    await db.execute(sql`UPDATE "event_menu_event_types" SET "name" = ${from} WHERE "name" = ${to}`)
  }
}
