import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import { APIError, type CollectionAfterDeleteHook, type CollectionBeforeChangeHook } from 'payload'

import type { EventRequest } from '../../payload-types'
import { removeCalendarEvent, upsertCalendarEvent } from '../googleCalendar'
import { formatDate, formatTime, STATUS_LABELS } from './summary'

type Doc = Partial<EventRequest> & Record<string, unknown>
const FIRST_REQUEST_NUMBER = 4834 // continues from the old site's #4833

const get = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj)

// Values coming from the admin form may be partial; fall back to the saved document.
const merged = (data: Doc, original?: Doc) => (path: string) => {
  const v = get(data, path)
  return v === undefined ? get(original, path) : v
}

const who = (req: { user?: { email?: string } | null }) => req.user?.email ?? 'System'

// ── Request number + list columns ────────────────────────────────
export const assignRequestNumber: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'create') {
    // From a database counter that only goes up (see the request_number_sequence migration),
    // so a deleted request's number is never reused.
    const db = req.payload.db as unknown as PostgresAdapter
    const result = await db.drizzle.execute(sql`SELECT nextval('event_request_number_seq') AS n`)
    const next = Number((result as unknown as { rows: { n: string }[] }).rows[0]?.n)
    data.requestNumber = Math.max(FIRST_REQUEST_NUMBER, next)
    data.status = 'pending'
    data.emails = { customer: 'not_sent', owner: 'not_sent' }
    data.calendar = { status: 'not_synced' }
  }
  const v = merged(data, originalDoc)
  const name = String(v('customer.nameOrCompany') ?? '')
  const adults = Number(v('event.adults') ?? 0)
  const kids = Number(v('event.kids') ?? 0)
  data.customerName = name
  data.startsOn = v('event.date') as string
  data.occasion = v('event.type') as string
  data.guests = kids ? `${adults} + ${kids} kids` : String(adults)
  data.title = `#${v('requestNumber') ?? data.requestNumber} · ${name} · ${v('event.date')}`
  return data
}

// ── Status rules: Pending → Approved | Declined, Approved → Cancelled ──
const ALLOWED: Record<string, string[]> = {
  pending: ['approved', 'declined'],
  approved: ['cancelled'],
  declined: [],
  cancelled: [],
}

// Lists show pending requests first, then approved, then the closed ones, newest request
// first within each. Payload's list sorts on one field, so both go into one number:
// status × 1,000,000 + (999,999 − request number). Sorted ascending.
export const STATUS_ORDER: Record<EventRequest['status'], number> = {
  pending: 0,
  approved: 1,
  declined: 2,
  cancelled: 3,
}

export const setStatusOrder: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const status = (data.status ?? originalDoc?.status ?? 'pending') as EventRequest['status']
  const number = Number(data.requestNumber ?? originalDoc?.requestNumber ?? 0)
  data.statusOrder = STATUS_ORDER[status] * 1_000_000 + (999_999 - number)
  return data
}

export const enforceStatusRules: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
}) => {
  if (operation !== 'update' || !data.status || data.status === originalDoc?.status) return data
  const from = originalDoc?.status as EventRequest['status']
  const to = data.status as EventRequest['status']
  if (!(to in STATUS_LABELS)) throw new APIError('Unknown status.', 400, null, true)
  if (!ALLOWED[from]?.includes(to)) {
    const label = (s: EventRequest['status']) => STATUS_LABELS[s].toLowerCase()
    const article = /^[aeiou]/.test(label(from)) ? 'An' : 'A'
    throw new APIError(
      `${article} ${label(from)} request can't be changed to ${label(to)}.`,
      400,
      null,
      true,
    )
  }
  return data
}

// ── Internal notes: who wrote them and when ────────────────────────
export const stampInternalNotes: CollectionBeforeChangeHook = ({ data, req }) => {
  if (Array.isArray(data.internalNotes)) {
    data.internalNotes = data.internalNotes.map((n: Record<string, unknown>) =>
      n.author ? n : { ...n, author: who(req), addedAt: new Date().toISOString() },
    )
  }
  return data
}

// ── Google Calendar: approve → add, edit → update, cancel → remove ──
const CALENDAR_FIELDS = [
  'event.date',
  'event.startTime',
  'event.endTime',
  'event.type',
  'event.adults',
  'event.kids',
  'customer.nameOrCompany',
  'customer.contactPerson',
  'customer.phone',
  'customer.email',
  'notes',
]

export const syncCalendarOnChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
  context,
}) => {
  if (operation !== 'update' || context.skipCalendar) return data
  const v = merged(data, originalDoc)
  const before = originalDoc?.status
  const after = v('status')
  const detailsChanged = CALENDAR_FIELDS.some(
    (f) =>
      get(data, f) !== undefined &&
      JSON.stringify(get(data, f)) !== JSON.stringify(get(originalDoc, f)),
  )

  const shouldAdd =
    after === 'approved' && (before !== 'approved' || detailsChanged || context.forceCalendarSync)
  const shouldRemove =
    after === 'cancelled' && (before !== 'cancelled' || context.forceCalendarSync)
  if (!shouldAdd && !shouldRemove) return data

  const settings = await req.payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    req,
    overrideAccess: true,
  })
  const calendarId = settings.internal?.googleCalendarId || process.env.GOOGLE_CALENDAR_ID
  const request = {
    ...(originalDoc as EventRequest),
    ...(data as EventRequest),
    customer: { ...originalDoc?.customer, ...data.customer },
    event: { ...originalDoc?.event, ...data.event },
    // Always the saved calendar event, never one sent with the edit
    calendar: originalDoc?.calendar,
  } as EventRequest

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  const result = shouldAdd
    ? await upsertCalendarEvent(calendarId, request, {
        location: settings.address,
        adminUrl: serverUrl
          ? `${serverUrl}/admin/collections/event-requests/${originalDoc?.id}`
          : undefined,
      })
    : await removeCalendarEvent(calendarId, originalDoc?.calendar?.eventId)

  data.calendar = {
    status: result.status,
    eventId: result.eventId ?? originalDoc?.calendar?.eventId ?? null,
    syncedAt:
      result.status === 'synced' || result.status === 'removed'
        ? new Date().toISOString()
        : originalDoc?.calendar?.syncedAt,
    error: result.error ?? null,
  }
  return data
}

