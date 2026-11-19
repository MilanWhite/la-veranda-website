# La Veranda Rebuild — Project Progress Tracker

This is the living build plan for the La Veranda website rebuild. Agents and developers working on the project **must read this file before starting work and update it before finishing**.

Related docs:

- [la_veranda_rebuild_summary.md](la_veranda_rebuild_summary.md) — project goals and core requirements
- [clarification_questions.md](clarification_questions.md) — scope decisions and open owner questions
- [menu/](menu/) — current restaurant, brunch, and event menu PDFs
- [event_contract/](event_contract/) — current event request form, booking summary, and confirmation email

---

## How to Use This File

**Checkbox states**

| Mark  | Meaning                                                     |
| ----- | ----------------------------------------------------------- |
| `[ ]` | Not started                                                 |
| `[~]` | In progress (add a short note on what remains)              |
| `[x]` | Done and verified                                           |
| `[!]` | Blocked (add the reason and what/who it is waiting on)      |
| `[-]` | Dropped or deferred out of V1 (add the reason)              |

**Stage status values:** `Not started` · `In progress` · `Blocked` · `Done`

**Rules for agents**

1. Work on the earliest unfinished stage unless the user directs otherwise. Stages may overlap (e.g. Stage 2 can begin while Stage 1 waits on owner copy), but do not mark a stage `Done` until its **Working result** has been verified.
2. Only mark an item `[x]` after it has been verified (ran it, tested it, or saw it working) — not just because code was written.
3. When you finish a session, update: the checkboxes you touched, the stage's **Status**, the **Current Status** summary below, and add a row to the **Progress Log**.
4. Record open questions in **Blockers & Open Questions** rather than guessing. Do not hard-code business rules (selection limits, prices, statuses, hours) that are still unconfirmed — make them data-driven or configurable.
5. Record significant technical choices in **Decisions Log** so future sessions don't re-litigate them.
6. Keep notes short. Link to files (`src/...`), PRs, or commits instead of pasting code.

---

## Current Status

- **Current stage:** Stages 6–7: menus and public pages built with placeholder content (Stage 5 waits on owner approval; Stage 1 owner confirmations still open)
- **Overall:** All public pages except Weddings & Corporate exist; menus, specials and gallery come from the database; seed/reset/test-DB scripts in place. Event request and contact forms are placeholders.
- **Last updated:** 2026-11-17
- **Next action:** Sign in to `/admin` and check that editing a menu item shows on `/menu` (Stage 6 verification). Then Stage 8 (event-menu data model), or design the Weddings & Corporate page.

---

## Stage Overview

| #  | Stage                                          | Status      |
| -- | ---------------------------------------------- | ----------- |
| 1  | Confirm the essential business rules           | In progress |
| 2  | Create the application foundation              | In progress |
| 3  | Payload authentication and access control      | Done        |
| 4  | Global site settings                           | Done        |
| 5  | Site shell and design system                   | In progress |
| 6  | Restaurant menus                               | In progress |
| 7  | Remaining public pages                         | In progress |
| 8  | Event-menu data model                          | Not started |
| 9  | Event-request submission                       | Not started |
| 10 | Request summaries, email, and PDF generation   | Not started |
| 11 | Administrative event workflow                  | Not started |
| 12 | Google Calendar integration                    | Not started |
| 13 | Restaurant-hours integration                   | Not started |
| 14 | SEO, accessibility, and migration              | Not started |
| 15 | Production testing and launch                  | Not started |

---

## Stage 1 — Confirm the Essential Business Rules

**Status:** In progress (site inventory done; owner confirmations open)

**Goal:** Lock down the rules the system depends on. Development may begin before final copy arrives, but uncertain rules must not be hard-coded.

### Business rules

- [ ] Final public page list confirmed
- [ ] Restaurant menu content confirmed (items, descriptions, prices, categories)
- [ ] Brunch menu content confirmed
- [ ] Event menu packages and options confirmed
- [ ] Event selection rules confirmed (limits per category, required vs. optional, "to be decided" allowed)
- [ ] Adult/child pricing rules confirmed
- [ ] Upcharges and extras confirmed
- [ ] Event statuses confirmed (`PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`)
- [ ] Event duration, guest limits, spaces, and availability rules confirmed
- [ ] Restaurant hours confirmed
- [ ] Required event-request form fields confirmed
- [ ] Email recipients for event requests confirmed

