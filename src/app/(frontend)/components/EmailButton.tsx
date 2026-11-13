'use client'

import { useEffect, useRef, useState } from 'react'
import { FaTimes } from 'react-icons/fa'

// "Email Us" that always works: a plain mailto: link does nothing on computers without a
// default email app, so this opens a small window with the address, a copy button and
// links to write the email in Gmail, Outlook or the computer's email app.
export function EmailButton({
  email,
  subject,
  label = 'Email Us',
  className = 'button',
}: {
  email: string
  subject?: string
  label?: string
  className?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const su = subject ? encodeURIComponent(subject) : ''
  const to = encodeURIComponent(email)
  const links = [
    {
      label: 'Gmail',
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}${su ? `&su=${su}` : ''}`,
    },
    {
      label: 'Outlook',
      href: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}${su ? `&subject=${su}` : ''}`,
    },
  ]

  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={dialog}
        className="email-dialog"
        aria-label="Email La Veranda"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close()
        }}
      >
        <div className="email-dialog-body">
          <button
            type="button"
            className="email-dialog-close"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
          >
            <FaTimes />
          </button>
          <p className="eyebrow eyebrow-accent">Email us</p>
          <p className="email-dialog-address">{email}</p>
          <button
            type="button"
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(email)
                setCopied(true)
              } catch {
                // clipboard blocked: the address is visible to copy by hand
              }
            }}
          >
            {copied ? 'Copied!' : 'Copy address'}
          </button>
          <p className="email-dialog-or">or write your email in</p>
          <div className="button-row button-row-center">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="button-solid"
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label}
              </a>
            ))}
            <a href={`mailto:${email}${su ? `?subject=${su}` : ''}`} className="button">
              Email app
            </a>
          </div>
        </div>
      </dialog>
    </>
  )
}
