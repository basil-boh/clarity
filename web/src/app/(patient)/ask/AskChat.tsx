'use client'

import { useI18n } from '@/components/I18nProvider'

import { useEffect, useRef, useState } from 'react'

import { Button, Input } from '@/components/ui'

/**
 * The overnight conversation.
 *
 * The suggestions are not filler. Four of the seven staff interviewed said the
 * questions that actually arrive at 1am are the same handful every time, and a
 * patient staring at an empty box at that hour usually closes the app. So the
 * common ones are offered as one tap.
 *
 * History is kept in component state only. It is not persisted anywhere, which
 * is a deliberate limit rather than an oversight: there is no database yet, and
 * writing a medical conversation into a cookie would put it on disk on a shared
 * family phone.
 */

type Turn = { role: 'patient' | 'assistant'; content: string; escalated?: boolean }

const OPENERS = [
  'I threw up after the first dose',
  'Can I drink milk tomorrow?',
  'My stools are still brown',
  'I cannot finish the whole bottle',
]

export function AskChat({ departmentPhone }: { departmentPhone: string }) {
  const { tx } = useI18n()

  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, busy])

  async function send(text: string) {
    const question = text.trim()
    if (!question || busy) return
    const next: Turn[] = [...turns, { role: 'patient', content: question }]
    setTurns(next)
    setDraft('')
    setBusy(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ turns: next.map(({ role, content }) => ({ role, content })) }),
      })
      const data = await res.json()
      setTurns((t) => [
        ...t,
        {
          role: 'assistant',
          content: data.reply ?? 'Something went wrong. Please call your hospital/clinic.',
          escalated: Boolean(data.escalated || data.unconfigured),
        },
      ])
    } catch {
      setTurns((t) => [
        ...t,
        {
          role: 'assistant',
          content:
            'No connection, so I cannot answer. Please call your endoscopy hospital/clinic, or 995 if this is severe.',
          escalated: true,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {turns.map((turn, i) =>
          turn.role === 'patient' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] bg-blue px-4 py-3 text-[16px] leading-relaxed text-white">
                {turn.content}
              </p>
            </div>
          ) : (
            <div key={i}>
              <p
                className={`max-w-[92%] border-l-[3px] px-4 py-3 text-[16px] leading-relaxed ${
                  turn.escalated
                    ? 'border-alert bg-alert-tint text-alert'
                    : 'border-hairline-strong bg-paper text-ink'
                }`}
              >
                {tx(turn.content)}
              </p>
            </div>
          ),
        )}

        {busy ? (
          <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-faint">{tx("Thinking…")}</p>
        ) : null}
        <div ref={endRef} />
      </div>

      {turns.length === 0 ? (
        <div className="mt-2">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">{tx("What people ask at 1am")}</p>
          <ul className="space-y-2">
            {OPENERS.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => send(tx(q))}
                  className="w-full border border-hairline bg-paper px-4 py-3 text-left text-[16px] text-ink transition-colors hover:bg-paper-sunken"
                >
                  {tx(q)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(draft)
        }}
        className="sticky bottom-0 mt-6 flex gap-2 bg-paper-dim pb-1 pt-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={tx("Ask a question")}
          aria-label={tx("Ask a question")}
          className="text-[17px]"
          disabled={busy}
        />
        <div className="w-[92px] shrink-0">
          <Button type="submit" disabled={busy || !draft.trim()}>{tx("Send")}</Button>
        </div>
      </form>

      <p className="mt-4 text-[14px] leading-relaxed text-ink-faint">{tx("This assistant supports your preparation and cannot change your dose or decide whether your procedure goes ahead. For anything urgent call")}{tx(' ')}
        {departmentPhone ? (
          <>
            <a href={`tel:${departmentPhone}`} className="font-semibold text-blue underline">{tx("your hospital/clinic")}</a>{tx(", or 995 if it is severe.")}</>
        ) : (
          // No number on file -- this app has no department behind it unless a
          // patient was given one. 995 is the part that always applies.
          <>{tx("your hospital/clinic, or 995 if it is severe.")}</>
        )}
      </p>
    </>
  )
}
