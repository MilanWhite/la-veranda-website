# La Veranda Rebuild — Simplified Clarification & Scope

## Purpose

This document keeps the project intentionally small and focused.

This is **not** an e-commerce platform, CRM, ERP, banquet-management system, or SaaS product.

V1 is a restaurant website with a small administration system for:

- Dynamic restaurant and event menus
- Event request submissions
- Simple request review and approval
- Customer/admin email summaries
- One event-summary PDF
- Google Calendar integration
- Restaurant hours
- Basic website content management

Future features should remain future scope unless explicitly added.

---

# 1. Core Project Decisions

## Ownership & Development

**Client / owner:** Elie Daher, owner of La Veranda.

**Developer:** One developer responsible for building the replacement site.

**Maintenance:** The developer will maintain the code after launch. Production hosting and service accounts should remain under La Veranda's control where practical.

**Timeline:** No hard deadline. Target completion is approximately one month.

**Location:** One restaurant location only. No multi-location support is required.

---

# 2. Technology

Use:

```text
Next.js
React
TypeScript
Payload CMS
PostgreSQL
Resend
Google Calendar API
Google business-hours integration
Cloudflare Turnstile
```

Recommended initial hosting:

```text
Railway
├── Next.js + Payload
└── PostgreSQL
```

Keep infrastructure inexpensive and simple.

Do not introduce separate frontend/backend services, microservices, Kubernetes, queues, or other infrastructure unless a real requirement appears.

---

# 3. Deployment Simplicity

Use only:

```text
Local development
Production
```

A separate staging environment shoud not be added.

V1 does not require:

- Complex monitoring
- Pager/alert systems
- Advanced backup automation
- Preview deployments for every pull request
- Multi-region hosting
- Container orchestration

Use the hosting provider's basic persistence and operational features. More advanced operational tooling can be added later.

---

# 4. Current Site Migration

Only the new system matters.

Do **not** migrate old WordPress form submissions.

Preserve important public URLs where practical.

Old spam, WooCommerce leftovers, broken pages, and obsolete WordPress routes should not be recreated.

Important old pages should either:

- remain at the same URL, or
- redirect to the appropriate new page

---

# 5. Design & Content

## Visual Direction

Keep the current La Veranda identity and general visual feel, but modernize the implementation and clean up the design.

The developer will design directly in code.

Reuse existing:

- Logo
- Photography
- Content
- Brand colours where appropriate

The owner can provide better assets later if available.

## Copy

Existing copy can be cleaned up for:

- Typos
- Grammar
- Outdated information
- Duplicated information

English only for V1.

No localization system is needed.

---

# 6. Public Pages

Keep the public site simple.

Recommended V1 pages:

```text
/
Home

/menu/
Restaurant menu

/brunch-menu/
Brunch menu

/events/
Events overview

/weddings-corporate/
Weddings & Corporate Events

/book-an-event/
Event request form

/specials/
Specials

/gallery/
Gallery

/contact/
Contact, hours and map

/reservations/
Basic reservation information or contact instructions
```

Legal/privacy pages can be added where required.

Do not create separate landing pages for every type of private event.

Birthdays, showers, communions, corporate events, etc. can be described within the main Events page.

---

# 7. Restaurant Menus

The restaurant menu system should remain simple.

## Required Menu Data

Each menu item needs only the fields that are actually useful:

```text
name
description
price
category
available
sortOrder
```

Optional fields can be added later if needed.

Avoid building a universal menu engine with complex:

- allergen matrices
- scheduled seasonal pricing
- POS synchronization
- advanced variant systems
- automated print-layout generation

Simple add-ons or price variants can be supported where the current menu requires them.

## Owner Input Required

The owner must provide or confirm:

1. Which menus are current.
2. The correct menu items.
3. The correct prices.
4. Any conflicting information between the website and PDFs.

The corrected menu becomes the single source of truth.

---

# 8. Dynamic Menu Principle

Menus should be stored once in the database.

The same data should be used by:

```text
Public website
Event request form
Admin dashboard
Emails
Generated event PDF
```

