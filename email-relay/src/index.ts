/**
 * La Veranda email relay (Cloudflare Worker).
 *
 * Railway blocks outgoing SMTP on its Hobby plan, so the website sends each finished email
 * here over HTTPS, and this Worker hands it to Gmail's SMTP server as SMTP_USER (booking@).
 * The email itself (attachments, inline logo, Message-ID, In-Reply-To) is built by the website
 * and passed through unchanged, so it arrives exactly as if the website had sent it by SMTP.
 *
 * Security:
 * - Every request must be signed: HMAC-SHA256 of "<timestamp>.<body>" with RELAY_SECRET,
 *   and the timestamp must be within 5 minutes (stale or replayed requests are refused).
 * - Mail goes out only from SMTP_USER; at most 50 recipients; at most 25 MB (Gmail's limit).
 * - Errors return the SMTP server's reply only, never the password or the email contents.
 *
 * Retries: Gmail sometimes refuses the login from Cloudflare's servers and accepts it moments
 * later, so a refused login, a temporary error or a lost connection is retried (3 attempts in
 * all, 1 s and 3 s apart). Nothing is retried once the end of the email has been sent.
 *
 * Secrets (wrangler secret put): SMTP_PASS (Gmail app password), RELAY_SECRET.
 * Var (wrangler.toml): SMTP_USER.
 */
import { connect } from 'cloudflare:sockets'

interface Env {
  SMTP_USER: string
  SMTP_PASS: string
  RELAY_SECRET: string
}

type SendRequest = { from: string; to: string[]; raw: string }

const MAX_RECIPIENTS = 50
const MAX_BYTES = 25 * 1024 * 1024
const MAX_SKEW_SECONDS = 300
// Waits before attempts 2 and 3 (wall time; doesn't count towards the CPU limit)
const RETRY_DELAYS_MS = [1_000, 3_000]
const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[a-z]{2,}$/i

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null
  const bytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

// Constant-time check (crypto.subtle.verify) of the request signature
async function signatureValid(secret: string, timestamp: string, body: string, sig: string) {
  const signature = hexToBytes(sig)
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(`${timestamp}.${body}`),
  )
}

class SmtpError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message)
  }
}

// Thrown once the end of the email has been sent: Gmail may already have accepted it, so a
// retry could deliver it twice. Never retried.
class AfterDataError extends Error {}

// Minimal SMTP client over implicit TLS (port 465): EHLO, AUTH PLAIN, MAIL, RCPT, DATA, QUIT.
async function sendSmtp(env: Env, from: string, to: string[], message: string) {
  const socket = connect({ hostname: 'smtp.gmail.com', port: 465 }, { secureTransport: 'on' })
  const writer = socket.writable.getWriter()
  const reader = socket.readable.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ''

  // Reads one (possibly multi-line) reply and checks its code
  async function reply(expected: number[]) {
    for (;;) {
      const lines = buffer.split('\r\n')
      const done = lines.findIndex((line) => /^\d{3} /.test(line))
      if (done >= 0) {
        const text = lines.slice(0, done + 1).join(' | ')
        buffer = lines.slice(done + 1).join('\r\n')
        const code = Number(lines[done].slice(0, 3))
        if (!expected.includes(code))
          throw new SmtpError(`SMTP ${code}: ${text.slice(0, 300)}`, code)
        return code
      }
      const { value, done: closed } = await reader.read()
      if (closed) throw new SmtpError('SMTP connection closed early')
      buffer += decoder.decode(value, { stream: true })
    }
  }
  const send = (line: string) => writer.write(encoder.encode(`${line}\r\n`))

  try {
    await reply([220])
    await send('EHLO laveranda-email-relay')
    await reply([250])
    await send(`AUTH PLAIN ${btoa(`\0${env.SMTP_USER}\0${env.SMTP_PASS.replace(/\s+/g, '')}`)}`)
    await reply([235])
    await send(`MAIL FROM:<${from}>`)
    await reply([250])
    for (const rcpt of to) {
      await send(`RCPT TO:<${rcpt}>`)
      await reply([250, 251])
    }
    await send('DATA')
    await reply([354])
    // CRLF line endings; a line starting with "." gets a second "." (SMTP dot-stuffing)
    // (the message is a byte string from atob, so it's written byte for byte, not re-encoded)
    let body = message.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
    if (!body.endsWith('\r\n')) body += '\r\n'
    await writer.write(Uint8Array.from(body, (c) => c.charCodeAt(0)))
    try {
      await send('.')
      await reply([250])
    } catch (error) {
      throw new AfterDataError(`Gmail's reply to the finished email: ${(error as Error).message}`)
    }
    await send('QUIT').catch(() => {})
  } finally {
    await socket.close().catch(() => {})
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/send')
      return json({ error: 'Not found' }, 404)
    if (!env.RELAY_SECRET || !env.SMTP_PASS || !env.SMTP_USER)
      return json({ error: 'Relay is not configured' }, 500)

    const timestamp = request.headers.get('x-relay-timestamp') ?? ''
    const signature = request.headers.get('x-relay-signature') ?? ''
    const age = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (!/^\d{10}$/.test(timestamp) || !(age <= MAX_SKEW_SECONDS))
      return json({ error: 'Request expired' }, 401)

    const body = await request.text()
    if (body.length > MAX_BYTES * 1.4) return json({ error: 'Email too large' }, 413)
    if (!(await signatureValid(env.RELAY_SECRET, timestamp, body, signature)))
      return json({ error: 'Bad signature' }, 401)

    let data: SendRequest
    try {
      data = JSON.parse(body)
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }
    if (data.from?.toLowerCase() !== env.SMTP_USER.toLowerCase())
      return json({ error: `Emails can only be sent from ${env.SMTP_USER}` }, 403)
    const to = [...new Set(Array.isArray(data.to) ? data.to : [])]
    if (!to.length || to.length > MAX_RECIPIENTS || !to.every((a) => EMAIL.test(a)))
      return json({ error: 'Invalid recipients' }, 400)

    let message: string
    try {
      message = atob(data.raw)
    } catch {
      return json({ error: 'Invalid email data' }, 400)
    }
    if (message.length > MAX_BYTES) return json({ error: 'Email too large' }, 413)

    // Gmail sometimes refuses the login (535) or drops the connection from Cloudflare's
    // servers, and accepts the same login moments later. Each attempt is a fresh connection.
    let lastError: Error = new Error('not sent')
    for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
      try {
        await sendSmtp(env, data.from, to, message)
        if (attempt > 1) console.log(`sent on attempt ${attempt}`)
        return json({ ok: true, accepted: to, attempts: attempt })
      } catch (error) {
        lastError = error as Error
        const retry = isRetryable(lastError) && attempt <= RETRY_DELAYS_MS.length
        console.log(
          `attempt ${attempt} failed (${lastError.message.slice(0, 120)}); retry: ${retry}`,
        )
        if (!retry) break
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]))
      }
    }
    const text =
      lastError instanceof SmtpError || lastError instanceof AfterDataError
        ? lastError.message
        : `Relay error: ${lastError.message}`
    return json({ error: text.slice(0, 400) }, 502)
  },
}

// Retried: refused login (535), temporary SMTP errors (4xx), lost or failed connections.
// Not retried: permanent errors (other 5xx, e.g. a bad address) and anything after the
// email's end was sent, so an email is never delivered twice.
function isRetryable(error: Error) {
  if (error instanceof AfterDataError) return false
  if (error instanceof SmtpError && error.code) return error.code === 535 || error.code < 500
  return true
}
