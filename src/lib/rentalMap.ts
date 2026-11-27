import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import type { FeatureCollection } from 'geojson'
import type { MapBounds, MapPoint } from './mapArea'

export interface RentalPin {
  id: string
  position: MapPoint
  price: string
  title: string
  active: boolean
  highlighted: boolean
}

interface MapEvents {
  move: (bounds: MapBounds) => void
  click: (point: MapPoint) => void
  select: (id: string) => void
  overview: (visible: boolean) => void
}

export interface MapSurface {
  fit: (points: MapPoint[]) => void
  pins: (pins: RentalPin[]) => void
  outline: (points: MapPoint[], closed: boolean) => void
  destroy: () => void
}

export const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'
export const GOOGLE_AUTH_FAILURE = 'ezrent:google-maps-auth-failure'
let googleLibraries: ReturnType<typeof loadGoogleLibraries> | undefined
let googleAuthFailed = false

function loadGoogleLibraries() {
  const authWindow = window as Window & { gm_authFailure?: () => void }
  authWindow.gm_authFailure = () => {
    googleAuthFailed = true
    window.dispatchEvent(new Event(GOOGLE_AUTH_FAILURE))
  }
  setOptions({ key: googleMapsKey, v: 'weekly', region: 'CO' })
  return Promise.all([importLibrary('maps'), importLibrary('marker')])
}

function syncPins<T>(
  markers: Map<string, { marker: T; content: HTMLElement }>,
  pins: RentalPin[],
  create: (pin: RentalPin, content: HTMLElement) => T,
  update: (marker: T, pin: RentalPin, raised: boolean) => void,
  remove: (marker: T) => void,
) {
  const visible = new Set(pins.map((pin) => pin.id))
  for (const [id, { marker }] of markers) {
    if (visible.has(id)) continue
    remove(marker)
    markers.delete(id)
  }
  for (const pin of pins) {
    let entry = markers.get(pin.id)
    if (!entry) {
      const content = document.createElement('span')
      content.className = 'rental-pin'
      entry = { marker: create(pin, content), content }
      markers.set(pin.id, entry)
    }
    const raised = pin.active || pin.highlighted
    entry.content.textContent = pin.price
    entry.content.classList.toggle('rental-pin-raised', raised)
    update(entry.marker, pin, raised)
  }
}

export async function prepareGoogleMap() {
  const [{ Map: GoogleMap, Polygon, Polyline }, { AdvancedMarkerElement }] = await (googleLibraries ??= loadGoogleLibraries())
  if (googleAuthFailed) throw new Error('Google Maps authorization failed')
  return (container: HTMLElement, events: MapEvents): MapSurface => {
    const map = new GoogleMap(container, {
      mapId, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      clickableIcons: false, gestureHandling: 'cooperative', headingInteractionEnabled: false,
      tiltInteractionEnabled: false, cameraControl: false, zoomControl: true,
    })
    const markers = new Map<string, { marker: google.maps.marker.AdvancedMarkerElement; content: HTMLElement }>()
    const removeMarker = (marker: google.maps.marker.AdvancedMarkerElement) => { marker.map = null }
    const border = { strokeColor: '#0f766e', strokeOpacity: 1, strokeWeight: 3, clickable: false }
    const line = new Polyline({ ...border, map })
    const polygon = new Polygon({ ...border, fillColor: '#0f766e', fillOpacity: 0.17, map })
    const idle = map.addListener('idle', () => {
      const bounds = map.getBounds()?.toJSON()
      if (bounds) events.move(bounds)
    })
    const click = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) events.click(event.latLng.toJSON())
    })

    return {
      fit(points) {
        if (points.length === 1) {
          map.setCenter(points[0])
          map.setZoom(15)
        } else {
          const bounds = new google.maps.LatLngBounds()
          for (const point of points) bounds.extend(point)
          map.fitBounds(bounds, 54)
        }
      },
      pins(pins) {
        syncPins(markers, pins, (pin, content) => {
          const marker = new AdvancedMarkerElement({ map, position: pin.position, gmpClickable: true })
          marker.append(content)
          marker.addEventListener('gmp-click', () => events.select(pin.id))
          return marker
        }, (marker, pin, raised) => {
          marker.title = pin.title
          marker.zIndex = raised ? 2 : 1
        }, removeMarker)
      },
      outline(points, closed) {
        line.setPath(closed ? [] : points)
        polygon.setPath(closed ? points : [])
      },
      destroy() {
        idle.remove()
        click.remove()
        for (const { marker } of markers.values()) removeMarker(marker)
        line.setMap(null)
        polygon.setMap(null)
        container.replaceChildren()
      },
    }
  }
}

