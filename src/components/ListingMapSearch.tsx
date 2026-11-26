import { useMemo, useState } from 'react'
import { formatCOP } from '../lib/format'
import { locale, tr } from '../lib/i18n'
import type { MapBounds, MapPoint } from '../lib/mapArea'
import type { Listing } from '../types'
import { RentalMap } from './RentalMap'
import { Photo } from './ui'

const compactPrice = (price: number) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(price / 1_000_000)

export function ListingMapSearch({
  focus, listings, selected, highlighted, onSelect, onMove, visibleOnly, onVisibleOnly, area, onArea, onFit,
}: {
  focus: MapPoint[]
  listings: Listing[]
  selected?: Listing
  highlighted: string
  onSelect: (id: string) => void
  onMove: (bounds: MapBounds) => void
  visibleOnly: boolean
  onVisibleOnly: (value: boolean) => void
  area: MapPoint[]
  onArea: (points: MapPoint[]) => void
  onFit: () => void
}) {
  const [draft, setDraft] = useState<MapPoint[] | null>(null)
  const lang = locale()
  const pins = useMemo(() => listings.map((listing) => ({
    id: listing.id,
    position: listing.mapLocation,
    title: `${listing.barrio}, ${formatCOP(listing.canon)}`,
    price: `$${compactPrice(listing.canon)}M`,
    active: selected?.id === listing.id,
    highlighted: highlighted === listing.id,
  })), [listings, selected, highlighted, lang])

  function finishArea() {
    if (!draft || draft.length < 3) return
    onArea(draft)
    onVisibleOnly(false)
    setDraft(null)
  }

  return (
    <section className="rental-map-search rental-map-frame" aria-label={tr('Map search', 'Búsqueda por mapa')}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && draft) setDraft(null)
      }}
    >
      <RentalMap
        focus={focus}
        pins={pins}
        outline={draft ?? area}
        drawing={draft !== null}
        onMove={onMove}
        onSelect={(id) => { if (!draft) onSelect(id) }}
        onClick={(point) => setDraft((points) => points && [...points, point])}
      />

      <div className="rental-map-controls">
        {draft ? (
          <div className="rental-map-toolbox">
            <p className="basis-full text-xs font-semibold text-stone-700">
              {tr('Tap at least 3 points to outline your search area.', 'Toca al menos 3 puntos para delimitar tu búsqueda.')}
            </p>
            <button type="button" className="map-tool map-tool-primary" disabled={draft.length < 3} onClick={finishArea}>
              {tr('Apply area', 'Aplicar zona')}
            </button>
            <button type="button" className="map-tool" disabled={!draft.length} onClick={() => setDraft(draft.slice(0, -1))}>
              {tr('Undo point', 'Deshacer punto')}
            </button>
            <button type="button" className="map-tool" onClick={() => setDraft(null)}>{tr('Cancel', 'Cancelar')}</button>
          </div>
        ) : (
          <>
            <label className="map-tool">
              <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={visibleOnly}
                onChange={(event) => onVisibleOnly(event.target.checked)} />
              {tr('Search as I move', 'Buscar al mover el mapa')}
            </label>
            <button type="button" className="map-tool" onClick={() => setDraft([])}>
              {area.length ? tr('Redraw area', 'Volver a dibujar') : tr('Draw area', 'Dibujar zona')}
            </button>
            {area.length > 0 ? (
              <button type="button" className="map-tool" onClick={() => onArea([])}>{tr('Clear area', 'Quitar zona')}</button>
            ) : (
              <button type="button" className="map-tool" onClick={onFit}>{tr('Fit results', 'Centrar resultados')}</button>
            )}
          </>
        )}
      </div>

      {!draft && selected && (
        <div className="rental-map-preview">
          <a href={`#/inmueble/${selected.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-teal-700">
            <Photo className="h-14 w-16 shrink-0 rounded-lg" src={selected.photos[0]} alt="" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-teal-800">{selected.barrio}</p>
              <p className="truncate text-sm font-extrabold">{tr(selected.titleEn, selected.title)}</p>
              <p className="text-xs text-stone-600">{formatCOP(selected.canon)} {tr('/ month', '/ mes')}</p>
            </div>
          </a>
          <button type="button" className="h-8 w-8 shrink-0 rounded-full text-lg hover:bg-stone-100" aria-label={tr('Close preview', 'Cerrar vista previa')}
            onClick={() => onSelect('')}>×</button>
        </div>
      )}

      {!draft && !selected && <p className="rental-map-caption">{tr('Approximate locations', 'Ubicaciones aproximadas')}</p>}
    </section>
  )
}
