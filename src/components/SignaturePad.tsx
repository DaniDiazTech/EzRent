import { useRef, useState, type PointerEvent } from 'react'
import { tr } from '../lib/i18n'

const WIDTH = 900
const HEIGHT = 300
type Point = { x: number; y: number }
type Bounds = { left: number; top: number; right: number; bottom: number }

export function SignaturePad({ onChange }: { onChange: (png: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pointer = useRef<number | null>(null)
  const last = useRef<Point | null>(null)
  const bounds = useRef<Bounds | null>(null)
  const [hasInk, setHasInk] = useState(false)

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.min(WIDTH, Math.max(0, (event.clientX - rect.left) * WIDTH / rect.width)),
      y: Math.min(HEIGHT, Math.max(0, (event.clientY - rect.top) * HEIGHT / rect.height)),
    }
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== null || event.button !== 0) return
    pointer.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    last.current = point(event)
    onChange(null)
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId || !last.current) return
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    const from = last.current
    const to = point(event)
    if (Math.hypot(to.x - from.x, to.y - from.y) < 1) return
    context.lineWidth = 5
    context.lineCap = 'round'
    context.strokeStyle = '#10574f'
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()
    last.current = to

    const box = bounds.current
    bounds.current = {
      left: Math.min(box?.left ?? from.x, to.x, from.x),
      top: Math.min(box?.top ?? from.y, to.y, from.y),
      right: Math.max(box?.right ?? from.x, to.x, from.x),
      bottom: Math.max(box?.bottom ?? from.y, to.y, from.y),
    }
    setHasInk(true)
  }

  function finish(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId) return
    pointer.current = null
    last.current = null
    const box = bounds.current
    if (!box || Math.hypot(box.right - box.left, box.bottom - box.top) < 18) return
    const left = Math.max(0, Math.floor(box.left) - 8)
    const top = Math.max(0, Math.floor(box.top) - 8)
    const width = Math.min(WIDTH, Math.ceil(box.right) + 8) - left
    const height = Math.min(HEIGHT, Math.ceil(box.bottom) + 8) - top
    const cropped = document.createElement('canvas')
    cropped.width = width
    cropped.height = height
    cropped.getContext('2d')?.drawImage(event.currentTarget, left, top, width, height, 0, 0, width, height)
    onChange(cropped.toDataURL('image/png'))
  }

  function clear() {
    canvas.current?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT)
    bounds.current = null
    pointer.current = null
    last.current = null
    setHasInk(false)
    onChange(null)
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-stone-300 bg-stone-50">
        <div aria-hidden="true" className="pointer-events-none absolute right-4 bottom-6 left-4 border-b border-stone-300" />
        {!hasInk && <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-stone-500">{tr('Draw here', 'Dibuja aquí')}</span>}
        <canvas
          ref={canvas} width={WIDTH} height={HEIGHT}
          aria-label={tr('Draw your signature', 'Dibuja tu firma')}
          className="relative block h-auto w-full touch-none cursor-crosshair"
          onPointerDown={start} onPointerMove={draw} onPointerUp={finish} onLostPointerCapture={finish}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-stone-600">{tr('Use your finger, mouse, or stylus.', 'Usa el dedo, el mouse o un lápiz táctil.')}</span>
        <button type="button" disabled={!hasInk} onClick={clear} className="font-bold text-teal-800 underline underline-offset-4 disabled:opacity-45">
          {tr('Clear', 'Borrar')}
        </button>
      </div>
    </>
  )
}
