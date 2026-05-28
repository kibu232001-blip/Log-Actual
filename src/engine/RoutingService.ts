/**
 * RoutingService — fetches real road geometry from OSRM public API
 * Results are cached in memory and localStorage so routes are only
 * fetched once per LOC across sessions.
 *
 * OSRM public endpoint: router.project-osrm.org (free, no key)
 * Falls back to straight-line if API unreachable (offline/mobile)
 */

export interface RouteGeometry {
  locId: string
  coordinates: [number, number][]  // [lng, lat] pairs — GeoJSON order
  distanceKm: number
  durationHours: number
  fromActual: [number, number]
  toActual: [number, number]
}

const CACHE_KEY = 'logactual_route_cache_v3'
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

// In-memory cache
const memCache: Record<string, RouteGeometry> = {}

// Load persistent cache from localStorage
function loadCache(): Record<string, RouteGeometry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch(e) {}
  return {}
}

function saveCache(cache: Record<string, RouteGeometry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch(e) {}
}

// Straight-line fallback when OSRM unavailable
function straightLine(locId: string, from: [number,number], to: [number,number]): RouteGeometry {
  // Interpolate 10 points for a smoother line
  const points: [number,number][] = []
  for (let i = 0; i <= 10; i++) {
    points.push([
      from[0] + (to[0] - from[0]) * i / 10,
      from[1] + (to[1] - from[1]) * i / 10,
    ])
  }
  const dx = (to[0]-from[0]) * 111
  const dy = (to[1]-from[1]) * 111
  return {
    locId,
    coordinates: points,
    distanceKm: Math.sqrt(dx*dx + dy*dy),
    durationHours: Math.sqrt(dx*dx + dy*dy) / 60,  // ~60km/h avg
    fromActual: from,
    toActual: to,
  }
}

export async function fetchRouteGeometry(
  locId: string,
  fromLng: number, fromLat: number,
  toLng: number, toLat: number,
): Promise<RouteGeometry> {
  // Check memory cache first
  if (memCache[locId]) return memCache[locId]

  // Check localStorage cache
  const stored = loadCache()
  if (stored[locId]) {
    memCache[locId] = stored[locId]
    return stored[locId]
  }

  const from: [number,number] = [fromLng, fromLat]
  const to: [number,number] = [toLng, toLat]

  try {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    if (!data.routes?.length) throw new Error('No routes')

    const route = data.routes[0]
    const result: RouteGeometry = {
      locId,
      coordinates: route.geometry.coordinates as [number,number][],
      distanceKm: Math.round(route.distance / 1000),
      durationHours: Math.round(route.duration / 3600 * 10) / 10,
      fromActual: from,
      toActual: to,
    }

    memCache[locId] = result
    const cache = loadCache()
    cache[locId] = result
    saveCache(cache)
    return result

  } catch(e) {
    // Fallback — straight line
    const fallback = straightLine(locId, from, to)
    memCache[locId] = fallback
    return fallback
  }
}

// Pre-fetch all LOCs for a scenario — call on game start
export async function prefetchScenarioRoutes(
  locs: Array<{ id: string; from: string; to: string }>,
  nodeMap: Record<string, { lat: number; lng: number }>
): Promise<Record<string, RouteGeometry>> {
  const results: Record<string, RouteGeometry> = {}

  // Stagger requests to avoid rate limiting — 3 at a time
  const chunks: typeof locs[] = []
  for (let i = 0; i < locs.length; i += 3) chunks.push(locs.slice(i, i + 3))

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async loc => {
      const from = nodeMap[loc.from]
      const to   = nodeMap[loc.to]
      if (!from || !to) return
      const geo = await fetchRouteGeometry(loc.id, from.lng, from.lat, to.lng, to.lat)
      results[loc.id] = geo
    }))
    // Small delay between chunks to be polite to the free API
    await new Promise(r => setTimeout(r, 200))
  }

  return results
}
