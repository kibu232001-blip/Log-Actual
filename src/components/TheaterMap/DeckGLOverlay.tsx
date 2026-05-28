/**
 * DeckGLOverlay — performance-optimised
 * Static layers (nodes, LOCs) built once and cached.
 * Only convoy positions rebuild on animation tick.
 * Decoupled from pan/zoom — MapLibre handles those natively.
 */

import { useEffect, useRef, useMemo } from 'react'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { PathLayer, IconLayer } from '@deck.gl/layers'
import { useGameStore } from '../../store/gameStore'
import { prefetchScenarioRoutes, RouteGeometry } from '../../engine/RoutingService'
import { getTheaterNetwork } from '../../data/scenarioNodes'

interface Props { mapInstance: any; zoom: number }

const SPRITE_URL = '/sprites/convoy-sprites.png'
const CW = 424; const CH = 421

const SPRITE_MAPPING: Record<string,{x:number;y:number;width:number;height:number}> = {
  ground_healthy:    {x:0,      y:0,    width:CW,height:CH},
  ground_damaged:    {x:CW,     y:0,    width:CW,height:CH},
  ground_armored:    {x:CW*2,   y:0,    width:CW,height:CH},
  dust_cloud:        {x:CW*3,   y:0,    width:CW,height:CH},
  helo:              {x:0,      y:CH,   width:CW,height:CH},
  fixed_wing:        {x:CW,     y:CH,   width:CW,height:CH},
  air_marker:        {x:CW*2,   y:CH,   width:CW,height:CH},
  airdrop:           {x:CW*3,   y:CH,   width:CW,height:CH},
  cargo_vessel:      {x:0,      y:CH*2, width:CW,height:CH},
  landing_craft:     {x:CW,     y:CH*2, width:CW,height:CH},
  sea_convoy:        {x:CW*2,   y:CH*2, width:CW,height:CH},
  submarine:         {x:CW*3,   y:CH*2, width:CW,height:CH},
  fob_healthy:       {x:0,      y:CH*3, width:CW,height:CH},
  fob_critical:      {x:CW,     y:CH*3, width:CW,height:CH},
  fob_stonewall:     {x:CW*2,   y:CH*3, width:CW,height:CH},
  depot_node:        {x:CW*3,   y:CH*3, width:CW,height:CH},
  route_open:        {x:0,      y:CH*4, width:CW,height:CH},
  route_interdicted: {x:CW,     y:CH*4, width:CW,height:CH},
  ied_site:          {x:CW*2,   y:CH*4, width:CW,height:CH},
  enemy_ao:          {x:CW*3,   y:CH*4, width:CW,height:CH},
  supply_full:       {x:0,      y:CH*5, width:CW,height:CH},
  supply_empty:      {x:CW,     y:CH*5, width:CW,height:CH},
  theater_push:      {x:CW*2,   y:CH*5, width:CW,height:CH},
  frago_doc:         {x:CW*3,   y:CH*5, width:CW,height:CH},
}

const LOC_COLORS: Record<string,[number,number,number,number]> = {
  OPEN:        [0,  255,136,160], ACTIVE:  [0,  255,136,160],
  INTERDICTED: [255, 50,  0,230], CONTESTED:[255,180,  0,200],
  AIR:         [0,  180,255,130], SEA:     [60, 100,255,130],
}

function getConvoySprite(c:any) {
  if (c.assetType==='AIR')  return 'fixed_wing'
  if (c.assetType==='HELO') return 'helo'
  if (c.assetType==='SEA')  return 'cargo_vessel'
  return 'ground_healthy'
}

function getNodeSprite(unit:any, nodeType:string) {
  if (['DEPOT','ASP','SEAPORT','AERIAL_PORT'].includes(nodeType)) return 'depot_node'
  if (!unit) return 'fob_healthy'
  if (unit.status==='STONEWALL'||unit.status==='DARK') return 'fob_stonewall'
  if (unit.status==='RED'||unit.readiness<40) return 'fob_critical'
  return 'fob_healthy'
}

function interpRoute(coords:[number,number][], t:number):{pos:[number,number];angle:number} {
  if (!coords?.length) return {pos:[0,0],angle:0}
  const clamped = Math.min(1,Math.max(0,t))
  const tot = coords.length-1
  const raw = clamped*tot
  const idx = Math.min(Math.floor(raw),tot-1)
  const frac = raw-idx
  const a = coords[idx], b = coords[Math.min(idx+1,tot)]
  const pos:[number,number] = [a[0]+(b[0]-a[0])*frac, a[1]+(b[1]-a[1])*frac]
  const angle = Math.atan2(b[0]-a[0], b[1]-a[1])*180/Math.PI
  return {pos, angle}
}

