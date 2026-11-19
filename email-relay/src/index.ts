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

class SmtpError extends Error {}

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
        if (!expected.includes(code)) throw new SmtpError(`SMTP ${code}: ${text.slice(0, 300)}`)
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
    await send('.')
    await reply([250])
    await send('QUIT')
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

    try {
      await sendSmtp(env, data.from, to, message)
      return json({ ok: true, accepted: to })
    } catch (error) {
      const text =
        error instanceof SmtpError ? error.message : `Relay error: ${(error as Error).message}`
      return json({ error: text.slice(0, 400) }, 502)
    }
  },
}
