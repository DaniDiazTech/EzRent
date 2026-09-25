export type Lang = 'en' | 'es'

export const DEFAULT_LANG: Lang = 'en'

let current: Lang = DEFAULT_LANG

/** Set by the store provider on every render, before children render. */
export function setLang(lang: Lang) {
  current = lang
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'es' ? 'es-CO' : 'en'
    document.title = lang === 'es' ? 'EzRent — Arrienda sin vueltas' : 'EzRent — Rent without the runaround'
  }
}

export const getLang = () => current

/** Pick the English or Spanish version of a piece of copy for the active language. */
export function tr<T>(en: T, es: T): T {
  return current === 'es' ? es : en
}

export const locale = () => (current === 'es' ? 'es-CO' : 'en-US')