### Existing site inventory

- [x] Existing URLs inventoried (list saved to `docs/`): [old_site_inventory.md](old_site_inventory.md)
- [x] Existing content inventoried (copy worth keeping)
- [x] Existing images collected and organized: gallery, events and specials photos in `src/seed/images/` (WebP, max 1600px)
- [~] Redirect map drafted (old URL → new URL): the table in `old_site_inventory.md`; still needs implementing in Stage 14
- [x] Obsolete WordPress commerce/spam routes identified for exclusion

**Working result:** All rules the build depends on are written down and confirmed, or explicitly marked as pending and configurable.

**Notes:**

---

## Stage 2 — Create the Application Foundation

**Status:** In progress (local done; Railway deferred)

- [x] Next.js app created with TypeScript
- [x] Payload CMS installed and configured
- [x] PostgreSQL connected (local)
- [x] Environment variables defined; `.env.example` committed (no secrets)
- [x] Local development instructions written in `README.md`
- [x] Linting configured
- [x] Formatting configured
- [x] Database migrations workflow established
- [x] Project folder structure established
- [-] Railway project created with PostgreSQL — deferred by user; local-only for now
- [-] Early Railway deployment succeeds — deferred
- [-] Production app connects to production PostgreSQL — deferred

**Working result:** The application runs locally and in production and connects to PostgreSQL.

**Notes:**

- Created from Payload's `blank` template (Payload 3.90, Next 16), npm. Removed unused template extras (Docker, Playwright/Vitest, example route).
- Local DB: `laveranda` on local PostgreSQL 17. Initial migration `src/migrations/20261012_193753_initial.ts` applied.
- `push: false` in `src/payload.config.ts` — schema changes go through migrations only.
- Verified: `npm run lint`, `tsc --noEmit`, Prettier check pass; site and `/admin` load locally (redirects to create-first-user).

---

## Stage 3 — Payload Authentication and Access Control

**Status:** Done

- [x] Admin-user collection created
- [x] Single administrator role for V1
- [x] Admin routes secured
- [x] Server-side access control on all protected collections
- [x] Public (unauthenticated) access limited to published/public data
- [x] First administrator account creation process documented
- [x] Verified: admin can sign in
- [x] Verified: public users cannot read protected data (e.g. event requests) via API

**Working result:** An administrator can sign in, while public users cannot access protected data.

**Notes:**

