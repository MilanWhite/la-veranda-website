// Dates for specials that repeat (e.g. Salsa Night, the last Friday of every month).
// Everything is worked out in Toronto time, so the day and hour never shift with UTC or
// daylight saving.

export const TIME_ZONE = 'America/Toronto'

export const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const
export const WEEKS = ['first', 'second', 'third', 'fourth', 'last'] as const

export type Weekday = (typeof WEEKDAYS)[number]
export type Week = (typeof WEEKS)[number]
export type Repeat = {
  frequency?: 'none' | 'weekly' | 'monthly' | null
  week?: Week | null
  weekday?: Weekday | null
  until?: string | null
}

type Wall = { year: number; month: number; day: number; hour: number; minute: number }

// The Toronto wall-clock time of an instant.
function toWall(date: Date): Wall {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)]),
  )
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  }
}

// The instant for a Toronto wall-clock time.
function fromWall({ year, month, day, hour, minute }: Wall): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute)
  const offset = (t: number) => {
    const w = toWall(new Date(t))
    return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute) - t
  }
  let t = asUtc - offset(asUtc)
  t = asUtc - offset(t) // second pass settles daylight-saving edges
  return new Date(t)
}

const dayOfWeek = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day)).getUTCDay()
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

// Day of the month of e.g. the "last friday" or "second tuesday".
function dayInMonth(year: number, month: number, week: Week, weekday: Weekday) {
  const target = WEEKDAYS.indexOf(weekday)
  if (week === 'last') {
    const last = daysInMonth(year, month)
    return last - ((dayOfWeek(year, month, last) - target + 7) % 7)
  }
  const first = 1 + ((target - dayOfWeek(year, month, 1) + 7) % 7)
  return first + 7 * WEEKS.indexOf(week)
}

// When the special happens next: its own date for one-off specials, otherwise the next
// repeat on or after today (Toronto), at the time of day of its start date. Returns null when
// it's over (a past one-off, or past its "until" date). An event that already started today
// still counts as today's, so it stays listed for the whole day.
export function nextOccurrence(
  start: string | null | undefined,
  repeat: Repeat | null | undefined,
  now = new Date(),
): Date | null {
  if (!start) return null
  const first = new Date(start)
  const today = toWall(now)
  const todayKey = today.year * 10000 + today.month * 100 + today.day
  const keyOf = (w: Wall) => w.year * 10000 + w.month * 100 + w.day

  const frequency = repeat?.frequency ?? 'none'
  if (frequency === 'none') return keyOf(toWall(first)) >= todayKey ? first : null

  const startWall = toWall(first)
  const from = Math.max(todayKey, keyOf(startWall))
  const until = repeat?.until ? keyOf(toWall(new Date(repeat.until))) : Infinity
  const weekday =
    repeat?.weekday ?? WEEKDAYS[dayOfWeek(startWall.year, startWall.month, startWall.day)]
  const at = (year: number, month: number, day: number) =>
    fromWall({ year, month, day, hour: startWall.hour, minute: startWall.minute })

  const fromYear = Math.floor(from / 10000)
  const fromMonth = Math.floor(from / 100) % 100
  const fromDay = from % 100

  if (frequency === 'weekly') {
    const ahead = (WEEKDAYS.indexOf(weekday) - dayOfWeek(fromYear, fromMonth, fromDay) + 7) % 7
    const d = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay + ahead))
    const next = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
    return keyOf({ ...next, hour: 0, minute: 0 }) <= until
      ? at(next.year, next.month, next.day)
      : null
  }

  // monthly: this month's date if it hasn't passed, otherwise next month's
  const week = repeat?.week ?? 'first'
  for (let i = 0; i < 2; i++) {
    const year = fromYear + Math.floor((fromMonth - 1 + i) / 12)
    const month = ((fromMonth - 1 + i) % 12) + 1
    const day = dayInMonth(year, month, week, weekday)
    const key = year * 10000 + month * 100 + day
    if (key < from) continue
    return key <= until ? at(year, month, day) : null
  }
  return null
}

// "Every Friday" / "Last Friday of every month"
export function describeRepeat(repeat: Repeat | null | undefined): string | null {
  const frequency = repeat?.frequency ?? 'none'
  if (frequency === 'none' || !repeat?.weekday) return null
  const day = repeat.weekday[0].toUpperCase() + repeat.weekday.slice(1)
  if (frequency === 'weekly') return `Every ${day}`
  const week = repeat.week ?? 'first'
  return `${week[0].toUpperCase() + week.slice(1)} ${day} of every month`
}
