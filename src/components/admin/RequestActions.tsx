'use client'

export type Status = 'pending' | 'approved' | 'declined' | 'cancelled'

export const ACTIONS: Record<
  Status,
  { to: Status; label: string; confirm: string; tone: string }[]
> = {
  pending: [
    {
      to: 'approved',
      label: 'Approve',
      tone: 'approve',
      confirm:
        'Approve this request? It will be added to the Google Calendar. (The customer is not emailed automatically; reply to them yourself.)',
    },
    {
      to: 'declined',
      label: 'Decline',
      tone: 'decline',
      confirm: 'Decline this request? This can’t be undone.',
    },
  ],
  approved: [
    {
      to: 'cancelled',
      label: 'Cancel event',
      tone: 'decline',
      confirm: 'Cancel this approved event? It will be removed from the Google Calendar.',
    },
  ],
  declined: [],
  cancelled: [],
}

// Calls one of the request's admin endpoints, then reloads the page so everything updates.
export async function requestAction(id: number | string, path: string, body?: object) {
  const res = await fetch(`/api/event-requests/${id}/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const result = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(result.error || 'Something went wrong.')
  window.location.reload()
}
