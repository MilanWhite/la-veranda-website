import type { Payload, PayloadRequest } from 'payload'

// Sidebar groups that start collapsed for each admin, so the daily "Bookings" group is what
// they see. Payload stores open/closed groups per user under the "nav" preference; this only
// writes it when the user has none yet, so their own choices are kept from then on.
const COLLAPSED_BY_DEFAULT = ['Website', 'Setup']

// From a hook, pass `req` so this runs in the same database transaction: on "create first
// user" the new user isn't committed yet, and a separate connection can't see it.
export async function ensureNavDefaults(
  payload: Payload,
  user: { id: number },
  req?: PayloadRequest,
) {
  const existing = await payload.find({
    req,
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
    req,
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
