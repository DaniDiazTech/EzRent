import { useState } from 'react'
import { tr } from '../lib/i18n'
import { PhotoSlideshow } from './PhotoSlideshow'
import { Photo } from './ui'

export function ListingGallery({ photos, title }: { photos: string[]; title: string }) {
  const [start, setStart] = useState<number | null>(null)
  if (!photos.length) return null

  return (
    <>
      <div className="mt-4 grid h-56 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-80">
        {photos.slice(0, 4).map((photo, index) => (
          <button
            type="button"
            key={index}
            onClick={() => setStart(index)}
            aria-haspopup="dialog"
            aria-label={tr(`Open photo ${index + 1} of ${photos.length}`, `Abrir foto ${index + 1} de ${photos.length}`)}
            className="listing-gallery-tile group relative size-full cursor-zoom-in overflow-hidden bg-stone-100 focus-visible:z-10 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-teal-400"
          >
            <Photo src={photo} alt="" className="size-full transition duration-300 group-hover:scale-[1.025]" />
            {index === 0 && (
              <span className="absolute right-3 bottom-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-stone-900 shadow-sm">
                {tr(`View photos (${photos.length})`, `Ver fotos (${photos.length})`)}
              </span>
            )}
          </button>
        ))}
      </div>
      {start !== null && <PhotoSlideshow photos={photos} title={title} start={start} onClose={() => setStart(null)} />}
    </>
  )
}
