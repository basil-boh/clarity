'use client'

import { useI18n, chooseAppLanguage } from '@/components/I18nProvider'

import { useActionState, useState } from 'react'

import { Button, Card, Field, Input, Select } from '@/components/ui'
import { LANGUAGES, LANGUAGE_LABELS, type Language } from '@/domain/i18n'
import { DICTIONARIES } from '@/messages'

import type { RegistrationState } from './actions'

/**
 * The three things the app needs, and the language it asks them in.
 *
 * A client component for one reason: the language has to change **as the
 * patient chooses it**, not after a round trip. Someone reaching for this
 * dropdown cannot read the screen they are on, so a spinner or a flash of the
 * old language is the one thing the feature must not do. All four catalogues
 * are already in the bundle, so the switch is a re-render.
 *
 * The chosen language is written to a cookie at the same moment, so every
 * server-rendered page after this one agrees with what is on screen. The form
 * also posts it, so the preference is saved against the patient even if the
 * cookie is later cleared.
 */
export function WelcomeForm({
  action,
  language: initial,
  name,
  date,
  editing,
}: {
  action: (state: RegistrationState, form: FormData) => Promise<RegistrationState>
  language: Language
  name: string
  date: string
  editing: boolean
}) {
  const { tx } = useI18n()

  const [language, setLanguage] = useState<Language>(initial)
  const [state, submit, pending] = useActionState(action, {})
  const t = DICTIONARIES[language]

  function chooseLanguage(next: Language) {
    setLanguage(next)
    // Same name, path and lifetime as `lib/language.ts` writes, so the server
    // reads back exactly what the browser just set.
    chooseAppLanguage(next)
  }

  return (
    <form action={submit} className="space-y-5">
      <Card>
        <Field label={tx(t.language.question)} hint={tx(t.language.hint)}>
          <Select
            name="language"
            value={language}
            onChange={(event) => chooseLanguage(event.target.value as Language)}
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {tx(LANGUAGE_LABELS[code])}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Card>
        <Field
          label={tx(t.welcome.nameLabel)}
          error={tx(state.errors?.name ? t.welcome[state.errors.name] : null)}
        >
          <Input
            name="name"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            defaultValue={name}
            placeholder={tx(t.welcome.namePlaceholder)}
            aria-invalid={Boolean(state.errors?.name)}
          />
        </Field>
      </Card>

      <Card>
        <Field
          label={tx(t.welcome.dateLabel)}
          hint={tx(t.welcome.dateHint)}
          error={tx(state.errors?.date ? t.welcome[state.errors.date] : null)}
        >
          <Input
            name="date"
            type="date"
            defaultValue={date}
            aria-invalid={Boolean(state.errors?.date)}
          />
        </Field>
      </Card>

      {state.failed ? (
        <p role="alert" className="text-[15px] font-medium text-flag-red">
          {tx(t.welcome.saveFailed)}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {tx(pending ? t.welcome.saving : editing ? t.welcome.editSubmit : t.welcome.submit)}
      </Button>
    </form>
  )
}

export function WelcomeIntro({ editing }: { editing: boolean }) {
  const { language } = useI18n()
  const t = DICTIONARIES[language]
  return <>
    <h1 className="mt-5 text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
      {editing ? t.welcome.editTitle : t.welcome.title}
    </h1>
    <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">
      {editing ? t.welcome.editIntro : t.welcome.intro}
    </p>
  </>
}
