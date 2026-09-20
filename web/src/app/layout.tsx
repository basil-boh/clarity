import type { Metadata, Viewport } from 'next'
import { DM_Mono, Inter } from 'next/font/google'

import { HTML_LANG } from '@/domain/i18n'
import { readLanguage } from '@/lib/language'

import './globals.css'

/**
 * Two faces, and the split is the deck's.
 *
 * Inter carries everything a patient reads as prose, set large — the median
 * user is over 50 and a good deal of the reading happens at one in the morning.
 * DM Mono carries times, dates, stamps and measurements: anything the eye needs
 * to compare down a column rather than read along a line. Self-hosted by Next,
 * so nothing depends on a font CDN being reachable on hospital wifi.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Clarity — your colonoscopy preparation',
  description:
    'Your appointment, what to do and when, and how your preparation is going. From your endoscopy department.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

/**
 * `lang` is set from the patient's choice, not fixed to English.
 *
 * It is what tells the browser to reach for a Chinese or Tamil face instead of
 * rendering tofu in Inter, which only carries Latin here, and what tells a
 * screen reader which voice to use. Getting it wrong is not cosmetic: a Tamil
 * sentence read aloud by an English voice is not readable at all.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = await readLanguage()

  return (
    <html lang={HTML_LANG[language]} className={`${inter.variable} ${dmMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
