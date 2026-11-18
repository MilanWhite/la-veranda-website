# La Veranda Rebuild: Status Report

**Date:** 2026-11-17
**Sources reviewed:** every file in `docs/` (brief, scope/clarifications, progress tracker, meeting agenda, chat summary, all 5 menu PDFs, the event contract screenshots, the booking-summary PDF and the confirmation email), all of `src/`, the config files, the database, and the running app.

---

## 1. Summary

| Area | State |
| --- | --- |
| Foundation (Next.js 16 + Payload 3.90 + PostgreSQL 17) | **Done.** Runs locally. Typecheck, lint and Prettier pass. All 3 migrations applied. |
| Admin panel (sign-in) | **Done.** `/admin` login works and an admin account exists. It manages Users, Media and Site Settings only. |
| Site Settings (contact, socials, hours, SEO, email recipients, calendar ID) | **Done.** |
| Header, footer, design system, homepage | **Built.** Waiting on owner approval. |
| Every other public page (9 pages) | **Not started.** All return 404. |
| Menus as data | **Not started.** |
| Event request ("reservation") form → database → email to owner/customer → PDF | **Not started.** |
| Admin workflow (approve/decline/cancel requests) | **Not started.** |
| Google Calendar, Google hours, Turnstile, rate limiting | **Not started.** |
| SEO, redirects, production hosting (Railway), launch | **Not started.** |
| Git | **Nothing committed.** Only the initial `README` commit exists. |

**Overall:** about 4 of 15 planned stages are complete (Stages 2–5, with Railway deferred and the homepage unapproved). Stages 6–15 contain every customer-facing feature apart from the homepage. Stage 1 (owner confirmations) is the main blocker for the menu and event-form work.

---

## 2. How to launch the application

Prerequisites on this machine are already satisfied: Node v24.19, npm 11.17, the PostgreSQL 17 Windows service (`postgresql-x64-17`) running on port 5432, a `.env` file present, and `node_modules` installed.

```bash
npm install          # only needed on a fresh clone
npm run migrate      # applies pending DB migrations (all 3 are already applied)
npm run dev          # starts the site
```

- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin. Sign in with the admin account that was already created. On a fresh database it shows "Create first user" instead.

`.env` needs two values (template in `.env.example`):

```
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/laveranda
PAYLOAD_SECRET=<long random string>
```

Other commands: `npm run build` / `npm start` (production), `npm run lint`, `npm run format`, `npm run migrate:create` (after any schema change), `npm run generate:types`.

> Note: the Next.js dev badge (bottom-left "N") covers the admin's sign-out button in dev. Use `/admin/logout`, or set `devIndicators: false` in `next.config.ts`.

---

## 3. What is finished (verified today)

### Foundation (Stage 2)
- Payload "blank" template on Next.js 16, React 19, TypeScript, PostgreSQL adapter, Lexical rich-text editor, sharp.
- `push: false`, so schema changes go through migrations only (`src/migrations/`).
- ESLint (Next 16 flat config), Prettier, `.env.example`, README with setup steps.
- Verified today: `tsc --noEmit` passes, `npm run lint` is clean, `prettier --check` is clean, and migrations show all 3 as ran.

### Authentication & access control (Stage 3)
- `src/access/authenticated.ts`: any signed-in user is an admin (one role in V1, as specified).
- Verified today: `GET /api/users` returns 403 to the public, and `/admin` redirects to `/admin/login`.
- Media: anyone can read it, but uploads require sign-in.

### Site Settings global (Stage 4): `src/globals/SiteSettings.ts`
- Restaurant name, phone, email, address, social links, hours (days / time / optional note), default SEO (title, description, share image).
- An `internal` group (event-request email recipients, Google Calendar ID) is hidden from the public API. Verified today: the public JSON has no `internal` key.

### Site shell & homepage (Stage 5)
- Old site's look reproduced: Playfair Display + Source Sans 3, black backgrounds, teal `#61b5c7` accent, outline/solid buttons, leader-line menu rows.
- Header with top bar (email, phone, socials) and nav (Home, Menu ▸ Dinner/Brunch, Events ▸ Events/Weddings & Corporate, Specials, Gallery, Contact, Book an Event). It has a CSS-only mobile hamburger that switches at ≤1024px.
- Footer: logo, tagline, socials, Quick Links, Menu links, Contact Info.
- Homepage sections: hero, Event Center / From Our Kitchen features, "Our Menu" (8 dishes), photo banner, "Visit Us" (contact, Google Map embed, opening hours, Get Directions / Book an Event).
- Base form-control styles exist (`input`, `select`, `textarea`, `label`) ready for the forms.
- Assets: logo + 4 photos in `src/assets/`.

