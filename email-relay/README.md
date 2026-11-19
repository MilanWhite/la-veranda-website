# La Veranda email relay

Railway blocks outgoing SMTP on its Hobby plan. The website builds each email itself and sends
it over HTTPS to this Cloudflare Worker, which hands it to Gmail's SMTP server as
`booking@laverandaresto.com`. Attachments, the inline logo, Reply-To and reply threading
(Message-ID / In-Reply-To) pass through unchanged, and sent emails show in booking@'s Sent folder.

Runs on Cloudflare's free Workers plan (account: booking@laverandaresto.com).

## Security

- Requests must carry `X-Relay-Timestamp` (unix seconds, within 5 minutes) and
  `X-Relay-Signature` = hex HMAC-SHA256 of `<timestamp>.<body>` with `RELAY_SECRET`.
- Emails are sent only from `SMTP_USER`; max 50 recipients and 25 MB.
- The Gmail app password lives only in Cloudflare's encrypted secrets.

## Retries

Gmail sometimes refuses the login from Cloudflare's servers (`535 Username and Password not
accepted`) and accepts the same login moments later. A refused login, a temporary SMTP error
(4xx) or a lost connection is retried on a fresh connection: 3 attempts in all, 1 s and 3 s
apart. Permanent errors (other 5xx) aren't retried, and nothing is retried once the end of the
email has been sent, so an email is never delivered twice. Each failed attempt is logged
(`npx wrangler tail`), so you can see how often it happens.

## Setup

```bash
cd email-relay
npx wrangler deploy
npx wrangler secret put SMTP_PASS      # booking@'s Gmail app password
npx wrangler secret put RELAY_SECRET   # same value as EMAIL_RELAY_SECRET on Railway
```

Website env (Railway): `EMAIL_RELAY_URL=https://la-veranda-email-relay.<subdomain>.workers.dev/send`,
`EMAIL_RELAY_SECRET`, `EMAIL_FROM=booking@laverandaresto.com`.

Logs: `npx wrangler tail` (or Workers → la-veranda-email-relay → Logs in the dashboard).
