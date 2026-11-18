# Old Site Inventory (laverandaresto.com)

Captured 2026-11-17 from the live WordPress site (`/wp-sitemap.xml` and the WP pages API). Use this for the redirect map (Stage 14) and for owner sign-off on content.

## Pages

| Old URL | Old title / content | New site | Status |
| --- | --- | --- | --- |
| `/` | Home | `/` | Built |
| `/menu/` | Dinner menu | `/menu` | Built (DB) |
| `/brunch-menu/` | Brunch menu | `/brunch-menu` | Built (DB) |
| `/events/` | "Events – Brunch Menu": events intro, event types, event contract form, photo carousel | `/events` (+ form → `/book-an-event`) | Built |
| `/events-brunch/` | Older duplicate of `/events/` ("2022 and beyond") | redirect → `/events` | To do (Stage 14) |
| `/book-an-event/` | "Contract Form": the event contract form | Redirects to `/events#book-an-event` (the form lives on the Events page) | Redirect done; form is a **placeholder** |
| `/contract-form/` | Second copy of the contract form | redirect → `/events#book-an-event` | To do (Stage 14) |
| `/reservations/` | Event contract form + lorem-ipsum "Book A Reservation" block | `/reservations` (table-reservation info; links to `/book-an-event`) | Built |
| `/specials/` | "Upcoming Special Events" cards (3 past 2025 events) + "Book Your Event" | `/specials` | Built (DB) |
| `/gallery/` | 20 photos (one duplicated) | `/gallery` | Built (DB) |
| `/contact/` | "Let's Talk" contact form (first/last name, email, phone, message), contact info, hours, map | `/contact` (form is a **placeholder**) | Built |
| `/thank-you/` | "Your booking has been confirmed" | Not recreated (the new form shows its own message) | Redirect → `/events` |
| `/shop/`, `/cart/`, `/checkout/`, `/my-account/`, `/payment/` | WooCommerce leftovers | Not recreated | Return 404/410 (Stage 14) |
| `/elementor-1937/` | Empty Elementor test page | Not recreated | 404 |
| (none) | Privacy policy | Not built (no old page) | Owner decision |
| (none) | Weddings & Corporate | Not built (needs its own design + owner content) | To do |

The sitemap also lists `wp-sitemap-posts-post-1/2.xml`, `wp-sitemap-users-1.xml` and `metform-form` entries. These are blog posts (likely the injected spam) and WordPress internals, so none of them get recreated.

## Downloads linked from the old site

| File | Used on new site? |
| --- | --- |
| `wp-content/uploads/2023/08/BrunchMenuMay2025.pdf` | Yes. Uploaded to Media and linked from `/brunch-menu` and `/events` |
| `wp-content/uploads/2023/08/New-Event-Menu-Options-La-Veranda-2-Pages-latest-2023.pdf` ("Group Menu", 2.9 MB) | Yes. Seeded as `src/seed/files/group-menu.pdf` and set in Site Settings → "Event group menu (PDF)"; linked as "Download Group Menu" on `/events`. It shows event upcharges are **per person** ("Add $15pp") and lists more starters than the online form (Grilled Vegie Sliders, Meatball Sliders, Loaded Iceberg Wedge Salad). The owner should confirm which is current |
| `wp-content/uploads/2023/08/Event-Form-Contract-2023.pdf` ("Contract Form", 113 KB) | No. Replaced by the online form. Not downloaded |

## Page banners (same photos as the old site)

| Page | Old file | New file (`src/assets/`) |
| --- | --- | --- |
| Menu, Brunch Menu | `Menu-Banner.jpg` | `menu-banner.webp` |
| Events | `Gallery-10.jpg` | `events-banner.webp` |
| Specials | `Gallery-24.jpg` | `specials-banner.webp` |
| Gallery | `gallery-Banner.jpg` | `gallery-banner.webp` |
| Contact | `Contact-Banner.jpg` (wood texture), **replaced** by `Gallery-7.jpg` (dining room) at the user's request | `contact-banner.webp` |
| Weddings & Corporate (new page) | `IMG_5942-min.jpg` (decorated event room) | `weddings-banner.webp` |
| Gallery "Book Your Event" background (new) | `IMG_5922-min.jpg` | `gallery-cta.webp` |
| Reservations | `Reservations-Banner.jpg` | `reservations-banner.webp` |
| "Book Your Reservation/Event" sections (menus, events, specials) | `statement-block-bg.jpg` | `statement.jpg` (identical file) |

