import { getLang, locale, tr } from './i18n'

const copEs = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const copEn = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** es: "$ 2.650.000" · en: "COP 2,650,000" (Colombian pesos, spelled out for English readers). */
export const formatCOP = (n: number) =>
  getLang() === 'es' ? copEs.format(n).replace(/ /g, ' ') : `${n < 0 ? '−' : ''}COP ${copEn.format(Math.abs(n))}`

/** $2,6 M — compact millions for chips and chart labels. */
export const formatMillions = (n: number) =>
  `$${(n / 1_000_000).toLocaleString(locale(), { maximumFractionDigits: 1, minimumFractionDigits: n % 1_000_000 === 0 ? 0 : 1 })} M`

/** Number with one decimal in the active locale (3,5 vs 3.5). */
export const formatRatio = (n: number) => n.toLocaleString(locale(), { maximumFractionDigits: 1 })

export const monthShort = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat(locale(), { month: 'short' }).format(new Date(y, m - 1, 1)).replace('.', '')
}

export const monthLong = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

export const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return tr('just now', 'hace un momento')
  if (min < 60) return tr(`${min} min ago`, `hace ${min} min`)
  const h = Math.round(min / 60)
  if (h < 24) return tr(`${h} h ago`, `hace ${h} h`)
  const d = Math.round(h / 24)
  return d === 1 ? tr('yesterday', 'ayer') : tr(`${d} days ago`, `hace ${d} días`)
}

export const tenureLabel = (months: number) => {
  if (months < 12) return tr(`${months} months`, `${months} meses`)
  const y = Math.floor(months / 12)
  const m = months % 12
  if (getLang() === 'es') return `${y} ${y === 1 ? 'año' : 'años'}${m ? ` y ${m} ${m === 1 ? 'mes' : 'meses'}` : ''}`
  return `${y} ${y === 1 ? 'year' : 'years'}${m ? ` and ${m} ${m === 1 ? 'month' : 'months'}` : ''}`
}
