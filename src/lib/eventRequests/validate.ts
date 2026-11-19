import type { EventMenu, EventRequest } from '../../payload-types'
import { pricingNotes } from './summary'

// Validates an event request against the current event menu (never trusting the browser)
// and builds the snapshot that gets saved: names and prices as they are right now.

export type FieldErrors = Record<string, string>
type RequestData = Omit<EventRequest, 'id' | 'createdAt' | 'updatedAt' | 'requestNumber' | 'status'>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[\d\s()+.-]{7,20}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

/** Start-time choices, e.g. 09:00, 09:30 … 22:00 */
export function startTimes(menu: EventMenu) {
  const step = Math.max(5, menu.startStepMinutes || 30)
  const from = TIME.test(menu.earliestStart) ? toMinutes(menu.earliestStart) : 9 * 60
  const to = TIME.test(menu.latestStart) ? toMinutes(menu.latestStart) : 22 * 60
  const times: string[] = []
  for (let m = from; m <= to; m += step) {
    times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return times
}

/** "Choose 4 items", "Choose up to 3", "Choose at least 1" */
export function pickRule(min?: number | null, max?: number | null) {
  const lo = min ?? 0
  if (max && lo === max) return `Choose ${max} item${max === 1 ? '' : 's'}`
  if (max && lo) return `Choose ${lo} to ${max}`
  if (max) return `Choose up to ${max}`
  if (lo) return `Choose at least ${lo}`
  return ''
}

/** YYYY-MM-DD that exists on the calendar (rejects 2027-02-30, which JS would roll over). */
function isRealDate(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

/** Today in Toronto as YYYY-MM-DD */
function todayInToronto() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date())
}

export function validateEventRequest(form: FormData, menu: EventMenu) {
  const errors: FieldErrors = {}
  // Single-line fields: line breaks and other control characters become spaces (they could
  // otherwise end up in email subjects or the calendar title). Notes keep their line breaks.
  const text = (name: string, max = 200) =>
    String(form.get(name) ?? '')
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .trim()
      .slice(0, max)
  const multiline = (name: string, max: number) =>
    String(form.get(name) ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
      .trim()
      .slice(0, max)
  const all = (name: string) => form.getAll(name).map(String)

  // Customer
  const nameOrCompany = text('nameOrCompany', 150)
  const contactPerson = text('contactPerson', 150)
  const address = text('address', 200)
  const email = text('email', 200)
  const phone = text('phone', 30)
  if (!nameOrCompany) errors.nameOrCompany = 'Please enter your name or company.'
  if (!EMAIL.test(email)) errors.email = 'Please enter a valid email address.'
  if (!PHONE.test(phone)) errors.phone = 'Please enter a valid phone number.'

  // Event type
  const typeValue = text('eventType', 100)
  const types = (menu.eventTypes ?? []).map((t) => t.name)
  let type = typeValue
  if (typeValue === '__other') {
    type = text('eventTypeOther', 80)
    if (!type) errors.eventTypeOther = 'Please tell us the type of event.'
  } else if (!types.includes(typeValue)) {
    errors.eventType = 'Please choose the type of event.'
  }

  // Date and time
  const date = text('date', 10)
  if (!isRealDate(date)) {
    errors.date = 'Please choose the date of your event.'
  } else if (date < todayInToronto()) {
    errors.date = 'Please choose a date in the future.'
  } else if (Number(date.slice(0, 4)) > new Date().getFullYear() + 3) {
    errors.date = 'Please choose a date within the next three years.'
  }
  const startTime = text('startTime', 5)
  const endTime = text('endTime', 5)
  if (!startTimes(menu).includes(startTime)) errors.startTime = 'Please choose a start time.'
  if (!TIME.test(endTime)) errors.endTime = 'Please choose an ending time.'
  else if (!errors.startTime) {
    let minutes = toMinutes(endTime) - toMinutes(startTime)
    if (minutes <= 0) minutes += 24 * 60 // ends after midnight
    if (minutes > 12 * 60) errors.endTime = 'Events can last up to 12 hours.'
  }

  // Guests
  const adults = Number(text('adults', 6))
  const kids = Number(text('kids', 6) || 0)
  if (!Number.isInteger(adults) || adults < 1 || adults > 2000)
    errors.adults = 'Please enter the number of guests.'
  if (!Number.isInteger(kids) || kids < 0 || kids > 1000)
    errors.kids = 'Please enter the number of kids (0 if none).'

  // Menu sections
  const selections: RequestData['selections'] = []
  for (const section of menu.sections ?? []) {
    const key = section.key
    if (section.forKids && !(kids > 0)) continue
    const available = (section.options ?? []).filter((o) => o.available !== false)
    const tbd = section.allowToBeDecided && form.get(`tbd.${key}`) === '1'
    const picked = tbd
      ? []
      : all(`section.${key}`)
          .map((id) => available.find((o) => o.id === id))
          .filter((o): o is NonNullable<typeof o> => Boolean(o))
    const unique = [...new Map(picked.map((o) => [o.id, o])).values()]
    const min = section.min ?? 0
    const max = section.max ?? null

    if (!tbd) {
      if (section.selection === 'single' && min > 0 && unique.length !== 1) {
        errors[`section.${key}`] = `Please choose one option for ${section.title}.`
      } else if (unique.length < min || (max && unique.length > max)) {
        errors[`section.${key}`] = `${section.title}: ${pickRule(min, max).toLowerCase()}.`
      }
    }

    const extraText = section.textOption?.label ? text(`text.${key}`, 100) : ''
    selections.push({
      title: section.title,
      toBeDecided: Boolean(tbd),
      items: unique.map((o) => ({ name: o.name, upcharge: o.upcharge ?? 0 })),
      textLabel: extraText ? section.textOption?.label : null,
      text: extraText || null,
      textUpcharge: extraText ? (section.textOption?.upcharge ?? 0) : null,
    })
  }

  // Extras
  const extrasAvailable = (menu.extras ?? []).filter((e) => e.available !== false)
  const extras = [...new Set(all('extra'))]
    .map((id) => extrasAvailable.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((e) => ({ name: e.name, price: e.price, unit: e.unit }))

  // Additional details (radio questions)
  const details: RequestData['details'] = []
  for (const choice of menu.choices ?? []) {
    const id = text(`choice.${choice.key}`, 100)
    const option = (choice.options ?? []).find((o) => o.id === id)
    if (!option) errors[`choice.${choice.key}`] = `Please choose an option for ${choice.label}.`
    else details.push({ label: choice.label, value: option.label })
  }

  const depositAcknowledged = form.get('depositAcknowledged') === 'on'
  if (!depositAcknowledged)
    errors.depositAcknowledged = 'Please confirm you understand a deposit is required.'

  const notes = multiline('notes', 3000)

  const data: RequestData = {
    customer: { nameOrCompany, contactPerson, address, email, phone },
    event: { type, date, startTime, endTime, adults, kids },
    selections,
    extras,
    details,
    depositAcknowledged,
    notes,
    pricing: {
      adultPrice: menu.adultPrice,
      kidPrice: menu.kidPrice,
      spaceFeePercent: menu.spaceFeePercent,
      includedHours: menu.includedHours,
      extraHourPrice: menu.extraHourPrice,
      notes: pricingNotes(menu).map((t) => ({ text: t })),
    },
  }
  return { errors, data }
}
