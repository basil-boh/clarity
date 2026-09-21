'use client'

import { useI18n } from '@/components/I18nProvider'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button, Field, Input, Notice } from '@/components/ui'
import { formatPhone } from '@/lib/phone'

/**
 * Sign in, in two steps on one page.
 *
 * The number step and the code step are one component because the second needs
 * the first's value and a patient who mistyped their number must be able to go
 * back without losing the page. Both steps keep a single visible action, which
 * is the whole reason this reads as a form and not as a flow.
 */

type Step = 'phone' | 'code'

export type DemoState = 'off' | 'all' | 'some'

export function SignInForm({
  demo,
  demoNumbers,
  resendSeconds,
}: {
  /** 'all' = no Twilio at all. 'some' = DEMO_PHONES, everyone else gets a real text. */
  demo: DemoState
  /** E.164 numbers that take the console-code path, for the hint below. */
  demoNumbers: string[]
  resendSeconds: number
}) {
  const { tx } = useI18n()

  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sentTo, setSentTo] = useState('')
  /** A demo number's code, which the screen shows because no SMS carries it. */
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  // The resend countdown. The server is the authority on the limit; this only
  // stops the patient spending an attempt to be told to wait.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  async function send(event?: React.FormEvent) {
    event?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/otp/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'We could not send the code.')
        if (typeof data.retryAfter === 'number') setCooldown(data.retryAfter)
        return
      }
      setSentTo(data.sentTo ?? '')
      setCooldown(resendSeconds)
      setStep('code')
      setDemoCode(typeof data.code === 'string' ? data.code : null)
      setCode(typeof data.code === 'string' ? data.code : '')
    } catch {
      setError('No connection. Check your signal and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/otp/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'That code is not right.')
        return
      }
      router.replace(data.next === '/welcome' ? '/welcome' : '/today')
      router.refresh()
    } catch {
      setError('No connection. Check your signal and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={send} className="space-y-5" noValidate>
        <Field
          label={tx("Your mobile number")}
          hint={tx("The number your endoscopy hospital/clinic has on file.")}
          error={tx(error)}
        >
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            placeholder={tx("9123 4567")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </Field>

        <Button type="submit" disabled={busy || phone.trim().length < 8}>
          {tx(busy ? 'Sending…' : 'Send me a code')}
        </Button>

        <p className="text-[15px] leading-relaxed text-ink-muted">{tx("We will text you a 6-digit code. Standard message rates apply.")}</p>

        {demo !== 'off' ? (
          <Notice>
            <strong className="font-semibold">
              {tx(demo === 'all' ? 'Demo mode.' : 'Demo numbers.')}
            </strong>{tx(' ')}
            {tx(demo === 'all'
              ? 'No text message is sent — your code is shown on the next screen.'
              : 'These numbers skip the text message and show their code on the next screen. Any other number gets a real text.')}
            {demoNumbers.length > 0 ? (
              <>
                {tx(' ')}{tx("Try")}{tx(' ')}
                {demoNumbers.map((number, i) => (
                  <span key={number}>
                    {tx(i > 0 ? (i === demoNumbers.length - 1 ? ' or ' : ', ') : null)}
                    <button
                      type="button"
                      className="underline underline-offset-2"
                      onClick={() => setPhone(formatPhone(number))}
                    >
                      {tx(formatPhone(number))}
                    </button>
                  </span>
                ))}
                .
              </>
            ) : null}
          </Notice>
        ) : null}
      </form>
    )
  }

  return (
    <form onSubmit={verify} className="space-y-5" noValidate>
      {demoCode ? (
        <Notice>
          <strong className="font-semibold">{tx("Demo number, so no text was sent.")}</strong>{' '}{tx("Your code is")}{' '}<span className="font-mono font-semibold">{tx(demoCode)}</span>{tx(", filled in below.")}</Notice>
      ) : null}

      <Field
        label={tx("Enter your code")}
        hint={
          tx(sentTo
            ? `We sent a 6-digit code to the number ending ${sentTo}.`
            : 'We sent you a 6-digit code.')
        }
        error={tx(error)}
      >
        <Input
          ref={codeRef}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder={tx("000000")}
          className="otp-input text-center"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={error ? true : undefined}
        />
      </Field>

      <Button type="submit" disabled={busy || code.length !== 6}>
        {tx(busy ? 'Checking…' : 'Continue')}
      </Button>

      <div className="flex flex-col gap-3 text-[15px]">
        <button
          type="button"
          onClick={() => send()}
          disabled={busy || cooldown > 0}
          className="text-left font-semibold text-blue disabled:font-normal disabled:text-ink-faint"
        >
          {tx(cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code')}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('phone')
            setError(null)
            setCode('')
          }}
          className="text-left text-ink-muted underline underline-offset-2"
        >{tx("Use a different number")}</button>
      </div>
    </form>
  )
}
