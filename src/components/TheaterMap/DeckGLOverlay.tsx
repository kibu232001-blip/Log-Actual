/**
 * DeckGLOverlay — integrates Deck.gl INSIDE MapLibre's render pipeline
 * Uses MapboxOverlay so Deck and MapLibre share the same WebGL context
 * and render on the same frame — zero lag during pan/zoom.
 */

import { useEffect, useRef } from 'react'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { PathLayer, IconLayer, ScatterplotLayer } from '@deck.gl/layers'
import { useGameStore } from '../../store/gameStore'
import { prefetchScenarioRoutes, RouteGeometry } from '../../engine/RoutingService'
import { getTheaterNetwork } from '../../data/scenarioNodes'

interface Props {
  mapInstance: any   // MapLibre Map instance (the raw _ml object)
  zoom: number
}

const SPRITE_URL = '/sprites/convoy-sprites.png'
const CW = 424; const CH = 421

const SPRITE_MAPPING: Record<string, {x:number;y:number;width:number;height:number}> = {
  ground_healthy:    {x:0,      y:0,      width:CW, height:CH},
  ground_damaged:    {x:CW,     y:0,      width:CW, height:CH},
  ground_armored:    {x:CW*2,   y:0,      width:CW, height:CH},
  dust_cloud:        {x:CW*3,   y:0,      width:CW, height:CH},
  helo:              {x:0,      y:CH,     width:CW, height:CH},
  fixed_wing:        {x:CW,     y:CH,     width:CW, height:CH},
  air_marker:        {x:CW*2,   y:CH,     width:CW, height:CH},
  airdrop:           {x:CW*3,   y:CH,     width:CW, height:CH},
  cargo_vessel:      {x:0,      y:CH*2,   width:CW, height:CH},
  landing_craft:     {x:CW,     y:CH*2,   width:CW, height:CH},
  sea_convoy:        {x:CW*2,   y:CH*2,   width:CW, height:CH},
  submarine:         {x:CW*3,   y:CH*2,   width:CW, height:CH},
  fob_healthy:       {x:0,      y:CH*3,   width:CW, height:CH},
  fob_critical:      {x:CW,     y:CH*3,   width:CW, height:CH},
  fob_stonewall:     {x:CW*2,   y:CH*3,   width:CW, height:CH},
  depot_node:        {x:CW*3,   y:CH*3,   width:CW, height:CH},
  route_open:        {x:0,      y:CH*4,   width:CW, height:CH},
  route_interdicted: {x:CW,     y:CH*4,   width:CW, height:CH},
  ied_site:          {x:CW*2,   y:CH*4,   width:CW, height:CH},
  enemy_ao:          {x:CW*3,   y:CH*4,   width:CW, height:CH},
  supply_full:       {x:0,      y:CH*5,   width:CW, height:CH},
  supply_empty:      {x:CW,     y:CH*5,   width:CW, height:CH},
  theater_push:      {x:CW*2,   y:CH*5,   width:CW, height:CH},
  frago_doc:         {x:CW*3,   y:CH*5,   width:CW, height:CH},
}

const LOC_COLORS: Record<string,[number,number,number,number]> = {
  OPEN:        [0,  255,136,160], ACTIVE:      [0,  255,136,160],
  INTERDICTED: [255, 50,  0,230], CONTESTED:   [255,180,  0,200],
  AIR:         [0,  180,255,130], SEA:         [60, 100,255,130],
}

function getConvoySprite(c:any) {
  if (c.assetType==='AIR')  return 'air_marker'
  if (c.assetType==='HELO') return 'helo'
  if (c.assetType==='SEA')  return 'cargo_vessel'
  return 'ground_healthy'
}

function getNodeSprite(unit:any, nodeType:string) {
  if (nodeType==='DEPOT'||nodeType==='ASP'||nodeType==='SEAPORT'||nodeType==='AERIAL_PORT') return 'depot_node'
  if (!unit) return 'fob_healthy'
  if (unit.status==='STONEWALL'||unit.status==='DARK') return 'fob_stonewall'
  if (unit.status==='RED'||unit.readiness<40) return 'fob_critical'
  return 'fob_healthy'
}