// ── History: plain-language log of every change ───────────────────
const LABELS: Record<string, string> = {
  'customer.nameOrCompany': 'Name / company',
  'customer.contactPerson': 'Contact person',
  'customer.email': 'Email',
  'customer.phone': 'Phone',
  'customer.address': 'Address',
  'event.type': 'Event type',
  'event.date': 'Event date',
  'event.startTime': 'Start time',
  'event.endTime': 'End time',
  'event.adults': 'Guests',
  'event.kids': 'Kids',
  notes: 'Customer notes',
  depositAcknowledged: 'Deposit acknowledged',
}

const show = (path: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '(empty)'
  if (path.endsWith('Time')) return formatTime(String(value))
  if (path === 'event.date') return formatDate(String(value))
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

// Compare arrays without the row ids Payload adds, treating empty values (null, missing,
// "") as the same and ignoring key order: the admin form sends rows back in a different
// shape than they're stored, which would otherwise log "updated" on every save.
const normalize = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(normalize)
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v)
        .filter(([k, x]) => k !== 'id' && x !== null && x !== undefined && x !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => [k, normalize(x)]),
    )
  }
  return v
}
const clean = (value: unknown) => JSON.stringify(normalize(value ?? []))

export const recordActivity: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
  context,
}) => {
  const now = new Date().toISOString()
  // Emails and replies are saved by the server; the staff member who pressed the button is
  // passed in context.by so History names them instead of "System".
  const by = (context.by as string | undefined) || who(req)

  if (operation === 'create') {
    data.activity = [{ at: now, by: 'Website', message: 'Request sent from the website' }]
    return data
  }

  const messages: string[] = []

  if (data.status && data.status !== originalDoc?.status) {
    messages.push(
      `Status changed: ${STATUS_LABELS[originalDoc?.status as EventRequest['status']]} → ${
        STATUS_LABELS[data.status as EventRequest['status']]
      }`,
    )
  }

  for (const [path, label] of Object.entries(LABELS)) {
    const next = get(data, path)
    const prev = get(originalDoc, path)
    if (next === undefined) continue
    const same = (next ?? '') === (prev ?? '') || (next === false && prev == null)
    if (!same) messages.push(`${label} changed from ${show(path, prev)} to ${show(path, next)}`)
  }

  const listChanges: [string, string][] = [
    ['selections', 'Menu selections updated'],
    ['extras', 'Extras updated'],
    ['details', 'Additional details updated'],
  ]
  for (const [path, message] of listChanges) {
    if (data[path] !== undefined && clean(data[path]) !== clean(originalDoc?.[path])) {
      messages.push(message)
    }
  }

  const notesBefore = (originalDoc?.internalNotes ?? []).length
  if (Array.isArray(data.internalNotes)) {
    const notesAfter = data.internalNotes.length
    if (notesAfter > notesBefore) messages.push(`Internal note added`)
    else if (notesAfter < notesBefore) messages.push(`Internal note removed`)
    else if (clean(data.internalNotes) !== clean(originalDoc?.internalNotes))
      messages.push(`Internal note edited`)
  }

  const cal = data.calendar as EventRequest['calendar'] | undefined
  if (
    cal?.status &&
    (cal.status !== originalDoc?.calendar?.status ||
      cal.syncedAt !== originalDoc?.calendar?.syncedAt ||
      cal.error !== originalDoc?.calendar?.error)
  ) {
    const text = {
      synced: 'Added to Google Calendar (or updated)',
      removed: 'Removed from Google Calendar',
      failed: `Google Calendar sync failed: ${cal.error ?? 'unknown error'}`,
      skipped: 'Google Calendar is not set up, so the calendar was not updated',
      not_synced: '',
    }[cal.status]
    if (text) messages.push(text)
  }

  for (const m of (context.activity as string[] | undefined) ?? []) messages.push(m)

  // Always build on the saved history so it can't be edited from the form.
  data.activity = [
    ...(originalDoc?.activity ?? []),
    ...messages.map((message) => ({ at: now, by, message })),
  ]
  return data
}

// Deleting a request that's on Google Calendar removes its calendar event too, so no
// orphaned events stay on the Bookings calendar.
export const removeCalendarOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const request = doc as EventRequest
  if (request.calendar?.status !== 'synced') return
  const settings = await req.payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    req,
    overrideAccess: true,
  })
  const calendarId = settings.internal?.googleCalendarId || process.env.GOOGLE_CALENDAR_ID
  const result = await removeCalendarEvent(calendarId, request.calendar?.eventId)
  if (result.status === 'failed') {
    req.payload.logger.error(
      `Event request #${request.requestNumber} deleted, but its calendar event could not be removed: ${result.error}`,
    )
  }
}
