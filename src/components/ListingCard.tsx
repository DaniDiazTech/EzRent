import { useState } from 'react'
import { formatCOP } from '../lib/format'
import { tr } from '../lib/i18n'
import type { Application, Listing } from '../types'
import { PhotoSlideshow } from './PhotoSlideshow'
import { Badge3D, Photo, StatusPill } from './ui'

export function ListingCard({ listing, fit, application }: { listing: Listing; fit?: boolean | null; application?: Application }) {
  const [idx, setIdx] = useState(0)
  const [showPhotos, setShowPhotos] = useState(false)
  const n = listing.photos.length
  const title = tr(listing.titleEn, listing.title)
  return (
    <article className="group animate-fade-up">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
        {n > 0 && (
          <button
            type="button"
            onClick={() => setShowPhotos(true)}
            aria-haspopup="dialog"
            aria-label={tr(`View photos of ${title}`, `Ver fotos de ${title}`)}
            className="size-full cursor-zoom-in focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-teal-400"
          >
            <Photo key={idx} src={listing.photos[idx]} alt="" className="size-full transition duration-500 group-hover:scale-[1.03]" />
            <span className="absolute right-2 bottom-2 rounded-lg bg-stone-950/75 px-2 py-1 text-xs font-bold text-white" aria-hidden="true">
              {idx + 1} / {n}
            </span>
          </button>
        )}
        <Badge3D className="pointer-events-none absolute left-3 top-3" />
        {application ? (
          <div className="pointer-events-none absolute right-3 top-3"><StatusPill status={application.status} /></div>
        ) : fit != null && (
          <span
            className={`pointer-events-none absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${fit ? 'bg-emerald-600 text-white' : 'bg-white/95 text-stone-600'}`}
          >
            {fit ? tr('✓ You qualify', '✓ Calificas') : tr('Not eligible', 'No calificas')}
          </span>
        )}
        {n > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
            {listing.photos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={tr(`Photo ${i + 1}`, `Foto ${i + 1}`)}
                aria-current={i === idx || undefined}
                onClick={() => setIdx(i)}
                className="pointer-events-auto flex h-6 min-w-5 items-center justify-center rounded-full px-1 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span className={`h-1.5 rounded-full shadow-sm ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/70'}`} />
              </button>
            ))}
          </div>
        )}
        {n > 1 && (
          <button
            aria-label={tr('Next photo', 'Siguiente foto')}
            type="button"
            onClick={() => setIdx((idx + 1) % n)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-stone-800 shadow hover:bg-white"
          >
            ›
          </button>
        )}
      </div>
      <a href={`#/inmueble/${listing.id}`} className="block rounded-b-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-stone-900">
              {listing.buildingName ?? `${listing.barrio}, Bogotá`}
            </h3>
            <p className="truncate text-sm text-stone-500">{listing.buildingName ? `${listing.barrio} · ${title}` : title}</p>
          </div>
          <span
            className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-bold text-stone-600"
            title={tr('Colombian socioeconomic tier of the area (1 to 6)', 'Estrato socioeconómico (1 a 6)')}
          >
            Estrato {listing.estrato}
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {tr(
            `${listing.habitaciones} bd · ${listing.banos} ba · ${listing.areaM2} m² · ${listing.parqueaderos ? `${listing.parqueaderos} parking` : 'No parking'}`,
            `${listing.habitaciones} hab · ${listing.banos} baños · ${listing.areaM2} m² · ${listing.parqueaderos ? `${listing.parqueaderos} parq.` : 'Sin parq.'}`,
          )}
        </p>
        <p className="mt-1.5 text-stone-900">
          <span className="font-bold">{formatCOP(listing.canon)}</span> <span className="text-sm text-stone-500">{tr(`/ month · HOA fee ${formatCOP(listing.administracion)}`, `/ mes · adm. ${formatCOP(listing.administracion)}`)}</span>
        </p>
      </a>
      {(listing.availableUnits ?? 0) > 1 && <p className="mt-1 text-xs font-semibold text-teal-800">
        {tr(`${listing.availableUnits} apartments available`, `${listing.availableUnits} apartamentos disponibles`)}
      </p>}
      {application?.status === 'aceptado' && <a href={`#/contrato/${application.id}`} className="mt-2 inline-block text-sm font-bold text-teal-800 underline underline-offset-4">
        {tr('Review and sign lease', 'Revisar y firmar contrato')}
      </a>}
      {showPhotos && <PhotoSlideshow photos={listing.photos} title={title} start={idx} onClose={() => setShowPhotos(false)} />}
    </article>
  )
}
