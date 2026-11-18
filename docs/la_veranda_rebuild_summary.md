# La Veranda Website Rebuild

## Project Goal

Replace the current WordPress site with a modern, maintainable website and administration system that supports both the restaurant's public website and its event-management workflow.

The new system should preserve useful existing content and URLs while eliminating duplicated information, outdated content, and fragile WordPress-dependent workflows.

---

## Core Requirements

### Public Website

The rebuilt site should include:

- Home
- Restaurant menu
- Brunch menu
- Events
- Specials
- Gallery
- Contact
- Reservations / event requests
- Weddings & Corporate Events

The site should be responsive, accessible, fast, and search-engine friendly.

Existing important URLs should be preserved where possible. Changed URLs should use permanent redirects so existing search traffic is not lost.

### Dynamic Menus

Restaurant and event menus should be stored as structured data instead of being manually duplicated across pages, PDFs, and forms.

Management should be able to update:

- Menu items
- Descriptions
- Prices
- Categories
- Availability
- Event options
- Upgrade pricing

The public site, event form, emails, and generated PDFs should all read from the same source of truth.

### Event Request System

Customers should be able to submit an event request through the website and choose:

- Event date and time
- Guest count
- Event type
- Menu selections
- Extras or upgrades
- Notes and special requests

Submitting a request should **not automatically confirm the event**.

A typical workflow should be:

```text
Customer submits request
        ↓
PENDING
        ↓
Admin reviews
   ↙          ↘
CHANGES       APPROVED
REQUESTED         ↓
              Calendar event
                  ↓
              CONFIRMED
```

Each submission should be saved to the database before emails are sent.

Both the restaurant and customer should receive a summary containing the submitted event details and selected menu.

### Historical Pricing

Event requests should preserve the menu selections and prices that existed when the customer submitted the request.

If menu pricing changes later, an older event request must still show the original price.

### Administration Dashboard

Restaurant staff should have a secure admin dashboard where they can:

- Review incoming event requests
- View event details and menu selections
- Change event status
- Approve events
- Update menus and pricing
- Manage website content
- Manage specials
- View upcoming confirmed events

The dashboard should be simple and focused on restaurant operations rather than exposing unnecessary technical controls.

### Google Calendar Integration

When management approves an event, the system should be able to add it to a configured Google Calendar.

The integration should prevent duplicate calendar events if the approval action is repeated.

The database should store the associated Google Calendar event ID.

### Restaurant Hours

Opening hours should come from Google's business information where practical rather than being manually duplicated across the website.

This reduces the chance of the website and Google listing displaying different hours.

### Email and PDF Generation

Event submissions should generate structured email summaries for both the customer and restaurant.

A PDF summary can also be generated from the saved event data.

Emails are notifications only. The database should remain the authoritative record if email delivery fails.

### Security

The system should include:

- Secure administrator authentication
- Server-side authorization
- Server-side form validation
- Protection against automated form spam
- Secure handling of API credentials
- Rate limiting where appropriate
- Safe storage of customer information

Pricing, menu rules, and other authoritative values should always be recalculated and validated on the server rather than trusted from the browser.

---

## Recommended Architecture

### Recommended Stack

```text
Next.js
React
TypeScript
Payload CMS
PostgreSQL
Resend
Google Calendar API
Google Places API
Cloudflare Turnstile
```

Add a payment provider such as Stripe only when deposits or online payments are introduced.

### High-Level Architecture

```text
                       Public Website
                            |
                       Next.js App
                  /         |         \
             Pages       Event Form    Hours
               |             |           |
               |             |           +--> Google Places
               |             |
               |             +--> PostgreSQL
               |                    |
               |                    +--> Email --> Resend
               |                    |
               |                    +--> Approval
               |                           |
               |                           +--> Google Calendar
               |
           Payload CMS
               |
           PostgreSQL
               |
           Admin Panel
```

---

## Why Next.js

Next.js is a strong fit because the project needs both:

