// Entrance animations, Elementor-style: each part of a page plays a short fade-and-slide
// once, as soon as it scrolls into view (ScrollReveal adds the classes; globals.css has the
// animations). One list, used both to hide the parts before they're shown and to find them.

export const REVEAL = {
  // Rise from below
  up: [
    // Not the hero/banner eyebrow: it animates in with its heading on load (globals.css).
    // Waiting for the script made it pop in late on phones.
    '.container:not(.hero-content, .page-banner-content) > .eyebrow',
    '.section-title',
    '.container > .lead',
    '.container > p.center',
    '.container > .button-row',
    '.check-list',
    '.dish-grid > *',
    '.menu-block',
    '.card',
    '.course-list > li',
    '.highlight-grid > *',
    '.visit-col',
    '.contact-grid > *',
    '.reservation-grid > *',
    '.form-container > form',
    '.gallery-tabs',
    '.masonry-column > li',
    '.carousel',
    '.map-wide',
    '.empty-state',
    '.cta-content > *',
  ],
  // Slide in from the left / right: side-by-side pairs come from their own side
  // (rows marked "reverse" have the photo on the right)
  left: [
    '.feature-grid > .feature:nth-child(odd)',
    '.feature-row:not(.feature-row-reverse) > .feature-row-image',
    '.feature-row-reverse > .feature-row-text',
  ],
  right: [
    '.feature-grid > .feature:nth-child(even)',
    '.feature-row:not(.feature-row-reverse) > .feature-row-text',
    '.feature-row-reverse > .feature-row-image',
  ],
  // Divider lines draw outwards from the centre
  line: ['.divider'],
} as const

export type RevealKind = keyof typeof REVEAL

const allTargets = Object.values(REVEAL).flat().join(', ')

// Hides the parts until they're revealed (the page is sent with html.reveal-on, so nothing
// flashes before sliding in), only for people who haven't asked for reduced motion.
// Safety net: if ScrollReveal hasn't started within 3 seconds (slow or failed script; it adds
// html.reveal-js), the parts are simply shown.
export const revealHideCss = `@media (prefers-reduced-motion: no-preference) {
  html.reveal-on :is(${allTargets}):not(.is-in) { opacity: 0; }
  html.reveal-on:not(.reveal-js) :is(${allTargets}):not(.is-in) {
    animation: reveal-fallback 0s 3s forwards;
  }
  @keyframes reveal-fallback { to { opacity: 1; } }
}`
