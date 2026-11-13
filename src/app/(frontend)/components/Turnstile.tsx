'use client'

import Script from 'next/script'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      reset: (id?: string) => void
    }
  }
}

export type TurnstileHandle = { reset: () => void }

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// Cloudflare Turnstile spam check. Renders nothing when no site key is configured.
// Puts the token in a hidden "cf-turnstile-response" field of the surrounding form.
export const Turnstile = forwardRef<TurnstileHandle, { theme?: 'dark' | 'light' }>(
  function Turnstile({ theme = 'dark' }, ref) {
    const box = useRef<HTMLDivElement>(null)
    const widget = useRef<string | null>(null)
    const [loaded, setLoaded] = useState(
      () => typeof window !== 'undefined' && Boolean(window.turnstile),
    )

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widget.current) window.turnstile?.reset(widget.current)
      },
    }))

    useEffect(() => {
      if (!SITE_KEY || !loaded || !box.current || widget.current || !window.turnstile) return
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        theme,
        'response-field-name': 'cf-turnstile-response',
      })
    }, [loaded, theme])

    if (!SITE_KEY) return null
    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setLoaded(true)}
        />
        <div ref={box} className="turnstile" />
      </>
    )
  },
)
