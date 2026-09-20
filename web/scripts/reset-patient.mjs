#!/usr/bin/env node
/**
 * Put a number back to how it was before anyone signed in.
 *
 * There are three different things "reset" can mean now, and only the widest
 * is here:
 *
 *   Re-answer the details   The patient taps "Change your details" on Home.
 *                           The form opens filled in and they edit it. Nothing
 *                           to run -- this is the everyday path.
 *
 *   Clear what they did     /admin -> the patient -> "Clear recorded progress".
 *                           Doses, fluids, diet answers, the bowel scale,
 *                           ticked steps, assistant chat, photograph readings
 *                           and the reminder log. Their name, language,
 *                           procedure date and Telegram link all survive.
 *
 *   Start again from zero   This script. Deletes the patient row, which
 *                           cascades to everything keyed on it, so their next
 *                           sign-in lands on /welcome with an empty form -- as
 *                           if the number had never been used.
 *
 * Their Telegram link goes with it -- it hangs off the patient row and the
 * cascade takes it -- so they tap Connect Telegram again after registering.
 *
 *   npm run reset:patient -- +6591234567
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'

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

const phone = process.argv.slice(2).find((a) => !a.startsWith('--'))

if (!phone) {
  console.error('Usage: npm run reset:patient -- +6591234567')
  process.exit(1)
}

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const patient = await db
  .from('web_patients')
  .select('display_name, language')
  .eq('phone', phone)
  .maybeSingle()

if (!patient.data) {
  console.log(`\n  ${phone} has no record. Their next sign-in already lands on /welcome.\n`)
  process.exit(0)
}

const procedure = await db
  .from('web_procedures')
  .select('scheduled_for')
  .eq('phone', phone)
  .order('scheduled_for', { ascending: false })
  .limit(1)
  .maybeSingle()

console.log(`\n  About to delete everything for ${phone}:`)
console.log(`    name       ${patient.data.display_name || '(blank)'}`)
console.log(`    language   ${patient.data.language}`)
console.log(`    procedure  ${procedure.data?.scheduled_for ?? '(none)'}`)
console.log('    plus progress, doses, chat, photograph readings, reminder log')
console.log('    and their Telegram link, which they will have to reconnect.\n')

// A destructive act on a real person's record, so it is confirmed rather than
// assumed -- the number is one typo away from somebody else's.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(`  Type the number again to confirm: `)
rl.close()

if (answer.trim() !== phone) {
  console.log('\n  Did not match. Nothing was deleted.\n')
  process.exit(1)
}

// Everything else is keyed on web_patients with `on delete cascade`, so this
// one delete takes the lot.
const { error } = await db.from('web_patients').delete().eq('phone', phone)
if (error) {
  console.error('\n  Failed:', error.message, '\n')
  process.exit(1)
}

console.log(`\n  Done. ${phone} now lands on /welcome with an empty form at their next sign-in.\n`)
