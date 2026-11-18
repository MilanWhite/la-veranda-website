import { getPayload } from 'payload'
import { cache } from 'react'

import type { Media, Menu } from '@/payload-types'
import config from '@/payload.config'

const payload = () => getPayload({ config })

export const getMenu = cache(async (slug: Menu['slug']) => {
  const { docs } = await (
    await payload()
  ).find({ collection: 'menus', where: { slug: { equals: slug } }, limit: 1 })
  return docs[0] ?? null
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
