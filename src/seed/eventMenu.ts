import type { EventMenu } from '../payload-types'

// Copied from the old site's Event Contract form and the 2023 Group Menu PDF
// (upcharges are per person, "pp"). The owner still has to confirm these; afterwards they
// are edited in the admin under Events → Event Menu & Form.

type Section = NonNullable<EventMenu['sections']>[number]
const options = (list: [string, number?][]) =>
  list.map(([name, upcharge = 0]) => ({ name, upcharge, available: true }))

const sections: Section[] = [
  {
    key: 'starters',
    title: 'Starters',
    description: 'Please select exactly 4 items.',
    selection: 'multiple',
    min: 4,
    max: 4,
    options: options([
      ['Antipasto Deluxe'],
      ['Crispy Cheese Rolls'],
      ['Polenta Fries'],
      ['Ravioli Fritti', 1],
      ['Calamari Fritti', 3],
      ['Grilled Zucchini Roll Ups', 1],
      ['Spiducci Skewers', 3],
      ['Bruschetta Classic'],
      ['Breaded Cauliflower'],
    ]),
  },
  {
    key: 'penne',
    title: 'Penne Sauce',
    description: 'Choose a sauce for the penne.',
    selection: 'single',
    min: 1,
    max: 1,
    options: options([['Pomodoro'], ['Vodka'], ['White'], ['Rosé']]),
    textOption: {
      label: 'Risotto Type',
      upcharge: 5,
      placeholder: 'e.g., Mushroom, Seafood',
    },
  },
  {
    key: 'mains',
    title: 'Main Dish',
    description: 'Choose the main dishes your guests can pick from.',
    selection: 'multiple',
    min: 1,
    allowToBeDecided: true,
    priceTag: 'adult',
    options: options([
      ['Chicken Supreme'],
      ['Grilled Steak', 15],
      ['Veal Chop', 12],
      ['Braised Beef', 8],
      ['Grilled Salmon', 8],
      ['Grilled Chicken & Lamb Chop Combo', 15],
      ['Surf and Turf', 20],
    ]),
  },
  {
    key: 'kids',
    title: 'Kids Menu',
    description: 'Served with fries.',
    selection: 'multiple',
    min: 0,
    forKids: true,
    priceTag: 'kids',
    options: options([['Chicken Fingers with Fries'], ['Cheese Pizza with Fries']]),
  },
]

export const eventMenuSeed: Omit<EventMenu, 'id' | 'createdAt' | 'updatedAt'> = {
  adultPrice: 73,
  kidPrice: 30,
  spaceFeePercent: 18,
  includedHours: 4,
  extraHourPrice: 10,
  timeLimitNote: '(excluding Open Bar)',
  extraNotes: [
    {
      title: 'Gratuity Policy',
      position: 'afterFee',
      text: 'Gratuity is not mandatory. Any optional gratuity may be paid directly to our service staff.',
    },
    {
      title: 'Deposit',
      position: 'end',
      text: 'A non-refundable deposit must be made to hold the date. An e-transfer can be sent to info@laverandaresto.com.',
    },
  ],
  earliestStart: '09:00',
  latestStart: '22:00',
  startStepMinutes: 30,
  eventTypes: [
    'Corporate Events',
    'Weddings',
    'Confirmations',
    'Engagements',
    'Communions',
    'Bridal Showers',
    "Sweet 16's",
    'Baptisms',
    'Birthdays',
  ].map((name) => ({ name })),
  sections,
  extras: [
    { name: 'Mimosa Bowl', price: 125, unit: 'event', available: true },
    { name: 'Fruit Tray', price: 75, unit: 'event', available: true },
    { name: 'Pesce Misto Platter', price: 45, unit: 'event', available: true },
    { name: 'Open Bar', price: 45, unit: 'adult', available: true },
  ],
  choices: [
    {
      key: 'wine',
      label: 'Wine Service',
      options: [{ label: 'Served by waiter' }, { label: 'Kept on table' }],
    },
    {
      key: 'alcohol',
      label: 'Alcohol',
      options: [{ label: 'Open Bar' }, { label: 'Pay per consumption' }],
    },
  ],
}