Do not maintain separate manually edited copies of the same information.

---

# 9. Event Request System

## V1 Goal

The event system is an **inquiry/request workflow**, not a complete banquet-management system.

The customer submits:

- Contact information
- Event type
- Requested date
- Requested start/end time or duration
- Guest count
- Menu selections
- Optional extras
- Notes

The request is saved in PostgreSQL.

The restaurant reviews it manually and communicated with the sender through email to then confirm it on the site.

Submitting the form does **not** mean the event is confirmed.

---

# 10. Event Statuses

Use a very small status model:

```text
PENDING
APPROVED
DECLINED
CANCELLED
```

Flow:

```text
Customer submits request
        ↓
     PENDING
      /   \
     /     \
APPROVED  DECLINED
   |
   └── Google Calendar event

APPROVED → CANCELLED
```

Do not build in V1:

- QUOTED
- EXPIRED
- IN_REVIEW
- COMPLETED
- soft holds
- quote version workflows
- automatic deposit-state transitions

These can be added later if the restaurant actually needs them.

---

# 11. Event Pricing

V1 does **not** need to be a full automatic invoicing or quoting engine.

The form may display menu pricing and selected upgrades, but the restaurant remains responsible for reviewing the request.

The system should preserve the values that existed when the request was submitted.

Example:

```json
{
  "itemName": "Grilled Steak",
  "priceAtSubmission": 73,
  "upgradeAtSubmission": 15
}
```

If prices change later, the old request should still display the original values.

## Do Not Build Yet

Do not implement complex rules for:

- invoices
- deposit calculations
- final balances
- automatic tax calculations
- minimum spends
- guest-count billing rules
- overtime billing
- quote discounts
- staff price overrides
- date-effective pricing

If the current event form requires a simple price or upcharge to be displayed, store and display it.

---

# 12. Event Information the Owner Must Confirm

These are the important event questions that cannot safely be guessed.

## Required Owner Questions

### Event Menu

What is the definitive current event menu?

Confirm:

- Base price
- Kids price
- Starter choices
- Pasta / risotto choices
- Main choices
- Upcharges
- Extras
- Bar options

The existing website and PDFs disagree, so the owner must provide the current version.

### Selection Rules

Confirm what the customer actually selects.

For example:

- How many starters?
- One pasta choice?
- One or multiple mains?
- Are menu selections required when submitting, or can they be decided later?

### Event Duration

What information should customers provide?

Recommended simple approach:

```text
Start time
End time
```

No automatic overtime billing is required in V1.

### Guest Limits

If there is an important minimum or maximum guest count, provide it.

Otherwise, accept the customer's requested guest count and let management review it manually.

### Event Spaces

If customers need to know about different spaces, provide:

- Space names
- General capacity
- Indoor/outdoor

Staff can assign the final space manually.

### Availability

V1 should **not** show live availability.

Accept the requested date and let restaurant staff check availability before approving it.

---

# 13. Event Request Form

Refer to the content of docs\event_contract to view what the event contract has.

Allow customers to submit even if they have not finalized every menu choice (as seen in the form).

A simple form is enough.

After submission show:

> Your event request has been received. This does not confirm your booking. La Veranda will review the request and contact you.

---

# 14. Event Emails

When an event request is submitted:

1. Save it to PostgreSQL.
2. Send an email to the customer from info@laverandaresto.com.
3. Attach one PDF event-request summary.

The email should be sent from:

```text
info@laverandaresto.com
```

Do not build:

- SMS
- WhatsApp alerts
- editable email-template builders
- long-term email archives
- elaborate retry dashboards

Basic failure handling is enough.

The database remains the source of truth even if email delivery fails.

---

# 15. PDF Requirements

V1 needs **one PDF type**:

## Event Request Summary

refer to docs\event_contract

Do not build separate V1 PDFs for:

- Versioned quotes
- Contracts
- Event confirmations
- BEO/kitchen sheets
- Public menu brochures
- Dinner/brunch print menus

Those can be introduced later if they become useful.

---

# 16. Administration Dashboard

Payload should provide the main administrative interface.

