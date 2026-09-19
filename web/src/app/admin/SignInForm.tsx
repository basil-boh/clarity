'use client'

import { useActionState } from 'react'

import { Button, Field, Input } from '@/components/ui'

import { signIn, type SignInState } from './actions'

export function AdminSignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {})

  return (
    <form action={action} className="space-y-5">
      <Field label="Admin password" error={state.error}>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </Button>
    </form>
  )
}
