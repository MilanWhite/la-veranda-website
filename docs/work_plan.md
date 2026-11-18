# La Veranda: Work Plan Without Owner Input

**Date:** 2026-11-17
**Purpose:** list everything that can be built now and how to build it. Anything the owner hasn't confirmed goes in as **placeholder data in the database or an env variable, never in code**, so the owner's later answers become admin edits or `.env` changes and no code needs rewriting.

Companion docs: [status_report.md](status_report.md) (current state) · [project_progress.md](project_progress.md) (tracker).

---

## Ground rules for placeholders

| Unknown | Placeholder now | How it gets swapped later |
| --- | --- | --- |
| Sending email account | Your personal Gmail via SMTP + app password | Change `SMTP_*` / `EMAIL_FROM` in `.env` |
| Restaurant hours | The current Site Settings values | Edit in admin |
| Dinner / brunch menus | Seeded from the existing PDFs/website (typos fixed) | Edit in admin |
| Event menu, prices, rules | Seeded from the old Event Contract form | Edit in admin |
| Event-request recipients | Your email in Site Settings → Internal | Edit in admin |
| Google Calendar | A test calendar in your own Google account + your own Cloud project | Change `GOOGLE_*` env and the calendar ID in admin |
| Turnstile | Cloudflare's official **test keys** | Real keys in `.env` |
| Weddings & Corporate copy, specials, privacy text | Draft copy from the old site, stored in the CMS and marked as draft | Owner edits in admin |
| Photos | The 5 current assets + old-site images | Upload new ones in admin |

Add a `confirmed` (checkbox) or `placeholder` note where useful, so you and the owner can see which data still needs sign-off.

---

## Phase 0: Housekeeping (do first, ~1 hour)

1. **Fix `.gitignore`**: add `tmp/`, `docs.zip`, `/media`, `.claude/settings.local.json`. Optionally delete the duplicate `docs/menu/BrunchMenuMay2025 (1).pdf`.
2. **First commit and push** to `origin` (`github.com/MilanWhite/la-veranda-website`). After that, commit at the end of each phase.
3. **Hide the Next dev badge** (`devIndicators: false` in `next.config.ts`) so the admin sign-out button is reachable.
4. **Add env vars to `.env.example`** as each phase needs them (without values):
   `NEXT_PUBLIC_SERVER_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `DATABASE_URL_TEST`.

---

## Phase 1: Databases (dev + test)

**Already done:** the dev database `laveranda` exists on your local PostgreSQL 17 and all migrations are applied. You do **not** need to create it.

Still to do:

1. **Seed script** (`src/seed/index.ts`, run with `npm run seed` → `payload run src/seed/index.ts`). It fills Site Settings, menus, event menu, a sample special and gallery items. Make it **idempotent** (upsert by slug/name) so it can be re-run safely.
2. **Reset script** (`npm run db:reset`): drop all tables (`payload migrate:fresh`), re-run migrations, re-seed. This gives a clean database in one command.
3. **Separate test database** `laveranda_test` for automated tests, so tests never touch your dev data. Payload creates the database automatically if `DATABASE_URL_TEST` points to one that doesn't exist; otherwise run `createdb -U postgres laveranda_test`.
4. **Document both in the README**, covering a fresh machine: install PostgreSQL 17, set `.env`, `npm run migrate`, `npm run seed`.
5. Rule that still applies: every collection/global change needs `npm run migrate:create` + `npm run migrate`, and the migration file must be committed.

---

## Phase 2: Menus (Stage 6)

### Data model
A `menus` collection with one document per menu (`dinner`, `brunch`). Payload arrays give drag-and-drop ordering, so there is no manual `sortOrder`.

```
Menu
  title, slug (dinner | brunch), intro, pdf (upload, optional "Download menu")
  sections[]                     e.g. Dips, Pasta, Benedicts
    title, note ("All pasta made in-house"), description ("served on an english muffin…")
    items[]
      name, description, price (number, optional)
      priceLabel (text, optional)      e.g. "10oz"
      variants[]  {label, price}       Striploin 10oz $42 / 12oz $55; Mimosa glass/pitcher
      addOns[]    {label, price}       "Add grilled chicken or shrimp +$8", "add egg +$2"
      available (checkbox, default true)
      featured  (checkbox)             shows on the homepage "Our Menu" section
      featuredGroup (select: Popular Dishes | Our Recommendation)
