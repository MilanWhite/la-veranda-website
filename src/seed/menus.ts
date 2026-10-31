import type { Menu } from '../payload-types'

// The restaurant's printed dinner and brunch menus (photographed Nov 2026), with spelling
// fixed. After seeding, menus are edited in the admin, not here.

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
  pdfLabel: 'Download Dinner Menu',
  sections: [
    section('Antipasto', [
      item(
        'Shared Board',
        32,
        'Marinated grilled vegetables, prosciutto, salami, bocconcini and Grana Padano',
      ),
      item(
        'Brie Focaccia',
        20,
        'Focaccia bread with a whole melted brie, served with a side of pesto and jam',
      ),
      item(
        'Calamari Fritti',
        20,
        'Dusted with seasoned flour and mixed with lemon herbs. Served with marinara sauce',
        { featured: 'popular' },
      ),
      item('Cauliflower Fritti', 14, 'Breaded cauliflower served with marinara sauce'),
      item(
        'Ravioli Fritti',
        14,
        'Fried agnolotti stuffed with spinach and ricotta, served with marinara sauce',
      ),
      item('Crispy Cheese Roll', 14, 'Spring rolls stuffed with feta, mozzarella and oregano'),
      item(
        'P.E.I. Mussels',
        22,
        'Steamed PEI mussels in a tomato garlic sauce with chili flakes and white wine, served with our homemade bread',
      ),
      item('Burrata Fritta', 26, 'Served with arugula, mortadella and pistachio'),
      item(
        'Polenta Fritti',
        16,
        'Polenta sticks made with rosemary, topped with Grana Padano and served with marinara sauce',
      ),
      item('Warm Mixed Olives', 15, 'Served with focaccia bread'),
      item(
        "Za'atar Focaccia",
        12,
        'Freshly baked focaccia with thyme, oregano, sesame seeds and olive oil, served with cucumber, olives and tomatoes',
      ),
    ]),
    section(
      'Salads',
      [
        item(
          'Burrata & Fig Salad',
          23,
          'Sun-dried tomatoes and arugula with pesto balsamic vinaigrette, drizzled with fig glaze',
          { featured: 'recommendation' },
        ),
        item(
          'Kale & Beets',
          18,
          'Shredded kale and beet, apple and cranberry with lemon pomegranate vinaigrette',
        ),
        item(
          'Caesar Salad',
          15,
          'Romaine lettuce, shaved Grana Padano and croutons with Caesar dressing',
        ),
        item(
          'Summer Caprese',
          22,
          'Fior di latte, arugula, tomatoes and lentils dressed with balsamic and pesto',
        ),
        item(
          'Mixed Green Salad',
          15,
          'Mixed greens, tomatoes, red peppers and cucumber with balsamic vinaigrette',
        ),
        item(
          'Greek Salad',
          16,
          'Romaine lettuce, tomatoes, cucumber, sweet red onion, feta, Kalamata olives and oregano with red wine vinaigrette',
        ),
        item(
          'Arugula Salad',
          21,
          'Arugula, tomatoes, fresh mozzarella and prosciutto dressed with pesto balsamic vinaigrette',
        ),
      ],
      {
        addOns: [
          { label: 'Add chicken', price: 6 },
          { label: 'Add steak', price: 12 },
        ],
      },
    ),
    section('Sandwiches', [
      item(
        'Della Tella',
        20,
        'Mortadella, stracciatella, pistachio mascarpone spread and arugula drizzled with pesto',
      ),
      item(
        'Grilled Chicken Pomodoro',
        18,
        'Grilled chicken with tomato sauce, melted mozzarella, sun-dried tomato pesto mayo and arugula',
      ),
      item('Grilled Veggie', 16, 'Mixed marinated grilled vegetables with arugula and pesto mayo'),
      item('Caprese', 18, 'Fresh mozzarella, balsamic marinated tomatoes, basil pesto and arugula'),
      item('Brie & Prosciutto', 20, 'Melted brie, prosciutto, arugula and balsamic glaze'),
    ]),
    section('Secondi', [
      item(
        'Bistecca',
        45,
        'Grilled 10 oz ribeye with mushroom sauce. Served with mashed potatoes and mixed grilled vegetables',
        { featured: 'recommendation' },
      ),
      item(
        'Osso Buco',
        40,
        'Slow-roasted veal shank in a tomato wine ragù. Served with your choice of homemade polenta or mashed potatoes',
      ),
      item(
        'Grilled Salmon',
        30,
        'Served with mashed potatoes or lentils and mixed grilled vegetables',
      ),
      item(
        'Chicken Supreme',
        28,
        'Pan-roasted chicken breast with mashed potatoes and mixed vegetables, served with sauce',
      ),
      item(
        'Chicken Shrimp',
        30,
        'Grilled dark chicken with shrimp, served with roasted potatoes and a mango avocado arugula salad',
      ),
    ]),
    section('Pasta', [
      item('Penne alla Vodka', 22, 'Penne in a tomato and vodka sauce with pancetta'),
      item(
        'Agnolotti Di Funghi',
        26,
        'Mushroom-stuffed agnolotti in a garlic and creamy Alfredo sauce, finished with parsley',
      ),
      item(
        'Gnocchi E Ragù Di Agnello',
        28,
        'Potato gnocchi with stewed lamb in a tomato-based sauce',
        { featured: 'recommendation' },
      ),
      item(
        'Fettuccine Con Salsiccia E Piselli',
        28,
        'Fettuccine with sweet peas, sausage, onion and mascarpone',
      ),
      item(
        'Fettuccine With Chicken',
        26,
        'Fettuccine topped with grilled chicken in a creamy Alfredo sauce',
      ),
      item(
        'Rigatoni Bolognese',
        25,
        'A slow-braised ragù of beef and veal with sweet onion, fresh basil and tomato sauce',
      ),
      item(
        'Chitarrini Di Mare',
        32,
        'Squid ink spaghetti with tiger shrimp, clams, mussels and garlic in a tomato wine sauce',
      ),
      item(
        'Pasta alla Norma',
        26,
        'Sicilian-style pasta with fried eggplant, tomato sauce, fresh basil and shaved ricotta salata',
      ),
      item(
        "Chicken & 'Nduja Gnocchi",
        26,
        "Sautéed chicken, 'nduja sausage, peas and Alfredo sauce",
      ),
      item(
        'Pesto Chicken Penne',
        26,
        'Sautéed chicken, sun-dried tomatoes, garlic and Parmesan in a basil pesto Alfredo sauce',
      ),
    ]),
    section('Pizza', [
      item('Margherita', 16, 'Tomato sauce, mozzarella and fresh basil'),
      item('Pepperoni', 20, 'Tomato sauce, mozzarella and pepperoni', { featured: 'popular' }),
      item(
        'Garden',
        18,
        'Tomato sauce, mozzarella, tomatoes, mushrooms, roasted red pepper, olives and onion',
      ),
      item('Calabrese', 22, 'Tomato sauce, mozzarella, red pepper, hot salami and black olives'),
      item('Mushroom', 20, 'White pizza with mozzarella, mushroom, parsley and olive oil'),
      item('Mushroom Caramelized Onion', 22, 'Mozzarella, garlic, mushroom and caramelized onion'),
      item(
        'Suicide',
        24,
        'Tomato sauce, mozzarella, soppressata, hot sausage, chili peppers, black olives and hot peppers',
      ),
      item(
        'Pear & Brie',
        22,
        'Brie, mozzarella, sliced pears, walnuts and dried cranberry with a honey drizzle',
      ),
      item(
        'La Veranda',
        24,
        'Tomato sauce, mozzarella, bocconcini, diced tomatoes, prosciutto, arugula and Grana Padano',
        { featured: 'popular' },
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
        20,
        'Freshly baked focaccia with a whole melted brie, served with a side of pesto and jam',
      ),
      item(
        "Za'atar Focaccia",
        14,
        'Freshly baked focaccia with thyme, oregano, sesame seeds and olive oil, served with cucumber, olives and tomatoes',
        { addOns: [{ label: 'Add labneh', price: 3 }] },
      ),
      item('Warm Olives Board', 15, 'Served with labneh and focaccia bread'),
      item('Labneh Chili Jam', 16, 'Served with chili jam, pistachio and house-made focaccia'),
      item(
        'Calamari Fritti',
        20,
        'Dusted with seasoned flour and mixed with lemon herbs. Served with marinara sauce',
      ),
      item(
        'Burrata & Fig Salad',
        23,
        'Sun-dried tomatoes and arugula with pesto balsamic vinaigrette, drizzled with fig glaze',
      ),
      item(
        'Kale & Beets',
        18,
        'Shredded kale and beet, apple and cranberry with lemon pomegranate vinaigrette',
        { addOns: [{ label: 'Add chicken', price: 6 }] },
      ),
      item(
        'Mango Avocado Arugula Salad',
        22,
        'Arugula tossed with mango slices and avocado, dressed in a mango-lime vinaigrette',
      ),
    ]),
    section('Savouries', [
      item(
        'Double B',
        17,
        'Two eggs your way and bread, paired with bacon, potatoes and a side of fresh fruit',
        // Hard to read on the photographed menu ("add jar of jam +1"?). Confirm with the owner.
        { addOns: [{ label: 'Add a jar of jam', price: 1 }] },
      ),
      item(
        'Avocado Toast',
        22,
        'Avocado over toasted sourdough with poached eggs, served with fresh fruit and potatoes',
      ),
      item('Chicken & Waffle', 22, 'Crispy fried chicken with waffle, potatoes and syrup', {
        featured: 'popular',
      }),
      // Price partly hidden by glare on the photo (reads as 35). Confirm with the owner.
      item('Steak & Eggs', 35, '8 oz ribeye, potatoes, arugula salad and chimichurri sauce'),
    ]),
    section(
      'Benedicts',
      [
        item('Salmon', 22, 'Smoked salmon with hollandaise sauce'),
        item('Peameal Bacon', 18, 'Served with hollandaise sauce'),
        item(
          'Prosciutto Delight',
          20,
          'Sun-dried tomato paste, melted mozzarella and crispy prosciutto',
        ),
        item('Braised Beef', 21, 'Braised beef and caramelized onion'),
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
        'Made with house-made mixed berry compote, whipped cream and maple syrup',
      ),
      item('Chocolate Chip Pancakes', 16, 'Served with whipped cream, Nutella and maple syrup'),
      item(
        'Waffle Stack',
        16,
        'Cinnamon waffle served with fresh fruit, whipped cream, Nutella and maple syrup',
      ),
      item('Apple Waffle', 18, 'Cinnamon waffle served with apple compote and vanilla ice cream'),
      item('Yogurt Parfait', 12, 'Greek yogurt served with fresh fruit, honey and granola'),
    ]),
    section(
      'Croffles',
      [
        item(
          'Dubai Chocolate Strawberry',
          19,
          'Croissant waffle pressed until crisp, topped with chocolate, pistachio-kunafeh crunch and fresh strawberries',
          { featured: 'recommendation' },
        ),
        item(
          'Savory Pesto Ham',
          20,
          'Crisp croffle with ham and melted cheese and soft scrambled eggs, served with pesto and a balsamic arugula salad',
        ),
        item(
          'Spicy Italian',
          21,
          'Croffle with Calabrese soppressata, roasted red pepper, olives and soft scrambled eggs, served with pesto and a balsamic arugula salad',
        ),
      ],
      { description: 'Pressed croissant waffle' },
    ),
    section(
      'Sandwiches',
      [
        item('B.E.L.T.', 19, 'Crispy bacon, eggs, lettuce and tomato topped with pesto mayo', {
          addOns: [{ label: 'Add chicken', price: 6 }],
        }),
        item('Brie & Prosciutto', 21, 'Melted brie, prosciutto, arugula and balsamic glaze'),
        item(
          'Grilled Veggie',
          17,
          'Zucchini, eggplant, sautéed onion, arugula, black olives, artichoke and pesto mayo',
        ),
        item(
          'Mortadella',
          21,
          'Mortadella, creamy burrata, pistachio mascarpone spread and arugula drizzled with pesto',
        ),
      ],
      { description: 'Served on house-made bread' },
    ),
    section('Pizza', [
      item('Margherita', 16, 'Tomato sauce, mozzarella and fresh basil'),
      item(
        'Garden',
        18,
        'Tomato sauce, mozzarella, tomatoes, mushrooms, roasted red pepper, olives and onion',
      ),
      item('Pepperoni', 18, 'Tomato sauce, mozzarella and pepperoni'),
      item(
        'La Diavola',
        22,
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
      item('Cappuccino or Latte', 5),
      item('Canadian Coffee', 3),
      item('Americano', 3.5),
      item('Espresso', 2.5),
    ]),
  ],
}
