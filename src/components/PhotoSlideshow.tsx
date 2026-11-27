import { useEffect, useId, useRef, useState } from 'react'
import { tr } from '../lib/i18n'
import { Photo } from './ui'

const control = 'flex size-11 shrink-0 items-center justify-center rounded-full bg-stone-800 text-2xl text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function PhotoSlideshow({ photos, title, start, onClose }: {
  photos: string[]
  title: string
  start: number
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const titleId = useId()
  const [index, setIndex] = useState(start)
  const count = photos.length

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
  }, [])

  function move(direction: number) {
    setIndex((current) => (current + direction + count) % count)
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
      className="photo-slideshow fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-stone-950 p-0 text-white backdrop:bg-stone-950"
    >
      <div className="mx-auto grid h-full max-w-screen-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3 sm:gap-4 sm:p-6">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-bold sm:text-base">{title}</h2>
            <p aria-live="polite" className="mt-0.5 text-sm text-stone-300">
              {tr(`Photo ${index + 1} of ${count}`, `Foto ${index + 1} de ${count}`)}
            </p>
          </div>
          <button type="button" className={control} onClick={() => dialog.current?.close()} aria-label={tr('Close photos', 'Cerrar fotos')}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="relative grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden rounded-xl bg-black sm:px-14">
          <div
            className="size-full touch-pan-y select-none"
            onPointerDown={(event) => {
              if (event.pointerType !== 'touch') return
              event.currentTarget.setPointerCapture(event.pointerId)
              touchStart.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerUp={(event) => {
              const start = touchStart.current
              touchStart.current = null
              if (!start) return
              const dx = event.clientX - start.x
              const dy = event.clientY - start.y
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
            }}
            onPointerCancel={() => { touchStart.current = null }}
          >
            <Photo key={index} src={photos[index]} alt={tr(`${title}, photo ${index + 1}`, `${title}, foto ${index + 1}`)} fit="contain" className="size-full" />
          </div>
          {count > 1 && (
            <>
              <button type="button" className={`${control} absolute left-2 sm:left-3`} aria-label={tr('Previous photo', 'Foto anterior')} onClick={() => move(-1)}>
                <span aria-hidden="true">‹</span>
              </button>
              <button type="button" className={`${control} absolute right-2 sm:right-3`} aria-label={tr('Next photo', 'Siguiente foto')} onClick={() => move(1)}>
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </div>
        {count > 1 && (
          <div className="mx-auto flex w-fit max-w-full gap-2 overflow-x-auto px-1 py-1" role="group" aria-label={tr('Photo thumbnails', 'Miniaturas de fotos')}>
            {photos.map((photo, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIndex(i)}
                aria-label={tr(`Go to photo ${i + 1}`, `Ir a la foto ${i + 1}`)}
                aria-current={i === index || undefined}
                className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-16 sm:w-24 ${i === index ? 'ring-2 ring-teal-300' : 'opacity-60 hover:opacity-100'}`}
              >
                <Photo src={photo} alt="" className="size-full" />
              </button>
            ))}
          </div>
        )}
      </div>
    </dialog>
  )
}
