'use client'

import Link from 'next/link'
import { useEffect } from 'react'

// Shown inside the site layout when a page fails to render.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="section status-page">
      <div className="container narrow center">
        <p className="eyebrow eyebrow-accent">Something went wrong</p>
        <h1>We’re Sorry</h1>
        <p className="lead">
          This page couldn’t be loaded. Please try again, or contact us if the problem continues.
        </p>
        <div className="button-row button-row-center">
          <button type="button" className="button-solid" onClick={reset}>
            Try Again
          </button>
          <Link href="/" className="button">
            Home
          </Link>
          <Link href="/contact" className="button">
            Contact
          </Link>
        </div>
      </div>
    </section>
  )
}
