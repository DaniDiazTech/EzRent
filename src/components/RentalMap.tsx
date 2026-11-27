import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { tr } from '../lib/i18n'
import type { MapBounds, MapPoint } from '../lib/mapArea'
import {
  GOOGLE_AUTH_FAILURE, googleMapsKey, prepareGoogleMap, prepareOpenStreetMap, type RentalPin, type MapSurface,
} from '../lib/rentalMap'

interface Props {
  focus: MapPoint[]
  pins: RentalPin[]
  outline?: MapPoint[]
  drawing?: boolean
  onMove?: (bounds: MapBounds) => void
  onClick?: (point: MapPoint) => void
  onSelect?: (id: string) => void
}

export function RentalMap({ focus, pins, outline, drawing, onMove, onClick, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [provider, setProvider] = useState(googleMapsKey ? 'google' : 'osm')
  const [surface, setSurface] = useState<MapSurface>()
  const [failed, setFailed] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const onMapMove = useEffectEvent((bounds: MapBounds) => onMove?.(bounds))
  const onMapClick = useEffectEvent((point: MapPoint) => onClick?.(point))
  const onPinSelect = useEffectEvent((id: string) => onSelect?.(id))

  useEffect(() => {
    const element = container.current!
    const fallback = () => {
      setSurface(undefined)
      setProvider('osm')
    }
    let cancelled = false
    let instance: typeof surface
    if (provider === 'google') window.addEventListener(GOOGLE_AUTH_FAILURE, fallback)
    const prepare = provider === 'google' ? prepareGoogleMap : prepareOpenStreetMap
    prepare().then((create) => {
      if (cancelled) return
      instance = create(element, {
        move: (bounds) => onMapMove(bounds),
        click: (point) => onMapClick(point),
        select: (id) => onPinSelect(id),
        overview: (visible) => { if (!cancelled) setShowOverview(visible) },
      })
      setSurface(instance)
    }).catch(() => {
      if (cancelled) return
      if (provider === 'google') fallback()
      else setFailed(true)
    })

    return () => {
      cancelled = true
      window.removeEventListener(GOOGLE_AUTH_FAILURE, fallback)
      instance?.destroy()
    }
  }, [provider])

  useEffect(() => { surface?.fit(focus) }, [surface, focus])
  useEffect(() => { surface?.pins(pins) }, [surface, pins])
  useEffect(() => { surface?.outline(outline ?? [], !drawing) }, [surface, outline, drawing])

  return (
    <>
      <div ref={container} className={`rental-map-canvas ${drawing ? 'rental-map-drawing' : ''}`} role="region" aria-label={tr('Rental map', 'Mapa de inmuebles')} />
      {surface && showOverview && (
        <p className="rental-map-overview" role="status">
          {tr('Bogotá overview', 'Vista general de Bogotá')}
        </p>
      )}
      {!surface && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-teal-50 text-sm font-semibold text-teal-900" role="status">
          {failed ? tr('Map unavailable', 'Mapa no disponible') : tr('Loading map…', 'Cargando mapa…')}
        </div>
      )}
    </>
  )
}
