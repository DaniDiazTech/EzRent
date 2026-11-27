import { useMemo, useState } from 'react'
import { ListingCard } from '../components/ListingCard'
import { ListingMapSearch } from '../components/ListingMapSearch'
import { applicants, listings } from '../data/seed'
import { formatCOP } from '../lib/format'
import { tr } from '../lib/i18n'
import { inBounds, inPolygon, type MapBounds, type MapPoint } from '../lib/mapArea'
import { matchPriority, rentalMatches } from '../lib/matches'
import { useStore } from '../lib/store'
import type { Listing } from '../types'

const BARRIOS = [...new Set(listings.map((listing) => listing.barrio))].sort((a, b) => a.localeCompare(b, 'es-CO'))
const CITY = listings.map((listing) => listing.mapLocation)
const PRICE_STEPS = [
  { label: 'Cualquier precio', labelEn: 'Any rent', max: Infinity },
  { label: 'Hasta $1,8 M', labelEn: 'Up to $1.8M', max: 1_800_000 },
  { label: 'Hasta $2,5 M', labelEn: 'Up to $2.5M', max: 2_500_000 },
  { label: 'Hasta $3 M', labelEn: 'Up to $3M', max: 3_000_000 },
  { label: 'Hasta $4 M', labelEn: 'Up to $4M', max: 4_000_000 },
  { label: 'Hasta $6 M', labelEn: 'Up to $6M', max: 6_000_000 },
]
const monthlyCost = (listing: Listing) => listing.canon + listing.administracion

