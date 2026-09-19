import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { adminEnabled } from '@/lib/admin'

export const metadata: Metadata = {
  title: 'Admin — Clarity',
  robots: { index: false, follow: false },
}

/**
 * No `ADMIN_PASSWORD`, no admin: the whole subtree is a 404 rather than a
 * sign-in form, so an unconfigured deployment does not even say it has one.
 * Each page and action checks again through `requireAdmin()`, because a layout
 * is not re-run on every navigation and a server action never passes through it.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!adminEnabled()) notFound()
  return (
    <main id="main" className="mx-auto min-h-dvh w-full max-w-[760px] px-5 pb-16 pt-8">
      {children}
    </main>
  )
}