- A fast public restaurant website
- Server-side application functionality

The same application can handle:

- Public pages
- Forms
- Server-side validation
- API integrations
- Database access
- Authentication
- Admin functionality

A separate frontend and backend service would add unnecessary complexity for this project.

---

## Why Payload

Payload acts as the backend/CMS layer inside the Next.js application.

It provides:

- Structured content models
- Admin authentication
- Access control
- CRUD operations
- APIs
- A generated admin interface
- PostgreSQL integration
- Customizable admin views

This avoids rebuilding generic admin functionality from scratch while still allowing custom React screens for restaurant-specific workflows.

Payload should manage operational data such as:

- Menu items
- Event packages
- Event requests
- Specials
- Site settings
- Admin users

---

## Why PostgreSQL

PostgreSQL should be the main source of truth for structured application data.

Example data includes:

```text
admins
menu_categories
menu_items
event_packages
event_package_options
event_requests
event_request_selections
special_events
site_settings
email_deliveries
audit_log
```

The database should enforce important constraints where possible rather than relying only on frontend logic.

---

## Event Submission Flow

A request should roughly follow this sequence:

```text
Validate request
    ↓
Validate anti-bot token
    ↓
Load current menu and pricing rules
    ↓
Calculate authoritative selections and pricing
    ↓
Save request and pricing snapshot
    ↓
Generate customer/admin email
    ↓
Record email delivery result
    ↓
Show confirmation to customer
```

The request should still exist even if the email provider fails.

---

## Important Design Principles

### One Source of Truth

Do not maintain separate versions of the same menu or event package in:

- Website pages
- PDFs
- Event forms
- Emails

Store the information once and generate everything else from that data.

### Database Before Notifications

Save important business data before depending on external services such as email or Google Calendar.

### Server Is Authoritative

Do not trust values sent from the browser for:

- Pricing
- Guest limits
- Menu availability
- Upgrade costs
- Allowed selections
- Event rules

Validate these on the server.

### Design for Failure

External services can fail or time out.

The system should account for cases such as:

- Email fails after the request is saved
- Google Calendar times out
- An admin clicks approve twice
- Database writes fail
- API credentials expire

Important actions should be safe to retry where possible.

---

## Future Features

The architecture should allow these features to be added later without redesigning the entire system:

### Customer Acceptance Links

Customers could receive a secure temporary link where they can:

- Review the finalized event
- Accept
- Request changes
- Decline

Customer accounts are probably unnecessary.

### Deposits and Payments

A future payment workflow could be:

```text
Admin approves event
        ↓
Customer receives acceptance link
        ↓
Customer accepts
        ↓
Deposit payment link generated
        ↓
Customer pays
        ↓
Payment webhook updates database
        ↓
Event becomes confirmed
```

Payment processing should be handled by a provider such as Stripe rather than implemented directly.

### Catering

Catering can reuse the same customer, email, payment, and admin infrastructure while using its own menu and booking rules.

### Online Ordering

Online ordering should be treated as a separate later phase rather than included in the initial rebuild.

---

## Recommended Implementation Order

1. Define the data model and business rules.
2. Set up Next.js, Payload, and PostgreSQL.
3. Configure admin authentication and menu management.
4. Rebuild the public website.
5. Build the event-request workflow.
6. Add email and PDF generation.
7. Add Google Calendar approval.
8. Add Google hours integration.
9. Add validation, anti-spam protection, and security controls.
10. Test the production workflow.
11. Preserve or redirect old URLs and migrate the site.
12. Add future payment, catering, and acceptance features as separate phases.

---

## Final Recommendation

The initial version should remain a **single modular Next.js application** rather than being split into microservices.

The recommended foundation is:

```text
Next.js + React + TypeScript
        |
      Payload
        |
    PostgreSQL
```

with external integrations for email, Google Calendar, Google business information, and anti-spam protection.

This is complex enough to properly support La Veranda's real operational needs without over-engineering the system.