```

Brunch sub-groups (Benedicts, Skillets, Shakshukas, Pies) work as their own sections with a `description`. Access: public read, write requires sign-in.

### Seed data (placeholder = current content)
- **Dinner:** from `Menu – La Veranda Restaurant.pdf`, 8 sections: Dips, Bistecca, Pasta, Carne, Insalate, Main, Pizzas, Antipasto. Fix the typos. Leave "House Speciality" without a price, marked unavailable until confirmed.
- **Brunch:** use **`BrunchMenuMay2025.pdf`** (it is the more complete one: Pies, add-ons, pitchers, ribeye option). Put Mortadella under Pizza as in the PDF.
- Upload the brunch PDF to Media and link it as the downloadable menu.

### Pages
- `/menu` and `/brunch-menu` are server components that read from Payload and reuse `.leader-row`. Each section gets an `id` anchor (`/menu#pasta`). Variants show as "10oz $42 · 12oz $55", and add-ons as small teal lines. Unavailable items are hidden.
- Homepage "Our Menu" reads `featured` items, so the hard-coded list in `page.tsx` and the $6/$9 Hummus mismatch go away.
- Footer "Menu" links point to the anchors.
- Freshness: use `revalidatePath` in an `afterChange` hook (or render dynamically) so admin edits show up immediately.

---

## Phase 3: Remaining public pages (Stage 7)

Shared pieces: a **page banner** component (title and background image, like the old site), and per-page `metadata`.

| Page | Content now (placeholder) | Editable from admin? |
| --- | --- | --- |
| `/events` | Old copy ("one of Woodbridge's original and historic event venues…"), event-type list, "Our Events" photo strip, "Book Your Event" CTA, download links (brunch menu PDF; event menu shown on `/book-an-event`) | Yes: `events-page` global (intro rich text, event types array, photos) |
| `/weddings-corporate` | Draft built only from what the old site already says (indoor + outdoor spaces, transformable room, event types). Sections: hero, "Weddings", "Corporate", "The Space", gallery strip, CTA. **No invented claims** (no capacity numbers, no entertainment lists). | Yes: `weddings-page` global with rich text per section, so the owner fills in the gaps |
| `/specials` | `specials` collection: title, description, image, date (optional), active, CTA label/link. Page lists active ones and shows a friendly empty state ("No specials right now, follow us on Instagram"). Seed 1 sample special set to inactive. | Yes |
| `/gallery` | `gallery` collection (or a `gallery` global with an images array): image upload + alt text + order. Grid + lightbox (small client component with keyboard support: Esc/←/→). Seed with the 5 existing photos + old-site images. | Yes |
| `/contact` | Contact list, map, hours (reuse homepage pieces) + contact form (Phase 5) | Info from Site Settings |
| `/reservations` | Info only: "For table reservations call (905) 605-5055 or email…", reusing the old "Book Your Reservation" copy, plus a separate CTA to `/book-an-event` for private events | Yes: rich text in a `reservations-page` global, or Site Settings |
| `/book-an-event` | Event request form (Phase 4) | Menu/prices from event menu global |
| `/privacy` | Generic draft privacy policy: what the forms collect, why, the email contact for deletion. Write it to suit PIPEDA (Canada). | Rich text global |
| 404 / error | `app/(frontend)/not-found.tsx` and `error.tsx` in site styling | — |

Also needed:
- **Old-site images:** allow `laverandaresto.com` in the browser pane (it was refused today) or download them manually. Grab the gallery, the 3 event-room photos and the second hero slide. Run them through `next/image` from Media uploads.
- **Move hard-coded homepage copy** (hero text, feature paragraphs, footer tagline) into a `home-page` global. This is optional but makes it owner-editable.

---

## Phase 4: Event request system (Stages 8–9): the form that goes to the owner

### 4a. Event menu global (`event-menu`), seeded from the old Event Contract
All of these are editable data. None are hard-coded.

```
adultPrice 73, kidPrice 30, spaceFeePercent 18, includedHours 4, extraHourPrice 10
taxNote "plus taxes", depositText, intro text
eventTypes[]          Corporate, Weddings, Confirmations, Engagements, Communions,
                      Bridal Showers, Sweet 16's, Baptisms, Birthdays, Other
timeSlots: earliest 09:00, latest 22:00, step 30 min
sections[]
  key, title, description
  type: multi | single | text            (starters=multi, penne=single, risotto=text)
  min, max                               (starters 4/4 = "exactly 4")
  allowToBeDecided (checkbox)            (mains = true)
  appliesTo: adults | kids
  options[] {name, upcharge, upchargeUnit: perPerson | perEvent, available}
  textOptionUpcharge                     (risotto +$5)
extras[] {name, price, unit: perEvent | perAdult, available}
choices[] (simple radios)  Wine service: waiter | on table;  Alcohol: open bar | pay per consumption
pricingNotes[]  (the "Pricing & Notes" bullet list shown on form, email and PDF)
```

