'use client'

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa'

export type GalleryCategory = 'food' | 'events' | 'restaurant'
export type GalleryImage = {
  url: string
  alt: string
  width: number
  height: number
  category: GalleryCategory
}

const tabs: { value: 'all' | GalleryCategory; label: string }[] = [
  { value: 'all', label: 'View All' },
  { value: 'food', label: 'Food' },
  { value: 'events', label: 'Events' },
  { value: 'restaurant', label: 'Restaurant' },
]

// 3 columns, or 2 on phones. The server always renders 3; phones switch after loading.
const PHONE = '(max-width: 699px)'
function useColumnCount() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(PHONE)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => (window.matchMedia(PHONE).matches ? 2 : 3),
    () => 3,
  )
}

// Masonry like the old site: each photo goes into the currently shortest column, so the
// first photos stay along the top row and different shapes form a collage. CSS then
// stretches the shorter columns slightly so all of them end on the same line.
function toColumns(images: GalleryImage[], count: number) {
  // Height of a photo in "column widths", plus the gap below it (~20px of a ~380px column).
  const h = (i: number) => images[i].height / images[i].width + 0.05
  const cols: number[][] = Array.from({ length: count }, () => [])
  const heights = new Array(count).fill(0)
  images.forEach((_, i) => {
    const c = heights.indexOf(Math.min(...heights))
    cols[c].push(i)
    heights[c] += h(i)
  })

  // Then even out the columns: move or swap photos between columns while that reduces the
  // gap between the tallest and shortest column (less stretching needed at the bottom).
  const spread = () => Math.max(...heights) - Math.min(...heights)
  for (let pass = 0; pass < 50; pass++) {
    let improved = false
    for (let a = 0; a < count && !improved; a++) {
      for (let b = 0; b < count && !improved; b++) {
        if (a === b) continue
        for (const i of cols[a]) {
          // move i: a → b
          const before = spread()
          heights[a] -= h(i)
          heights[b] += h(i)
          if (spread() < before - 1e-6 && cols[a].length > 1) {
            cols[a] = cols[a].filter((x) => x !== i)
            cols[b] = [...cols[b], i].sort((x, y) => x - y)
            improved = true
            break
          }
          heights[a] += h(i)
          heights[b] -= h(i)
          // swap i ↔ j
          for (const j of cols[b]) {
            const d = h(i) - h(j)
            heights[a] -= d
            heights[b] += d
            if (spread() < before - 1e-6) {
              cols[a] = cols[a].map((x) => (x === i ? j : x)).sort((x, y) => x - y)
              cols[b] = cols[b].map((x) => (x === j ? i : x)).sort((x, y) => x - y)
              improved = true
              break
            }
            heights[a] += d
            heights[b] -= d
          }
          if (improved) break
        }
      }
    }
    if (!improved) break
  }
  return {
    columns: cols.map((c) => c.map((index) => ({ img: images[index], index }))),
    // how much the shortest column must stretch to reach the tallest (0 = already flat)
    stretch: Math.min(...heights) > 0 ? spread() / Math.min(...heights) : Infinity,
  }
}

// Filter tabs + photo collage; clicking a photo opens it full screen.
// Keyboard: ←/→ move between tabs; in the viewer Esc closes and ←/→ browse.
export function GalleryGrid({ images: allImages }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<'all' | GalleryCategory>('all')
  const [open, setOpen] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const images = filter === 'all' ? allImages : allImages.filter((i) => i.category === filter)
  const visibleTabs = tabs.filter(
    (t) => t.value === 'all' || allImages.some((i) => i.category === t.value),
  )

  // Slide the teal underline under the active tab (and keep it there on resize).
  useLayoutEffect(() => {
    const place = () => {
      const tab = tabRefs.current[filter]
      if (tab) setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [filter])

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open !== null && !dialog.open) dialog.showModal()
    if (open === null && dialog.open) {
      dialog.close()
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step])

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next =
      visibleTabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + visibleTabs.length) % visibleTabs.length]
    setFilter(next.value)
    tabRefs.current[next.value]?.focus()
  }

  // Always 3 columns like the old site (2 on phones); only a category with fewer photos
  // than that uses fewer.
  const columnCount = Math.min(useColumnCount(), Math.max(1, images.length))
  const current = open === null ? null : images[open]
  // End on a flat line only when that crops photos a little; otherwise (e.g. a category with
  // a few tall photos) the columns simply end at different heights, like the old site.
  const layout = toColumns(images, columnCount)
  const flat = layout.stretch <= 0.15

  return (
    <>
      {visibleTabs.length > 2 && (
        <div className="gallery-tabs" role="tablist" aria-label="Filter photos">
          {visibleTabs.map((tab, i) => (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[tab.value] = el
              }}
              type="button"
              role="tab"
              id={`gallery-tab-${tab.value}`}
              aria-selected={filter === tab.value}
              aria-controls="gallery-panel"
              tabIndex={filter === tab.value ? 0 : -1}
              className={filter === tab.value ? 'active' : undefined}
              onClick={() => setFilter(tab.value)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {tab.label}
            </button>
          ))}
          <span
            className="gallery-tabs-indicator"
            aria-hidden
            style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          />
        </div>
      )}

      <div
        id="gallery-panel"
        role="tabpanel"
        aria-labelledby={`gallery-tab-${filter}`}
        className={flat ? 'masonry' : 'masonry masonry-ragged'}
      >
        {layout.columns.map((column, c) => (
          <ul key={`${filter}-${c}`} className="masonry-column">
            {column.map(({ img, index }) => (
              <li key={img.url}>
                <button
                  type="button"
                  className="gallery-thumb"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget
                    setOpen(index)
                  }}
                  aria-label={`Open photo: ${img.alt}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    sizes="(max-width: 699px) 50vw, 33vw"
                  />
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label="Photo viewer"
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        {current && (
          <>
            <figure>
              <Image
                src={current.url}
                alt={current.alt}
                width={current.width}
                height={current.height}
                sizes="90vw"
              />
              <figcaption>
                {current.alt}{' '}
                <span>
                  ({(open ?? 0) + 1} / {images.length})
                </span>
              </figcaption>
            </figure>
            <button type="button" className="lightbox-close" onClick={close} aria-label="Close">
              <FaTimes />
            </button>
            <button
              type="button"
              className="lightbox-prev"
              onClick={() => step(-1)}
              aria-label="Previous photo"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              className="lightbox-next"
              onClick={() => step(1)}
              aria-label="Next photo"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </dialog>
    </>
  )
}
