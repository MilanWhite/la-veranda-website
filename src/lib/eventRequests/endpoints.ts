import type { Endpoint, PayloadRequest } from 'payload'

import type { EventRequest } from '../../payload-types'
import { sendCustomerReply, sendRequestEmails } from './emails'
import { pdfFilename, renderBookingPdf } from './pdf'

// Admin-only actions used by the buttons on a request's Overview tab.

const json = (body: unknown, status = 200) => Response.json(body, { status })

async function load(req: PayloadRequest) {
  if (!req.user) return { error: json({ error: 'Please sign in.' }, 401) }
  const id = req.routeParams?.id as string
  try {
    const doc = await req.payload.findByID({ collection: 'event-requests', id, depth: 0, req })
    return { doc: doc as EventRequest }
  } catch {
    return { error: json({ error: 'Request not found.' }, 404) }
  }
}

const message_ = (error: unknown) => (error as Error).message || 'Something went wrong.'

export const eventRequestEndpoints: Endpoint[] = [
  {
    // Approve / decline / cancel
    path: '/:id/status',
    method: 'post',
    handler: async (req) => {
      const { doc, error } = await load(req)
      if (error) return error
      const body = (req.json ? await req.json() : {}) as { status?: EventRequest['status'] }
      if (!body.status) return json({ error: 'Missing status.' }, 400)
      // Two people (or a double click) changing the same request: tell the second one.
      if (body.status === doc!.status) {
        return json({ error: `This request is already ${body.status}. Reload to see it.` }, 400)
      }
      try {
        const updated = await req.payload.update({
          collection: 'event-requests',
          id: doc!.id,
          data: { status: body.status },
          req,
        })
        return json({ ok: true, status: updated.status, calendar: updated.calendar })
      } catch (e) {
        return json({ error: message_(e) }, 400)
      }
    },
  },
  {
    // Try the Google Calendar update again (after a failure, or after fixing the setup)
    path: '/:id/calendar-sync',
    method: 'post',
    handler: async (req) => {
      const { doc, error } = await load(req)
      if (error) return error
      if (doc!.status !== 'approved' && doc!.status !== 'cancelled') {
        return json({ error: 'Only approved or cancelled requests are synced.' }, 400)
      }
      const updated = await req.payload.update({
        collection: 'event-requests',
        id: doc!.id,
        data: {},
        req,
        context: { forceCalendarSync: true },
      })
      return json({ ok: true, calendar: updated.calendar })
    },
  },
  {
    // Send the confirmation + notification emails again
    path: '/:id/resend-emails',
    method: 'post',
    handler: async (req) => {
      const { doc, error } = await load(req)
      if (error) return error
      const result = await sendRequestEmails(req.payload, doc!)
      return json({ ok: true, ...result })
    },
  },
  {
    // Reply to the customer from the admin, in the same email conversation as their
    // confirmation (see sendCustomerReply)
    path: '/:id/reply',
    method: 'post',
    handler: async (req) => {
      const { doc, error } = await load(req)
      if (error) return error
      const body = (req.json ? await req.json() : {}) as { message?: string; attachPdf?: boolean }
      const message = String(body.message ?? '')
        .replace(/\r\n?/g, '\n')
        .trim()
      if (!message) return json({ error: 'Please write a message.' }, 400)
      if (message.length > 10_000) return json({ error: 'The message is too long.' }, 400)
      try {
        await sendCustomerReply(req.payload, doc!, {
          message,
          attachPdf: Boolean(body.attachPdf),
          sentBy: req.user?.email,
        })
        return json({ ok: true })
      } catch (e) {
        return json({ error: message_(e) }, 500)
      }
    },
  },
  {
    // Download the booking summary PDF
    path: '/:id/pdf',
    method: 'get',
    handler: async (req) => {
      const { doc, error } = await load(req)
      if (error) return error
      const pdf = await renderBookingPdf(doc!)
      return new Response(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${pdfFilename(doc!)}"`,
          'Cache-Control': 'no-store',
        },
      })
    },
  },
]
