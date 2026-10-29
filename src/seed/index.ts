/**
 * Fills the database with placeholder content taken from the old site.
 *
 *   npm run seed       add anything that is missing (safe to re-run; never overwrites edits)
 *   npm run db:reset   wipe the database, re-run migrations, then seed
 *
 * Optional: SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD in .env create an admin user when the
 * database has none (handy after a reset).
 */
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../payload.config'
import { brunchMenu, dinnerMenu } from './menus'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const log = (msg: string) => console.log(`[seed] ${msg}`)

type GalleryCategory = 'food' | 'events' | 'restaurant'

// Old-site photos (laverandaresto.com/gallery), resized to WebP in ./images. Categories match
// the old site's filter tabs (01–06 Food, 07–15 Events, 16–19 Restaurant).
const galleryImages: { file: string; alt: string; events?: boolean }[] = [
  { file: 'gallery-01', alt: 'Grilled meat with arugula and cherry tomatoes on a wooden board' },
  { file: 'gallery-02', alt: 'Platter of fried calamari with dipping sauces and lemon' },
  { file: 'gallery-03', alt: 'Mini sandwiches with arugula on a serving platter' },
  { file: 'gallery-04', alt: 'Whole grilled fish with lemon slices' },
  { file: 'gallery-05', alt: 'Grilled skewers and sweet potato fries on a wooden board' },
  { file: 'gallery-06', alt: 'Stuffed pita wraps on a wooden board' },
  { file: 'gallery-07', alt: 'Dining room decorated with greenery for an event' },
  { file: 'gallery-08', alt: 'Event room with wooden walls, lanterns and floral decor' },
  { file: 'gallery-09', alt: 'Guests dancing at a celebration', events: true },
  { file: 'gallery-10', alt: 'Long table set with white roses for an event', events: true },
  { file: 'gallery-11', alt: 'Buffet table of antipasto platters' },
  {
    file: 'gallery-12',
    alt: 'Guests serving themselves from a table of shared plates',
  },
  { file: 'gallery-13', alt: 'Bar counter lined with bottles under a chandelier', events: true },
  { file: 'gallery-14', alt: 'Guests seated at a long table during an event', events: true },
  { file: 'gallery-15', alt: 'Drinks being poured into a row of glasses' },
  { file: 'gallery-16', alt: 'Banquet table with white flowers and folded napkins', events: true },
  { file: 'gallery-17', alt: 'Table setting with roses and folded napkins', events: true },
  { file: 'gallery-18', alt: 'Dining room set with white tablecloths and flowers', events: true },
  { file: 'gallery-19', alt: 'Dining room with long tables set under wooden beams', events: true },
]

function galleryCategory(file: string): GalleryCategory {
  const n = Number(file.replace('gallery-', ''))
  return n <= 6 ? 'food' : n <= 15 ? 'events' : 'restaurant'
}

async function upsertMedia(payload: Payload, filename: string, alt: string, dir = 'images') {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0]
  log(`uploading ${filename}`)
  return payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.join(dirname, dir, filename),
  })
}

async function seedSiteSettings(payload: Payload) {
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  if (settings.phone || settings.email) {
    log('site settings already filled in, skipping')
    return
  }
  log('site settings')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      restaurantName: 'La Veranda',
      phone: '(905) 605-5055',
      email: 'info@laverandaresto.com',
      address: '140 Woodbridge Ave.\nWoodbridge, ON L4L 4K9',
      socialLinks: [
        { platform: 'Facebook', url: 'https://www.facebook.com/laverandawoodbridge/' },
        { platform: 'Instagram', url: 'https://www.instagram.com/la_veranda_resto/' },
      ],
      // From the old Contact page. Not confirmed: four different versions exist.
      hours: [
        { days: 'Mon – Tue', time: 'Closed' },
        { days: 'Wed – Thu', time: '5pm – 9:30pm' },
        { days: 'Fri – Sat', time: '12pm – 12am' },
        { days: 'Sun', time: 'By reservation only' },
      ],
      seo: {
        title: 'La Veranda Restaurant & Event Center',
        description:
          "Italian restaurant and event venue in Downtown Woodbridge. Dinner, weekend brunch and private events, inspired by Nonna's kitchen.",
      },
    },
  })
}