## Content decisions made without the owner (please confirm)

**Dinner menu** (`/menu`): copied from the live page. Prices are identical to `docs/menu/Menu – La Veranda Restaurant.pdf`.
- Spelling fixed: Caesar, Fattoush, Maiale, Tenderloin **Beef** Skewers, Pappardelle Ai **Funghi**, Fettuccine Con **Salsiccia** E Piselli, "Wilted", "dressing", "tomato", "lemon dip", "arrabbiata", "Chef's".
- "Add Grilled Chicken Breast Or Shrimp – $8" sits under **Insalate** on the live page, so it is a salad add-on (not a pizza add-on).
- "House Speciality" has no price on the live site. It is seeded but **hidden** (unticked "available").
- Homepage dishes are now the dinner items flagged "Show on homepage". The old homepage prices that disagreed (Hummus $6, Spigola $32) are replaced by the menu prices ($9, $36).

**Brunch menu** (`/brunch-menu`): the live page plus the extras from the restaurant's own `BrunchMenuMay2025.pdf`, which the site links as "the" brunch menu.
- Added from the PDF: **Pies** section (Mediterranean, Spicy Calabrese, add egg +$2), add labneh +$3, add chicken +$6 (Kale & Beets, B.E.L.T.), Steak & Eggs **10oz ribeye $45** option, Mimosa pitcher $45, Sangria pitcher $55.
- Shakshukas are under **Savouries** (as in the PDF). The live page lists them under Sweets.
- Mortadella is under **Pizza** (as in the PDF). The live page lists it under Sandwiches.
- Tabouleh and Siciliana (salads) are under **Shareables**. The live page lists them under Sandwiches, and the PDF doesn't have them.
- The live page also contains a hidden copy of the dinner Antipasto section, which was left out.

**Hours**: a 4th version exists on the old Contact page (Wed–Thu 5–9:30pm, Fri–Sat 12pm–12am, Sun by reservation only). The seed uses it only for a **fresh** database. Your current Site Settings were not changed.

**Specials**: the three old 2025 specials (Father's Day, Easter, Thanksgiving) are seeded as **inactive** examples, so `/specials` shows the "nothing scheduled" message until the owner adds or re-activates one.

**Events page**: "Now booking all types of events for 2025 and beyond" became "Now booking all types of events" (no year to go stale).

## Weddings & Corporate page: what the owner must confirm

`/weddings-corporate` was designed from the structure of the page the owner liked
(aeventspace.com: intro, highlights, what's included, process, photos, call to action), with
weddings first. **Every statement comes from what La Veranda already publishes** (old site text
and the 2023 Group Menu PDF); nothing about capacity, décor, entertainment or vendors was invented.

Please confirm or correct:

- "Indoor and outdoor spaces", "completely transformable" (old Events page).
- Three-course plated dinner: four family-style starters, penne (or risotto on request), choice of
  mains; mixed green salad, soft drinks and coffee included; buffet-style stations; open bar or
  pay per consumption; vegetarian option, vegan/gluten-free on request; kids' menu (Group Menu PDF).
- Process: request → quotation by email → non-refundable deposit to hold the date (old form).
- Occasions listed: wedding receptions, engagement parties, bridal/baby showers, corporate
  functions, meetings, company parties, communions, confirmations, baptisms, sweet 16s, birthdays.

Worth adding once the owner provides it: guest capacity (seated / standing), ceremony on site
(yes/no), what's included in the room (tables, linens, sound, lighting, décor), outside vendors
policy, real wedding photos, and pricing to show (the page links the Group Menu instead of
repeating prices).
