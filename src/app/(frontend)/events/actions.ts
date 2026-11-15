'use server'

import { getPayload } from 'payload'

import { sendRequestEmails } from '@/lib/eventRequests/emails'
import { type FieldErrors, validateEventRequest } from '@/lib/eventRequests/validate'
import { verifyTurnstile } from '@/lib/turnstile'
import type { EventRequest } from '@/payload-types'
import config from '@/payload.config'
import { clientIp, isRateLimited } from '../lib/rateLimit'

export type EventRequestState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: FieldErrors
  requestNumber?: number
}

// Event request form on /events. Order matters: check → save as Pending → then email.
// The request is never lost because of an email problem.
export async function submitEventRequest(
  _prev: EventRequestState,
  form: FormData,
): Promise<EventRequestState> {
  // Honeypot: real visitors never fill this hidden field.
  if (String(form.get('website') ?? '')) return { status: 'success' }

  // Spam limits per visitor: up to 15 tries in 10 minutes (so fixing mistakes never locks
  // anyone out), and at most 3 requests actually saved in 10 minutes (checked below).
  const ip = await clientIp()
  if (isRateLimited(`event-try:${ip}`, 15, 10 * 60 * 1000)) {
    return {
      status: 'error',
      message: 'Too many requests in a short time. Please try again later, or call us.',
    }
  }
  if (!(await verifyTurnstile(String(form.get('cf-turnstile-response') ?? ''), ip))) {
    return { status: 'error', message: 'Please complete the spam check and try again.' }
  }

  const payload = await getPayload({ config })
  const menu = await payload.findGlobal({ slug: 'event-menu', depth: 0 })
  const { errors, data } = validateEventRequest(form, menu)
  if (Object.keys(errors).length) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors }
  }

  if (isRateLimited(`event:${ip}`, 3, 10 * 60 * 1000)) {
    return {
      status: 'error',
      message: 'Too many requests in a short time. Please try again later, or call us.',
    }
  }

  let request: EventRequest
  try {
    request = await payload.create({
      collection: 'event-requests',
      data: { ...data, status: 'pending' },
      overrideAccess: true,
    })
  } catch (error) {
    console.error('Event request: could not save', error)
    return {
      status: 'error',
      message: 'Sorry, your request could not be sent. Please email or call us instead.',
    }
  }

  try {
    await sendRequestEmails(payload, request)
  } catch (error) {
    // Saved already; staff can resend the emails from the admin.
    console.error('Event request: emails failed', error)
  }

  return { status: 'success', requestNumber: request.requestNumber ?? undefined }
}
