import type { SiteSetting } from '@/payload-types'

// Opening hours from Site Settings as name — line — value rows.
export function HoursList({ hours }: { hours: SiteSetting['hours'] }) {
  if (!hours?.length) return null
  return (
    <ul className="hours-list">
      {hours.map((h) => (
        <li key={h.id}>
          <div className="leader-row">
            <h3>{h.days}</h3>
            <span className="leader-line" />
            <span className="leader-value">{h.time}</span>
          </div>
          {h.note && <p className="hours-note">{h.note}</p>}
        </li>
      ))}
    </ul>
  )
}
