'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Marks a contact message as handled (or back to unanswered) and refreshes the inbox.
export function MessageHandledButton({ id, handled }: { id: number; handled: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    const res = await fetch(`/api/contact-messages/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: !handled }),
    })
    if (!res.ok) window.alert('Could not update the message. Please try again.')
    setBusy(false)
    router.refresh()
  }

  return (
    <button type="button" className="lv-act" disabled={busy} onClick={toggle}>
      {busy ? 'Saving…' : handled ? 'Mark as unanswered' : 'Mark as handled'}
    </button>
  )
}
