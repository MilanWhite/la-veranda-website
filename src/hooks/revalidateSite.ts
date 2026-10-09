import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

// Public pages read from the database, so any content change clears the whole site's
// cached pages. Outside a Next.js request (e.g. the seed script) there is nothing to
// revalidate and revalidatePath throws, so errors are ignored.
function revalidateSite() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // not running inside Next.js
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateSite()
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidateSite()
  return doc
}
