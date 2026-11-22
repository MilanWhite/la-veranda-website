import type { Metadata } from 'next'

import { MenuPage } from '../components/MenuPage'

export const metadata: Metadata = {
  alternates: { canonical: '/brunch-menu' },
  title: 'Brunch Menu',
  description:
    'Benedicts, skillets, shakshukas, pancakes, focaccia, pizza and brunch cocktails at La Veranda in Woodbridge.',
}

export default function BrunchMenuPage() {
  return <MenuPage slug="brunch" otherMenu={{ label: 'View Dinner Menu', href: '/menu' }} />
}
