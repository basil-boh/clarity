'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createI18n } from '@/domain/translate'
import { HTML_LANG, type Language } from '@/domain/i18n'

const LanguageContext = createContext<Language>('en')

/** One preference for every client component and the server-rendered routes. */
export function I18nProvider({ language: initial, children }: { language: Language; children: React.ReactNode }) {
  const [language, setLanguage] = useState(initial)
  const router = useRouter()
  useEffect(() => { setLanguage(initial) }, [initial])
  useEffect(() => {
    const change = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail
      setLanguage(next)
      document.documentElement.lang = HTML_LANG[next]
      router.refresh()
    }
    window.addEventListener('clarity-language', change)
    return () => window.removeEventListener('clarity-language', change)
  }, [router])
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const language = useContext(LanguageContext)
  return useMemo(() => createI18n(language), [language])
}

export function chooseAppLanguage(language: Language) {
  document.cookie = `clarity_lang=${language}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  window.dispatchEvent(new CustomEvent('clarity-language', { detail: language }))
}
