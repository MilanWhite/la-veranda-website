import { getPayload } from 'payload'
import { cache } from 'react'

import type { Media, Menu } from '@/payload-types'
import config from '@/payload.config'
import { nextOccurrence } from '@/lib/recurrence'

const payload = () => getPayload({ config })

export const getMenu = cache(async (slug: Menu['slug']) => {
  const { docs } = await (
    await payload()
  ).find({ collection: 'menus', where: { slug: { equals: slug } }, limit: 1 })
  return docs[0] ?? null
})

export const getEventMenu = cache(async () =>
  (await payload()).findGlobal({ slug: 'event-menu', depth: 0 }),
)

// Active specials that are still to come, soonest first, each with the date it happens
// next (`next`: a repeating special's next date, or a one-time special's own date). Past
// one-time specials drop off by themselves; specials without a date are listed last.
export const getActiveSpecials = cache(async () => {
  const { docs } = await (
    await payload()
  ).find({ collection: 'specials', where: { active: { equals: true } }, sort: 'date', limit: 50 })
  return docs
    .map((special) => ({ ...special, next: nextOccurrence(special.date, special.repeat) }))
    .filter((special) => special.next || !special.date)
    .sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity))
})

export const getGallery = cache(async () => {
  const gallery = await (await payload()).findGlobal({ slug: 'gallery' })
  return (gallery.images ?? []).flatMap((row) => {
    const image = asMedia(row.image)
    return image
      ? [{ image, category: row.category, showOnEventsPage: Boolean(row.showOnEventsPage) }]
      : []
  })
})

// Upload fields are either an ID or the populated document, depending on query depth.
export function asMedia(value: number | Media | null | undefined): Media | null {
  return value && typeof value === 'object' && value.url ? value : null
}

export function formatPrice(price: number) {
  return `$${Number.isInteger(price) ? price : price.toFixed(2)}`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
