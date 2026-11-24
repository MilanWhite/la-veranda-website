import type { Transport } from 'nodemailer'
import type MailMessage from 'nodemailer/lib/mailer/mail-message'

// Sends each finished email through Cloudflare Email Sending (REST "send_raw") over HTTPS,
// as booking@laverandaresto.com. No mailbox sign-in is involved, so Gmail can't refuse it.
//
// Nodemailer builds the email here exactly as for SMTP (attachments, inline logo, Reply-To,
// In-Reply-To/References) and Cloudflare sends it unchanged, with one exception: Cloudflare
// gives every email its own Message-ID. The ID it used is returned as `messageId`, and that
// is the one callers must save so later replies join the same conversation.
//
// All recipients (To, Cc and Bcc) go in one request, so they all get the same Message-ID:
// the restaurant's Bcc copy and the customer's copy are the same email.
//
// Reliability:
// - Temporary problems (network, timeout, 429, 5xx) are retried a few times.
// - Cloudflare refuses a whole email when any recipient is on its suppression list. If that
//   happens and the email has Bcc copies, it's sent again without them, so the customer still
//   gets theirs; the missing copies are reported in `rejected` for the caller to handle.
// - The email only counts as failed when one of its main (To/Cc) recipients didn't get it.
// - Errors carry `failover`: true when another provider might succeed where Cloudflare
//   didn't (see withFailover in mail.ts); false when the email itself is the problem.

const TIMEOUT_MS = 20_000
const RETRY_DELAYS_MS = [1_000, 3_000]
// Stop retrying once this much time has passed, so a form submit never hangs for minutes
const RETRY_BUDGET_MS = 30_000

const SUPPRESSED = 10205

export type CloudflareSentInfo = {
  envelope: { from: string | false; to: string[] }
  messageId: string
  accepted: string[]
  /** Recipients that didn't get it (only ever Bcc copies; a main recipient is an error). */
  rejected: string[]
}

type Options = {
  accountId: string
  apiToken: string
  sender: string
  /** For tests */
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

type SendRawResult = {
  message_id: string
  delivered?: string[]
  queued?: string[]
  permanent_bounces?: string[]
  suppressed_recipients?: string[]
}

export class CloudflareEmailError extends Error {
  /** Another provider might succeed (outage, auth, quota, suppression) */
  failover: boolean
  /** Worth trying Cloudflare again (network, timeout, 429, 5xx) */
  retryable: boolean
  codes: number[]
  status?: number
  constructor(
    message: string,
    o: { failover: boolean; retryable?: boolean; codes?: number[]; status?: number },
  ) {
    super(message)
    this.name = 'CloudflareEmailError'
    this.failover = o.failover
    this.retryable = o.retryable ?? false
    this.codes = o.codes ?? []
    this.status = o.status
  }
}

const lower = (list: string[]) => list.map((a) => a.toLowerCase())

export function cloudflareTransport({
  accountId,
  apiToken,
  sender,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}: Options): Transport<CloudflareSentInfo> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send_raw`

  /** One request to Cloudflare. Throws CloudflareEmailError. */
  async function post(from: string, recipients: string[], mime: string): Promise<SendRawResult> {
    let res: Response
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, recipients, mime_message: mime }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      throw new CloudflareEmailError(`Cloudflare email unreachable: ${(error as Error).message}`, {
        failover: true,
        retryable: true,
      })
    }
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean
      errors?: { code: number; message: string }[]
      result?: SendRawResult
    }
    if (res.ok && body.success && body.result?.message_id) return body.result

    const codes = (body.errors ?? []).map((e) => e.code)
    const reason = body.errors?.map((e) => `${e.message} (${e.code})`).join('; ')
    const retryable = res.status === 429 || res.status >= 500
    // 400s other than suppression mean the email itself is wrong (too big, malformed):
    // another provider would refuse it too. Everything else (auth, sending disabled, quota,
    // outage, suppressed recipient) is Cloudflare-specific.
    const failover = res.status !== 400 || codes.includes(SUPPRESSED)
    throw new CloudflareEmailError(
      `Cloudflare email (${res.status}): ${reason || res.statusText}`,
      {
        failover,
        retryable,
        codes,
        status: res.status,
      },
    )
  }

  /** post() with retries for temporary problems */
  async function postWithRetry(from: string, recipients: string[], mime: string) {
    const started = Date.now()
    for (let attempt = 0; ; attempt++) {
      try {
        return await post(from, recipients, mime)
      } catch (error) {
        const e = error as CloudflareEmailError
        const delay = RETRY_DELAYS_MS[attempt]
        if (!e.retryable || delay === undefined || Date.now() - started + delay > RETRY_BUDGET_MS) {
          throw e
        }
        await sleep(delay)
      }
    }
  }

  async function send(mail: MailMessage<CloudflareSentInfo>): Promise<CloudflareSentInfo> {
    const envelope = mail.message.getEnvelope()
    if (!envelope.from || envelope.from.toLowerCase() !== sender.toLowerCase()) {
      throw new CloudflareEmailError(`Cloudflare email: emails can only be sent from ${sender}.`, {
        failover: false,
      })
    }
    if (!envelope.to.length) {
      throw new CloudflareEmailError('Cloudflare email: the email has no recipients.', {
        failover: false,
      })
    }

    // Bcc copies (the restaurant's mailbox) vs the people the email is for
    // (typed as strings, but nodemailer returns { address, name } objects)
    const bccList = (mail.message.getAddresses().bcc ?? []) as (string | { address: string })[]
    const bcc = new Set(lower(bccList.map((a) => (typeof a === 'string' ? a : a.address))))
    const main = envelope.to.filter((a) => !bcc.has(a.toLowerCase()))

    // Nodemailer leaves Bcc out of the built email; Bcc addresses are only in the envelope
    const mime = (await mail.message.build()).toString('utf8')

    let result: SendRawResult
    const dropped: string[] = []
    try {
      result = await postWithRetry(envelope.from, envelope.to, mime)
    } catch (error) {
      const e = error as CloudflareEmailError
      // A suppressed address fails the whole email. Send it again to the main recipients only,
      // so a suppressed Bcc copy can't stop the customer's email.
      if (!e.codes?.includes(SUPPRESSED) || !bcc.size || !main.length) throw e
      result = await postWithRetry(envelope.from, main, mime)
      dropped.push(...envelope.to.filter((a) => bcc.has(a.toLowerCase())))
      console.warn(
        `Cloudflare email: ${dropped.join(', ')} is on the suppression list; sent without that Bcc copy.`,
      )
    }

    // "queued" means Cloudflare accepted it and keeps retrying the recipient's server itself
    const accepted = [...(result.delivered ?? []), ...(result.queued ?? [])]
    const rejected = [
      ...dropped,
      ...(result.permanent_bounces ?? []),
      ...(result.suppressed_recipients ?? []),
    ]
    const missedMain = main.filter((a) => lower(rejected).includes(a.toLowerCase()))
    if (missedMain.length) {
      // A permanent bounce is a real answer from the recipient's server: no failover
      throw new CloudflareEmailError(
        `Cloudflare email: not delivered to ${missedMain.join(', ')}.`,
        {
          failover: false,
        },
      )
    }
    return { envelope, messageId: result.message_id, accepted, rejected }
  }

  return {
    name: 'cloudflare-email-sending',
    version: '1.1.0',
    send(mail, callback) {
      send(mail).then(
        (info) => callback(null, info),
        (error: Error) => callback(error, undefined as unknown as CloudflareSentInfo),
      )
    },
  }
}
