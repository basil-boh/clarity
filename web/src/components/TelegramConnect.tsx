import { Card, SectionTitle } from '@/components/ui'
import type { Dictionary } from '@/messages'
import { readLink, issueLinkToken } from '@/lib/reminder-store'
import { botUsername, deepLink } from '@/lib/telegram'

/**
 * Where a patient turns on reminders.
 *
 * The link is minted on render rather than behind a button, so connecting is
 * one tap from a page they are already on. The token behind it lasts half an
 * hour; a patient who leaves the page and comes back gets a fresh one, which is
 * also what stops a link left in a shared browser from working later.
 *
 * Renders nothing at all when the bot is not configured. An offer to connect
 * that leads nowhere is worse than no offer, particularly for the one feature
 * whose whole promise is "you do not have to remember".
 */
export async function TelegramConnect({ phone, t }: { phone: string; t: Dictionary }) {
  if (!botUsername()) return null

  const link = await readLink(phone)
  if (!link) return null

  if (link.linked) {
    return (
      <section className="mb-5">
        <SectionTitle>{t.reminders.heading}</SectionTitle>
        <Card>
          <p className="text-[16px] leading-relaxed text-ink-muted">{t.reminders.connected}</p>
        </Card>
      </section>
    )
  }

  const token = await issueLinkToken(phone)
  const href = token ? deepLink(token) : null
  if (!href) return null

  return (
    <section className="mb-5">
      <SectionTitle>{t.reminders.heading}</SectionTitle>
      <Card>
        <p className="text-[16px] leading-relaxed text-ink-muted">
          {link.stopped ? t.reminders.stopped : t.reminders.blurb}
        </p>
        <a
          href={href}
          // Telegram opens in its own app; this page stays where it was, so a
          // patient who changes their mind has not lost their place.
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[17px] font-semibold text-white hover:bg-blue-deep"
        >
          {t.reminders.connect}
        </a>
      </Card>
    </section>
  )
}
