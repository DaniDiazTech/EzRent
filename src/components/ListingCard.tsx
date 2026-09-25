import { useState } from 'react'
import { formatCOP } from '../lib/format'
import type { Listing } from '../types'
import { Badge3D, Photo } from './ui'

export function ListingCard({ listing, fit }: { listing: Listing; fit?: boolean | null }) {
  const [idx, setIdx] = useState(0)
  const n = listing.photos.length
  return (
    <a href={`#/inmueble/${listing.id}`} className="group block animate-fade-up">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
        <Photo src={listing.photos[idx]} alt={listing.title} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        <Badge3D className="absolute left-3 top-3" />
        {fit != null && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${fit ? 'bg-emerald-600 text-white' : 'bg-white/95 text-stone-600'}`}
          >
            {fit ? '✓ Calificas' : 'No calificas'}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {listing.photos.map((_, i) => (
            <button
              key={i}
              aria-label={`Foto ${i + 1}`}
              onClick={(e) => {
                e.preventDefault()
                setIdx(i)
              }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </div>
        {n > 1 && (
          <button
            aria-label="Siguiente foto"
            onClick={(e) => {
              e.preventDefault()
              setIdx((idx + 1) % n)
            }}
            className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow group-hover:flex"
          >
            ›
          </button>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-stone-900">
            {listing.barrio}, Bogotá
          </h3>
          <p className="truncate text-sm text-stone-500">{listing.title}</p>
        </div>
        <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-bold text-stone-600">Estrato {listing.estrato}</span>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        {listing.habitaciones} hab · {listing.banos} baños · {listing.areaM2} m² · {listing.parqueaderos ? `${listing.parqueaderos} parq.` : 'Sin parq.'}
      </p>
      <p className="mt-1.5 text-stone-900">
        <span className="font-bold">{formatCOP(listing.canon)}</span> <span className="text-sm text-stone-500">/ mes · adm. {formatCOP(listing.administracion)}</span>
      </p>
    </a>
  )
}
