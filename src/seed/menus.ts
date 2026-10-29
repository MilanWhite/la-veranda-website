import type { Menu } from '../payload-types'

// Placeholder menus taken from laverandaresto.com (Nov 2026) and the restaurant's own
// BrunchMenuMay2025.pdf, with spelling fixed. The owner still has to confirm items and
// prices; after that they are edited in the admin, not here.

type Section = NonNullable<Menu['sections']>[number]
type Item = NonNullable<Section['items']>[number]

const item = (
  name: string,
  price: number | null,
  description?: string,
  extra: Partial<Item> = {},
): Item => ({ name, price, description, available: true, ...extra })

const section = (title: string, items: Item[], extra: Partial<Section> = {}): Section => ({
  title,
  items,
  ...extra,
})

export const dinnerMenu: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'Dinner Menu',
  slug: 'dinner',
  sections: [
    section('Dips', [
      item('Hummus', 9, 'Chickpea, roasted garlic, smoked paprika and lemon', {
        featured: 'recommendation',
      }),
      item('Babaghanouj', 10, 'Roasted eggplant, sesame and lemon'),
      item('Labneh', 10, 'Pressed yogurt'),
    ]),
    section('Bistecca', [
      item(
        'Dry Aged "AAA" Striploin',
        42,
        'Served with crispy Parmesan potato, grilled thick-cut tomato and garlic beans',
        { priceLabel: '10oz' },
      ),
      item(
        'Dry Aged "AAA" Ribeye',
        55,
        'Served with crispy Parmesan potato, grilled thick-cut tomato and garlic beans',
        { priceLabel: '12oz' },
      ),
    ]),
    section(
      'Pasta',
      [
        item(
          'Pappardelle Ai Funghi',
          18,
          'Pappardelle / wild mushrooms / garlic / smoked bread crumbs / olive oil',
        ),
        item(
          'Ravioli Di Coniglio',
          22,
          'Braised and pulled rabbit stuffed ravioli / leeks / butter sauce',
        ),
        item('Gnocchi E Ragu Di Agnello', 20, 'Potato gnocchi / stewed lamb and tomato', {
          featured: 'recommendation',
        }),
        item(
          'Spaghetti E Aragosta',
          24,
          'Squid ink spaghetti chitarra / poached lobster / saffron / zucchini / tomato / white wine',
        ),
        item(
          'Fettuccine Con Salsiccia E Piselli',
          22,
          'Fettuccine / sweet peas / house-made sausage / onion / mascarpone',
        ),
      ],
      { note: 'All pasta is made in-house' },
    ),
    section('Carne', [
      item(
        'Blue Red Burger',
        21,
        'Grilled to mouthwatering perfection and finished with spicy roasted red pepper, fresh tomato, arugula and blue cheese sauce',
      ),
      item(
        'Chicken Skewers (Tawouk Platter)',
        22,
        'Grilled chicken in a yogurt and chili marinade',
      ),
      item('Tenderloin Beef Skewers', 26, 'Grilled tenderloin marinated in special spices'),
      // The live site shows this item with no price, so it stays hidden until confirmed.
      item('House Speciality', null, 'Served with grilled vegetables and house salad', {
        available: false,
      }),
    ]),
    section(
      'Insalate',
      [
        item(
          'Caesar',
          14,
          'Romaine lettuce, shaved Grana Padano and pita croutons with our own dressing',
        ),
        item(
          'Fattoush',
          16,
          'Escarole, tomato, cucumber, sweet onion, house pickle, celery, spiced pita crisps and pomegranate sumac vinaigrette',
        ),
        item(
          'Tuscan',
          19,
          'Torn radicchio and kale, shaved fennel, roasted walnuts, prosecco pear and goat cheese with chestnut honey and fig dressing',
        ),
        item(
          'Winter Caprese',
          21,
          'Imported bufala mozzarella, roasted tomato, pickled beets, orange, pistachio and lentils with aged balsamic',
        ),
        item(
          'Tabouleh',
          14,
          'Chopped parsley, mint, bulgur, tomato, sweet onion, radish and avocado with spiced lemon oil',
        ),
        item(
          'Siciliana',
          18,
          'Wild arugula, orange, fennel, pistachio, dried olive, celery and caperberry with chili-prosecco dressing',
        ),
      ],
      { addOns: [{ label: 'Add grilled chicken breast or shrimp', price: 8 }] },
    ),
    section('Main', [
      item(
        'Grilled Organic Salmon Filet',
        24,
        'Wilted kale and mixed mushroom salad, warm pancetta-truffle dressing',
        { featured: 'recommendation' },
      ),
      item(
        'Anatra',
        28,
        'Pan-seared duck breast / chanterelle mushroom / charred grapes / Belgian endive',
      ),
      item('Grigliata Di Pesce Mista', 25, "A daily offering of the market's freshest selection"),
      item(
        'Maiale',
        26,
        'Crispy and tender pork belly / sweet corn polenta / roasted apples and thyme',
      ),
      item('Manzo', 42, 'Grilled Black Angus ribeye / mushroom conserva / tomato salad'),
      item(
        'Pollo',
        24,
        'Pan-roasted chicken supreme / eggplant / zucchini / pepper / onion / celery / caper berries / pan jus',
      ),
      item(
        'Spigola',
        36,
        'Grilled whole European sea bass / stewed fregola / leeks / rapini / cauliflower / clams',
        { featured: 'recommendation' },
      ),
    ]),
    section('Pizzas', [
      item('Pepperoni Pizza', 16, 'Tomato sauce, cheese and pepperoni', { featured: 'popular' }),
      item('Margherita', 16, 'Tomato sauce, cheese and basil'),
      item(
        'Suicide Pizza',
        20,
        'Soppressata, spicy Calabrese sausage, chili flakes, black olives, roasted red peppers, mozzarella and tomato sauce',
      ),
      item('Calabrese', 18, 'Tomato sauce, mozzarella, red peppers, hot salami and black olives'),
      item(
        'La Veranda Pizza',
        22,
        'Bocconcini, cherry tomato, prosciutto, arugula and Grana Padano. Red or white',
        { featured: 'popular' },
      ),
      item('Napoletana', 18, 'Tomato sauce, cheese, capers, black olives and anchovies'),
      item(
        'Mushroom Caramelized Onion',
        18,
        'Cheese, garlic, mushroom and caramelized onion. Red or white',
      ),
      item(
        'Zorba Style Vegetarian Pizza',
        17,
        'Mozzarella and feta, tomato sauce, red onion, diced tomatoes, Kalamata olives and fresh oregano',
      ),
      item('Mushroom Pizza', 16, 'White pizza with cheese, mushroom, parsley and olive oil'),
    ]),
    section('Antipasto', [
      item('Shared Board', 32, "Chef's selection of salumi and cheese with preserves and pickles"),
      item(
        'La Veranda Porchetta',
        16,
        'Slow-roasted pork shoulder / house-baked focaccia / caramelized onions / rapini / roasted garlic aioli',
        { featured: 'popular' },
      ),
      item(
        'Crispy Feta Cheese Rolls',
        12,
        'Spring rolls stuffed with feta, mozzarella and oregano',
      ),
      item('Warm Olives', 12, 'Marinated olives with garlic, herbs and citrus'),
      item(
        'Sardine Alla Griglia',
        12,
        'Tossed in parsley, garlic, lemon and chili on a cauliflower purée',
      ),
      item('Calamari Fritti', 18, 'Dusted with seasoned flour, served with smoked red pepper dip'),
      item(
        'Polenta Fries',
        12,
        'Our own polenta chips made with rosemary and Grana Padano, served with lemon dip',
      ),
      item(
        'Vegetarian Delight',
        19,
        "Middle Eastern flavours: four falafel balls, pickles, olives, hummus, babaghanouj and labneh with za'atar",
      ),
      item('Polipo Alla Griglia', 26, 'Grilled octopus / balsamic reduction / chickpea / arugula', {
        featured: 'popular',
      }),
      item(
        'Ravioli Fritti',
        14,
        'Deep-fried ravioli stuffed with spinach and ricotta, served with arrabbiata sauce',
      ),
    ]),
  ],
}