Default assumption until confirmed: upcharges are **per person** and labelled as such. This is one field to change if the owner says otherwise.

### 4b. `event-requests` collection
```
requestNumber (auto, e.g. 1001+; shown as "#1001")
status: PENDING | APPROVED | DECLINED | CANCELLED (default PENDING)
customer: nameOrCompany, contactPerson, address, email, phone
event: type, date, startTime, endTime, adults, kids
selections: snapshot JSON/array: [{section, choices:[{name, upchargeAtSubmission, unit}], toBeDecided}]
extras: snapshot [{name, priceAtSubmission, unit}]
choices: wineService, alcohol
pricingAtSubmission: {adultPrice, kidPrice, spaceFeePercent, includedHours, extraHourPrice}
estimate (optional, informational): computed server-side, clearly "estimate before tax"
depositAcknowledged, notes
internalNotes[] {note, author, date}     ← record what was agreed by email
email: customerStatus, ownerStatus, lastError, sentAt
calendar: eventId, syncStatus, lastError
submittedFromIp (hashed) / userAgent     (for abuse handling; optional)
```
- **Access:** public `create: false` (submissions come only through the server action using `overrideAccess`). Read, update and delete require sign-in.
- **Status rules** in a `beforeChange` hook: only `PENDING→APPROVED`, `PENDING→DECLINED` and `APPROVED→CANCELLED` are allowed, otherwise an error is thrown. Snapshot fields are read-only in the admin.

### 4c. The public form (`/book-an-event`)
- A client component for interactivity: it disables starters after 4, toggles the mains between "Chosen" and "To be decided", shows "max 4 hrs" if the end time exceeds it, and shows a live estimate. It submits to a **Next.js server action**.
- **Server action** (the authoritative path, in this order):
  1. Rate-limit by IP (in-memory sliding window is fine for a single Railway instance, e.g. 5 per 10 min).
  2. Verify the Turnstile token. A hidden honeypot field also catches bots.
  3. Validate the shape with **zod** (add as a dependency): required fields, email/phone format, date in the future, end after start, guests ≥ 1.
  4. Load the `event-menu` from the DB and check every option ID exists and is available, plus min/max per section and TBD rules. **Prices come from the DB, never from the browser.**
  5. Build the snapshot and estimate, then **save as PENDING**.
  6. Send the emails (Phase 5) and record the result on the request. A failure is recorded and never rolls back the save.
  7. Return the success message: "Your event request has been received. This does not confirm your booking…"
- Errors return per-field messages and the form keeps what the user typed.

---

## Phase 5: Email, PDF and the owner conversation (Stage 10)