V1 administration should support:

```text
View event requests
Open an event request
Approve / decline / cancel request
Update menus and prices
Update specials
Manage basic site content
```

## Admin Users

Use one general admin permission level initially.

There is no need for a complex:

```text
Owner
Manager
Staff
```

role hierarchy in V1 unless the owner specifically requests different permissions.

Payload authentication with secure passwords and appropriate access control is sufficient for V1.

Do not build:

- custom 2FA
- audit-log UI
- CSV exports
- assignment workflows
- separate staff dashboards
- scheduled publishing
- advanced content approval workflows

---

# 17. Google Calendar

Use one restaurant Google Calendar.

When an administrator approves an event:

```text
PENDING
   ↓
APPROVED
   ↓
Create Google Calendar event
```

Store the Google Calendar event ID with the request.

If the approved event changes, update the existing Google event rather than creating another one.

If an event is cancelled, remove or cancel the associated Calendar entry.

Keep synchronization one-way:

```text
Website → Google Calendar
```

Do not build two-way synchronization.

Do not invite the customer as a Calendar attendee.

Timezone:

```text
America/Toronto
```

---

# 18. Restaurant Hours

The goal is to avoid manually maintaining conflicting opening hours.

## Owner Must Confirm

1. What are the actual current restaurant hours?
2. Are the hours currently shown on the Google Business Profile correct?
3. Who has access to the Google Business Profile?

## Implementation

Preferred:

```text
Google business information
        ↓
Website
```

If direct Google Business Profile integration becomes unnecessarily difficult, use a simple hours editor in the Payload admin as the fallback.

Do not make the entire project depend on approval for a Google API.

The website does not need:

- complex "open now" logic
- hours-based booking restrictions
- separate business-rule engines based on opening hours

---

# 19. Specials

Keep specials simple.

Each special needs roughly:

```text
title
description
image
date
active
```

Optionally include a CTA/link.

Past specials can simply be hidden when no longer relevant.

Do not build:

- recurrence engines
- ticket sales
- automatic annual duplication
- complex publishing schedules

---

# 20. Gallery

Migrate useful existing restaurant images.

The gallery can remain mostly static.

There is no requirement for public or admin media-upload workflows in V1 unless this changes later.

A basic image gallery/lightbox is enough.

---

# 21. Table Reservations

La Veranda doesnt want normal table reservations to be handled through the new website

Recommended V1:

- Do not build a custom reservation system.
- Provide phone/email instructions or link to an existing reservation provider if one is used.
- Keep private-event requests separate from normal table reservations.

---

# 22. Contact Form

Use a simple contact form:

```text
Name
Email
Phone (optional)
Message
```

Submit it to the restaurant's email.

Storing contact messages in the database is optional and is not required for V1.

---

# 23. Weddings & Corporate Page

Create one combined:

```text
Weddings & Corporate Events
```

page.

this could be used as inspiration for what will go on the page: https://aeventspace.com/services/weddings-bridal-parties-in-toronto/


The owner needs to provide or confirm:

- Services offered
- Venue capabilities
- Entertainment options
- Event customizations
- Photos/content
- Any claims about capacity or services

Do not invent offerings that the restaurant has not confirmed.

---

# 24. Security

Keep security appropriate but uncomplicated.

V1 requires:

- Payload administrator authentication
- Server-side authorization
- Server-side validation
- Secure environment variables
- Cloudflare Turnstile on public forms
- Reasonable rate limiting
- HTTPS
- No secrets exposed to the browser

Do not rely on frontend controls for security.

The browser should never be trusted for authoritative pricing or permissions.

---

# 25. Accessibility & Performance

Target:

- Responsive desktop/tablet/mobile design
- Semantic HTML
- Keyboard-accessible controls
- Useful alt text
- Reasonable contrast
- Good performance
- Modern Chrome, Safari, Edge and Firefox

Do not turn specific Lighthouse scores or Core Web Vitals thresholds into hard contractual requirements.

Build the site correctly and keep it fast.

---

# 26. SEO & Migration

Preserve the important existing URLs where practical.