---

## 4. What needs to be done, item by item

Each item uses the format **Currently → Needs**.

### 4.1 Owner confirmations (Stage 1): blocks menus and the event form

| Topic | Currently | Needs |
| --- | --- | --- |
| Restaurant hours | Three conflicting versions exist. The DB holds a placeholder: Mon–Tue closed, Wed 9–3, Thu 9–9, Fri 9–10, Sat 9–11, Sun 9–6. | The owner must give the real hours and confirm whether the Google Business Profile is correct. |
| Dinner menu | Only the website-printout PDF exists. It has typos and a "House Speciality" with a blank price (`$`). | The owner must confirm items and prices. |
| Brunch menu | The website page and `BrunchMenuMay2025.pdf` disagree (see 4.3). | The owner must confirm which one is current. |
| Event menu & rules | Only the old form exists. The old Events page links a "Group Menu" PDF (`NEW-EVENT-MENU-OPTIONS-…-2023.pdf`) that is **not in `docs/`**. | Confirm prices, starter count, per-person vs per-event upcharges, which selections may be "to be decided", the deposit amount, and guest limits (full list in `meeting_agenda_elio.md` §3). |
| Email sending account | Undecided: Resend from `info@`, a new Gmail with an app password, or Google Workspace. | Decide this, because it changes how the email code is built. |
| Accounts & access | None granted yet. | Railway (owner pays, developer as Editor), Google Cloud project, "La Veranda Events" calendar shared, Google Business Profile manager, DNS/registrar, and where `info@` mail is hosted (Hostinger vs Netfirms). |
| Content | None received. | Weddings & Corporate page copy (services, capacity, entertainment), current specials, better photos / logo source, gallery approval, event-space names and capacities. |
| Old site security | The WordPress homepage has injected casino spam links. | Raise this with the owner and decide whether to clean it up now or retire it at launch. |
| Site inventory | Not done. | List all old URLs, collect old gallery/events images, and draft a redirect map. **I could not do this today** because the browser was not allowed to open laverandaresto.com, so the old Gallery, Specials, Contact and Reservations pages still need to be captured. |

### 4.2 Admin panel

| Currently | Needs |
| --- | --- |
| Payload admin with **Users, Media, Site Settings** only. Default Payload branding. | **Menus**, **Event Packages/Options**, **Event Requests**, **Specials** and **Gallery** collections (or editable content) so staff can run everything from `/admin`. |
| No email adapter. Payload warns "Email will be written to console". | Configure an email adapter. Without it, **"Forgot password?" does not send emails**. |
| No event workflow. | List and detail views of requests, Approve / Decline / Cancel actions, and server-side rules (`PENDING → APPROVED/DECLINED`, `APPROVED → CANCELLED` only). |
| | Internal notes / record of changes agreed by email. |
| | An "Upcoming approved events" view. |
| | Optional: La Veranda logo/branding on the admin login and dashboard. |
| | Optional: a simple dashboard landing page focused on restaurant work (new requests, upcoming events). |

### 4.3 Public pages

