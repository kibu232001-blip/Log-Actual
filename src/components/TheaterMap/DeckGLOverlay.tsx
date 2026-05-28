/**
 * DeckGLOverlay — Deck.gl layers on top of Leaflet map
 * Uses real road geometry from RoutingService + sprite sheet for icons
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Deck } from '@deck.gl/core'
import { PathLayer, IconLayer, ScatterplotLayer } from '@deck.gl/layers'
import { useGameStore } from '../../store/gameStore'
import { prefetchScenarioRoutes, RouteGeometry } from '../../engine/RoutingService'
import { getTheaterNetwork } from '../../data/scenarioNodes'

interface Props { mapInstance: any; zoom: number }

// ── SPRITE ATLAS DEFINITION ─────────────────────────────────────────────────
const SPRITE_URL = '/sprites/convoy-sprites.png'
const CW = 424  // cell width
const CH = 421  // cell height

const SPRITE_MAPPING: Record<string, { x:number; y:number; width:number; height:number; mask?:boolean }> = {
  ground_healthy:    { x:0,    y:0,    width:CW, height:CH },
  ground_damaged:    { x:CW,   y:0,    width:CW, height:CH },
  ground_armored:    { x:CW*2, y:0,    width:CW, height:CH },
  dust_cloud:        { x:CW*3, y:0,    width:CW, height:CH },
  helo:              { x:0,    y:CH,   width:CW, height:CH },
  fixed_wing:        { x:CW,   y:CH,   width:CW, height:CH },
  air_marker:        { x:CW*2, y:CH,   width:CW, height:CH },
  airdrop:           { x:CW*3, y:CH,   width:CW, height:CH },
  cargo_vessel:      { x:0,    y:CH*2, width:CW, height:CH },
  landing_craft:     { x:CW,   y:CH*2, width:CW, height:CH },
  sea_convoy:        { x:CW*2, y:CH*2, width:CW, height:CH },
  submarine:         { x:CW*3, y:CH*2, width:CW, height:CH },
  fob_healthy:       { x:0,    y:CH*3, width:CW, height:CH },
  fob_critical:      { x:CW,   y:CH*3, width:CW, height:CH },
  fob_stonewall:     { x:CW*2, y:CH*3, width:CW, height:CH },
  depot_node:        { x:CW*3, y:CH*3, width:CW, height:CH },
  route_open:        { x:0,    y:CH*4, width:CW, height:CH },
  route_interdicted: { x:CW,   y:CH*4, width:CW, height:CH },
  ied_site:          { x:CW*2, y:CH*4, width:CW, height:CH },
  enemy_ao:          { x:CW*3, y:CH*4, width:CW, height:CH },
  supply_full:       { x:0,    y:CH*5, width:CW, height:CH },
  supply_empty:      { x:CW,   y:CH*5, width:CW, height:CH },
  theater_push:      { x:CW*2, y:CH*5, width:CW, height:CH },
  frago_doc:         { x:CW*3, y:CH*5, width:CW, height:CH },
}

// LOC status → color [r,g,b,a]
const LOC_COLORS: Record<string, [number,number,number,number]> = {
  OPEN:        [0,   255, 136, 160],
  ACTIVE:      [0,   255, 136, 160],
  INTERDICTED: [255,  50,   0, 230],
  CONTESTED:   [255, 180,   0, 200],
  AIR:         [0,  180, 255, 130],
  SEA:         [60, 100, 255, 130],
}

// Pick convoy sprite based on asset type and status
function getConvoySprite(convoy: any): string {
  const type = convoy.assetType || 'GROUND'
  if (type === 'AIR')  return 'air_marker'
  if (type === 'HELO') return 'helo'
  if (type === 'SEA')  return 'cargo_vessel'
  return 'ground_healthy'
}

// Pick node sprite based on unit status
function getNodeSprite(unit: any, nodeType: string): string {
  if (nodeType === 'DEPOT' || nodeType === 'ASP') return 'depot_node'
  if (!unit) return 'fob_healthy'
  if (unit.status === 'STONEWALL' || unit.status === 'DARK') return 'fob_stonewall'
  if (unit.status === 'RED' || unit.readiness < 40) return 'fob_critical'
  return 'fob_healthy'
}

export default function DeckGLOverlay({ mapInstance, zoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deckRef   = useRef<Deck | null>(null)
  const [routes, setRoutes] = useState<Record<string, RouteGeometry>>({})
  const [fetching, setFetching] = useState(false)
  const [frame, setFrame] = useState(0)

  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const storeLocs        = useGameStore(s => s.locs) as any
  const realConvoys      = useGameStore(s => (s as any).realConvoys || []) as any[]
  const units            = useGameStore(s => s.units) as any
  const enemyAOs         = useGameStore(s => (s as any).enemyAOs || []) as any[]
  const currentDay       = useGameStore(s => s.currentDay)

  const theater = getTheaterNetwork(activeScenarioId)
  const nodeMap: Record<string, { lat: number; lng: number }> = {}
  theater.nodes.forEach((n: any) => { nodeMap[n.id] = { lat: n.lat, lng: n.lng } })

  // Prefetch road routes
  useEffect(() => {
    if (fetching) return
    setFetching(true)
    const groundLocs = theater.locs.filter((l: any) =>
      l.type !== 'SEA' && nodeMap[l.from] && nodeMap[l.to]
    )
    prefetchScenarioRoutes(groundLocs, nodeMap).then(result => {
      setRoutes(result)
      setFetching(false)
    })
  }, [activeScenarioId])

  // Animation frame for pulsing effects
  useEffect(() => {
    const t = setInterval(() => setFrame(f => f + 1), 250)
    return () => clearInterval(t)
  }, [])

  const syncViewport = useCallback(() => {
    if (!deckRef.current || !mapInstance) return
    const center = mapInstance.getCenter()
    const size   = mapInstance.getSize()
    deckRef.current.setProps({
      viewState: {
        longitude: center.lng,
        latitude:  center.lat,
        zoom:      mapInstance.getZoom() - 1,
        pitch:     zoom >= 9 ? 40 : 0,
        bearing:   0,
      },
      width: size.x, height: size.y,
    })
  }, [mapInstance, zoom])

  // Init Deck.gl
  useEffect(() => {
    if (!canvasRef.current || !mapInstance) return
    const size = mapInstance.getSize()
    const center = mapInstance.getCenter()

    deckRef.current = new Deck({
      canvas: canvasRef.current,
      width: size.x, height: size.y,
      controller: false,
      useDevicePixels: Math.min(window.devicePixelRatio, 2),
      viewState: { longitude: center.lng, latitude: center.lat, zoom: mapInstance.getZoom() - 1, pitch: 0, bearing: 0 },
      layers: [],
    })

    mapInstance.on('move',   syncViewport)
    mapInstance.on('zoom',   syncViewport)
    mapInstance.on('resize', syncViewport)

    return () => {
      mapInstance.off('move',   syncViewport)
      mapInstance.off('zoom',   syncViewport)
      mapInstance.off('resize', syncViewport)
      deckRef.current?.finalize()
      deckRef.current = null
    }
  }, [mapInstance])

  // Rebuild layers
  useEffect(() => {
    if (!deckRef.current) return

    // ── 1. ROAD PATH LAYER ───────────────────────────────────────────────────
    const locPaths = theater.locs.map((loc: any) => {
      const live   = storeLocs?.[loc.id]
      const status = live?.status || loc.status || 'OPEN'
      const geo    = routes[loc.id]

      let color = loc.type === 'AIR' ? LOC_COLORS.AIR
                : loc.type === 'SEA' ? LOC_COLORS.SEA
                : (LOC_COLORS as any)[status] || LOC_COLORS.OPEN

      if (status === 'INTERDICTED') {
        const pulse = Math.sin(frame * 0.5) * 0.5 + 0.5
        color = [255, 50, 0, Math.round(130 + pulse * 100)] as [number,number,number,number]
      }

      let path: [number,number][] | null = null
      if (geo?.coordinates?.length > 1) {
        path = geo.coordinates
      } else {
        const from = nodeMap[loc.from]
        const to   = nodeMap[loc.to]
        if (from && to) path = [[from.lng, from.lat], [to.lng, to.lat]]
      }

      if (!path) return null
      return { id: loc.id, path, color, width: status === 'INTERDICTED' ? 6 : 3 }
    }).filter(Boolean)

    const pathLayer = new PathLayer({
      id: 'loc-roads',
      data: locPaths,
      getPath:        (d: any) => d.path,
      getColor:       (d: any) => d.color,
      getWidth:       (d: any) => d.width,
      widthUnits:     'pixels',
      widthMinPixels: 2,
      widthMaxPixels: 10,
      capRounded:     true,
      jointRounded:   true,
    })

    // ── 2. CONVOY SPRITE LAYER ───────────────────────────────────────────────
    const convoyIcons = realConvoys
      .filter((c: any) => c.status === 'EN_ROUTE')
      .map((c: any) => {
        const progress = Math.min(1, Math.max(0,
          c.departedDay ? (currentDay - c.departedDay) / Math.max(1, c.travelDays) : 0
        ))

        // Find the geo path for interpolation
        const geo = routes[c.locId]
        let position: [number, number]

        if (geo?.coordinates?.length > 1) {
          const totalPts = geo.coordinates.length - 1
          const idx  = Math.min(Math.floor(progress * totalPts), totalPts - 1)
          const frac = (progress * totalPts) - idx
          const a = geo.coordinates[idx]
          const b = geo.coordinates[idx + 1] || a
          position = [a[0] + (b[0]-a[0])*frac, a[1] + (b[1]-a[1])*frac]
        } else {
          const fromNode = nodeMap[c.fromNodeId]
          const toNode   = Object.values(nodeMap)[0]  // fallback
          if (!fromNode) return null
          const to = nodeMap[c.toUnitId] || toNode
          position = [
            fromNode.lng + (to.lng - fromNode.lng) * progress,
            fromNode.lat + (to.lat - fromNode.lat) * progress,
          ]
        }

        return {
          id: c.id,
          position,
          icon: getConvoySprite(c),
          size: zoom >= 8 ? 56 : zoom >= 6 ? 40 : 28,
        }
      }).filter(Boolean)

    const convoyLayer = new IconLayer({
      id: 'convoys',
      data: convoyIcons,
      iconAtlas:   SPRITE_URL,
      iconMapping: SPRITE_MAPPING,
      getIcon:     (d: any) => d.icon,
      getPosition: (d: any) => d.position,
      getSize:     (d: any) => d.size,
      sizeUnits:   'pixels',
      billboard:   false,
      pickable:    false,
    })

    // ── 3. NODE SPRITE LAYER (FOBs, Depots) ──────────────────────────────────
    const nodeIcons = theater.nodes
      .filter((n: any) => nodeMap[n.id])
      .map((n: any) => {
        const unit = n.unitId ? units[n.unitId] : null
        return {
          id: n.id,
          position: [n.lng, n.lat] as [number, number],
          icon: getNodeSprite(unit, n.nodeType),
          size: zoom >= 8 ? 52 : zoom >= 6 ? 38 : 26,
        }
      })

    const nodeLayer = new IconLayer({
      id: 'nodes',
      data: nodeIcons,
      iconAtlas:   SPRITE_URL,
      iconMapping: SPRITE_MAPPING,
      getIcon:     (d: any) => d.icon,
      getPosition: (d: any) => d.position,
      getSize:     (d: any) => d.size,
      sizeUnits:   'pixels',
      billboard:   false,
      pickable:    false,
    })

    // ── 4. ENEMY AO MARKERS ──────────────────────────────────────────────────
    const aoIcons = enemyAOs
      .filter((ao: any) => ao.expiresDay >= currentDay)
      .map((ao: any) => ({
        id: ao.id,
        position: [ao.lng, ao.lat] as [number, number],
        icon: ao.type === 'IED' ? 'ied_site' : 'enemy_ao',
        size: zoom >= 7 ? 44 : 32,
      }))

    const aoLayer = new IconLayer({
      id: 'enemy-aos',
      data: aoIcons,
      iconAtlas:   SPRITE_URL,
      iconMapping: SPRITE_MAPPING,
      getIcon:     (d: any) => d.icon,
      getPosition: (d: any) => d.position,
      getSize:     (d: any) => d.size,
      sizeUnits:   'pixels',
      billboard:   false,
    })

    deckRef.current.setProps({ layers: [pathLayer, nodeLayer, aoLayer, convoyLayer] })
    syncViewport()

  }, [routes, storeLocs, realConvoys, units, enemyAOs, currentDay, zoom, frame])

  const size = mapInstance?.getSize()

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0,
        width:  size?.x || '100%',
        height: size?.y || '100%',
        pointerEvents: 'none',
        zIndex: 450,
      }}
    />
  )
}