const OVERVIEW_LABELS = [
  { name: 'Suba', position: { lat: 4.7455, lng: -74.0993 } },
  { name: 'Cedritos', position: { lat: 4.7255, lng: -74.0413 } },
  { name: 'Usaquén', position: { lat: 4.6975, lng: -74.0382 } },
  { name: 'Ciudad Salitre', position: { lat: 4.6468, lng: -74.1087 } },
  { name: 'Chapinero', position: { lat: 4.6325, lng: -74.0543 } },
  { name: 'Teusaquillo', position: { lat: 4.619, lng: -74.076 } },
  { name: 'Bogotá', position: { lat: 4.5981, lng: -74.0758 } },
]

const OVERVIEW_STYLES: Record<string, L.PathOptions> = {
  park: { fillColor: '#bfdbb7', fillOpacity: 1, stroke: false },
  water: { fillColor: '#aecfdb', fillOpacity: 1, stroke: false },
  waterway: { color: '#9bc5d6', weight: 1.6, opacity: 1 },
  minor: { color: '#fff', weight: 1.2, opacity: 1 },
  major: { color: '#b9b6a6', weight: 1.6, opacity: 1 },
}

export async function prepareOpenStreetMap() {
  const [L, { default: overview }] = await Promise.all([
    import('leaflet'), import('../data/bogotaOverview.geojson?raw'), import('leaflet/dist/leaflet.css'),
  ])
  const geometry: FeatureCollection = JSON.parse(overview)
  return (container: HTMLElement, events: MapEvents): MapSurface => {
    const map = L.map(container, {
      zoomControl: false, scrollWheelZoom: false, maxZoom: 19, worldCopyJump: true,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.attributionControl.setPrefix(false)
    // The local overview sits behind the live tiles so missing tiles still show real geography.
    const pane = map.createPane('bogota-overview')
    pane.style.zIndex = '190'
    pane.style.pointerEvents = 'none'
    const renderer = L.canvas({ pane: 'bogota-overview' }) ?? undefined
    L.geoJSON(geometry, {
      pane: 'bogota-overview',
      interactive: false,
      style: (feature) => ({ renderer, ...OVERVIEW_STYLES[feature?.properties?.kind ?? 'major'] }),
    }).addTo(map)
    for (const label of OVERVIEW_LABELS) {
      const text = document.createElement('span')
      text.textContent = label.name
      L.marker(label.position, {
        pane: 'bogota-overview',
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ html: text, className: 'rental-place-label', iconSize: [92, 15] }),
      }).addTo(map)
    }
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    const vectorAttribution = '<a href="https://openfreemap.org/">OpenFreeMap</a> · &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>'
    map.attributionControl.addAttribution(vectorAttribution)
    events.overview(true)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution,
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).once('tileload', () => {
      events.overview(false)
    }).addTo(map)
    const layer = L.layerGroup().addTo(map)
    const markers = new Map<string, { marker: L.Marker; content: HTMLElement }>()
    const stroke = { color: '#0f766e', weight: 3, interactive: false }
    const line = L.polyline([], stroke).addTo(map)
    const polygon = L.polygon([], { ...stroke, fillOpacity: 0.17 }).addTo(map)
    map.on('moveend', () => {
      const bounds = map.getBounds()
      events.move({ north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest() })
    })
    map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng.wrap()
      events.click({ lat, lng })
    })
    const resize = new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) map.invalidateSize({ pan: false })
    })
    resize.observe(container)

    return {
      fit(points) {
        if (points.length === 1) map.setView(points[0], 15, { animate: false })
        else map.fitBounds(points.map(({ lat, lng }) => [lat, lng]), { padding: [54, 54], maxZoom: 16, animate: false })
      },
      pins(pins) {
        syncPins(markers, pins, (pin, content) => {
          const marker = L.marker(pin.position, {
            icon: L.divIcon({ html: content, className: 'rental-pin-anchor', iconSize: [0, 0] }),
          }).addTo(layer)
          marker.on('click', () => events.select(pin.id))
          marker.getElement()?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            event.stopPropagation()
            events.select(pin.id)
          })
          return marker
        }, (marker, pin, raised) => {
          marker.getElement()?.setAttribute('aria-label', pin.title)
          marker.setZIndexOffset(raised ? 1000 : 0)
        }, (marker) => layer.removeLayer(marker))
      },
      outline(points, closed) {
        line.setLatLngs(closed ? [] : points)
        polygon.setLatLngs(closed ? points : [])
      },
      destroy() {
        resize.disconnect()
        map.remove()
      },
    }
  }
}
