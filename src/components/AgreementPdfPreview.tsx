import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { tr } from '../lib/i18n'

GlobalWorkerOptions.workerSrc = workerUrl

export function AgreementPdfPreview({ url, title }: { url: string; title: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let cancelled = false
    let render: RenderTask | undefined
    const document = getDocument({ url, useSystemFonts: true })

    async function paint() {
      const pdf = await document.promise
      const page = await pdf.getPage(1)
      if (cancelled || !element) return
      const viewport = page.getViewport({ scale: 2 })
      element.width = viewport.width
      element.height = viewport.height
      render = page.render({ canvas: element, viewport })
      await render.promise
      if (!cancelled) setState('ready')
    }

    paint().catch(() => { if (!cancelled) setState('error') })
    return () => {
      cancelled = true
      render?.cancel()
      void document.destroy().catch(() => undefined)
    }
  }, [url])

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-white px-4 py-3 text-sm">
        <h2 className="font-bold">{tr('Agreement preview', 'Vista previa del contrato')}</h2>
        {state === 'ready' && <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-stone-600">{tr('Page 1 of 1', 'Página 1 de 1')}</span>
          <button type="button" aria-pressed={zoomed} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50" onClick={() => setZoomed(!zoomed)}>
            {zoomed ? tr('Fit page', 'Ajustar página') : tr('Zoom in', 'Acercar')}
          </button>
        </div>}
      </div>
      <div className="max-h-[78dvh] overflow-auto p-3 sm:p-5" tabIndex={0} aria-label={tr('PDF document', 'Documento PDF')}>
        <canvas ref={canvas} role="img" aria-label={title}
          className={`mx-auto h-auto bg-white shadow-sm ${zoomed ? 'w-[830px] max-w-none' : 'w-full max-w-[612px]'} ${state === 'ready' ? 'block' : 'hidden'}`} />
        {state === 'loading' && <p role="status" className="p-7 text-center text-sm text-stone-600">{tr('Loading PDF…', 'Cargando PDF…')}</p>}
        {state === 'error' && <p role="status" className="p-7 text-center text-sm text-stone-700">
          {tr('The inline preview is unavailable.', 'La vista previa no está disponible.')}{' '}
          <a href={url} target="_blank" rel="noreferrer" className="font-bold text-teal-800 underline">{tr('Open PDF', 'Abrir PDF')}</a>
        </p>}
      </div>
    </div>
  )
}
