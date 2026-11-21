import { googleOpeningHours } from '@/lib/googleHours'
import type { SiteSetting } from '@/payload-types'

// Opening hours as name — line — value rows. Uses Google's hours when that integration is
// set up, otherwise the hours from Site Settings.

// "9:00 AM – 3:00 PM" → "9 AM – 3 PM" (minutes are kept when they aren't :00)
const tidyTime = (time: string) => time.replace(/:00(?=\s*[AaPp]\.?[Mm])/g, '')

export async function HoursList({ hours }: { hours: SiteSetting['hours'] }) {
  const list = (await googleOpeningHours()) ?? hours
  if (!list?.length) return null
  return (
    <ul className="hours-list">
      {list.map((h) => (
        <li key={h.id}>
          <div className="leader-row">
            <h3>{h.days}</h3>
            <span className="leader-line" />
            <span className="leader-value">{tidyTime(h.time)}</span>
          </div>
          {h.note && <p className="hours-note">{h.note}</p>}
        </li>
      ))}
    </ul>
  )
}
