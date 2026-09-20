import 'server-only'

/**
 * The Telegram bot.
 *
 * Chosen over SMS for one reason that matters and one that does not. The one
 * that matters: it costs nothing per message, so a pilot is not rationed by an
 * SMS budget and nobody has to decide whether tonight's patient is worth four
 * cents. The one that does not: it is prettier. Against that, it asks the
 * patient to tap a link once -- which SMS would not -- and that is the whole
 * trade.
 *
 * Everything is a plain fetch against the HTTP API. The `telegram` npm package
 * exists but this is two endpoints, and a dependency that polls or holds a
 * connection is the wrong shape for a serverless function anyway.
 */

const API = 'https://api.telegram.org'

function token(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN
}

export function telegramConfigured(): boolean {
  return Boolean(token())
}

/**
 * Whether messages are actually sent.
 *
 * Off by default, and deliberately a separate switch from having a token. It
 * lets a full purge night be watched in the logs -- who would have been
 * messaged, about which dose, at what time -- before anything reaches a real
 * patient's phone. The cost of getting this wrong is a text at 2am to someone
 * who is not expecting one.
 */
export function remindersEnabled(): boolean {
  return process.env.REMINDERS_ENABLED === 'true' && telegramConfigured()
}

/** The bot's @name, for building the deep link the patient taps. */
export function botUsername(): string | undefined {
  return process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '')
}

/**
 * The link that connects a patient to the bot.
 *
 * `?start=<token>` is Telegram's own mechanism: the token comes back to the
 * webhook as `/start <token>` in the first message, which is how a chat gets
 * tied to a phone number without the patient typing anything.
 */
export function deepLink(linkToken: string): string | null {
  const bot = botUsername()
  return bot ? `https://t.me/${bot}?start=${linkToken}` : null
}

type SendResult = { ok: true } | { ok: false; error: string; blocked?: boolean }

export async function sendMessage(chatId: number, text: string): Promise<SendResult> {
  if (!remindersEnabled()) {
    // The dry run. Loud, and says exactly what would have happened, because a
    // silent no-op here looks identical to a working reminder system.
    console.info(`[clarity] REMINDERS DISABLED — would send to chat ${chatId}:\n  ${text}`)
    return { ok: true }
  }

  try {
    const response = await fetch(`${API}/bot${token()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        // The reminder is prose with a couple of bold times in it. HTML rather
        // than Markdown because a patient's name could contain an underscore.
        parse_mode: 'HTML',
        disable_notification: false,
      }),
    })

    const body = (await response.json()) as { ok?: boolean; description?: string; error_code?: number }
    if (body.ok) return { ok: true }

    // 403 is the patient having blocked the bot or deleted the chat. It is not
    // a failure to retry -- it is a withdrawal of consent, and the caller marks
    // them stopped rather than trying again every fifteen minutes.
    const blocked = body.error_code === 403
    return { ok: false, error: body.description ?? `HTTP ${response.status}`, blocked }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Telegram unreachable' }
  }
}

/**
 * Point Telegram at this deployment's webhook.
 *
 * Run once per deployment URL. The secret is echoed back on every update in
 * `X-Telegram-Bot-Api-Secret-Token`, which is what stops anyone who guesses the
 * path from posting fake updates and linking themselves to a patient.
 */
export async function setWebhook(url: string, secret: string): Promise<SendResult> {
  if (!telegramConfigured()) return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not set.' }

  const response = await fetch(`${API}/bot${token()}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ['message'],
    }),
  })
  const body = (await response.json()) as { ok?: boolean; description?: string }
  return body.ok ? { ok: true } : { ok: false, error: body.description ?? 'setWebhook failed' }
}
