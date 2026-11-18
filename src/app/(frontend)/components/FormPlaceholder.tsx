import type { ReactNode } from 'react'

import type { SiteSetting } from '@/payload-types'

// Stand-in for a form that isn't built yet (it needs email sending + spam protection first).
// Offers email/phone instead so visitors are never stuck.
export function FormPlaceholder({
  id,
  title,
  children,
  settings,
}: {
  id: string
  title: string
  children: ReactNode
  settings: SiteSetting
}) {
  return (
    <div id={id} className="form-placeholder">
      <p className="eyebrow eyebrow-accent">Coming soon</p>
      <h3>{title}</h3>
      {children}
      <div className="button-row button-row-center">
        {settings.email && (
          <a href={`mailto:${settings.email}`} className="button-solid">
            Email Us
          </a>
        )}
        {settings.phone && (
          <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="button">
            Call {settings.phone}
          </a>
        )}
      </div>
    </div>
  )
}
