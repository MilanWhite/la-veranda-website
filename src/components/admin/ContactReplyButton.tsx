'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

// "Reply" on a contact message: write the answer in a window and send it from the admin.
// The website emails it as the restaurant with the visitor's original message quoted
// underneath, so they see what they're being answered about.
export function ContactReplyButton({
  id,
  firstName,
  email,
  original,
}: {
  id: number
  firstName: string
  email: string
  original: { header: string; text: string }
}) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openDialog = () => {
    setDraft(`Hi ${firstName},\n\n`)
    setError(null)
    dialog.current?.showModal()
  }

  const send = async () => {
    if (!draft.trim()) return setError('Please write a message.')
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/contact-messages/${id}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: draft }),
      })
      const result = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(result.error || 'Something went wrong.')
      dialog.current?.close()
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button type="button" className="lv-act" onClick={openDialog}>
        Reply
      </button>
      <dialog ref={dialog} className="lv-reply-dialog" aria-label={`Reply to ${firstName}`}>
        <div className="lv-reply-dialog-head">
          <h2>Reply to {firstName}</h2>
          <p>
            To <strong>{email}</strong> · Subject “Re: Your message to La Veranda”
          </p>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          aria-label="Message"
        />
        <div className="lv-reply-quote">
          <p>{original.header}</p>
          <blockquote>{original.text}</blockquote>
        </div>
        <p className="lv-reply-hint">
          Sent from the restaurant’s email with their message quoted underneath, as shown. A copy is
          kept in its Sent mail and the message is marked handled.
        </p>
        {error && (
          <p className="lv-msg lv-msg-error" role="alert">
            {error}
          </p>
        )}
        <div className="lv-reply-buttons">
          <button
            type="button"
            className="lv-act"
            onClick={() => dialog.current?.close()}
            disabled={sending}
          >
            Cancel
          </button>
          <button type="button" className="lv-act lv-act-approve" onClick={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </dialog>
    </>
  )
}
