const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const formatCOP = (n: number) => cop.format(n).replace(/ /g, ' ')

/** $2,6 M — compact millions for chips and chart labels. */
export const formatMillions = (n: number) =>
  `$${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: n % 1_000_000 === 0 ? 0 : 1 })} M`

const monthFmt = new Intl.DateTimeFormat('es-CO', { month: 'short' })
const monthLongFmt = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })

export const monthShort = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return monthFmt.format(new Date(y, m - 1, 1)).replace('.', '')
}

export const monthLong = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return monthLongFmt.format(new Date(y, m - 1, 1))
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

export const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ayer' : `hace ${d} días`
}

export const tenureLabel = (months: number) => {
  if (months < 12) return `${months} meses`
  const y = Math.floor(months / 12)
  const m = months % 12
  return `${y} ${y === 1 ? 'año' : 'años'}${m ? ` y ${m} ${m === 1 ? 'mes' : 'meses'}` : ''}`
}
