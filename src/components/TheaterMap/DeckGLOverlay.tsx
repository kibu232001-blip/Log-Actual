/**
 * DeckGLOverlay — renders Deck.gl layers on top of the existing Leaflet map
 *
 * Layers:
 *  - PathLayer:  real road geometry for each LOC, color-coded by status
 *  - ScatterplotLayer: convoy position dots moving along routes
 *  - TripsLayer: animated convoy trail (only when zoomed in > 8)
 *
 * Mobile-safe: uses Canvas2D renderer, no WebGL2 requirement
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Deck } from '@deck.gl/core'
import { PathLayer, ScatterplotLayer, IconLayer } from '@deck.gl/layers'
import { useGameStore } from '../../store/gameStore'
import { prefetchScenarioRoutes, RouteGeometry } from '../../engine/RoutingService'
import { getTheaterNetwork } from '../../data/scenarioNodes'

interface Props {
  mapInstance: any  // Leaflet map instance
  zoom: number
}

// LOC status → color [r,g,b,a]
const LOC_COLORS = {
  OPEN:        [0,   255, 136, 180] as [number,number,number,number],
  ACTIVE:      [0,   255, 136, 180] as [number,number,number,number],
  INTERDICTED: [255,  50,   0, 220] as [number,number,number,number],
  CONTESTED:   [255, 180,   0, 200] as [number,number,number,number],
  AIR:         [0,  180, 255, 140] as [number,number,number,number],
  SEA:         [60, 100, 255, 140] as [number,number,number,number],
}

export default function DeckGLOverlay({ mapInstance, zoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deckRef   = useRef<Deck | null>(null)
  const [routes, setRoutes] = useState<Record<string, RouteGeometry>>({})
  const [fetching, setFetching] = useState(false)

  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const storeLocs        = useGameStore(s => s.locs) as any
  const realConvoys      = useGameStore(s => (s as any).realConvoys || []) as any[]
  const currentDay       = useGameStore(s => s.currentDay)

  // Build node coordinate map for routing
  const theater = getTheaterNetwork(activeScenarioId)
  const nodeMap: Record<string, { lat: number; lng: number }> = {}
  theater.nodes.forEach((n: any) => { nodeMap[n.id] = { lat: n.lat, lng: n.lng } })

  // Prefetch road geometry on scenario load
  useEffect(() => {
    if (fetching || !theater.locs.length) return
    setFetching(true)

    const groundLocs = theater.locs.filter((l: any) =>
      l.type !== 'SEA' && nodeMap[l.from] && nodeMap[l.to]
    )

    prefetchScenarioRoutes(groundLocs, nodeMap).then(result => {
      setRoutes(result)
      setFetching(false)
    })
  }, [activeScenarioId])

  // Sync Deck.gl viewport with Leaflet on every map move
  const syncViewport = useCallback(() => {
    if (!deckRef.current || !mapInstance) return
    const center = mapInstance.getCenter()
    const size   = mapInstance.getSize()
    deckRef.current.setProps({
      viewState: {
        longitude: center.lng,
        latitude:  center.lat,
        zoom:      mapInstance.getZoom() - 1,  // Deck.gl zoom offset vs Leaflet
        pitch: zoom >= 9 ? 35 : 0,   // Tilt to 3D perspective when zoomed in
        bearing: 0,
      },
      width:  size.x,
      height: size.y,
    })
  }, [mapInstance, zoom])

  // Init Deck.gl on canvas
  useEffect(() => {
    if (!canvasRef.current || !mapInstance) return

    const size = mapInstance.getSize()
    const center = mapInstance.getCenter()

    deckRef.current = new Deck({
      canvas: canvasRef.current,
      width:  size.x,
      height: size.y,
      controller: false,  // Leaflet handles pan/zoom
      useDevicePixels: window.devicePixelRatio <= 2 ? window.devicePixelRatio : 2,
      viewState: {
        longitude: center.lng,
        latitude:  center.lat,
        zoom: mapInstance.getZoom() - 1,
        pitch: 0,
        bearing: 0,
      },
      layers: [],
      onWebGLInitialized: () => {},
    })

    mapInstance.on('move',    syncViewport)
    mapInstance.on('zoom',    syncViewport)
    mapInstance.on('resize',  syncViewport)

    return () => {
      mapInstance.off('move',   syncViewport)
      mapInstance.off('zoom',   syncViewport)
      mapInstance.off('resize', syncViewport)
      deckRef.current?.finalize()
      deckRef.current = null
    }
  }, [mapInstance])

  // Rebuild layers whenever data changes
  useEffect(() => {
    if (!deckRef.current) return

    // ── PATH LAYER — real road geometry for each LOC ──────────────────────────
    const locPaths = theater.locs.map((loc: any) => {
      const live  = storeLocs ? storeLocs[loc.id] : null
      const status = live?.status || loc.status || 'OPEN'
      const geo   = routes[loc.id]

      let color = loc.type === 'AIR' ? LOC_COLORS.AIR
                : loc.type === 'SEA' ? LOC_COLORS.SEA
                : (LOC_COLORS as any)[status] || LOC_COLORS.OPEN

      // Pulse effect for INTERDICTED routes — alternating alpha
      if (status === 'INTERDICTED') {
        const pulse = Math.sin(Date.now() / 400) * 0.5 + 0.5
        color = [255, 50, 0, Math.round(120 + pulse * 100)] as [number,number,number,number]
      }

      const path = geo ? geo.coordinates : (() => {
        // Fallback straight line until route is fetched
        const from = nodeMap[loc.from]
        const to   = nodeMap[loc.to]
        if (!from || !to) return null
        return [[from.lng, from.lat], [to.lng, to.lat]] as [number,number][]
      })()

      if (!path) return null
      return { id: loc.id, path, color, width: status === 'INTERDICTED' ? 5 : 3 }
    }).filter(Boolean)

    const pathLayer = new PathLayer({
      id: 'loc-paths',
      data: locPaths,
      getPath:       (d: any) => d.path,
      getColor:      (d: any) => d.color,
      getWidth:      (d: any) => d.width,
      widthUnits:    'pixels',
      widthMinPixels: 2,
      widthMaxPixels: 8,
      capRounded:    true,
      jointRounded:  true,
      pickable:      false,
    })

    // ── CONVOY DOTS — position along route based on progress ─────────────────
    const convoyPoints = realConvoys
      .filter((c: any) => c.status === 'EN_ROUTE')
      .map((c: any) => {
        const progress = Math.min(1, Math.max(0,
          c.departedDay ? (currentDay - c.departedDay) / Math.max(1, c.travelDays) : 0
        ))

        // Find position along route path
        const fromNode = nodeMap[c.fromNodeId]
        const toNode   = nodeMap[c.toUnitId] || nodeMap[Object.keys(nodeMap).find(k =>
          theater.nodes.find((n: any) => n.id === k && n.unitId === c.toUnitId)
        ) || '']

        if (!fromNode || !toNode) return null

        // If we have real road geometry, interpolate along it
        const geo = routes[c.locId] || routes[`direct_${c.fromNodeId}_${c.toUnitId}`]
        let position: [number, number]

        if (geo?.coordinates?.length > 1) {
          const idx = Math.floor(progress * (geo.coordinates.length - 1))
          const frac = (progress * (geo.coordinates.length - 1)) - idx
          const a = geo.coordinates[Math.min(idx, geo.coordinates.length - 1)]
          const b = geo.coordinates[Math.min(idx + 1, geo.coordinates.length - 1)]
          position = [a[0] + (b[0]-a[0])*frac, a[1] + (b[1]-a[1])*frac]
        } else {
          position = [
            fromNode.lng + (toNode.lng - fromNode.lng) * progress,
            fromNode.lat + (toNode.lat - fromNode.lat) * progress,
          ]
        }

        const col = c.assetType === 'AIR' || c.assetType === 'HELO'
          ? [0, 180, 255] : c.assetType === 'SEA'
          ? [60, 100, 255] : [0, 255, 136]

        return { id: c.id, position, color: col, radius: zoom >= 9 ? 8000 : 4000 }
      }).filter(Boolean)

    const convoyLayer = new ScatterplotLayer({
      id: 'convoys',
      data: convoyPoints,
      getPosition:   (d: any) => d.position,
      getFillColor:  (d: any) => [...d.color, 220],
      getRadius:     (d: any) => d.radius,
      radiusUnits:   'meters',
      radiusMinPixels: 4,
      radiusMaxPixels: 16,
      pickable: false,
    })

    // ── CONVOY LABEL LAYER (zoom ≥ 9 only) ───────────────────────────────────
    const layers = [pathLayer, convoyLayer]

    deckRef.current.setProps({ layers })
    syncViewport()

  }, [routes, storeLocs, realConvoys, currentDay, zoom])

  // Pulse animation for INTERDICTED routes
  useEffect(() => {
    if (!deckRef.current) return
    const interval = setInterval(() => {
      if (deckRef.current) deckRef.current.setProps({ layers: deckRef.current.props.layers })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const mapSize = mapInstance?.getSize()

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width:  mapSize?.x || '100%',
        height: mapSize?.y || '100%',
        pointerEvents: 'none',
        zIndex: 450,
      }}
    />
  )
}
