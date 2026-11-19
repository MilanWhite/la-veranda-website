import type { EventMenu } from '../payload-types'

// Starter replies for the Reply button on an event request. Edited in the admin under
// Event Menu & Form → Reply Templates. Placeholders are filled in from the request.
const signature = `Best regards,
The La Veranda Team
La Veranda Restaurant & Event Center
(905) 605-5055`

export const replyTemplatesSeed: NonNullable<EventMenu['replyTemplates']> = [
  {
    name: 'Ready to proceed',
    body: `Hi {name},

Thank you for your event request #{number} for your {eventType} on {date} ({time}, {guests}).

We've reviewed your request and would be happy to host your event. To confirm your booking and hold the date, please send the non-refundable deposit by e-transfer to info@laverandaresto.com.

Let us know if you'd like to proceed, or if you have any questions.

${signature}`,
  },
  {
    name: 'Need more details',
    body: `Hi {name},

Thank you for your event request #{number} for your {eventType} on {date}.

Before we can prepare your quotation, we need a few more details:
-
-

Feel free to reply to this email or call us.

${signature}`,
  },
  {
    name: 'Date not available',
    body: `Hi {name},

Thank you for your interest in hosting your {eventType} at La Veranda.

Unfortunately, we are not available on {date}. If your date is flexible, we'd be happy to suggest other dates that work for your event.

${signature}`,
  },
  {
    name: 'Booking confirmed',
    body: `Hi {name},

We've received your deposit, and your {eventType} on {date} ({time}, {guests}) is confirmed.

We'll be in touch closer to the date to go over the final details. If anything changes in the meantime, just reply to this email.

${signature}`,
  },
]
