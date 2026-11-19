/**
 * Checks the Google hours setup: which business Google found and the hours the site will show.
 *   npm run check:google-hours
 */
import 'dotenv/config'

import { fetchGooglePlace, groupWeekdays } from '../src/lib/googleHours'

if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.log('GOOGLE_PLACES_API_KEY is not set: the site shows the hours from Site Settings.')
  process.exit(0)
}
const place = await fetchGooglePlace().catch((e: Error) => {
  console.error('Request failed:', e.message)
  return null
})
if (!place) {
  console.error(
    'Google returned nothing. Check the key, that "Places API (New)" is enabled and billing is linked.',
  )
  process.exit(1)
}
console.log(`Found: ${place.displayName?.text} — ${place.formattedAddress}`)
console.log(`Place ID: ${place.id}  (optional: put it in GOOGLE_PLACE_ID to pin this business)`)
const lines = place.regularOpeningHours?.weekdayDescriptions ?? []
if (!lines.length) console.log('Google has no opening hours for this place.')
for (const h of groupWeekdays(lines)) console.log(`  ${h.days}: ${h.time}`)
