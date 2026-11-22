import type { Metadata } from 'next'

import { MenuPage } from '../components/MenuPage'

export const metadata: Metadata = {
  alternates: { canonical: '/menu' },
  title: 'Dinner Menu',
  description:
    'Pasta made in-house, dry-aged steaks, pizzas, salads and antipasto at La Veranda in Woodbridge.',
}

export default function DinnerMenuPage() {
  return <MenuPage slug="dinner" otherMenu={{ label: 'View Brunch Menu', href: '/brunch-menu' }} />
}