// The old site's event "Group Menu" PDF (2023), linked from the Events page.
async function seedGroupMenu(payload: Payload) {
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  if (settings.groupMenuPdf) return
  const pdf = await upsertMedia(
    payload,
    'group-menu.pdf',
    'La Veranda event group menu (PDF)',
    'files',
  )
  log('group menu PDF')
  await payload.updateGlobal({ slug: 'site-settings', data: { groupMenuPdf: pdf.id } })
}

async function seedMenus(payload: Payload) {
  const pdf = await upsertMedia(payload, 'brunch-menu.pdf', 'La Veranda brunch menu (PDF)', 'files')

  for (const menu of [dinnerMenu, { ...brunchMenu, pdf: pdf.id }]) {
    const existing = await payload.find({
      collection: 'menus',
      where: { slug: { equals: menu.slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      log(`${menu.title} already exists, skipping`)
      continue
    }
    log(menu.title)
    await payload.create({ collection: 'menus', data: menu })
  }
}

async function seedGallery(payload: Payload) {
  const gallery = await payload.findGlobal({ slug: 'gallery' })
  if (gallery.images?.length) {
    log('gallery already has images, skipping')
    return
  }
  const images = []
  for (const g of galleryImages) {
    const media = await upsertMedia(payload, `${g.file}.webp`, g.alt)
    images.push({
      image: media.id,
      category: galleryCategory(g.file),
      showOnEventsPage: Boolean(g.events),
    })
  }
  log('gallery')
  await payload.updateGlobal({ slug: 'gallery', data: { images } })
}

async function seedSpecials(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'specials' })
  if (totalDocs > 0) {
    log('specials already exist, skipping')
    return
  }
  const media = async (file: string) =>
    (await payload.find({ collection: 'media', where: { filename: { equals: file } }, limit: 1 }))
      .docs[0]?.id

  const fathersDay = await upsertMedia(
    payload,
    'special-fathers-day.webp',
    'Brunch pancakes with berries, salad and coffee',
  )

  // The old site's 2025 specials, kept as inactive examples for the owner to copy.
  const specials = [
    {
      title: "Father's Day Brunch: $40, Kids $20",
      date: '2025-06-15T12:00:00.000Z', // 8:00am Toronto
      description: "A delightful Father's Day brunch.",
      image: fathersDay.id,
    },
    {
      title: 'Easter Sunday',
      date: '2025-04-20T23:00:00.000Z', // 7:00pm Toronto
      description:
        'Enjoy a special Easter brunch with seasonal delights, fresh flavours and a warm, family-friendly atmosphere. Book your table today!',
      image: await media('gallery-16.webp'),
    },
    {
      title: 'Thanksgiving',
      date: '2025-10-14T00:00:00.000Z', // 8:00pm Toronto, Oct 13
      description:
        'Savour a traditional Thanksgiving feast with rich flavours and warm hospitality. Reserve your table for a heartwarming gathering!',
      image: await media('gallery-10.webp'),
    },
  ]
  for (const s of specials) {
    log(`special: ${s.title}`)
    await payload.create({
      collection: 'specials',
      data: {
        ...s,
        active: false,
        cta: { label: 'Reserve a Table', url: '/reservations' },
      },
    })
  }
}

async function seedAdmin(payload: Payload) {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) return
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs > 0) return
  log(`admin user ${email}`)
  await payload.create({ collection: 'users', data: { email, password } })
}

const payload = await getPayload({ config })
await seedSiteSettings(payload)
await seedGroupMenu(payload)
await seedMenus(payload)
await seedGallery(payload)
await seedSpecials(payload)
await seedAdmin(payload)
log('done')
process.exit(0)
