// Opening hours from Google (Places API, New). Off until GOOGLE_PLACES_API_KEY is set; the
// site then shows the hours from Site Settings. GOOGLE_PLACE_ID is optional: without it the
// restaurant is looked up by name and address (GOOGLE_PLACE_QUERY). Cached for a day, so
// it's about one request a day. Any problem → null → Site Settings hours are shown.

export type OpeningHours = { id: string; days: string; time: string; note?: string | null }[]

const DEFAULT_QUERY = 'La Veranda Restaurant, 140 Woodbridge Ave, Woodbridge, ON'
const FIELDS = 'regularOpeningHours.weekdayDescriptions'
const DAY = 86_400

type Place = {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  regularOpeningHours?: { weekdayDescriptions?: string[] }
}

export async function fetchGooglePlace(): Promise<Place | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null
  const placeId = process.env.GOOGLE_PLACE_ID
  const init = { next: { revalidate: DAY }, signal: AbortSignal.timeout(5000) }

  if (placeId) {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        ...init,
        headers: {
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': `id,displayName,formattedAddress,${FIELDS}`,
        },
      },
    )
    return res.ok ? ((await res.json()) as Place) : null
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': `places.id,places.displayName,places.formattedAddress,places.${FIELDS}`,
    },
    body: JSON.stringify({
      textQuery: process.env.GOOGLE_PLACE_QUERY || DEFAULT_QUERY,
      maxResultCount: 1,
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { places?: Place[] }
  return data.places?.[0] ?? null
}

const SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

// Google gives one line per day ("Monday: 5:00 – 9:30 PM"); days in a row with the same
// hours are joined like the Site Settings list ("Mon – Tue": "Closed").
export function groupWeekdays(lines: string[]): OpeningHours {
  const days = lines.map((line) => {
    const at = line.indexOf(':')
    return { day: line.slice(0, at).trim(), time: line.slice(at + 1).trim() }
  })
  const groups: { from: string; to: string; time: string }[] = []
  for (const d of days) {
    const last = groups.at(-1)
    if (last && last.time === d.time) last.to = d.day
    else groups.push({ from: d.day, to: d.day, time: d.time })
  }
  return groups.map((g, i) => ({
    id: `g${i}`,
    days:
      g.from === g.to
        ? (SHORT[g.from] ?? g.from)
        : `${SHORT[g.from] ?? g.from} – ${SHORT[g.to] ?? g.to}`,
    time: g.time,
  }))
}

export async function googleOpeningHours(): Promise<OpeningHours | null> {
  try {
    const lines = (await fetchGooglePlace())?.regularOpeningHours?.weekdayDescriptions
    return lines?.length ? groupWeekdays(lines) : null
  } catch {
    return null
  }
}
