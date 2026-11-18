import type { SiteSetting } from '@/payload-types'

export function mapQuery(settings: SiteSetting) {
  return settings.address ? encodeURIComponent(settings.address.replace(/\s+/g, ' ')) : null
}

export function directionsUrl(settings: SiteSetting) {
  const q = mapQuery(settings)
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${q}` : null
}

// Google Maps embed for the address in Site Settings.
export function MapEmbed({
  settings,
  className = 'map',
}: {
  settings: SiteSetting
  className?: string
}) {
  const q = mapQuery(settings)
  if (!q) return null
  return (
    <iframe
      className={className}
      src={`https://www.google.com/maps?q=${q}&output=embed`}
      title={`Map of ${settings.restaurantName}`}
      loading="lazy"
    />
  )
}
