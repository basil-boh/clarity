'use client'

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
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sentTo, setSentTo] = useState('')
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
      setCode('')
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
      router.replace('/today')
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
          label="Your mobile number"
          hint="The number your endoscopy department has on file."
          error={error}
        >
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            placeholder="9123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </Field>

        <Button type="submit" disabled={busy || phone.trim().length < 8}>
          {busy ? 'Sending…' : 'Send me a code'}
        </Button>

        <p className="text-[15px] leading-relaxed text-ink-muted">
          We will text you a 6-digit code. Standard message rates apply.
        </p>

        {demo !== 'off' ? (
          <Notice>
            <strong className="font-semibold">
              {demo === 'all' ? 'Demo mode.' : 'Demo numbers.'}
            </strong>{' '}
            {demo === 'all'
              ? 'No SMS is sent — the code is printed in the server console.'
              : 'These numbers skip the SMS and print their code in the server console. Any other number gets a real text.'}
            {demoNumbers.length > 0 ? (
              <>
                {' '}
                Try{' '}
                {demoNumbers.map((number, i) => (
                  <span key={number}>
                    {i > 0 ? (i === demoNumbers.length - 1 ? ' or ' : ', ') : null}
                    <button
                      type="button"
                      className="underline underline-offset-2"
                      onClick={() => setPhone(formatPhone(number))}
                    >
                      {formatPhone(number)}
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
      <Field
        label="Enter your code"
        hint={
          sentTo
            ? `We sent a 6-digit code to the number ending ${sentTo}.`
            : 'We sent you a 6-digit code.'
        }
        error={error}
      >
        <Input
          ref={codeRef}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          className="otp-input text-center"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={error ? true : undefined}
        />
      </Field>

      <Button type="submit" disabled={busy || code.length !== 6}>
        {busy ? 'Checking…' : 'Continue'}
      </Button>

      <div className="flex flex-col gap-3 text-[15px]">
        <button
          type="button"
          onClick={() => send()}
          disabled={busy || cooldown > 0}
          className="text-left font-semibold text-blue disabled:font-normal disabled:text-ink-faint"
        >
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep('phone')
            setError(null)
            setCode('')
          }}
          className="text-left text-ink-muted underline underline-offset-2"
        >
          Use a different number
        </button>
      </div>
    </form>
  )
}
