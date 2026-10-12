import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa'

import type { SiteSetting } from '@/payload-types'

// Email, phone and address from Site Settings, each with a teal icon.
export function ContactList({ settings }: { settings: SiteSetting }) {
  return (
    <ul className="icon-list">
      {settings.email && (
        <li>
          <FaEnvelope />
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </li>
      )}
      {settings.phone && (
        <li>
          <FaPhoneAlt />
          <a href={`tel:${settings.phone}`}>{settings.phone}</a>
        </li>
      )}
      {settings.address && (
        <li>
          <FaMapMarkerAlt />
          <span style={{ whiteSpace: 'pre-line' }}>{settings.address}</span>
        </li>
      )}
    </ul>
  )
}
