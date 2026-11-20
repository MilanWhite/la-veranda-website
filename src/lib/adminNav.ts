import type { Payload } from 'payload'

// Sidebar groups that start collapsed for each admin, so the daily "Bookings" group is what
// they see. Payload stores open/closed groups per user under the "nav" preference; this only
// writes it when the user has none yet, so their own choices are kept from then on.
const COLLAPSED_BY_DEFAULT = ['Website', 'Setup']

export async function ensureNavDefaults(payload: Payload, user: { id: number }) {
  const existing = await payload.find({
    collection: 'payload-preferences',
    where: {
      and: [
        { key: { equals: 'nav' } },
        { 'user.relationTo': { equals: 'users' } },
        { 'user.value': { equals: user.id } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length) return
  await payload.create({
    collection: 'payload-preferences',
    // Payload fills the preference's "user" field from the request user, so pass it here
    user: { ...user, collection: 'users' },
    data: {
      key: 'nav',
      user: { relationTo: 'users', value: user.id },
      value: {
        open: true,
        groups: Object.fromEntries(COLLAPSED_BY_DEFAULT.map((g) => [g, { open: false }])),
      },
    },
  })
}