### Email transport (works with your personal email today)
- Add `@payloadcms/email-nodemailer` and configure `email:` in `payload.config.ts` from the `SMTP_*` env vars. Admin "Forgot password" then starts working too.
- **Gmail placeholder:** turn on 2-Step Verification, create an App Password, and set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`/`EMAIL_FROM` = your Gmail, `SMTP_PASS` = the app password. Only send to your own test addresses while it's your account.
- Swapping later: if the owner chooses Gmail or Workspace, only the env changes. If they choose Resend, add `@payloadcms/email-resend` behind the same `sendEmail` helper.
- For offline dev you can also point SMTP at **Mailpit** (local fake inbox) so you don't need internet or spam your inbox.

### One source for summaries
`buildRequestSummary(request)` returns ordered `[label, value]` rows, built **from the saved snapshot only**. The admin view, both emails and the PDF all render from it, so they always match.

### Emails (simple HTML templates; React Email optional)
| Email | To | From | Reply-To | Content |
| --- | --- | --- | --- | --- |
| Customer confirmation | customer | `EMAIL_FROM` | restaurant email (Site Settings) | "Thank You For Your Request", summary table, pricing notes, PDF attached, "This does not confirm your booking" |
| Owner notification | Site Settings → Internal → recipients (your email for now) | `EMAIL_FROM` | **customer's email** | "New event request #1001", summary, link to `/admin/collections/event-requests/<id>`, PDF attached |

**This is how the owner continues the conversation:** they press Reply on the notification, which goes straight to the customer. Later they open the admin link, add an internal note about what was agreed, edit details and approve.

Optional, still V1-sized: a status-change email to the customer on Approved/Declined/Cancelled.

### PDF
- Use **`@react-pdf/renderer`** (pure JS, no headless browser, so it runs fine on Railway).
- Layout copies `Booking-Summary-Request-4833.pdf`: logo, "Booking Summary Request #1001", two-column table, Pricing & Notes, footer note "Exact totals depend on final guest counts…".
- Generated on demand from the snapshot. Attach it to both emails, and add a "Download PDF" button in the admin (a protected route `/api/event-requests/:id/pdf` that checks the user is signed in).

---

## Phase 6: Admin workflow (Stage 11)

- **Event Requests list:** columns #, status, date, customer, guests, type. Default sort by newest. Filter by status.
- **Request detail:** a custom UI field at the top showing the formatted summary and the action buttons **Approve / Decline / Cancel** (only the valid ones appear). Each button sets the status through the API, and the server hooks enforce the rules.
- **Internal notes** array for what was agreed by email; editable event fields (date, times, guests, notes) for agreed changes.
- **Upcoming approved events:** a custom admin view (`/admin/upcoming`) or a dashboard widget listing APPROVED requests with date ≥ today.
- **Dashboard:** replace Payload's default with counts of new pending requests, the next upcoming events, and quick links (Menus, Specials, Site Settings).
- **Branding:** La Veranda logo/icon on the login and nav via `admin.components.graphics`. Group the sidebar into "Events", "Menus", "Website", "Settings".
- Keep it simple, with no roles, audit UI or CSV export (per scope).

---

## Phase 7: Contact form (scope §22; missing from tracker)

- Fields: Name, Email, Phone (optional), Message, plus Turnstile and a honeypot.
- Server action: rate-limit, then verify Turnstile, then validate with zod, then email the restaurant (Site Settings email, Reply-To = sender), then show a thank-you message.
- Storing messages in the DB is optional. A small `contact-messages` collection is a cheap safety net if email fails.

---

## Phase 8: Spam protection & security

- **Turnstile:** use Cloudflare's always-pass test keys locally (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`) and verify server-side at `challenges.cloudflare.com/turnstile/v0/siteverify`. Real keys come later and are free.
- **Rate limiting:** a shared helper used by both forms.
- **Headers:** add basic security headers in `next.config.ts` (X-Frame-Options/CSP frame-ancestors, Referrer-Policy, X-Content-Type-Options).
- **Secrets:** check that none are exposed to the browser (only `NEXT_PUBLIC_*` reach it).
- **Payload hardening:** decide on the GraphQL playground (disable it in production), set `serverURL`/`cors`/`csrf` from `NEXT_PUBLIC_SERVER_URL`, and set the admin lockout settings (`maxLoginAttempts`, `lockTime`) on Users.

---

## Phase 9: Google Calendar (Stage 12): doable now with your own Google account

1. In your own Google Cloud project, enable the Calendar API and create a **service account** + JSON key, stored in `.env` as `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`.
2. Create a test calendar in your Google Calendar, share it with the service account email ("Make changes to events"), and put its ID in Site Settings → Internal.
3. Use the `googleapis` package (or a JWT + REST call) in an `afterChange` hook on event-requests:
   - → APPROVED: `events.insert` with a **deterministic event ID** derived from the request ID, which makes repeat approvals idempotent (a 409 means it already exists, so update instead). Store `calendar.eventId`.
   - APPROVED + details edited: `events.patch`.
   - → CANCELLED: `events.delete`.
   - Errors are saved to `calendar.syncStatus/lastError` and never block the status change. Add a "Retry calendar sync" button.
   - Timezone `America/Toronto`. Never add the customer as an attendee.
4. Moving to the owner later means a new key + calendar ID only.

---

## Phase 10: Restaurant hours (Stage 13): build now, enable later

- Code path: if `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` are set, fetch `regularOpeningHours` from Places API (New) and cache it for 24h (`fetch` with `next: { revalidate: 86400 }`). Otherwise, or on any error, use the Site Settings hours.
- You can test with your own key, but it needs a billing account, so set a quota cap. Or leave the env empty, which keeps the current behaviour.

---

## Phase 11: SEO, accessibility, migration (Stage 14)