| Page | Currently | Needs |
| --- | --- | --- |
| `/` Home | Built. The "Our Menu" dishes are **hard-coded**, and two prices disagree with the menu PDF: **Hummus $6 vs $9**, **Spigola $32 vs $36**. | Owner approval, then pull the dishes from menu data (for example a "featured" flag). |
| `/menu` Dinner | 404 | Page built from menu data. Categories: Dips, Bistecca, Pasta, Carne, Insalate, Main, Pizzas, Antipasto. Needs **price variants** (Striploin 10oz $42, Ribeye 12oz $55), an **add-on** (pizzas: "Add grilled chicken or shrimp +$8"), a category note ("All pasta made in-house"), and a "Download brunch menu" link. Fix typos: Ceasar, Mailale, "Beek", "Witted", "tomatoe", "Lemone", "Dressin". |
| `/brunch-menu` | 404 | Page built from data. The PDF has items the website lacks: a **Pies** section (Mediterranean, Spicy Calabrese $16, add egg +$2), add-ons (labneh +$3, chicken +$6), Steak & Eggs "or 10oz ribeye $45", Mimosa pitcher $45, Sangria pitcher $55. The website page wrongly lists Tabouleh/Siciliana under Sandwiches and Mortadella under Sandwiches (the PDF has it under Pizza). Benedicts / Skillets / Shakshukas are **sub-groups with their own description**. |
| `/events` | 404 | Old copy ("one of Woodbridge's original and historic event venues…"), the event-type list (Corporate, Weddings, Confirmations, Engagements, Communions, Bridal Showers, Sweet 16s, Baptisms, Birthdays, And More), the "Our Events" photo carousel (3 room photos, not yet downloaded), and a "Book Your Event" call to action. |
| `/weddings-corporate` | 404 | A new combined page (inspiration: aeventspace.com weddings page). It **must not invent offerings** and is blocked on owner content. |
| `/book-an-event` | 404 | The event request form (see 4.4). |
| `/specials` | 404 | A Specials collection (title, description, image, date, active, optional link) and a list page that hides inactive or past specials. |
| `/gallery` | 404 | Migrate the old gallery images and build a grid with a lightbox. Mostly static. |
| `/contact` | 404 | Contact info, map, hours, and a **contact form** (Name, Email, Phone optional, Message) that emails the restaurant, with Turnstile and rate limiting. *This form is in the scope doc (§22) but missing from the progress tracker.* |
| `/reservations` | 404 | **Information only.** The scope doc (§21) says La Veranda does **not** want table reservations on the website: show "call or email us" instructions, or link to a booking provider if one exists. The old site's "Book Your Reservation" text can be reused. |
| Privacy policy | None | Recommended, because the forms collect personal data (Canadian privacy law). |
| 404 / 500 pages | Next.js defaults | Branded error pages. |
| Footer "Menu" links | Pastas, Pizzas, Carne and Antipasto all go to `/menu`. | Link to section anchors (`/menu#pasta`, etc.). |

### 4.4 Event request form (the "reservation form that gets sent to the owner")

In the docs, the form that goes to the owner is the **event request / "Book an Event"** form. Normal table reservations are explicitly excluded.

**Currently:** nothing exists. There is no collection, no form, no email and no PDF.

**Needs: form fields** (copied from the old Event Contract form):
- Name/Company, Contact Person, Address, Email, Phone
- Event Type (dropdown, with a custom option)
- Date; Start Time (9:00 AM–10:00 PM in 30-minute steps); End Time. Show "Max 4 hrs; $10 extra for each additional hour (excluding Open Bar)".
- Number of adult guests and number of kids
- **Starters:** choose **exactly 4** of 9. Upcharges: Ravioli Fritti +$1, Calamari +$3, Zucchini Roll Ups +$1, Spiducci +$3.
- **Penne:** one sauce (Pomodoro / Vodka / White / Rosé), plus an optional risotto type (free text, +$5).
- **Main dish ($73, plus taxes and an 18% space fee):** "Chosen" or "To be decided". Multiple mains can be picked: Chicken Supreme, Steak +$15, Veal Chop +$12, Braised Beef +$8, Salmon +$8, Chicken & Lamb Combo +$15, Surf & Turf +$20.
- **Kids menu ($30):** Chicken Fingers w/ Fries or Cheese Pizza w/ Fries.
- **Extras:** Mimosa Bowl $125, Fruit Tray $75, Pesce Misto $45, Open Bar $45/person.
- **Wine service:** served by waiter or kept on table. **Alcohol:** open bar or pay per consumption. Open Bar appears both here and in Extras, so ask the owner which one to keep.
- Deposit acknowledgement checkbox, Notes, and the "Pricing & Notes" box.
- On success, show: "Your event request has been received. This does not confirm your booking…"

**Needs: backend:**
- Event menu stored as data (packages, options, min/max per category, upcharges, extras, adult/kid prices, "to be decided"), so that changing a price in admin updates the form, emails and PDF.
- An `event-requests` collection with a human-readable request number (the old one used `#4833`), status `PENDING`, and a **price snapshot** (`priceAtSubmission`) so old requests keep their original prices.
- Server-side validation (never trust browser prices), Cloudflare Turnstile, rate limiting.
- Save to the DB **first**, then send emails, then record whether each email succeeded or failed. A failed email must never lose the request.

