import logoDark from '@/assets/logo-dark.png'

// La Veranda logo on the admin login screen (the admin is light mode only).
export function Logo() {
  return (
    <div className="lv-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoDark.src} alt="La Veranda" />
      <p>Restaurant &amp; Events Admin</p>
    </div>
  )
}

// Small mark Payload shows in a few places: the real logo, never a cut-off circle.
export function Icon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logoDark.src} alt="La Veranda" className="lv-icon" />
}