- `src/access/authenticated.ts` — any signed-in user is an admin (single V1 role). Applied explicitly to `users`; reuse it for future protected collections (e.g. event requests).
- `media`: public read, writes require sign-in (Payload default).
- Verified without a session: `GET/POST /api/users` → 403, `POST /api/media` → 403, `GET /api/media` → 200, `/admin` redirects to `/admin/login`.
- No migration needed (access rules don't change the schema).

---

## Stage 4 — Global Site Settings

**Status:** Done

- [x] Site settings global created in Payload
- [x] Restaurant contact details (phone, email)
- [x] Address and social links
- [x] Default SEO information (site title, description, share image)
- [x] Restaurant hours fallback
- [x] Email recipients for notifications
- [x] Google Calendar configuration references (calendar ID, not secrets)
- [x] Settings rendered on the public site (header/footer/contact)
- [x] Verified: editing a setting updates the public site

**Working result:** Shared information is managed once and displayed publicly.

**Notes:**

- Global `site-settings` in `src/globals/SiteSettings.ts`; migration `20261012_195835_site_settings` applied.
- Public read; update requires sign-in. The `internal` group (notification emails, Google Calendar ID) is readable only by signed-in users — verified absent from the public API.
- Payload starter homepage and styles removed. Homepage is now an unstyled page showing the settings; header/footer come in Stage 5. Page title/description come from Default SEO, falling back to the restaurant name.
- Hours are free text (days + time) so no hours rules are hard-coded.

---

## Stage 5 — Site Shell and Design System

**Status:** In progress (waiting on owner approval)

- [x] Typography
- [x] Colour palette
- [x] Buttons
- [x] Form controls
- [x] Responsive layout grid / containers
- [x] Image treatment (sizes, aspect ratios, optimization)
- [x] Header and navigation (desktop + mobile)
- [x] Footer
- [x] Homepage concept built
- [ ] Homepage direction approved by owner
- [x] Verified on desktop and mobile

**Working result:** The homepage and navigation work across desktop and mobile.

**Notes:**

- Old site's look kept: Playfair Display (headings) + Source Sans 3 (body, the renamed Source Sans Pro) via `next/font`; black / `#0f0f0f` backgrounds, `#f7f7f7` text, white headings and nav, teal `#61b5c7` accent only for menu labels/prices and footer headings/icons (old pink `#cc3366` and cream `#e5cfbd` not used). Styles in `src/app/(frontend)/globals.css`; sizes measured from the live site.
- Reusable classes for other pages: `.container` (1200px content), `.container-wide` (header/footer, grows to 1920px), `.section`, `.section-alt`, `.section-title`, `.divider`, `.eyebrow` / `.eyebrow-accent`, `.button` (white outline → filled on hover) / `.button-solid` (filled → outline on hover).
- Icons from `react-icons` (Font Awesome, same set as the old site). `components/SocialLinks.tsx` picks the Facebook/Instagram icon from the platform name in Site Settings.
- Hours entries have an optional `note` (migration `20261012_205633_hours_note`). Opening Hours is a single centred list using the shared `.leader-row` (name — line — teal value), same as the menu rows, instead of one card per day.
- Feature photos use a fixed 16:9 shape so neither photo's text ("events" left, "resto" right) is cropped at any width. Section/footer spacing and the photo banner height scale down on small screens.
- Top bar hidden below 768px and nav collapses to the hamburger at ≤1024px, both as on the old site.
- Header/footer in `src/app/(frontend)/components/`. Contact info, social links, hours read from Site Settings. Footer tagline and link lists are hard-coded (same as old site).
- Mobile nav is a CSS checkbox toggle (no JS); desktop dropdowns open on hover/focus.
- Images in `src/assets/` (logo + 4 photos downloaded from the old homepage), served via `next/image`. Old hero was a 2-image slideshow; only the first image is used.
- Homepage "Our Menu" dishes are hard-coded temporarily — replace with menu data in Stage 6. Obvious typos fixed (Wilted, dressing, tomato).
- Opening Hours section only renders once hours are entered in Site Settings.
- The old site's hidden "About us" section (zero height on the live page) was not carried over.
- Links to pages from Stage 7 (`/events`, `/gallery`, etc.) 404 until those pages exist.
- Old WordPress homepage contains injected casino/betting spam links (site likely compromised) — none copied.

---

## Stage 6 — Restaurant Menus

**Status:** In progress (built; waiting on admin-edit check and owner confirmation of items/prices)

- [x] Menus collection: `src/collections/Menus.ts` (one doc per menu: `dinner`, `brunch`)
- [x] Menu categories: `sections` array (+ "sub-group" option for Benedicts/Skillets/Shakshukas, description, note, section add-ons)
- [x] Menu items (name, description, price)
- [x] Availability flag: unticked items are hidden
- [x] Ordering (categories and items): drag-and-drop arrays
- [x] Variants (e.g. sizes / price options): `priceLabel` (10oz) and `variants` (Glass/Pitcher)
- [x] Simple add-ons: per item and per section
- [x] Restaurant menu seeded (live site content, typos fixed)
- [x] Brunch menu seeded (live site + BrunchMenuMay2025.pdf extras)
- [x] Public restaurant menu page: `/menu`
- [x] Public brunch menu page: `/brunch-menu`
- [~] Verified: editing a menu item in admin is immediately reflected publicly. Data changes show on the pages in dev, and `revalidatePath` hooks are in place for production (pages are prerendered). Still to do: an edit through the admin UI with a real login.

**Working result:** An administrator can edit a menu item and the public website immediately reflects it.

**Notes:**

- Homepage "Our Menu" now reads dinner items flagged "Show on homepage" (Popular Dishes / Our Recommendation), which replaces the hard-coded list and its wrong prices.
- All content decisions (category moves, typo fixes, hidden House Speciality) are listed in [old_site_inventory.md](old_site_inventory.md) for owner sign-off.
- Brunch PDF uploaded to Media and linked as "Download Brunch Menu".
- Admin array rows show their title/name (`src/components/admin/RowLabel.tsx`).

---

## Stage 7 — Remaining Public Pages

**Status:** In progress (Weddings & Corporate not started; forms are placeholders)

- [x] Events: `/events` (old copy, event types, photos flagged in the Gallery, CTA)
- [~] Weddings and Corporate Events: `/weddings-corporate` designed (structure inspired by the aeventspace.com page the owner liked; weddings first). Copy uses only facts La Veranda already publishes; owner must confirm before launch (see `old_site_inventory.md`)
- [x] Specials: `specials` collection + `/specials` (cards, or a "nothing scheduled" message)
- [x] Gallery: `gallery` global + `/gallery` (grid + keyboard-accessible lightbox)
- [~] Contact: `/contact` with a working "Let's Talk" form (server-validated, honeypot, 5 per 10 min per IP) saving to the `contact-messages` collection (admin → Inbox). Still to add: email notification to the restaurant + Turnstile (Stage 10)
- [x] Reservations information: `/reservations` (phone/email only, links to `/book-an-event`)
- [~] Basic editable content blocks where useful: menus, specials, gallery, site settings editable; page copy is still in code
- [~] All pages linked in navigation and responsive: no horizontal overflow at 375px on any page; nav link to `/weddings-corporate` shows the 404 page until it exists

**Working result:** The complete public website works with temporary or final content.

**Notes:**

- The event request form slot is on `/events` (`#book-an-event`, dashed "Coming soon" placeholder offering email/phone); `/book-an-event` redirects there. The real form is Stages 8–10.
- Each inner page uses its old-site banner photo; see the table in `old_site_inventory.md`.
- No privacy page: the old site had none (decide with owner before forms go live).
- Inner pages share `components/PageBanner.tsx` (the old site's darkened room photo + white title).
- Branded `not-found.tsx` + `error.tsx`; `[...slug]/page.tsx` sends unknown URLs to the branded 404 (real 404 status).
- Per-page `<title>` via a `%s | <restaurant name>` template.

---

## Stage 8 — Event-Menu Data Model

**Status:** Not started

- [ ] Event packages
- [ ] Selectable options per package/category
- [ ] Selection limits (min/max per category)
- [ ] Upcharges
- [ ] Extras
- [ ] Adult and child pricing
- [ ] "To be decided" selections
- [ ] Submission snapshot structure for historical prices (`priceAtSubmission`, etc.)
- [ ] Current event menu seeded
- [ ] Verified: every confirmed option from the current event form (see `docs/event_contract/`) can be represented

**Working result:** Payload can represent every confirmed option from the current event form.

**Notes:**

---

## Stage 9 — Event-Request Submission

**Status:** Not started

- [ ] Event request collection
- [ ] Public form: customer details
- [ ] Public form: date and time
- [ ] Public form: guest counts (adult / child)
- [ ] Public form: menu choices (respecting selection limits)
- [ ] Public form: extras
- [ ] Public form: notes
- [ ] Server-side validation of all input
- [ ] Authoritative server-side price lookup (never trust client prices)
- [ ] Price snapshot stored with the request
- [ ] Cloudflare Turnstile
- [ ] Rate limiting
- [ ] Request saved as `PENDING` before any external service is called
- [ ] Verified: valid submission appears in admin
- [ ] Verified: invalid submissions are rejected with clear errors

**Working result:** A customer submits a valid request and an administrator can see the saved record.

**Notes:**

---

## Stage 10 — Request Summaries, Email, and PDF Generation

**Status:** Not started

- [ ] Summary generated from saved snapshot data (not live menu data)
- [ ] Event-request PDF generated
- [ ] Customer confirmation email via Resend
- [ ] Restaurant notification email via Resend
- [ ] PDF attached to emails
- [ ] Email delivery success/failure recorded on the request
- [ ] Email failure never deletes or rolls back the request
- [ ] Verified: admin view, email, and PDF show matching information
- [ ] Verified: simulated email failure leaves the request stored with failure recorded

**Working result:** A submission remains safely stored and produces matching admin, email, and PDF information.

**Notes:**

---

## Stage 11 — Administrative Event Workflow

**Status:** Not started

- [ ] View requests (list + detail)
- [ ] Edit requests
- [ ] Record changes agreed upon by email (notes / change history)
- [ ] Approve
- [ ] Decline
- [ ] Cancel
- [ ] Invalid status transitions blocked server-side (`PENDING → APPROVED | DECLINED`, `APPROVED → CANCELLED` only)
- [ ] Upcoming approved events view
- [ ] Verified: request can be managed from submission through approval or rejection

**Working result:** Restaurant staff can manage a request from submission through approval or rejection.

**Notes:**

---

## Stage 12 — Google Calendar Integration

**Status:** Not started

- [ ] Google service account / credentials configured (secrets in env only)
- [ ] Calendar event created on approval
- [ ] Google Calendar event ID stored on the request
- [ ] Existing calendar event updated when request details change
- [ ] Calendar event removed/cancelled when request is cancelled
- [ ] Repeated approval is idempotent (no duplicate events)
- [ ] Calendar failures recorded without breaking the request workflow
- [ ] Verified: one request ↔ exactly one calendar event across approve, edit, re-approve, cancel

**Working result:** The website reliably controls one corresponding calendar event.

**Notes:**

---

## Stage 13 — Restaurant-Hours Integration

**Status:** Not started

> Kept separate so Google approval cannot block launch.

- [ ] Google Business Profile API access requested
- [ ] Hours fetched from Google Business information (if approved)
- [ ] Payload-managed hours used as fallback
- [ ] Fallback verified when Google integration is unavailable

**Working result:** Hours display reliably whether or not the Google integration is available.

**Notes:**

---

## Stage 14 — SEO, Accessibility, and Migration

**Status:** Not started

### SEO

- [ ] Page titles
- [ ] Meta descriptions
- [ ] Canonical URLs
- [ ] Sitemap
- [ ] Robots configuration
- [ ] Restaurant structured data (JSON-LD)

### Accessibility and quality

- [ ] Image optimization
- [ ] Alt text on all meaningful images
- [ ] Keyboard support (nav, forms, menus)
- [ ] Responsive checks across breakpoints
- [x] Error pages (404, 500): branded 404 verified; error page not triggered yet

### Migration

- [ ] Redirects for important old URLs implemented
- [ ] Obsolete WordPress commerce/spam routes excluded (return 404/410, not redirected)
- [ ] Redirect map verified

**Working result:** The site is search-ready, accessible, and preserves important existing URLs.

**Notes:**

---

## Stage 15 — Production Testing and Launch

**Status:** Not started

### Functional testing

- [ ] Authentication
- [ ] Menu editing
- [ ] Event submissions
- [ ] Invalid input
- [ ] Email failure
- [ ] Approval
- [ ] Repeated approval
- [ ] Calendar updates
- [ ] Cancellation

### Production readiness

- [ ] Production credentials verified
- [ ] DNS configured
- [ ] HTTPS working
- [ ] Persistent uploads (media survives redeploys)
- [ ] Database backups configured
- [ ] Restore procedure tested and documented

### Launch

- [ ] Domain pointed to Railway
- [ ] Redirects verified on production domain
- [ ] Forms verified on production domain
- [ ] Sitemap submitted to Google Search Console
- [ ] WordPress retired

**Working result:** The new site is live on the production domain and WordPress is retired.

**Notes:**

---

## Blockers & Open Questions

| Date | Stage | Question / Blocker | Waiting on | Resolved? |
| ---- | ----- | ------------------ | ---------- | --------- |
| 2026-11-17 | 1, 6 | Confirm dinner/brunch items, prices and the category moves listed in `old_site_inventory.md` | Owner | No |
| 2026-11-17 | 1, 4 | Correct opening hours (4 conflicting versions) | Owner | No |
| 2026-11-17 | 7 | Weddings & Corporate content (services, capacity, photos) | Owner | No |
| 2026-11-17 | 7 | Privacy policy wanted? (none on old site) | Owner | No |
| 2026-11-17 | 7 | Current specials to publish | Owner | No |
| 2026-11-18 | 6 | Confirm the two unclear prices on the photographed brunch menu (Double B "add jar of jam +1"?, Steak & Eggs 35?) | Owner | No |
| 2026-11-18 | 7 | Salsa Night start time and description (site shows the day only for now) | Owner | No |
| 2026-11-18 | 6 | Dinner menu PDF (button shows "Coming soon" until uploaded) | Owner | No |

---

## Decisions Log

| Date       | Decision                                                                 | Reason                                   |
| ---------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| 2026-10-12 | Stack: Next.js, TypeScript, Payload CMS, PostgreSQL, hosted on Railway   | Per project roadmap                      |
| 2026-10-12 | V1 event statuses limited to PENDING, APPROVED, DECLINED, CANCELLED      | Per `clarification_questions.md` §10     |
| 2026-10-12 | Single administrator role for V1                                         | Per project roadmap                      |
| 2026-11-17 | Menus = one collection doc per menu with nested sections/items arrays     | Drag-to-reorder in admin; no separate sortOrder fields |
| 2026-11-17 | Gallery is a global (ordered images array), specials a collection        | Gallery is one ordered list; specials come and go |
| 2026-11-17 | Seed only adds missing data; reset/test-DB via `scripts/db-reset.mjs`    | Re-running the seed never overwrites admin edits |
| 2026-11-17 | Uploads folder set by `MEDIA_DIR` (`media/` dev, `media-test/` test)     | Keeps test uploads apart from dev ones |
| 2026-11-17 | `/reservations` = phone/email info; event requests on `/events`          | Scope §21: no table reservations online |
| 2026-11-17 | Contact messages are stored in the DB (`contact-messages`) before email exists | Form works now; email notification added in Stage 10 |
| 2026-11-17 | Weddings page shows no prices; links the Group Menu PDF instead          | One source of truth; prices still unconfirmed |
| 2026-11-17 | Event request form lives on `/events` (`#book-an-event`); `/book-an-event` 308-redirects there | User: booking belongs on the Events page, as on the old site |
| 2026-11-18 | Event contract form is a light "paper" card on the dark page | Long form is easier to read and fill in dark-on-light; matches the printed menus |
| 2026-11-18 | Page-end CTAs: one shared look (fixed darkened photo, solid main button + outline alternative) | User asked for consistent CTA sections |
| 2026-11-18 | Specials can repeat weekly or monthly (e.g. last Friday); past one-time specials hide themselves | Salsa Night runs the last Friday of every month |

---

## Progress Log

Newest entries first.

| Date       | Stage | Summary of work                          | By    |
| ---------- | ----- | ---------------------------------------- | ----- |
| 2026-11-19 | 8–14 | Admin redesign (bookings-first dashboard with the requests list + full-height Coming up panel, request page top bar with actions next to Save, booking-summary Overview, contact messages inbox, light mode, sidebar logo); request sorting pending-first; calendar fixed (GOOGLE_CALENDAR_ID → booking@); restaurant email made safe to reply to (no admin link); Google hours work with just an API key (`npm run check:google-hours`); old-site redirects. Full test run: 41 validator cases, real form/contact submits, honeypot, spam limits, every status change, edits, notes, resend, PDF, delete, 18 signed-out API checks, all pages at 390/1366px, links, fresh-database migrations, production build. Fixed: Feb 30 accepted, line breaks in one-line fields, spam limit counting failed tries, bad-status crash, repeat approvals, false 'Menu selections updated' history, orphaned calendar events on delete. | Agent |
| 2026-11-18 | 6, 7 | Feedback round 3: dinner + brunch menus replaced from the restaurant's printed menus (47 + 52 items, seed + dev DB); "Download Dinner Menu" placeholder button; gallery full width, always 3 columns (uneven ends instead of heavy crops), slow 1s zoom without dimming; homepage photo as a fixed "window"; nav dropdown closes after choosing a page; Events and Weddings photos as a carousel (4/3/2 across, autoplay, arrows, dots); event form on a light paper card; repeating specials (weekly / monthly e.g. last Friday, + migration) with Salsa Night seeded; consistent CTA sections; footer menu links fixed for the new sections. Verified tsc, lint, prettier, build, desktop + 390px, repeat rules. | Agent |
| 2026-11-17 | 8–12 | Event request workflow (branch `event-request-workflow`): Event Menu & Form global (seeded from old form), Event Requests collection (#4834+, Pending/Approved/Declined/Cancelled rules, plain-language History, internal notes), form on `/events` (server validation, price snapshot, honeypot, rate limit, Turnstile), booking-summary PDF, customer + restaurant emails via Gmail SMTP (Reply-To customer), contact form emails, Google Calendar sync (approve/edit/cancel, idempotent event id), switchable Google hours, La Veranda admin (dashboard, request overview with Approve/Decline/Cancel, logo). Verified: submit → saved → both emails sent; PDF; status rules; History; 401 when signed out. Calendar success path waits on enabling the Calendar API. | Agent |
| 2026-11-17 | 6, 7  | Feedback round 2: darker photo CTAs; menus in two balanced columns (sections kept whole, best split chosen); gallery filter tabs (View All/Food/Events/Restaurant, sliding teal underline) + flat-bottom masonry + photo CTA; gallery `category` field (+ data migration); Contact: new dining-room banner, working "Let's Talk" form → `contact-messages`, full-width map; new `/weddings-corporate` page; weddings teaser on `/events`. Verified build, desktop + 375px, form validation/save/API lockdown. | Agent |
| 2026-11-17 | 6, 7  | Design feedback round: per-page banners from the old site; statement-photo CTAs; two-column menus (sections paired like the old site); Events page full-width intro, event types in 2 rows × 5, Group/Brunch menu downloads, event request placeholder moved onto `/events#book-an-event` (`/book-an-event` now redirects); masonry gallery; Contact page uses shared `VisitUs`; plain social icons in footer. Added Site Settings → Event group menu (PDF) + migration. Verified build, desktop + 375px. | Agent |
| 2026-11-17 | 1, 6, 7 | Inventoried old site; added Menus/Specials/Gallery (+ migration), seed, `db:reset`, `db:test:setup` (`laveranda_test`); built `/menu`, `/brunch-menu`, `/events`, `/specials`, `/gallery`, `/contact`, `/reservations`, `/book-an-event` (form placeholder), branded 404/error; homepage dishes from DB; `.gitignore` excludes `tmp/`, `docs.zip`. Verified tsc/lint/prettier/build, all pages desktop + 375px, lightbox keyboard. | Agent |
| 2026-11-17 | —     | Full project audit; status written to [status_report.md](status_report.md). Re-verified lint/tsc/Prettier, migrations, admin login, public API lockdown; all pages except `/` still 404. No code changes. | Agent |
| 2026-10-12 | 5     | Hours section became "Visit Us": contact info + Google Map embed + Get Directions/Book buttons (left), hours (right). Contact list shared with footer (`components/ContactList.tsx`). | Agent |
| 2026-10-12 | 5     | Feature photos uncropped (16:9), smaller mobile spacing, hours as a leader-line list, hero text re-centred. | Agent |
| 2026-10-12 | 5     | Restyled to match the live site: white text/nav, outline + solid buttons, wide header/footer, scaling logo, icons, equal feature images, menu leader lines, white hours cards, footer accents. | Agent |
| 2026-10-12 | 5     | Built header, footer, design styles and homepage from the old site (teal accent, photos downloaded). Stage 4 verified via phone edit. | Agent |
| 2026-10-12 | 4     | Added Site Settings global (+ migration); replaced Payload starter homepage with a plain settings page. | Agent |
| 2026-10-12 | 3     | Added `authenticated` access helper, applied to Users; verified public API access is blocked. | Agent |
| 2026-10-12 | 2     | Scaffolded Next.js + Payload + Postgres; lint/format/migrations set up; verified locally. Railway deferred. | Agent |
| 2026-10-12 | —     | Created project progress tracker         | Agent |
