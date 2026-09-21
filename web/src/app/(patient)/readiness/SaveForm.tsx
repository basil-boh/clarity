'use client'

import { useActionState, type ReactNode } from 'react'

/** Keep a failed check-in editable and prevent repeated submissions while saving. */
export function SaveForm({ action, children, className }: {
  action: (form: FormData) => Promise<void>
  children: ReactNode
  className?: string
}) {
  const [status, submit, pending] = useActionState(async (_previous: string, form: FormData) => {
    try {
      await action(form)
      return 'Saved'
    } catch {
      return 'Could not save your check-in. Please try again.'
    }
  }, '')
  return (
    <form action={submit} className={className}>
      <fieldset disabled={pending}>{children}</fieldset>
      <p role="status" aria-live="polite" className="mt-1 text-[14px] text-ink-muted">
        {pending ? 'Saving…' : status}
      </p>
    </form>
  )
}