- `metadataBase` from `NEXT_PUBLIC_SERVER_URL`, a unique `title`/`description` per page (template "%s | La Veranda"), canonical URLs, and Open Graph using the Site Settings share image.
- `app/sitemap.ts` (all public pages) and `app/robots.ts` (disallow `/admin`, `/api`).
- **Restaurant JSON-LD** in the layout: name, address, phone, URL, `servesCuisine`, `hasMenu`, `openingHoursSpecification` from hours, sameAs (socials).
- **Redirects** in `next.config.ts` `redirects()` (permanent): the old pages keep the same URLs (`/menu/`, `/brunch-menu/`, `/events/`, `/book-an-event/`, `/gallery/`, `/contact/`, `/reservations/`, `/specials/`), so mostly only trailing-slash handling is needed (`trailingSlash` choice) plus any others found in the inventory.
- **Gone routes:** middleware returning **410** for `/shop`, `/cart`, `/checkout`, `/my-account`, `/payment`, `/product/*`, `/wp-admin`, `/wp-login.php`, `?p=` spam patterns.
- **Old URL inventory:** fetch `https://laverandaresto.com/wp-sitemap.xml` (or `/sitemap_index.xml`) once browser access is allowed, and save the list to `docs/url_inventory.md`.
- **Accessibility:** visible focus styles (inputs currently remove the outline), a skip-to-content link, `aria-expanded` on the mobile nav, alt text on all Media (already required), labels on every form field, error messages linked via `aria-describedby`, and a contrast check of teal on black.
- **Responsive check** of every new page at 375 / 768 / 1024 / 1440.

---

## Phase 12: Tests (scope §27, kept small)

- **Vitest** unit tests: event validation (exactly 4 starters, TBD rules, unavailable option rejected), estimate calculation, status-transition rules, summary builder.
- **Integration tests** against `laveranda_test` using Payload's Local API:
  - A valid submission saves as PENDING with a snapshot.
  - An invalid one is rejected.
  - A client-sent price or status is ignored.
  - A mocked email failure keeps the request with the failure recorded.
  - Unauthenticated REST calls to `/api/event-requests` get 403.
  - Approve twice gives one calendar event (mocked Google client).
- One manual end-to-end checklist in `docs/` for pre-launch.

---

## Phase 13: Deployment prep (Stage 2 remainder + 15): mostly doable now

- **Media storage:** Railway's disk is wiped on redeploy. Choose either a **Railway volume** mounted at `/media` (simplest) or `@payloadcms/storage-s3` with Cloudflare R2. Set it up behind env so local still uses disk.
- **Production build check:** `npm run build && npm start` locally with `NODE_ENV=production`.
- **Migrations on deploy:** start command `npm run migrate && npm start` (or Payload's `prodMigrations`).
- **Optional demo deploy** to your own Railway trial account. This gives the owner a link to approve the homepage and review pages without waiting for their account. Move it to their account later.
- Write `docs/deployment.md`: env vars, Railway setup, backups, restore steps, DNS cut-over checklist (**leave the MX records alone**).

---

## Phase 14: Docs to keep current

- Update `project_progress.md` after every session (its own rules).
- Add the Blockers table rows for every owner question (they're currently only in the meeting agenda).
- README: seed/reset/test commands and the new env vars.

---

## What genuinely still needs the owner (can't be avoided)

These don't block building. They only block **launch**:
1. Confirming menus, event prices/rules and hours (these become admin edits).
2. Their real sending email account + DNS records (SPF/DKIM) for it.
3. Railway (or other) billing account, domain/DNS access, Google Business Profile access, their Google Calendar.
4. Real Weddings & Corporate content, specials and photos; approval of the homepage.
5. Who else gets admin access.
6. Retiring the hacked WordPress site.

---

## Suggested order

0 Housekeeping → 1 Seed/reset/test DB → 2 Menus → 3 Pages → 4 Event form + data → 5 Email/PDF (your Gmail) → 6 Admin workflow → 7 Contact form → 8 Spam/security → 9 Calendar (your Google) → 10 Hours fallback → 11 SEO/a11y/redirects → 12 Tests → 13 Deploy prep/demo.

New dependencies this plan adds: `zod`, `@payloadcms/email-nodemailer` (+ `nodemailer`), `@react-pdf/renderer`, `googleapis` (or a light JWT client), `vitest`, and optionally `yet-another-react-lightbox`, `@payloadcms/storage-s3`.
