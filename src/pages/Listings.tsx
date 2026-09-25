import { useMemo, useState } from 'react'
import { ListingCard } from '../components/ListingCard'
import { applicants, listings } from '../data/seed'
import { evaluate } from '../lib/evaluate'
import { formatCOP } from '../lib/format'
import { tr } from '../lib/i18n'
import { useStore } from '../lib/store'

const BARRIOS = Array.from(new Set(listings.map((l) => l.barrio)))
const PRICE_STEPS = [
  { label: 'Cualquier precio', labelEn: 'Any price', max: Infinity },
  { label: 'Hasta $1,8 M', labelEn: 'Up to $1.8M', max: 1_800_000 },
  { label: 'Hasta $2,5 M', labelEn: 'Up to $2.5M', max: 2_500_000 },
  { label: 'Hasta $3 M', labelEn: 'Up to $3M', max: 3_000_000 },
  { label: 'Hasta $4 M', labelEn: 'Up to $4M', max: 4_000_000 },
]

export function Listings() {
  const s = useStore()
  const [barrio, setBarrio] = useState<string>('')
  const [price, setPrice] = useState(0)
  const [rooms, setRooms] = useState(0)
  const [onlyFit, setOnlyFit] = useState(false)

  const me = applicants.find((a) => a.id === s.applicantId)!
  const verified = s.verified.includes(me.id)

  const filtered = useMemo(
    () =>
      listings.filter(
        (l) =>
          (!barrio || l.barrio === barrio) &&
          l.canon <= PRICE_STEPS[price].max &&
          l.habitaciones >= rooms &&
          (!onlyFit || !verified || evaluate(me, l).qualified),
      ),
    [barrio, price, rooms, onlyFit, verified, me],
  )

  const fitCount = verified ? listings.filter((l) => evaluate(me, l).qualified).length : 0

  return (
    <div>
      <section className="border-b border-stone-100 bg-gradient-to-b from-teal-50/70 to-white">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pt-12">
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            {tr('Apply before you visit. ', 'Aplica antes de visitar. ')}
            <span className="text-teal-700">{tr('Only visit where you qualify.', 'Visita solo donde calificas.')}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            {tr(
              'Upload your documents once and our agent will reply right away with whether you meet each landlord’s requirements. Then tour every apartment in 3D before leaving home.',
              'Sube tus documentos una vez y nuestro agente te responderá de manera inmediata si cumples con los requisitos de cada propietario. Además, recorre cada apartamento en 3D antes de moverte.',
            )}
          </p>
          {verified ? (
            <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-teal-100">
              <span className="font-bold text-teal-800">{tr('✓ Documents verified', '✓ Documentos verificados')}</span>
              <span className="text-stone-600">
                {tr(`You qualify for ${fitCount} of ${listings.length} places.`, `Calificas en ${fitCount} de ${listings.length} inmuebles.`)}
              </span>
              <label className="ml-1 inline-flex items-center gap-2 font-semibold text-stone-800">
                <input type="checkbox" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} className="h-4 w-4 accent-teal-700" />
                {tr('Only show places where I qualify', 'Ver solo donde califico')}
              </label>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-600">
              <span>{tr('① Upload your documents just once', '① Sube tus documentos una sola vez')}</span>
              <span>{tr('② Our agent tells you right away if you meet the requirements', '② Nuestro agente te responde al instante si cumples los requisitos')}</span>
              <span>{tr('③ Tour in 3D and book the visit', '③ Recorre en 3D y agenda la visita')}</span>
            </div>
          )}
        </div>
      </section>

      <div className="sticky top-[105px] z-30 border-b border-stone-100 bg-white/95 backdrop-blur md:top-[65px]">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          <select value={barrio} onChange={(e) => setBarrio(e.target.value)} className="shrink-0 rounded-full border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold" aria-label={tr('Neighborhood', 'Barrio')}>
            <option value="">{tr('All neighborhoods', 'Todos los barrios')}</option>
            {BARRIOS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <select value={price} onChange={(e) => setPrice(Number(e.target.value))} className="shrink-0 rounded-full border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold" aria-label={tr('Price', 'Precio')}>
            {PRICE_STEPS.map((p, i) => (
              <option key={p.label} value={i}>
                {tr(p.labelEn, p.label)}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-stone-300 p-1" role="group" aria-label={tr('Bedrooms', 'Habitaciones')}>
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setRooms(n)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${rooms === n ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
              >
                {n === 0 ? tr('Beds', 'Hab.') : `${n}+`}
              </button>
            ))}
          </div>
          {(barrio || price || rooms || onlyFit) ? (
            <button onClick={() => (setBarrio(''), setPrice(0), setRooms(0), setOnlyFit(false))} className="shrink-0 px-2 text-sm font-semibold text-teal-700 underline">
              {tr('Clear', 'Limpiar')}
            </button>
          ) : null}
          <span className="ml-auto shrink-0 pl-2 text-sm text-stone-500">{tr(`${filtered.length} places`, `${filtered.length} inmuebles`)}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
            {tr(
              `No places match those filters. Try another neighborhood or a price up to ${formatCOP(4_000_000)}.`,
              `No hay inmuebles con esos filtros. Prueba con otro barrio o un precio hasta ${formatCOP(4_000_000)}.`,
            )}
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} fit={verified ? evaluate(me, l).qualified : null} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
