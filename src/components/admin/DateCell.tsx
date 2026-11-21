'use client'

// Event date column in the Event Requests list: "2026-11-21" → "Sat, Nov 21, 2026".
const format = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function DateCell({ cellData }: { cellData?: unknown }) {
  const m = typeof cellData === 'string' ? cellData.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null
  if (!m) return <>{typeof cellData === 'string' ? cellData : ''}</>
  return <>{format.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])))}</>
}