export function Listings({ nearby, onlyMatches }: { nearby?: Listing; onlyMatches: boolean }) {
  const s = useStore()
  const [barrio, setBarrio] = useState('')
  const [price, setPrice] = useState(0)
  const [rooms, setRooms] = useState(0)
  const [baths, setBaths] = useState(0)
  const [parking, setParking] = useState(false)
  const [onlyFit, setOnlyFit] = useState(onlyMatches)
  const [sort, setSort] = useState('')
  const [view, setView] = useState<'map' | 'list'>(onlyMatches ? 'list' : 'map')
  const [selectedId, setSelectedId] = useState(nearby?.id ?? '')
  const [highlighted, setHighlighted] = useState('')
  const [focus, setFocus] = useState(nearby ? [nearby.mapLocation] : CITY)
  const [bounds, setBounds] = useState<MapBounds>()
  const [visibleOnly, setVisibleOnly] = useState(true)
  const [area, setArea] = useState<MapPoint[]>([])

  const me = applicants.find((a) => a.id === s.applicantId)!
  const verified = s.verified.includes(me.id)
  const filterByQualification = verified && onlyFit
  const matches = useMemo(() => rentalMatches(me, s.applications), [me, s.applications])
  const byId = useMemo(() => new Map(matches.map((match) => [match.listing.id, match])), [matches])
  const priorities = useMemo(() => new Map(matches.map((match) => [match.listing.id, matchPriority(match, verified)])), [matches, verified])
  const matchCount = matches.filter((match) => (priorities.get(match.listing.id) ?? 0) >= 2).length
  const ready = matches.filter(({ application }) => application?.status === 'aceptado')
  const closest = verified && !matchCount
    ? matches.filter(({ application }) => !application).sort((a, b) =>
      b.result.passedCount - a.result.passedCount || monthlyCost(a.listing) - monthlyCost(b.listing)).slice(0, 3)
    : []

  const filtered = useMemo(() => listings.filter((listing) =>
    (!barrio || listing.barrio === barrio) &&
    listing.canon <= PRICE_STEPS[price].max &&
    listing.habitaciones >= rooms &&
    listing.banos >= baths &&
    (!parking || listing.parqueaderos > 0) &&
    (!filterByQualification || (priorities.get(listing.id) ?? 0) >= 2),
  ), [barrio, price, rooms, baths, parking, filterByQualification, priorities])
  const inArea = useMemo(() => filtered.filter((listing) =>
    (!area.length || inPolygon(listing.mapLocation, area)) &&
    (!visibleOnly || !bounds || inBounds(listing.mapLocation, bounds)),
  ), [filtered, area, visibleOnly, bounds])
  const results = useMemo(() => {
    if (sort === 'low') return [...inArea].sort((a, b) => monthlyCost(a) - monthlyCost(b))
    if (sort === 'high') return [...inArea].sort((a, b) => monthlyCost(b) - monthlyCost(a))
    return [...inArea].sort((a, b) => (priorities.get(b.id) ?? 0) - (priorities.get(a.id) ?? 0))
  }, [inArea, sort, priorities])

  function reset() {
    setBarrio('')
    setPrice(0)
    setRooms(0)
    setBaths(0)
    setParking(false)
    setOnlyFit(false)
    setArea([])
    setVisibleOnly(true)
    setSelectedId('')
    setBounds(undefined)
    setFocus([...CITY])
  }

  function showMatches() {
    reset()
    setOnlyFit(true)
    setView('list')
    setSort('')
  }

  function selectNeighborhood(value: string) {
    setBarrio(value)
    setArea([])
    setSelectedId('')
    setBounds(undefined)
    setFocus(value ? listings.filter((listing) => listing.barrio === value).map((listing) => listing.mapLocation) : [...CITY])
  }

  const narrowed = Boolean(barrio || price || rooms || baths || parking || filterByQualification || area.length)
  const resultCount = results.length === 1 ? tr('1 rental', '1 inmueble') : tr(`${results.length} rentals`, `${results.length} inmuebles`)

  return (
    <div>
      <section className="border-b border-teal-100 bg-gradient-to-br from-teal-50 to-white">
        <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6 sm:py-8">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            {tr('Find rentals in ', 'Encuentra arriendos en ')}<span className="text-teal-800">Bogotá</span>
          </h1>
          <p className="mt-2 text-sm text-stone-600 sm:text-base">
            {tr('Find your neighborhood, see where you qualify, and tour in 3D before visiting.', 'Encuentra tu barrio, revisa dónde calificas y recorre el inmueble en 3D antes de visitar.')}
          </p>
          {(verified || ready.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-teal-900">
              {ready.map(({ listing, application }) => (
                <a key={listing.id} href={`#/contrato/${application!.id}`} className="rounded-xl bg-teal-800 px-3 py-2 font-bold text-white hover:bg-teal-900">
                  {tr('Ready to sign', 'Listo para firmar')} · {listing.buildingName ?? listing.barrio}
                </a>
              ))}
              {verified && <span className="font-semibold">{tr(`Verified profile · ${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`, `Perfil verificado · ${matchCount} ${matchCount === 1 ? 'coincidencia' : 'coincidencias'}`)}</span>}
              {verified && matchCount > 0 && (
                <button type="button" className="font-bold underline underline-offset-4" onClick={showMatches}>{tr('Show my matches', 'Ver mis coincidencias')}</button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <select value={barrio} onChange={(event) => selectNeighborhood(event.target.value)} className="rental-filter" aria-label={tr('Neighborhood', 'Barrio')}>
            <option value="">{tr('All neighborhoods', 'Todos los barrios')}</option>
            {BARRIOS.map((name) => <option key={name}>{name}</option>)}
          </select>
          <select value={price} onChange={(event) => setPrice(Number(event.target.value))} className="rental-filter" aria-label={tr('Maximum monthly rent', 'Canon mensual máximo')}>
            {PRICE_STEPS.map((step, index) => <option key={step.label} value={index}>{tr(step.labelEn, step.label)}</option>)}
          </select>
          <select value={rooms} onChange={(event) => setRooms(Number(event.target.value))} className="rental-filter" aria-label={tr('Bedrooms', 'Habitaciones')}>
            <option value={0}>{tr('Beds', 'Hab.')}</option>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{tr(`${n}+ beds`, `${n}+ hab.`)}</option>)}
          </select>
          <select value={baths} onChange={(event) => setBaths(Number(event.target.value))} className="rental-filter" aria-label={tr('Bathrooms', 'Baños')}>
            <option value={0}>{tr('Baths', 'Baños')}</option>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{tr(`${n}+ baths`, `${n}+ baños`)}</option>)}
          </select>
          <label className="rental-filter">
            <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={parking} onChange={(event) => setParking(event.target.checked)} />
            {tr('Parking', 'Parqueadero')}
          </label>
          {verified && <label className="rental-filter">
            <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={filterByQualification} onChange={(event) => setOnlyFit(event.target.checked)} />
            {tr('Only show places where I qualify', 'Ver solo donde califico')}
          </label>}
          {narrowed && <button className="px-2 py-2 text-sm font-semibold text-teal-800 underline" onClick={reset}>{tr('Clear filters', 'Limpiar filtros')}</button>}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 py-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 className="text-lg font-extrabold" aria-live="polite">{resultCount}</h2>
            <span className="text-xs text-stone-600">
              {area.length ? tr('in drawn area', 'en la zona dibujada') : visibleOnly && bounds ? tr('in map view', 'en el mapa') : ''}
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <select value={sort} onChange={(event) => setSort(event.target.value)} className={`rental-filter ${view === 'map' ? 'rental-sort-map' : ''}`} aria-label={tr('Sort rentals', 'Ordenar inmuebles')}>
              <option value="">{tr('Recommended', 'Recomendados')}</option>
              <option value="low">{tr('Lowest monthly total', 'Menor total mensual')}</option>
              <option value="high">{tr('Highest monthly total', 'Mayor total mensual')}</option>
            </select>
            <div className="rental-view-toggle inline-flex lg:hidden" role="group" aria-label={tr('Results view', 'Vista de resultados')}>
              <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>{tr('Map', 'Mapa')}</button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>{tr('List', 'Lista')}</button>
            </div>
          </div>
        </div>

        <div className="rental-split relative grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          <div className={`min-w-0 lg:sticky lg:top-20 lg:block lg:self-start ${view === 'list' ? 'max-lg:invisible max-lg:absolute max-lg:inset-x-0' : ''}`}>
            <ListingMapSearch
              focus={focus} listings={results} selected={results.find((listing) => listing.id === selectedId)}
              highlighted={highlighted} onSelect={setSelectedId} onMove={setBounds}
              visibleOnly={visibleOnly} onVisibleOnly={setVisibleOnly} area={area} onArea={setArea}
              onFit={() => setFocus(filtered.length ? filtered.map((listing) => listing.mapLocation) : [...CITY])}
            />
          </div>
          <div
            className={`rental-results min-w-0 lg:block ${view === 'map' && results.length ? 'hidden' : ''}`}
            role="region"
            aria-label={tr('Rental results', 'Resultados de inmuebles')}
            tabIndex={0}
          >
            {results.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((listing) => (
                  <div key={listing.id}
                    className={`rental-result ${selectedId === listing.id ? 'rental-result-active' : ''}`}
                    onMouseEnter={() => setHighlighted(listing.id)}
                    onMouseLeave={() => setHighlighted('')}
                    onFocus={() => setHighlighted(listing.id)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setHighlighted('')
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      fit={verified ? byId.get(listing.id)?.result.qualified : null}
                      application={byId.get(listing.id)?.application}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 px-5 py-10 text-center">
                <h3 className="font-extrabold">{filterByQualification
                  ? tr('No matches in this search', 'No hay coincidencias en esta búsqueda')
                  : tr('No rentals found', 'No encontramos inmuebles')}</h3>
                <p className="mt-2 text-sm text-stone-600">{filterByQualification && !matchCount
                  ? tr('These rentals come closest to your verified profile. See each review for the requirements you still need to meet.', 'Estos inmuebles se acercan más a tu perfil verificado. Revisa qué requisitos te faltan en cada uno.')
                  : tr('Try a wider area or adjust your filters.', 'Prueba con una zona más amplia o ajusta los filtros.')}</p>
                {filterByQualification && closest.length > 0 && (
                  <ul className="mt-4 space-y-2 text-left">
                    {closest.map(({ listing, result }) => (
                      <li key={listing.id}>
                        <a href={`#/aplicar/${listing.id}`} className="block rounded-xl border border-stone-200 p-3 text-sm hover:bg-stone-50">
                          <span className="block font-bold text-teal-800">{listing.buildingName ?? listing.barrio}</span>
                          <span className="text-stone-600">{formatCOP(monthlyCost(listing))} · {tr(`${result.passedCount}/${result.results.length} requirements met`, `${result.passedCount}/${result.results.length} requisitos cumplidos`)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {filterByQualification && matchCount > 0 && (
                  <button type="button" onClick={showMatches} className="mt-4 mr-4 text-sm font-bold text-teal-800 underline">{tr('Show all my matches', 'Ver todas mis coincidencias')}</button>
                )}
                <button onClick={reset} className="mt-4 text-sm font-bold text-teal-800 underline">{tr('Reset search', 'Restablecer búsqueda')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
