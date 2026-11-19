import { createHmac } from 'crypto'
import type { Transport } from 'nodemailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message'

// Sends each finished email to the La Veranda email relay (a Cloudflare Worker, see
// email-relay/) over HTTPS; the relay hands it to Gmail SMTP. Railway blocks SMTP on its
// Hobby plan but not HTTPS.
//
// Nodemailer builds the email here exactly as for SMTP (attachments, inline logo, Reply-To,
// Message-ID, In-Reply-To), and the relay passes it through unchanged.
//
// Security: each request is signed (HMAC-SHA256 of "<timestamp>.<body>" with
// EMAIL_RELAY_SECRET); the relay refuses unsigned, altered or old requests. Only the
// configured sender may be used as From. Errors carry the relay's/Gmail's reply only.

const TIMEOUT_MS = 30_000

export type RelaySentInfo = {
  envelope: { from: string | false; to: string[] }
  messageId: string
  accepted: string[]
}

type Options = { url: string; secret: string; sender: string }

export function relayTransport({ url, secret, sender }: Options): Transport<RelaySentInfo> {
  async function send(mail: MailMessage<RelaySentInfo>): Promise<RelaySentInfo> {
    const envelope = mail.message.getEnvelope()
    if (!envelope.from || envelope.from.toLowerCase() !== sender.toLowerCase()) {
      throw new Error(`Email relay: emails can only be sent from ${sender}.`)
    }
    if (!envelope.to.length) throw new Error('Email relay: the email has no recipients.')

    const raw = await mail.message.build()
    const body = JSON.stringify({
      from: envelope.from,
      to: envelope.to,
      raw: raw.toString('base64'),
    })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')

    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Relay-Timestamp': timestamp,
          'X-Relay-Signature': signature,
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      throw new Error(`Email relay unreachable: ${(error as Error).message}`)
    }
    const result = (await res.json().catch(() => ({}))) as { error?: string; accepted?: string[] }
    if (!res.ok) throw new Error(`Email relay (${res.status}): ${result.error ?? res.statusText}`)
    return {
      envelope,
      messageId: mail.message.messageId(),
      accepted: result.accepted ?? envelope.to,
    }
  }

  return {
    name: 'la-veranda-email-relay',
    version: '1.0.0',
    send(mail, callback) {
      send(mail).then(
        (info) => callback(null, info),
        (error: Error) => callback(error, undefined as unknown as RelaySentInfo),
      )
    },
  }
}