export default function DeckGLOverlay({ mapInstance, zoom }: Props) {
  const overlayRef  = useRef<MapboxOverlay | null>(null)
  const routesRef   = useRef<Record<string,RouteGeometry>>({})
  const frameRef    = useRef(0)

  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const storeLocs        = useGameStore(s => s.locs) as any
  const realConvoys      = useGameStore(s => (s as any).realConvoys || []) as any[]
  const units            = useGameStore(s => s.units) as any
  const enemyAOs         = useGameStore(s => (s as any).enemyAOs || []) as any[]
  const currentDay       = useGameStore(s => s.currentDay)

  const theater = getTheaterNetwork(activeScenarioId)
  const nodeMap: Record<string,{lat:number;lng:number}> = {}
  theater.nodes.forEach((n:any) => { nodeMap[n.id] = {lat:n.lat, lng:n.lng} })

  // Get the raw MapLibre instance
  const mlMap = mapInstance?._ml || mapInstance

  // Prefetch road routes
  useEffect(() => {
    if (!theater.locs.length) return
    const groundLocs = theater.locs.filter((l:any) => l.type!=='SEA' && nodeMap[l.from] && nodeMap[l.to])
    prefetchScenarioRoutes(groundLocs, nodeMap).then(r => { routesRef.current = r; renderLayers() })
  }, [activeScenarioId])

  // Mount overlay into MapLibre once map is ready
  useEffect(() => {
    if (!mlMap?.addControl) return

    const overlay = new MapboxOverlay({ layers: [], interleaved: false })
    mlMap.addControl(overlay)
    overlayRef.current = overlay

    return () => {
      try { mlMap.removeControl(overlay) } catch(e) {}
      overlayRef.current = null
    }
  }, [mlMap])

  // Pulse animation for interdicted routes
  useEffect(() => {
    const t = setInterval(() => { frameRef.current++; renderLayers() }, 300)
    return () => clearInterval(t)
  }, [storeLocs, realConvoys, units, enemyAOs, currentDay, zoom])

  function renderLayers() {
    if (!overlayRef.current) return
    const routes = routesRef.current

    // ── PATH LAYER ──────────────────────────────────────────────────────────
    const locPaths = theater.locs.map((loc:any) => {
      const live   = storeLocs?.[loc.id]
      const status = live?.status || loc.status || 'OPEN'
      const geo    = routes[loc.id]
      let color    = loc.type==='AIR' ? LOC_COLORS.AIR : loc.type==='SEA' ? LOC_COLORS.SEA : LOC_COLORS[status] || LOC_COLORS.OPEN

      if (status==='INTERDICTED') {
        const p = Math.sin(frameRef.current * 0.8) * 0.5 + 0.5
        color = [255, 50, 0, Math.round(120+p*110)] as [number,number,number,number]
      }

      let path: [number,number][] | null = null
      if (geo?.coordinates?.length > 1) {
        path = geo.coordinates
      } else {
        const f = nodeMap[loc.from], t = nodeMap[loc.to]
        if (f && t) path = [[f.lng,f.lat],[t.lng,t.lat]]
      }
      if (!path) return null
      return { id:loc.id, path, color, width: status==='INTERDICTED'?6:3 }
    }).filter(Boolean)

    const pathLayer = new PathLayer({
      id:'loc-roads', data:locPaths,
      getPath:(d:any)=>d.path, getColor:(d:any)=>d.color, getWidth:(d:any)=>d.width,
      widthUnits:'pixels', widthMinPixels:2, widthMaxPixels:10,
      capRounded:true, jointRounded:true,
    })

    // ── NODE ICONS ──────────────────────────────────────────────────────────
    const nodeSize = zoom>=10?42:zoom>=8?30:zoom>=6?20:13
    const nodeIcons = theater.nodes.filter((n:any)=>nodeMap[n.id]).map((n:any) => ({
      id:n.id,
      position:[n.lng,n.lat] as [number,number],
      icon: getNodeSprite(units[n.unitId], n.nodeType),
      size: nodeSize,
    }))

    const nodeLayer = new IconLayer({
      id:'nodes', data:nodeIcons,
      iconAtlas:SPRITE_URL, iconMapping:SPRITE_MAPPING,
      getIcon:(d:any)=>d.icon, getPosition:(d:any)=>d.position, getSize:(d:any)=>d.size,
      sizeUnits:'pixels', billboard:true, pickable:false,
    })

    // ── CONVOY ICONS ─────────────────────────────────────────────────────────
    const convoySize = zoom>=10?44:zoom>=8?32:zoom>=6?22:14
    const convoyIcons = realConvoys.filter((c:any)=>c.status==='EN_ROUTE').map((c:any) => {
      const progress = Math.min(1,Math.max(0, c.departedDay?(currentDay-c.departedDay)/Math.max(1,c.travelDays):0))
      const geo = routes[c.locId]
      let position:[number,number]

      if (geo?.coordinates?.length>1) {
        const tot=geo.coordinates.length-1
        const idx=Math.min(Math.floor(progress*tot),tot-1)
        const frac=progress*tot-idx
        const a=geo.coordinates[idx], b=geo.coordinates[Math.min(idx+1,tot)]
        position=[a[0]+(b[0]-a[0])*frac, a[1]+(b[1]-a[1])*frac]
      } else {
        const f=nodeMap[c.fromNodeId]
        const t=Object.values(nodeMap)[0] as any
        if (!f) return null
        position=[f.lng+(t.lng-f.lng)*progress, f.lat+(t.lat-f.lat)*progress]
      }
      return { id:c.id, position, icon:getConvoySprite(c), size:convoySize }
    }).filter(Boolean)

    const convoyLayer = new IconLayer({
      id:'convoys', data:convoyIcons,
      iconAtlas:SPRITE_URL, iconMapping:SPRITE_MAPPING,
      getIcon:(d:any)=>d.icon, getPosition:(d:any)=>d.position, getSize:(d:any)=>d.size,
      sizeUnits:'pixels', billboard:true, pickable:false,
    })

    // ── ENEMY AO ICONS ───────────────────────────────────────────────────────
    const aoSize = zoom>=8?40:28
    const aoIcons = enemyAOs.filter((ao:any)=>ao.expiresDay>=currentDay).map((ao:any) => ({
      id:ao.id, position:[ao.lng,ao.lat] as [number,number],
      icon:ao.type==='IED'?'ied_site':'enemy_ao', size:aoSize,
    }))

    const aoLayer = new IconLayer({
      id:'enemy-aos', data:aoIcons,
      iconAtlas:SPRITE_URL, iconMapping:SPRITE_MAPPING,
      getIcon:(d:any)=>d.icon, getPosition:(d:any)=>d.position, getSize:(d:any)=>d.size,
      sizeUnits:'pixels', billboard:true, pickable:false,
    })

    overlayRef.current.setProps({ layers:[pathLayer, nodeLayer, aoLayer, convoyLayer] })
  }

  // Re-render when game state changes
  useEffect(() => { renderLayers() }, [storeLocs, realConvoys, units, enemyAOs, currentDay, zoom])

  return null  // No DOM element needed — MapboxOverlay injects into MapLibre directly
}
