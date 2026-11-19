'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

export type CarouselPhoto = { id: number | string; url: string; alt: string }

const AUTOPLAY_MS = 5000

// Photo strip like the old Events page: 4 photos across (3 on tablets, 2 on phones), moves
// one photo every 5 seconds and wraps around at the end. It can also be swiped/scrolled, or
// moved with the arrows and dots. Autoplay pauses while hovered or focused, stops for good
// once the visitor moves it themselves, and is off for people who prefer reduced motion.
export function PhotoCarousel({ photos, label }: { photos: CarouselPhoto[]; label: string }) {
  const track = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)
  const [positions, setPositions] = useState(1)
  const [paused, setPaused] = useState(false)
  const [stopped, setStopped] = useState(false)

  // How far one photo moves, and how many start positions exist (photos minus visible + 1).
  const measure = useCallback(() => {
    const el = track.current
    const first = el?.children[0] as HTMLElement | undefined
    if (!el || !first) return { step: 1, count: 1 }
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const step = first.offsetWidth + gap
    const visible = Math.round((el.clientWidth + gap) / step)
    return { step, count: Math.max(1, photos.length - visible + 1) }
  }, [photos.length])

  const go = useCallback(
    (to: number) => {
      const el = track.current
      if (!el) return
      const { step, count } = measure()
      const next = ((to % count) + count) % count
      el.scrollTo({ left: next * step, behavior: 'smooth' })
    },
    [measure],
  )

  // Keep the dots in sync with wherever the strip is (arrows, swipes, trackpads).
  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const { step, count } = measure()
        setPositions(count)
        setIndex(Math.min(count - 1, Math.round(el.scrollLeft / step)))
      })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [measure])

  useEffect(() => {
    if (paused || stopped || positions < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [index, paused, stopped, positions, go])

  const move = (to: number) => {
    setStopped(true)
    go(to)
  }

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={() => setStopped(true)}
      onWheel={(e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) setStopped(true)
      }}
    >
      <ul ref={track} className="carousel-track">
        {photos.map((photo) => (
          <li key={photo.id}>
            <Image
              src={photo.url}
              alt={photo.alt}
              width={600}
              height={600}
              sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 300px"
            />
          </li>
        ))}
      </ul>

      {positions > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-prev"
            aria-label="Previous photos"
            onClick={() => move(index - 1)}
          >
            <FaChevronLeft />
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-next"
            aria-label="Next photos"
            onClick={() => move(index + 1)}
          >
            <FaChevronRight />
          </button>
          <div className="carousel-dots">
            {Array.from({ length: positions }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index || undefined}
                onClick={() => move(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
