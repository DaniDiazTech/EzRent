export interface MapPoint {
  lat: number
  lng: number
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export function inBounds(point: MapPoint, bounds: MapBounds) {
  const { lat, lng } = point
  const { north, south, east, west } = bounds
  const insideLongitude = west <= east ? lng >= west && lng <= east : lng >= west || lng <= east
  return lat >= south && lat <= north && insideLongitude
}

export function inPolygon(point: MapPoint, path: MapPoint[]) {
  let inside = false
  for (let i = 0, previous = path.length - 1; i < path.length; previous = i++) {
    const a = path[previous]
    const b = path[i]
    const cross = (point.lng - a.lng) * (b.lat - a.lat) - (point.lat - a.lat) * (b.lng - a.lng)
    if (Math.abs(cross) < 1e-12 && inBounds(point, {
      south: Math.min(a.lat, b.lat), north: Math.max(a.lat, b.lat),
      west: Math.min(a.lng, b.lng), east: Math.max(a.lng, b.lng),
    })) return true
    if ((a.lat > point.lat) !== (b.lat > point.lat) &&
      point.lng < a.lng + ((point.lat - a.lat) * (b.lng - a.lng)) / (b.lat - a.lat)) {
      inside = !inside
    }
  }
  return inside
}
