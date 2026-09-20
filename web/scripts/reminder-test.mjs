#!/usr/bin/env node
/**
 * Send one patient's dose reminder now, for testing.
 *
 * Works out when the dose actually falls from their procedure date, clears any
 * record of having already sent it, and calls the endpoint with the clock wound
 * to that moment. The timestamp arithmetic is the error-prone part -- the 2am
 * dose is on the day *after* the purge night, and Singapore is eight hours
 * ahead of the UTC the server thinks in -- so it is done here rather than by
 * hand.
 *
 *   npm run reminder:test -- +6591234567            # both doses
 *   npm run reminder:test -- +6591234567 dose-2     # just the 2am one
 *
 * Development only: it winds the clock, which the endpoint refuses to do in
 * production. To send in production, wait for the real window and narrow the
 * ordinary run to one patient:
 *
 *   curl -X POST -H "x-reminder-key: $REMINDER_CRON_SECRET" \
 *     "https://YOUR-APP/api/reminders/send?phone=%2B6591234567"
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, '.env.local'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const [phone, which] = process.argv.slice(2)
if (!phone) {
  console.error('Usage: npm run reminder:test -- +6591234567 [dose-1|dose-2]')
  process.exit(1)
}

const base = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const secret = env.REMINDER_CRON_SECRET
if (!secret) {
  console.error('REMINDER_CRON_SECRET is not set in .env.local.')
  process.exit(1)
}

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const link = await db
  .from('web_telegram')
  .select('chat_id, stopped')
  .eq('phone', phone)
  .maybeSingle()

if (!link.data?.chat_id) {
  console.error(`${phone} has not connected Telegram. Open the app as them and tap Connect.`)
  process.exit(1)
}
if (link.data.stopped) {
  console.error(`${phone} has sent /stop. They must connect again before anything is sent.`)
  process.exit(1)
}

const procedure = await db
  .from('web_procedures')
  .select('scheduled_for')
  .eq('phone', phone)
  .order('scheduled_for', { ascending: false })
  .limit(1)
  .maybeSingle()

if (!procedure.data?.scheduled_for) {
  console.error(`${phone} has no procedure date.`)
  process.exit(1)
}

const date = procedure.data.scheduled_for
console.log(`\n  ${phone} · procedure ${date} · chat ${link.data.chat_id}\n`)

/** The day before `iso`, as a Singapore calendar date. */
function dayBefore(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const back = new Date(Date.UTC(y, m - 1, d - 1))
  return back.toISOString().slice(0, 10)
}

// Straight from domain/prep.ts: first dose 18:00 on the purge night, second at
// 02:00 -- which is the procedure date itself, not the night before it.
const doses = {
  'dose-1': `${dayBefore(date)}T18:00:00+08:00`,
  'dose-2': `${date}T02:00:00+08:00`,
}

const wanted = which ? [which] : ['dose-1', 'dose-2']
for (const id of wanted) {
  if (!doses[id]) {
    console.error(`  unknown dose "${id}" — use dose-1 or dose-2`)
    continue
  }

  // 20 minutes before the dose, inside the half-hour window it is due in.
  const fireAt = new Date(new Date(doses[id]).getTime() - 20 * 60_000).toISOString()

  // Forget having sent it, so the run is not suppressed as a duplicate.
  await db
    .from('web_reminders_sent')
    .delete()
    .eq('phone', phone)
    .eq('key', `${id === 'dose-2' ? date : dayBefore(date)}:${id}`)

  const url = `${base}/api/reminders/send?at=${encodeURIComponent(fireAt)}&phone=${encodeURIComponent(phone)}`
  const response = await fetch(url, { method: 'POST', headers: { 'x-reminder-key': secret } })
  const body = await response.json().catch(() => ({}))

  const when = new Date(doses[id]).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })
  console.log(`  ${id} (dose at ${when} SGT) → sent=${body.sent ?? '?'} failed=${body.failed ?? '?'}`)
  if (body.dryRun) console.log('    REMINDERS_ENABLED is not true — nothing was actually sent.')
}

console.log('')
