#!/usr/bin/env node
/**
 * Telegram against a local dev server.
 *
 * A webhook needs a public URL, and `localhost` is not one -- which would mean
 * deploying before the connect flow could be tried even once. This long-polls
 * `getUpdates` instead and posts each update to the local route, with the same
 * secret header Telegram would send. The route cannot tell the difference.
 *
 * Development only. In a deployed environment set a real webhook (see the
 * README) -- polling costs a held connection per instance and does not survive
 * a serverless function ending.
 *
 *   npm run telegram:dev
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envPath = path.join(root, '.env.local')

if (!fs.existsSync(envPath)) {
  console.error('No .env.local. Copy .env.example and fill in the Telegram values.')
  process.exit(1)
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const token = env.TELEGRAM_BOT_TOKEN
const secret = env.TELEGRAM_WEBHOOK_SECRET
const target = `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/telegram/webhook`

if (!token || !secret) {
  console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must both be set in .env.local.')
  process.exit(1)
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((response) => response.json())

// A webhook and getUpdates are mutually exclusive; drop any webhook first so
// this does not silently receive nothing.
const dropped = await api('deleteWebhook', { drop_pending_updates: false })
if (!dropped.ok) console.warn('could not clear webhook:', dropped.description)

const me = await api('getMe', {})
if (!me.ok) {
  console.error('bad token:', me.description)
  process.exit(1)
}

console.log(`\n  Listening as @${me.result.username}`)
console.log(`  Forwarding to ${target}`)
console.log('  Open the app, tap Connect Telegram, and watch here.\n')

let offset = 0
for (;;) {
  try {
    const updates = await api('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] })
    if (!updates.ok) {
      console.error('getUpdates:', updates.description)
      await new Promise((r) => setTimeout(r, 3000))
      continue
    }

    for (const update of updates.result) {
      offset = update.update_id + 1
      const text = update.message?.text ?? '(no text)'
      const from = update.message?.chat?.id
      console.log(`  → chat ${from}: ${text}`)

      const response = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': secret,
        },
        body: JSON.stringify(update),
      })
      console.log(`    forwarded, ${response.status}`)
    }
  } catch (err) {
    console.error('  poll failed:', err.message)
    await new Promise((r) => setTimeout(r, 3000))
  }
}