function interpArc(fLng:number,fLat:number,tLng:number,tLat:number,t:number):{pos:[number,number];angle:number} {
  const clamped = Math.min(1,Math.max(0,t))
  const pos:[number,number] = [fLng+(tLng-fLng)*clamped, fLat+(tLat-fLat)*clamped]
  const angle = Math.atan2(tLng-fLng, tLat-fLat)*180/Math.PI
  return {pos, angle}
}

export default function DeckGLOverlay({ mapInstance, zoom }: Props) {
  const overlayRef    = useRef<MapboxOverlay|null>(null)
  const routesRef     = useRef<Record<string,RouteGeometry>>({})
  const animRef       = useRef<ReturnType<typeof requestAnimationFrame>|null>(null)
  const frameRef      = useRef(0)
  const lastFrameTime = useRef(0)

  // Cached static layer data — rebuilt only when these deps change
  const staticPathRef = useRef<any[]>([])
  const staticNodeRef = useRef<any[]>([])
  const staticAORef   = useRef<any[]>([])

  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId||'CAMPAIGN_1')
  const storeLocs        = useGameStore(s => s.locs) as any
  const realConvoys      = useGameStore(s => (s as any).realConvoys||[]) as any[]
  const units            = useGameStore(s => s.units) as any
  const enemyAOs         = useGameStore(s => (s as any).enemyAOs||[]) as any[]
  const currentDay       = useGameStore(s => s.currentDay)
  const secondsToNextDay = useGameStore(s => (s as any).secondsToNextDay??120)

  const theater = useMemo(()=>getTheaterNetwork(activeScenarioId),[activeScenarioId])
  const nodeMap = useMemo(()=>{
    const m:Record<string,{lat:number;lng:number}> = {}
    theater.nodes.forEach((n:any)=>{ m[n.id]={lat:n.lat,lng:n.lng} })
    return m
  },[theater])

  function findDest(toUnitId:string) {
    if (nodeMap[toUnitId]) return nodeMap[toUnitId]
    const n = theater.nodes.find((n:any)=>n.unitId===toUnitId)
    return n ? {lat:n.lat,lng:n.lng} : undefined
  }

  // Prefetch routes
  useEffect(()=>{
    const ground = theater.locs.filter((l:any)=>l.type!=='SEA'&&nodeMap[l.from]&&nodeMap[l.to])
    prefetchScenarioRoutes(ground, nodeMap).then(r=>{
      routesRef.current=r
      rebuildStaticLayers()
      commitLayers()
    })
  },[activeScenarioId])

  // Mount overlay
  useEffect(()=>{
    const ml = mapInstance?._ml || mapInstance
    if (!ml?.addControl) return
    const overlay = new MapboxOverlay({layers:[], interleaved:false})
    ml.addControl(overlay)
    overlayRef.current = overlay
    return ()=>{ try{ml.removeControl(overlay)}catch(e){}; overlayRef.current=null }
  },[mapInstance])

  // Rebuild STATIC layers when LOC status, units, or AOs change
  useEffect(()=>{
    rebuildStaticLayers()
    commitLayers()
  },[storeLocs, units, enemyAOs, activeScenarioId])

  // rAF loop — only rebuilds convoy positions each frame
  useEffect(()=>{
    let running = true
    const FRAME_BUDGET = 80  // ms — ~12fps for convoy animation (smooth enough, mobile-safe)

    function tick(now:number) {
      if (!running) return
      animRef.current = requestAnimationFrame(tick)
      if (now - lastFrameTime.current < FRAME_BUDGET) return
      lastFrameTime.current = now
      frameRef.current++
      commitLayers()
    }
    animRef.current = requestAnimationFrame(tick)
    return ()=>{ running=false; if(animRef.current) cancelAnimationFrame(animRef.current) }
  },[realConvoys, currentDay, secondsToNextDay])

  function rebuildStaticLayers() {
    const routes = routesRef.current

    // ── LOC PATHS — only changes when interdiction status changes ───────────
    staticPathRef.current = theater.locs.map((loc:any)=>{
      const live   = storeLocs?.[loc.id]
      const status = live?.status||loc.status||'OPEN'
      const geo    = routes[loc.id]

      const color = loc.type==='AIR' ? LOC_COLORS.AIR
                  : loc.type==='SEA' ? LOC_COLORS.SEA
                  : LOC_COLORS[status]||LOC_COLORS.OPEN

      let path:[number,number][]|null = null
      if (geo?.coordinates?.length>1) path = geo.coordinates
      else {
        const f=nodeMap[loc.from], t=nodeMap[loc.to]
        if (f&&t) path = [[f.lng,f.lat],[t.lng,t.lat]]
      }
      if (!path) return null
      return {id:loc.id, path, color, width:status==='INTERDICTED'?6:3, interdicted:status==='INTERDICTED'}
    }).filter(Boolean)

    // ── NODE ICONS — only changes when unit status changes ──────────────────
    staticNodeRef.current = theater.nodes.filter((n:any)=>nodeMap[n.id]).map((n:any)=>({
      id:n.id,
      position:[n.lng,n.lat] as [number,number],
      icon:getNodeSprite(units[n.unitId], n.nodeType),
      size:['DEPOT','ASP'].includes(n.nodeType)?1200:1500,
    }))

    // ── ENEMY AO ICONS ──────────────────────────────────────────────────────
    staticAORef.current = enemyAOs
      .filter((ao:any)=>ao.expiresDay>=currentDay)
      .map((ao:any)=>({
        id:ao.id, position:[ao.lng,ao.lat] as [number,number],
        icon:ao.type==='IED'?'ied_site':'enemy_ao', size:1000,
      }))
  }

  function commitLayers() {
    if (!overlayRef.current) return
    const routes = routesRef.current
    const SECONDS_PER_DAY = 120
    const dayFraction = (SECONDS_PER_DAY - secondsToNextDay) / SECONDS_PER_DAY

    // Pulse for interdicted routes — update color in-place without full rebuild
    const pulse = Math.sin(frameRef.current*0.4)*0.5+0.5
    const interdictColor:[number,number,number,number] = [255,50,0,Math.round(120+pulse*100)]
    const paths = staticPathRef.current.map(d =>
      d.interdicted ? {...d, color:interdictColor} : d
    )

    const pathLayer = new PathLayer({
      id:'loc-roads', data:paths,
      getPath:(d:any)=>d.path, getColor:(d:any)=>d.color, getWidth:(d:any)=>d.width,
      widthUnits:'pixels', widthMinPixels:2, widthMaxPixels:10,
      capRounded:true, jointRounded:true,
      updateTriggers:{getColor:[frameRef.current]},
    })

    const nodeLayer = new IconLayer({
      id:'nodes', data:staticNodeRef.current,
      iconAtlas:SPRITE_URL, iconMapping:SPRITE_MAPPING,
      getIcon:(d:any)=>d.icon, getPosition:(d:any)=>d.position, getSize:(d:any)=>d.size,
      sizeUnits:'meters', sizeMinPixels:18, sizeMaxPixels:128,
      billboard:true, pickable:false,
    })

    const aoLayer = new IconLayer({
      id:'enemy-aos', data:staticAORef.current,
      iconAtlas:SPRITE_URL, iconMapping:SPRITE_MAPPING,
      getIcon:(d:any)=>d.icon, getPosition:(d:any)=>d.position, getSize:(d:any)=>d.size,
      sizeUnits:'meters', sizeMinPixels:12, sizeMaxPixels:72,
      billboard:true, pickable:false,
    })

    // ── CONVOY POSITIONS — computed every frame ─────────────────────────────
    const convoyIcons = realConvoys
      .filter((c:any)=>c.status==='EN_ROUTE')
      .map((c:any)=>{
        const completedDays = currentDay-(c.departedDay||currentDay)
        const progress = Math.min(1,Math.max(0,(completedDays+dayFraction)/Math.max(1,c.travelDays)))
        const isAir = c.assetType==='AIR'||c.assetType==='HELO'
        const geo = routes[c.locId]
        let pos:[number,number], angle=0

        if (isAir||!geo?.coordinates?.length) {
          const f=nodeMap[c.fromNodeId], t=findDest(c.toUnitId)
          if (!f||!t) return null
          const r = interpArc(f.lng,f.lat,t.lng,t.lat,progress)
          pos=r.pos; angle=r.angle
        } else {
          const r = interpRoute(geo.coordinates, progress)
          pos=r.pos; angle=r.angle
        }
        return {
          id:c.id, position:pos,
          icon:getConvoySprite(c),
          size:isAir?2000:c.assetType==='SEA'?1800:1200,
          angle:-angle,
        }
      }).filter(Boolean)

    const convoyLayer = new IconLayer({
      id:'convoys', data:convoyIcons,
      iconAtlas:SPRITE_URL, iconMapping:SPRITE_MAPPING,
      getIcon:(d:any)=>d.icon, getPosition:(d:any)=>d.position,
      getSize:(d:any)=>d.size, getAngle:(d:any)=>d.angle,
      sizeUnits:'meters', sizeMinPixels:14, sizeMaxPixels:96,
      billboard:true, pickable:false,
    })

    overlayRef.current.setProps({
      layers:[pathLayer, nodeLayer, aoLayer, convoyLayer]
    })
  }

  return null
}
