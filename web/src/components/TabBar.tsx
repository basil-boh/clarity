'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Five destinations, fixed to the bottom of the phone.
 *
 * Five is the ceiling at 390px with 44px tap targets, so every label is one
 * short word. Journey lost its tab to Diet and Ask -- it is read once, early,
 * and reached from Today's "All stages" link, whereas these two are opened
 * repeatedly and at speed.
 */
const TABS = [
  { href: '/today', label: 'Today' },
  { href: '/prep', label: 'Plan' },
  { href: '/diet', label: 'Diet' },
  { href: '/ask', label: 'Ask' },
  { href: '/progress', label: 'Progress' },
] as const

export function TabBar() {
  const path = usePathname()

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex w-full max-w-[560px]">
        {TABS.map((tab) => {
          const active = path === tab.href || path.startsWith(`${tab.href}/`)
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 text-[13px] font-semibold leading-tight ${
                  active ? 'text-blue' : 'text-ink-faint'
                }`}
              >
                <span
                  aria-hidden
                  className={`h-[3px] w-7 rounded-full ${active ? 'bg-blue' : 'bg-transparent'}`}
                />
                <span className="text-center">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