export const brunchMenu: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'Brunch Menu',
  slug: 'brunch',
  pdfLabel: 'Download Brunch Menu',
  sections: [
    section('Shareables', [
      item(
        'Brie Focaccia',
        18,
        'Freshly baked focaccia with a whole melted brie, served with pesto and jam',
      ),
      item(
        "Za'atar Focaccia",
        12,
        'Freshly baked focaccia with thyme, oregano, sesame seeds and olive oil, served with cucumber, olives and tomatoes',
        { addOns: [{ label: 'Add labneh', price: 3 }] },
      ),
      item('Warm Olives Board', 15, 'Served with labneh and focaccia'),
      item('Labneh Chili Jam', 15, 'Served with chili jam, pistachio and house-made focaccia'),
      item(
        'Burrata & Fig Salad',
        23,
        'Sun-dried tomatoes and arugula with pesto balsamic vinaigrette and a fig glaze',
      ),
      item(
        'Kale & Beets',
        17,
        'Shredded kale and beet, apple and cranberry with lemon pomegranate vinaigrette',
        { addOns: [{ label: 'Add chicken', price: 6 }] },
      ),
      item(
        'Mango Avocado Arugula Salad',
        22,
        'Arugula tossed with mango and avocado in a mango-lime vinaigrette',
      ),
      item(
        'Tabouleh',
        14,
        'Chopped parsley, mint, bulgur, tomato, sweet onion, radish and avocado with spiced lemon oil',
      ),
      item(
        'Siciliana',
        18,
        'Wild arugula, orange, fennel, pistachio, dried olive, celery and caperberry with chili-prosecco dressing',
      ),
    ]),
    section('Savouries', [
      item(
        'Double B',
        16,
        'Two eggs your way and bread with bacon, potatoes and a side of fresh fruit',
      ),
      item(
        'Avocado Toast',
        20,
        'Avocado over toasted sourdough with poached eggs, fresh fruit and potatoes',
      ),
      item('Steak & Eggs', null, 'With potatoes and chimichurri sauce', {
        variants: [
          { label: '8oz striploin', price: 36 },
          { label: '10oz ribeye', price: 45 },
        ],
      }),
    ]),
    section(
      'Benedicts',
      [
        item('Salmon', 22, 'Smoked salmon with hollandaise sauce'),
        item('Peameal Bacon', 18, 'With hollandaise sauce'),
        item(
          'Prosciutto Delight',
          20,
          'Sun-dried tomato paste, melted mozzarella and crispy prosciutto',
        ),
      ],
      {
        isSubgroup: true,
        description:
          'Served on an English muffin with poached eggs, a side of potatoes and fresh fruit',
      },
    ),
    section(
      'Skillets',
      [
        item('Brisket', 22, 'Brisket with sautéed peppers, mushrooms and onions'),
        item(
          'Italian',
          20,
          "Spicy 'nduja sausage, sun-dried tomatoes, onions, pesto, black olives and roasted red peppers",
        ),
        item(
          'Garden',
          19,
          'Mushrooms, onions, peppers and zucchini, finished with fresh basil pesto',
        ),
      ],
      { isSubgroup: true, description: 'Served with sunny-side-up eggs and crispy potatoes' },
    ),
    section(
      'Shakshukas',
      [
        item('Gnocchi', 22, 'Cheese gnocchi, onions, garlic, fresh basil and Parmesan'),
        item('Spicy Vodka', 22, 'Alla vodka sauce with Italian sausage and crispy bacon'),
        item('Feta Olives', 22, 'Served with fresh oregano'),
      ],
      {
        isSubgroup: true,
        description: 'Served with two eggs, tomato and red pepper ragù and house-made focaccia',
      },
    ),
    section('Sweets', [
      item(
        'Mixed Berries Pancakes',
        16,
        'With house-made mixed berry compote, whipped cream and maple syrup',
      ),
      item('Chocolate Chip Pancakes', 16, 'With whipped cream, Nutella and maple syrup'),
      item(
        'Waffle Stack',
        16,
        'Cinnamon waffle with fresh fruit, whipped cream, Nutella and maple syrup',
      ),
      item('Apple Waffle', 16, 'Cinnamon waffle with apple compote and vanilla ice cream'),
      item('Yogurt Parfait', 12, 'Greek yogurt with fresh fruit, honey and granola'),
    ]),
    section(
      'Pies',
      [
        item('Mediterranean', 16, 'Feta, tomatoes, black olives, oregano and parsley'),
        item('Spicy Calabrese', 16, 'Soppressata, spicy sausage, tomatoes and basil'),
      ],
      { addOns: [{ label: 'Add one egg', price: 2 }] },
    ),
    section(
      'Sandwiches',
      [
        item('B.E.L.T.', 18, 'Crispy bacon, eggs, lettuce and tomato topped with pesto mayo', {
          addOns: [{ label: 'Add chicken', price: 6 }],
        }),
        item('Brie & Prosciutto', 20, 'Melted brie, prosciutto, arugula and balsamic glaze'),
        item(
          'Grilled Veggie',
          16,
          'Zucchini, eggplant, sautéed onion, arugula, black olives, artichoke and pesto mayo',
        ),
      ],
      { description: 'Served on house-made bread' },
    ),
    section('Pizza', [
      item('Margherita', 16, 'Tomato sauce, mozzarella and fresh basil'),
      item(
        'Garden',
        17,
        'Tomato sauce, mozzarella, tomatoes, mushrooms, roasted red pepper, olives and onion',
      ),
      item('Pepperoni', 18, 'Tomato sauce, mozzarella and pepperoni'),
      item(
        'Mortadella',
        20,
        'Mortadella, creamy burrata, pistachio mascarpone spread and arugula drizzled with pesto',
      ),
      item(
        'La Diavola',
        21,
        "Tomato sauce, mozzarella, hot soppressata, spicy 'nduja sausage, roasted peppers and black olives",
      ),
    ]),
    section('Drinks', [
      item('Mint Lemon Slush', 6, 'Made with fresh lemon, mint and agave'),
      item('Mango Smoothie', 6),
      item('Blue Lagoon', 10, 'Pineapple juice, Malibu rum, soda water and blue curaçao syrup'),
      item('Mimosa', null, 'Orange juice and prosecco with fresh fruit', {
        variants: [
          { label: 'Glass', price: 12 },
          { label: 'Pitcher', price: 45 },
        ],
      }),
      item('Sangria', null, 'Red or white wine with fresh fruit', {
        variants: [
          { label: 'Glass', price: 14 },
          { label: 'Pitcher', price: 55 },
        ],
      }),
      item('Aperol Spritz', 14),
      item('Hugo Spritz', 14),
      item('Freshly Squeezed Orange Juice', 6),
      item('Iced Matcha Latte', 6),
      item('Iced or Hot Vanilla Latte', 5),
      item('Cappuccino or Latte', 4.5),
      item('Canadian Coffee', 3),
      item('Americano', 3.5),
      item('Espresso', 2.5),
    ]),
  ],
}
