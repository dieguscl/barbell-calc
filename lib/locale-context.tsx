"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { type Locale, translations, type TranslationKey } from "./i18n"

const STORAGE_KEY = "barbell-calc-locale"

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

function getDefaultLocale(): Locale {
  if (typeof window === "undefined") return "en"

  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && stored in translations) return stored

  const browserLang = navigator.language.slice(0, 2).toLowerCase()
  if (browserLang === "es") return "es"
  if (browserLang === "pt") return "pt"
  return "en"
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocaleState(getDefaultLocale())
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale]
  )

  if (!mounted) return null

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }
  return context
}