Recommended important URLs:

```text
/
/menu/
/brunch-menu/
/events/
/specials/
/gallery/
/contact/
/book-an-event/
```

Redirect obsolete legitimate pages where appropriate.

Do not recreate:

```text
/shop/
/cart/
/checkout/
/my-account/
/payment/
```

or injected/spam WordPress content.

Add:

- page titles
- meta descriptions
- sitemap
- robots configuration
- Restaurant structured data
- canonical URLs

Advanced analytics and advertising pixels are not required for V1.

---

# 27. Testing

Do not build an enterprise test suite.

At minimum test:

### Event Submission

```text
Valid request saves successfully
Invalid request is rejected
Customer cannot set arbitrary protected values
Email failure does not delete the request
```

### Authentication

```text
Unauthenticated users cannot access admin data
Admin can manage allowed content
```

### Event Approval

```text
Approval updates status
Calendar event is created
Repeated approval does not create duplicates
```

Add automated tests where they provide clear value.

Manual end-to-end testing before launch is still required.

---

# 28. Launch

Simple launch process:

```text
Finish site
↓
Verify menu/content with owner
↓
Test forms/admin/calendar/email
↓
Point domain to new deployment
↓
Verify redirects
↓
Submit sitemap
↓
Retire old WordPress site
```

No formal multi-week staging/UAT process is required unless the owner wants one.

---

# 29. Future Features — Explicitly Out of Scope

These should **not** be implemented in V1.

## Phase 2 Candidates

- Customer acceptance links
- Online deposits
- Stripe/payment processing
- Payment tracking
- Automated event confirmation after payment
- More advanced event quote workflows

## Later Candidates

- Catering booking
- Online ordering
- Customer accounts
- CRM/customer history
- Advanced reservation management
- Advanced staff roles
- Automated reminders
- BEO/kitchen documents
- Full invoicing/accounting
- POS integration

The V1 data model should avoid obvious dead ends, but it should **not** implement unused systems merely to prepare for hypothetical future requirements.

---

# 30. Development Documentation

Do not create a 20+ document enterprise specification set.

Use a small documentation structure:

```text
docs/
├── project-overview.md
├── requirements.md
├── data-model.md
├── event-workflow.md
├── architecture.md
└── implementation-plan.md
```

Optional:

```text
deployment.md
```

if deployment details become substantial.

The original `la_veranda_rebuild_summary.md` can remain as the initial brief.

---

# 31. Instructions for AI Coding Agents

Use this as a standing complexity constraint:

> This is intentionally a simple small-business application, not an e-commerce platform, CRM, ERP, banquet-management product, or SaaS system.
>
> V1 consists of a public restaurant website, Payload admin, dynamic menus, event-request storage, simple event statuses, customer/admin email with one request-summary PDF, Google Calendar creation when an admin approves a request, and restaurant-hours integration.
>
> Do not add functionality merely because it may be useful in the future.
>
> Do not implement payments, payment ledgers, customer accounts, customer acceptance links, live availability, booking holds, automated reminders, BEOs, audit systems, complex staff roles, CRM features, advanced publishing workflows, or e-commerce functionality unless explicitly requested.
>
> Prefer the simplest correct data model and workflow that satisfies the current project scope.
>
> Ask a question only when its answer materially changes the V1 implementation.

---

# 32. Remaining Questions for the Owner

These are the questions worth asking before or during development.

## Menus

1. What are the definitive current restaurant menus and prices?
2. What is the definitive current event menu and pricing?


## Event Form

3. What exact menu selections should customers make?
4. Which selections are required at request time?
5. Are there important minimum/maximum guest limits?

## Operations

6. What are the correct restaurant hours?
7. Is the Google Business Profile currently correct?
8. Which Google Calendar should approved events use?
9. Does the restaurant want normal table reservations handled by this website?

## Content

10. What information should appear on the Weddings & Corporate Events page?
11. Are there any important event-space names/capacities that should appear publicly?

## Administration

12. Who needs administrator access besides the owner?

Everything else should generally be treated as a developer implementation decision rather than something that blocks the project.
