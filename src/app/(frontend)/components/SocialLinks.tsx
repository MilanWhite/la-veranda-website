import { FaFacebookF, FaInstagram } from 'react-icons/fa'

import type { SiteSetting } from '@/payload-types'

const icons = { facebook: FaFacebookF, instagram: FaInstagram }

// Shows an icon when the platform name matches one above, otherwise the name as text.
export function SocialLinks({
  links,
  className,
}: {
  links: SiteSetting['socialLinks']
  className?: string
}) {
  return (
    <div className={className}>
      {links?.map((link) => {
        const Icon = icons[link.platform.toLowerCase() as keyof typeof icons]
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.platform}
          >
            {Icon ? <Icon /> : link.platform}
          </a>
        )
      })}
    </div>
  )
}