**Needs: email & PDF (so the owner can continue the conversation):**
- **Customer email** from `info@laverandaresto.com`: "Thank You For Your Request", with the summary table and the PDF attached (matching the old `Booking-Summary-Request-4833.pdf`).
- **Owner notification email** to the recipients set in Site Settings, with **Reply-To set to the customer's email**, so the owner can just hit Reply and carry on the conversation from their inbox. The staff then record the agreed changes and approve the request in `/admin`.
- One PDF (Booking Summary Request): La Veranda logo, all the fields, and the Pricing & Notes block.

### 4.5 Integrations

| Integration | Currently | Needs |
| --- | --- | --- |
| Email (Resend or Gmail) | None | Provider choice (blocked), API key/app password in env, sender domain DNS (SPF/DKIM) if Resend/Workspace. |
| Google Calendar | Only a `googleCalendarId` field | Service account in La Veranda's Google Cloud with the calendar shared to it. On approval, create the event and store its ID. On edit, update it. On cancel, delete it. Repeated approval must not create duplicates. Failures are recorded and can be retried. Timezone America/Toronto. |
| Google hours | Hours are entered manually in Site Settings | Places API fetched about once a day and cached, falling back to Site Settings. Needs a billing account and a quota cap. |
| Cloudflare Turnstile | None | Site and secret keys, applied to the event and contact forms. |

### 4.6 SEO, accessibility, migration (Stage 14)

| Currently | Needs |
| --- | --- |
| One site-wide title/description from Site Settings. | Per-page titles and descriptions, canonical URLs, Open Graph share image (the field exists but is unused). |
| No `sitemap.xml` or `robots.txt` (both 404). | Add both. |
| No structured data. | Restaurant JSON-LD (name, address, phone, hours, menu URL). |
| No redirects. | Map old URLs to new ones. Make `/shop`, `/cart`, `/checkout`, `/my-account`, `/payment` and the spam URLs return 404/410. |
| Inputs remove the focus outline and only change the border colour. | Check keyboard focus visibility, alt text on every image, and responsive layouts on all new pages. |

### 4.7 Production & launch (Stages 2 remainder + 15)

| Currently | Needs |
| --- | --- |
| Local only. Railway deferred. | Railway project + PostgreSQL, environment variables, first deploy. |
| Uploaded media is saved to the local disk (`/media`), which would be wiped on each Railway deploy. | A Railway volume or S3-compatible storage adapter so uploads persist. |
| No backups. | Railway DB backups and a tested restore procedure. |
| No tests. | Minimum tests from scope §27: valid/invalid submission, protected values can't be set, email failure keeps the request, unauthenticated access blocked, approval → one calendar event and no duplicates. |
| | DNS cut-over **without touching the MX records** (so `info@` mail keeps working), HTTPS, verify redirects and forms on the live domain, submit the sitemap to Search Console, retire WordPress. |

### 4.8 Repository housekeeping (found today)

- **Nothing is committed.** All work exists only on this disk. This should be committed soon.
- `.gitignore` does **not** exclude `tmp/` (about 57 MB of Python PDF libraries) or `docs.zip` (a duplicate of `docs/`). Both would be committed by `git add .`.
- `docs/menu/BrunchMenuMay2025 (1).pdf` is a byte-for-byte duplicate of `BrunchMenuMay2025.pdf`.
- `private/la_password.txt` holds a plaintext password. It is git-ignored, which is good, but a password manager would be safer. I did not open it.
- The scope doc (§30) suggests a small doc set (`requirements.md`, `data-model.md`, `event-workflow.md`, …). Only the progress tracker exists. This is optional.
- I added `.claude/launch.json` so the dev server can be started from the desktop app's preview.

---

## 5. Recommended order from here

1. **Commit the current work** (after fixing `.gitignore`).
2. **Get owner answers** for hours, menus, the event menu and rules, and the email account. These unblock almost everything else.
3. **Stage 6, menus:** collections, seed data from the PDFs, `/menu` and `/brunch-menu`, homepage dishes from data.
4. **Stage 7, other pages:** Events, Specials, Gallery, Contact (with contact form), Reservations info, and Weddings & Corporate once content arrives.
5. **Stages 8–10, event request flow:** data model, then the form, then save, then email the owner (Reply-To customer) and the customer, then the PDF.
6. **Stage 11, admin workflow:** approve, decline, cancel, notes, upcoming events.
7. **Stage 12, Google Calendar.** **Stage 13, Google hours** (optional; the fallback already works).
8. **Stage 14, SEO and redirects.** **Stage 15, Railway, testing, DNS, launch.**
