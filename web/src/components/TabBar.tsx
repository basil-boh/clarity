'use client'

import { useI18n } from '@/components/I18nProvider'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Patient destinations, fixed to the bottom of the phone.
 * The minimum item width preserves tap targets on narrow screens.
 */
const TABS = [
  { href: '/today', key: 'home' },
  { href: '/prep', key: 'plan' },
  { href: '/diet', key: 'diet' },
  { href: '/ask', key: 'ask' },
  { href: '/readiness', key: 'readiness' },
] as const

/**
 * Labels come from the server rather than a lookup in here, so the tabs are
 * already in the right language in the first paint -- the bar is the one part
 * of the app on screen for every page, and it flickering through English on
 * each navigation would be worse than not translating it at all.
 */
export function TabBar({ labels }: { labels: Record<(typeof TABS)[number]['key'], string> }) {
  const { tx } = useI18n()

  const path = usePathname()

  return (
    <nav
      aria-label={tx("Sections")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex w-full max-w-[560px] overflow-x-auto">
        {TABS.map((tab) => {
          const active = path === tab.href || path.startsWith(`${tab.href}/`)
          return (
            <li key={tab.href} className="min-w-[60px] flex-1">
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
                <span className="text-center">{tx(labels[tab.key])}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
