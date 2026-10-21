import { notFound } from 'next/navigation'

// Any URL without a page shows the branded 404 (not-found.tsx) inside the site layout.
// /admin and /api are more specific routes, so they are never caught here.
export default function CatchAll() {
  notFound()
}
