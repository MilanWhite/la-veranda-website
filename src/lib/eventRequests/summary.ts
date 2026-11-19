import type { EventMenu, EventRequest } from '../../payload-types'

export const STATUS_LABELS: Record<EventRequest['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

/** "13:30" → "1:30 PM" */
export function formatTime(time?: string | null) {
  const m = time?.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return time ?? ''
  const h = Number(m[1])
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

/** "2026-10-31" → "Saturday, October 31, 2026" */
export function formatDate(date?: string | null) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return date ?? ''
  const [y, mo, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, mo - 1, d)))
}

export function money(value?: number | null) {
  if (value == null) return ''
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`
}

/** "Pricing & Notes" lines, generated from the event menu (one source of truth). */
export function pricingNotes(menu: EventMenu) {
  type Spot = NonNullable<EventMenu['extraNotes']>[number]['position']
  const extra = (position: Spot) =>
    (menu.extraNotes ?? [])
      .filter((n) => n.position === position && n.title?.trim() && n.text?.trim())
      .map((n) => `${n.title.trim()}: ${n.text.trim()}`)
  const notes = [
    ...extra('top'),
    `Base Price: Adult ${money(menu.adultPrice)}, Kids ${money(menu.kidPrice)} (plus taxes)`,
    ...extra('afterBase'),
    `Space Setup Fee: ${menu.spaceFeePercent}%`,
    ...extra('afterFee'),
    ...(menu.extras ?? [])
      .filter((e) => e.unit === 'adult' && e.available !== false)
      .map((e) => `${e.name} (if selected): ${money(e.price)} extra per adult`),
    ...extra('afterExtras'),
    `Time Limit: ${menu.includedHours} hrs max; ${money(menu.extraHourPrice)} extra for each additional hour${
      menu.timeLimitNote ? ` ${menu.timeLimitNote}` : ''
    }`,
  ]
  notes.push(...extra('end'))
  return notes
}

export type SummaryRow = { label: string; value: string }

/**
 * The request as label/value rows, in the same order as the old booking summary PDF.
 * Used by the admin overview, both emails and the PDF so they always match.
 */
export function summaryRows(r: EventRequest): SummaryRow[] {
  const rows: SummaryRow[] = [
    { label: 'Name / Company', value: r.customer?.nameOrCompany ?? '' },
    { label: 'Contact Person', value: r.customer?.contactPerson ?? '' },
    { label: 'Address', value: r.customer?.address ?? '' },
    { label: 'Email', value: r.customer?.email ?? '' },
    { label: 'Phone', value: r.customer?.phone ?? '' },
    { label: 'Event Type', value: r.event?.type ?? '' },
    { label: 'Event Date', value: r.event?.date ?? '' },
    { label: 'Start Time', value: formatTime(r.event?.startTime) },
    { label: 'Ending Time', value: formatTime(r.event?.endTime) },
    { label: '# of Guests Expected', value: String(r.event?.adults ?? '') },
    { label: '# of Kids Guests Expected', value: String(r.event?.kids ?? 0) },
  ]

  for (const s of r.selections ?? []) {
    const items = (s.items ?? [])
      .map((i) => (i.upcharge ? `${i.name} (+${money(i.upcharge)})` : i.name))
      .join(', ')
    rows.push({ label: s.title, value: s.toBeDecided ? 'To be decided' : items || '—' })
    if (s.textLabel && s.text) {
      rows.push({
        label: s.textLabel,
        value: s.textUpcharge ? `${s.text} (+${money(s.textUpcharge)})` : s.text,
      })
    }
  }

  rows.push({
    label: 'Extras',
    value:
      (r.extras ?? [])
        .map((e) => `${e.name} ${money(e.price)}${e.unit === 'adult' ? ' per adult' : ''}`)
        .join(', ') || 'None',
  })
  for (const d of r.details ?? []) rows.push({ label: d.label, value: d.value ?? '' })
  rows.push({ label: 'Deposit Required', value: r.depositAcknowledged ? 'Yes' : 'No' })
  rows.push({ label: 'Notes', value: r.notes || '—' })

  return rows.filter((row) => row.value !== '')
}

export function requestNotes(r: EventRequest) {
  return (r.pricing?.notes ?? []).map((n) => n.text ?? '').filter(Boolean)
}
