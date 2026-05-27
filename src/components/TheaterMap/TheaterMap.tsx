import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGameStore } from '../../store/gameStore'
import NodeDetailPanel from './NodeDetailPanel'
import BattlefieldFeed from './BattlefieldFeed'
import WeatherOverlay from './WeatherOverlay'
import AttackAnimations from './AttackAnimations'
import { getTheaterNetwork, TheaterNode, TheaterLOC } from '../../data/scenarioNodes'
import AudioEngine from '../../engine/AudioEngine'
import NewsFeedSystem from './NewsFeedSystem'

const SC: Record<string,string> = {
  GREEN:'#00ff88', AMBER:'#ffaa00', RED:'#ff4444', STONEWALL:'#ff4400', ACTIVE:'#00cc66', DARK:'#333344'
}

type NodePos = Record<string, { x:number; y:number }>
interface Mover { id:string; x:number; y:number; heading:number; cargo:string; moveType:'GROUND'|'AIR'|'SEA'|'HELO'; progress:number }
interface Conflict { id:string; x:number; y:number; intensity:number; type:'explosion'|'smoke'|'contact' }

// Ship SVG
const ShipSVG = ({size,col}:{size:number;col:string}) => (
  <svg width={size*2.2} height={size} viewBox="0 0 22 10" style={{display:'block'}}>
    <path d="M1,8 L3,3 L16,3 L21,8 Z" fill={col} opacity="0.9"/>
    <rect x="8" y="1" width="4" height="4" fill={col} opacity="0.7"/>
    <line x1="10" y1="1" x2="10" y2="0" stroke={col} strokeWidth="1" opacity="0.6"/>
  </svg>
)

// Helicopter SVG
const HeloSVG = ({size,col}:{size:number;col:string}) => (
  <svg width={size*2} height={size} viewBox="0 0 20 10" style={{display:'block'}}>
    <rect x="4" y="4" width="9" height="4" rx="2" fill={col} opacity="0.9"/>
    <rect x="13" y="5.5" width="6" height="1.5" rx="0.5" fill={col} opacity="0.8"/>
    <line x1="1" y1="4" x2="19" y2="4" stroke={col} strokeWidth="1.2" opacity="0.6"/>
    <line x1="18" y1="2" x2="18" y2="7" stroke={col} strokeWidth="1" opacity="0.5"/>
    <circle cx="7" cy="6" r="1" fill={col} opacity="0.5"/>
  </svg>
)

// Plane SVG
const PlaneSVG = ({size,col}:{size:number;col:string}) => (
  <svg width={size*2} height={size} viewBox="0 0 20 10" style={{display:'block'}}>
    <path d="M1,5 L18,5 L20,3 L18,2 L2,5" fill={col} opacity="0.9"/>
    <path d="M6,5 L8,1 L10,1 L9,5" fill={col} opacity="0.7"/>
    <path d="M14,5 L15,7 L17,7 L16,5" fill={col} opacity="0.7"/>
  </svg>
)


function NATOSymbol({ nodeType, unitId, col, size, isDark:dk, isAmber, isStonewall }:{
  nodeType:string; unitId:string|null; col:string; size:number
  isDark:boolean; isAmber:boolean; isStonewall:boolean
}) {
  const s = size
  const sw = Math.max(1.5, s*0.07)
  const anim = isStonewall?'sw-pulse 0.9s ease-in-out infinite':isAmber?'node-critical 2.0s ease-in-out infinite':'amb-breath 3s ease-in-out infinite'
  const op = dk ? 0.15 : 1

  // ── STONEWALL / DARK — UNIT OFFLINE BLACKOUT ─────────────────────────────
  if (isStonewall || dk) {
    const deathCol = dk ? '#440000' : '#ff2200'
    return (
      <svg width={s*1.5} height={s*0.75} viewBox="0 0 60 30"
        style={{ animation:'sw-pulse 0.6s ease-in-out infinite', overflow:'visible' }}>
        <rect x="1" y="5" width="58" height="22" fill="rgba(0,0,0,0.95)" stroke={deathCol} strokeWidth={sw*1.2} rx="1"/>
        <line x1="10" y1="8" x2="50" y2="24" stroke={deathCol} strokeWidth={sw*1.5}/>
        <line x1="50" y1="8" x2="10" y2="24" stroke={deathCol} strokeWidth={sw*1.5}/>
      </svg>
    )
  }

  if (nodeType==='SEAPORT') return (
    <svg width={s} height={s} viewBox="0 0 40 40" style={{animation:anim,opacity:op}}>
      <circle cx="20" cy="20" r="18" fill={col+'18'} stroke={col} strokeWidth={sw}/>
      <line x1="20" y1="8" x2="20" y2="32" stroke={col} strokeWidth={sw}/>
      <line x1="12" y1="12" x2="28" y2="12" stroke={col} strokeWidth={sw}/>
      <path d="M12,30 Q20,26 28,30" fill="none" stroke={col} strokeWidth={sw}/>
      <circle cx="20" cy="10" r="2.5" fill={col}/>
    </svg>
  )
  if (nodeType==='AERIAL_PORT') return (
    <svg width={s} height={s*0.7} viewBox="0 0 48 30" style={{animation:anim,opacity:op}}>
      <rect x="1" y="1" width="46" height="28" fill={col+'15'} stroke={col} strokeWidth={sw} rx="1"/>
      <path d="M24,8 L24,22" stroke={col} strokeWidth={sw}/>
      <path d="M14,15 L34,15" stroke={col} strokeWidth={sw}/>
      <path d="M17,21 L31,21" stroke={col} strokeWidth={sw*.8}/>
    </svg>
  )
  if (nodeType==='DEPOT') return (
    <svg width={s*1.4} height={s*0.65} viewBox="0 0 56 26" style={{animation:anim,opacity:op}}>
      <rect x="1" y="1" width="54" height="24" fill={col+'15'} stroke={col} strokeWidth={sw} rx="1"/>
      <line x1="8" y1="9" x2="48" y2="9" stroke={col} strokeWidth={sw}/>
      <line x1="8" y1="13" x2="48" y2="13" stroke={col} strokeWidth={sw*.7}/>
      <line x1="8" y1="17" x2="48" y2="17" stroke={col} strokeWidth={sw*.7}/>
    </svg>
  )
  if (nodeType==='ASP') return (
    <svg width={s*1.2} height={s*0.65} viewBox="0 0 48 26" style={{animation:anim,opacity:op}}>
      <rect x="1" y="1" width="46" height="24" fill={col+'15'} stroke={col} strokeWidth={sw} rx="1"/>
      <circle cx="16" cy="13" r="4" fill={col} opacity=".75"/>
      <circle cx="24" cy="13" r="4" fill={col} opacity=".75"/>
      <circle cx="32" cy="13" r="4" fill={col} opacity=".75"/>
    </svg>
  )
  if (nodeType==='FARP') return (
    <svg width={s} height={s} viewBox="0 0 40 40" style={{animation:anim,opacity:op}}>
      <path d="M20,2 L38,20 L20,38 L2,20 Z" fill={col+'15'} stroke={col} strokeWidth={sw}/>
      <line x1="20" y1="11" x2="20" y2="29" stroke={col} strokeWidth={sw}/>
      <line x1="11" y1="20" x2="29" y2="20" stroke={col} strokeWidth={sw}/>
    </svg>
  )
  if (nodeType==='AIRFIELD') return (
    <svg width={s*1.4} height={s*0.65} viewBox="0 0 56 26" style={{animation:anim,opacity:op}}>
      <rect x="1" y="1" width="54" height="24" fill={col+'15'} stroke={col} strokeWidth={sw} rx="1"/>
      <path d="M14,8 L28,18 M42,8 L28,18" stroke={col} strokeWidth={sw}/>
      <path d="M14,8 L42,8" stroke={col} strokeWidth={sw}/>
      <path d="M17,8 Q28,4 39,8" fill="none" stroke={col} strokeWidth={sw*.7}/>
    </svg>
  )
  // Ground units — NATO rectangle with echelon
  const echelon = unitId==='III_CORPS'?3:unitId==='4ID'?2:1
  return (
    <svg width={s*1.5} height={s*0.75} viewBox="0 0 60 30" style={{animation:anim,opacity:op,overflow:'visible'}}>
      <rect x="1" y="5" width="58" height="22" fill={col+'18'} stroke={col} strokeWidth={sw} rx="1"/>
      <line x1="12" y1="9" x2="48" y2="23" stroke={col} strokeWidth={sw}/>
      <line x1="48" y1="9" x2="12" y2="23" stroke={col} strokeWidth={sw}/>
      {[...Array(echelon)].map((_,i)=>{
        const x = 30 + (i - (echelon-1)/2)*7
        return <line key={i} x1={x} y1="0" x2={x} y2="6" stroke={col} strokeWidth={sw*1.2}/>
      })}
      {dk && <rect x="1" y="5" width="58" height="22" fill="rgba(0,0,0,.75)" rx="1"/>}
    </svg>
  )
}

const MAP_CSS = `
  .theater-tiles { filter:brightness(0.22) saturate(0.15) hue-rotate(100deg) contrast(1.2); }
  .leaflet-control-zoom a { background:#0d1f0f!important; color:#00ff88!important; border-color:#1a3a20!important; }
  .leaflet-control-attribution { background:rgba(3,10,6,.7)!important; color:#0a2a14!important; font-size:9px!important; }
  .ao-tooltip { background:#1a0404!important; border:1px solid #ff220060!important; color:#ff8866!important; font-family:'Share Tech Mono',monospace!important; font-size:11px!important; }
  @keyframes sw-pulse   { 0%,100%{opacity:1} 50%{opacity:.15} }
  @keyframes amb-breath { 0%,100%{opacity:.7} 50%{opacity:1}  }
  @keyframes fire-flick { 0%{stroke:#ff6600;stroke-width:5} 40%{stroke:#ff9900;stroke-width:7} 80%{stroke:#ff3300;stroke-width:4} 100%{stroke:#ff6600;stroke-width:5} }
  @keyframes scan-move  { 0%{transform:translateY(-100%)} 100%{transform:translateY(300%)} }
  @keyframes explosion-ring { 0%{transform:translate(-50%,-50%) scale(.3);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.8);opacity:0} }
  @keyframes smoke-drift { 0%{transform:translate(-50%,-50%) translateY(0) scale(.5);opacity:.7} 100%{transform:translate(-50%,-50%) translateY(-22px) scale(2);opacity:0} }
  @keyframes contact-flash { 0%,100%{opacity:1} 35%{opacity:.15} }
  @keyframes ship-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
  @keyframes helo-bob { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-2px) rotate(-2deg)} 75%{transform:translateY(-1px) rotate(2deg)} }
  @keyframes plane-glide { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
`

interface Props { onBack?: () => void }

export default function TheaterMap({ onBack }: Props) {
  const { units, metrics, currentDay, currentPhase } = useGameStore()
  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const realConvoys      = useGameStore(s => (s as any).realConvoys || [])
  const mapFlyTarget    = useGameStore(s => (s as any).mapFlyTarget)
  const clearFlyTarget  = useGameStore(s => (s as any).clearFlyTarget)
  const enemyAOs         = useGameStore(s => (s as any).enemyAOs || [])

  // Load scenario-specific theater network
  const theater = getTheaterNetwork(activeScenarioId)
  const GEO_NODES = theater.nodes
  const LOCS      = theater.locs

  const mapRef      = useRef<HTMLDivElement>(null)
  const svgRef      = useRef<HTMLDivElement>(null)
  const mapInst     = useRef<L.Map | null>(null)
  const aoLayerRef  = useRef<L.LayerGroup | null>(null)
  const rafRef      = useRef<number>(0)
  const progRef     = useRef<Record<string,number>>({})
  const conflictRef = useRef<Record<string,number>>({})
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [redForceWarning, setRedForceWarning] = useState<string|null>(null)
  const [screenShake, setScreenShake]         = useState(false)
  const [rocketStrikes, setRocketStrikes]     = useState<{id:string;unitId:string}[]>([])
  const lastAttacksRef = useRef<any[]>([])
  const lastSWRef      = useRef(0)

  // Artillery flash listener
  useEffect(() => {
    const handleRocket = (e: Event) => {
      const { unitId } = (e as CustomEvent).detail || {}
      if (!unitId) return
      const strikeId = `strike_${Date.now()}_${Math.random()}`
      setRocketStrikes(prev => [...prev, { id:strikeId, unitId }])
      setTimeout(() => setRocketStrikes(prev => prev.filter(s => s.id !== strikeId)), 1800)
    }
    window.addEventListener('ROCKET_IMPACT', handleRocket)
    return () => window.removeEventListener('ROCKET_IMPACT', handleRocket)
  }, [])

  // Combat cam — auto-zoom to enemy attack location
  const lastEnemyAttacks = useGameStore(s => (s as any).lastEnemyAttacks || [])
  useEffect(() => {
    if (!lastEnemyAttacks.length || !mapInst.current) return
    const newAttacks = lastEnemyAttacks.filter((a:any) =>
      !lastAttacksRef.current.find((old:any) => old.id === a.id)
    )
    lastAttacksRef.current = lastEnemyAttacks
    if (newAttacks.length > 0) {
      const atk = newAttacks[0]
      if (atk.mapMarker) {
        // Brief zoom to attack site
        mapInst.current.flyTo([atk.mapMarker.lat, atk.mapMarker.lng], 8, { duration:1.2 })
        setTimeout(() => {
          mapInst.current?.flyTo([theater.mapCenter[0], theater.mapCenter[1]], theater.mapZoom, { duration:1.5 })
        }, 3500)
      }
      AudioEngine.playEnemyAttack()
      // Show RED FORCE banner
      setRedForceWarning(`RED FORCE ACTIVITY — ${atk.type || 'INTERDICTION'} DETECTED`)
      setTimeout(() => setRedForceWarning(null), 4000)
    }
  }, [lastEnemyAttacks])

  // Screen shake — listens for CustomEvent from ANY component
  useEffect(() => {
    const handleShake = (e: Event) => {
      setScreenShake(true)
      const dur = ((e as CustomEvent).detail?.intensity || 10) < 8 ? 400 : 650
      setTimeout(() => setScreenShake(false), dur)
    }
    window.addEventListener('TRIGGER_SCREEN_SHAKE', handleShake)
    return () => window.removeEventListener('TRIGGER_SCREEN_SHAKE', handleShake)
  }, [])

  // Screen shake on stonewall entry
  useEffect(() => {
    const swCount = Object.values(units).filter((u:any) => u.status === 'STONEWALL').length
    if (swCount > lastSWRef.current) {
      AudioEngine.playStonewallAlarm()
      window.dispatchEvent(new CustomEvent('TRIGGER_SCREEN_SHAKE', { detail: { intensity: 14 } }))
    }
    lastSWRef.current = swCount
  }, [units])

  const [pos, setPos]           = useState<NodePos>({})
  const [zoom, setZoom]         = useState(theater.mapZoom)
  const [selNode, setSelNode]   = useState<TheaterNode | null>(null)
  const [movers, setMovers]     = useState<Mover[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  const unitOf = (id:string|null) =>
    id ? (Object.values(units) as any[]).find(u=>u.id===id)??null : null

  const statusColor = (node:TheaterNode) => {
    const u=unitOf(node.unitId); if(!u) return '#00cc66'
    return SC[u.status as string]||'#00cc66'
  }

  const nodeMap:Record<string,TheaterNode>={}
  GEO_NODES.forEach(n=>{nodeMap[n.id]=n})

  const updatePositions = useCallback(()=>{
    if(!mapInst.current) return
    const newPos:NodePos={}
    GEO_NODES.forEach(node=>{
      const pt=mapInst.current!.latLngToContainerPoint([node.lat,node.lng])
      newPos[node.id]={x:pt.x,y:pt.y}
    })
    // Strategic origin (ships departing)
    if(theater.strategicOrigin){
      const pt=mapInst.current!.latLngToContainerPoint([theater.strategicOrigin.lat,theater.strategicOrigin.lng])
      newPos['STRATEGIC_ORIGIN']={x:pt.x,y:pt.y}
    }
    setPos(newPos)
    setZoom(mapInst.current.getZoom())
  },[GEO_NODES, theater])

  const animate = useCallback(()=>{
    if(!mapInst.current){rafRef.current=requestAnimationFrame(animate);return}
    const cz=mapInst.current.getZoom()
    const groundSpeed=cz>=9?.00012:cz>=7?.0002:.00035
    const airSpeed=groundSpeed*1.8
    const seaSpeed=groundSpeed*0.5

    const newMovers:Mover[]=[]
    const newConflicts:Conflict[]=[]

    LOCS.forEach((loc:TheaterLOC,i:number)=>{
      const f=nodeMap[loc.from];const t=nodeMap[loc.to];if(!f||!t) return

      if(loc.status==='INTERDICTED'){
        const nc=cz>=8?4:cz>=7?2:1
        for(let c=0;c<nc;c++){
          const ck=`cf-${loc.id}-${c}`
          if(!conflictRef.current[ck]) conflictRef.current[ck]=c/nc+Math.random()*.1
          conflictRef.current[ck]=(conflictRef.current[ck]+.003)%1
          const tt=conflictRef.current[ck]
          const lat=f.lat+(t.lat-f.lat)*tt,lng=f.lng+(t.lng-f.lng)*tt
          const pt=mapInst.current!.latLngToContainerPoint([lat,lng])
          const phase=tt*Math.PI*2
          newConflicts.push({
            id:ck,
            x:pt.x+Math.sin(phase*3)*(cz>=8?5:3),
            y:pt.y+Math.cos(phase*2)*(cz>=8?5:3),
            intensity:(Math.sin(Date.now()*.003+c*1.5)+1)/2,
            type:c%3===0?'explosion':c%3===1?'smoke':'contact',
          })
        }
        return
      }

      const isAir=loc.type==='AIR'
      const isSea=loc.type==='SEA'
      const isHelo=isAir && (loc.cargo.includes('MEDEVAC')||loc.cargo.includes('LIFT')||loc.cargo.includes('AASLT'))
      const speed=isSea?seaSpeed:isAir?airSpeed:groundSpeed
      const nc=cz>=9?3:cz>=7?2:cz>=5?1:0
      if(nc===0) return

      for(let c=0;c<nc;c++){
        const ck=`cv-${loc.id}-${c}`
        if(progRef.current[ck]===undefined) progRef.current[ck]=(i*.28+c*(1/nc))%1
        progRef.current[ck]=(progRef.current[ck]+speed)%1
        const tt=progRef.current[ck]
        const lat=f.lat+(t.lat-f.lat)*tt,lng=f.lng+(t.lng-f.lng)*tt
        const pt=mapInst.current!.latLngToContainerPoint([lat,lng])
        const nt=Math.min(1,tt+.01)
        const nPt=mapInst.current!.latLngToContainerPoint([f.lat+(t.lat-f.lat)*nt,f.lng+(t.lng-f.lng)*nt])
        newMovers.push({
          id:ck,x:pt.x,y:pt.y,
          heading:Math.atan2(nPt.y-pt.y,nPt.x-pt.x)*180/Math.PI,
          cargo:loc.cargo,
          moveType: isSea?'SEA':isHelo?'HELO':isAir?'AIR':'GROUND',
          progress:tt,
        })
      }
    })

    

    setMovers(newMovers)
    setConflicts(newConflicts)
    rafRef.current=requestAnimationFrame(animate)
  },[LOCS, GEO_NODES, theater])

  // Re-init map when scenario changes
  useEffect(()=>{
    if(mapInst.current){
      mapInst.current.flyTo(theater.mapCenter,theater.mapZoom,{duration:1.2})
      setTimeout(updatePositions,600)
    }
  },[activeScenarioId])

  useEffect(()=>{
    if(!mapRef.current||mapInst.current) return
    const map=L.map(mapRef.current,{center:theater.mapCenter,zoom:theater.mapZoom,zoomControl:true})
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',className:'theater-tiles'}).addTo(map)
    mapInst.current=map
    aoLayerRef.current=L.layerGroup().addTo(map)
    map.on('moveend zoomend move zoom resize',updatePositions)
    setTimeout(updatePositions,400)
    rafRef.current=requestAnimationFrame(animate)
    return()=>{map.remove();mapInst.current=null;cancelAnimationFrame(rafRef.current)}
  },[])

  useEffect(()=>{updatePositions()},[units,currentDay])

  // Sync store convoys and node positions for animation loop
  const dispatchConvoyFn = useGameStore(s => (s as any).dispatchConvoy)
  useEffect(()=>{ (window as any).__logActualConvoys = realConvoys },[realConvoys])
  useEffect(()=>{ if(dispatchConvoyFn) (window as any).__dispatchConvoy = dispatchConvoyFn },[dispatchConvoyFn])
  // Share node pixel positions so AttackAnimations can target actual node locations
  useEffect(()=>{ (window as any).__nodePositions = pos; (window as any).__geoNodes = GEO_NODES },[pos])

  // Fly to location when battlefield feed event is clicked
  useEffect(()=>{
    if (!mapFlyTarget || !mapInst.current) return
    mapInst.current.flyTo([mapFlyTarget.lat, mapFlyTarget.lng], mapFlyTarget.zoom, { duration:1.0 })
    if (clearFlyTarget) setTimeout(clearFlyTarget, 1500)
  },[mapFlyTarget])

  useEffect(()=>{
    if(!aoLayerRef.current) return
    aoLayerRef.current.clearLayers()
    enemyAOs.forEach((ao:any)=>{
      const color=ao.type==='ENEMY_AO'?'#ff2200':ao.type==='CONVOY_AMBUSH'?'#ff6600':ao.type==='STRIKE'?'#ff4400':'#00aaff'
      L.circle([ao.lat,ao.lng],{radius:ao.radius,color,fillColor:color,fillOpacity:.1,opacity:.7,weight:2,dashArray:'8,5'})
        .bindTooltip(ao.label,{className:'ao-tooltip',permanent:false,direction:'top'})
        .addTo(aoLayerRef.current!)
    })
  },[enemyAOs])

  const sigC=metrics.sigmaLevel>=3?'#00ff88':metrics.sigmaLevel>=2?'#ffaa00':'#ff4444'
  const cs=zoom>=10?20:zoom>=9?16:zoom>=8?13:zoom>=7?10:7

  return(
    <div style={{
      flex:1, display:'flex', overflow:'hidden', position:'relative', height:'100%',
      animation: screenShake ? 'screen-shake 0.5s ease' : undefined,
    }}>
      <style>{MAP_CSS + `
        @keyframes screen-shake {
          0%,100%{transform:translate(0,0)}
          15%{transform:translate(-4px,2px)}
          30%{transform:translate(4px,-2px)}
          45%{transform:translate(-3px,3px)}
          60%{transform:translate(3px,-1px)}
          75%{transform:translate(-2px,2px)}
          90%{transform:translate(2px,-1px)}
        }
      `}</style>

      {/* ── RED FORCE WARNING BANNER ── */}
      {redForceWarning && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:500,
          background:'rgba(180,0,0,0.92)', borderBottom:'2px solid #ff2200',
          padding:'7px 16px', display:'flex', alignItems:'center', gap:10,
          animation:'redforce-in 0.3s ease, redforce-out 0.5s ease 3.5s forwards',
          fontFamily:'Share Tech Mono,monospace', letterSpacing:3,
        }}>
          <span style={{fontSize:14, color:'#ff4444', animation:'sw-pulse 0.6s infinite'}}>◉</span>
          <span style={{fontSize:11, color:'#fff', fontWeight:700}}>{redForceWarning}</span>
          <span style={{marginLeft:'auto', fontSize:9, color:'rgba(255,255,255,0.5)'}}>REROUTE OR REINFORCE</span>
        </div>
      )}

      <div ref={svgRef} style={{flex:1,position:'relative',overflow:'hidden'}}>
        <div ref={mapRef} style={{position:'absolute',inset:0,zIndex:0}}/>

        {/* SVG LOC lines */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:10}}>
          <defs>
            <filter id="fg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="fb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="fr" x="-80%" y="-80%" width="360%" height="360%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="fs" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          

          {LOCS.map((loc:TheaterLOC)=>{
            const f=pos[loc.from];const t=pos[loc.to];if(!f||!t) return null
            if(loc.status==='INTERDICTED'){
              const mx=(f.x+t.x)/2;const my=(f.y+t.y)/2
              return(
                <g key={loc.id}>
                  <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#ff2200" strokeWidth="22" opacity=".1" filter="url(#fr)"/>
                  <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#ff6600" strokeWidth="4" strokeDasharray="11,6" filter="url(#fr)" style={{animation:'fire-flick .8s ease-in-out infinite'}}/>
                  {zoom>=7&&<><rect x={mx-52} y={my-13} width="104" height="24" rx="2" fill="#cc2200" opacity=".92" filter="url(#fr)"/><text x={mx} y={my+5} fill="white" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Share Tech Mono,monospace" letterSpacing="2">INTERDICTED</text></>}
                </g>
              )
            }
            const isSea=loc.type==='SEA'
            const isAir=loc.type==='AIR'
            const col=isSea?'#4488ff':isAir?'#00aaff':'#00ee77'
            const filt=isAir||isSea?'url(#fb)':'url(#fg)'
            const flowLen = isSea ? '20,12' : isAir ? '12,8' : '16,10'
            const flowDur = isSea ? '3s' : isAir ? '2s' : '2.5s'
            return(
              <g key={loc.id}>
                {/* Glow base */}
                <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={isSea?8:isAir?8:12} opacity=".08" filter={filt}/>
                {/* Static route line */}
                <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={isSea?1.5:isAir?1.5:2} strokeDasharray={isSea?'12,8':isAir?'7,6':undefined} opacity={isSea?.35:isAir?.45:.6} filter={filt}/>
                {/* FLOWING supply animation */}
                <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={col} strokeWidth={isSea?2.5:isAir?2:3}
                  strokeDasharray={flowLen} opacity={isSea?.7:isAir?.65:.85}
                  style={{
                    animation:`flow-supply ${flowDur} linear infinite`,
                    filter:`drop-shadow(0 0 3px ${col})`,
                  }}/>
              </g>
            )
          })}

          {/* HUD — desktop only, TopBar covers this on mobile */}
          {window.innerWidth >= 768 && (
          <g fontFamily="Share Tech Mono,monospace">
            <rect x="10" y="10" width="340" height="48" rx="3" fill="rgba(3,10,6,.9)" stroke="#1a3a20" strokeWidth="1"/>
            <text x="22" y="30" fill="#00ff88" fontSize="14" fontWeight="700" fontFamily="Barlow Condensed,sans-serif" letterSpacing="2">LOG ACTUAL — {activeScenarioId.replace('CAMPAIGN_','C').replace('_',' ')} THEATER</text>
            <text x="22" y="50" fill="#1a5a3a" fontSize="12">DAY </text>
            <text x="54" y="50" fill="#00ff88" fontSize="12">{String(currentDay).padStart(2,'0')}/{theater.nodes[0]?.id?30:30}</text>
            <text x="108" y="50" fill="#1a5a3a" fontSize="12">PHASE </text>
            <text x="152" y="50" fill={currentPhase==='EXECUTION'?'#00ff88':currentPhase==='PLANNING'?'#ffaa00':'#00aaff'} fontSize="12">{currentPhase}</text>
            <text x="250" y="50" fill="#1a5a3a" fontSize="12">σ </text>
            <text x="264" y="50" fill={sigC} fontSize="12">{metrics.sigmaLevel.toFixed(1)}</text>
            <text x="296" y="50" fill="#1a5a3a" fontSize="12">RCT </text>
            <text x="324" y="50" fill={metrics.avgRequestCycleTime<=32?'#00ff88':metrics.avgRequestCycleTime<=48?'#ffaa00':'#ff4444'} fontSize="12">{metrics.avgRequestCycleTime}h</text>
          </g>
          )}
        </svg>

        {/* Moving assets */}
        {/* ── ROCKET IMPACT FLASHES ── */}
        {rocketStrikes.map(strike => {
          // Find the node position for this unit
          const hitNode = GEO_NODES.find(n => n.unitId === strike.unitId)
          const hitPos = hitNode ? pos[hitNode.id] : null
          if (!hitPos) return null
          return (
            <div key={strike.id} style={{ position:'absolute', left:hitPos.x, top:hitPos.y, transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:200 }}>
              <div style={{ position:'absolute', width:80, height:80, marginLeft:-40, marginTop:-40, borderRadius:'50%', border:'3px solid #ff4400', animation:'rocket-ring 1.2s ease-out forwards', opacity:1 }}/>
              <div style={{ position:'absolute', width:40, height:40, marginLeft:-20, marginTop:-20, borderRadius:'50%', background:'rgba(255,100,0,0.4)', animation:'rocket-ring 0.8s ease-out forwards' }}/>
              <div style={{ position:'absolute', width:12, height:12, marginLeft:-6, marginTop:-6, borderRadius:'50%', background:'#ff6600', boxShadow:'0 0 20px #ff4400', animation:'rocket-flash 0.4s ease-out forwards' }}/>
              <style>{`
                @keyframes rocket-ring  { 0%{transform:scale(0.2);opacity:1} 100%{transform:scale(2.5);opacity:0} }
                @keyframes rocket-flash { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(3)} }
              `}</style>
            </div>
          )
        })}
        <div style={{position:'absolute',inset:0,zIndex:25,pointerEvents:'none'}}>
          {movers.map(m=>{
            const col=m.moveType==='SEA'?'#4488ff':m.moveType==='HELO'?'#88ddff':m.moveType==='AIR'?'#00aaff':'#00ff88'
            return(
              <div key={m.id} style={{position:'absolute',left:m.x,top:m.y,transform:`translate(-50%,-50%) rotate(${m.heading}deg)`,pointerEvents:'none'}}>
                {m.moveType==='SEA'&&<div style={{animation:'ship-bob 2s ease-in-out infinite'}}><ShipSVG size={cs} col={col}/></div>}
                {m.moveType==='HELO'&&<div style={{animation:'helo-bob 1.2s ease-in-out infinite'}}><HeloSVG size={cs} col={col}/></div>}
                {m.moveType==='AIR'&&<div style={{animation:'plane-glide 1.8s ease-in-out infinite'}}><PlaneSVG size={cs} col={col}/></div>}
                {m.moveType==='GROUND'&&<div style={{width:cs*1.8,height:cs,background:col,borderRadius:2,boxShadow:`0 0 ${cs}px ${col}60`,opacity:.9}}/>}
                {zoom>=9&&m.moveType!=='SEA'&&<div style={{position:'absolute',top:-16,left:'50%',transform:`translateX(-50%) rotate(-${m.heading}deg)`,whiteSpace:'nowrap',fontFamily:'Share Tech Mono,monospace',fontSize:9,color:col,textShadow:`0 0 4px ${col}`,letterSpacing:.5}}>{m.cargo}</div>}
              </div>
            )
          })}
        </div>

        {/* Conflict effects */}
        <div style={{position:'absolute',inset:0,zIndex:30,pointerEvents:'none'}}>
          {conflicts.map(cf=>(
            <div key={cf.id} style={{position:'absolute',left:cf.x,top:cf.y,pointerEvents:'none'}}>
              {cf.type==='explosion'&&<>
                <div style={{position:'absolute',width:zoom>=9?32:zoom>=7?20:12,height:zoom>=9?32:zoom>=7?20:12,borderRadius:'50%',border:'2px solid #ff6600',boxShadow:'0 0 14px #ff440080',animation:'explosion-ring 1.2s ease-out infinite',animationDelay:`${cf.intensity*.6}s`}}/>
                <div style={{position:'absolute',width:zoom>=9?10:zoom>=7?6:4,height:zoom>=9?10:zoom>=7?6:4,borderRadius:'50%',background:`rgba(255,${Math.round(100+cf.intensity*155)},0,.9)`,transform:'translate(-50%,-50%)',boxShadow:`0 0 ${zoom>=8?12:7}px #ff4400`,animation:'contact-flash .4s ease-in-out infinite'}}/>
              </>}
              {cf.type==='smoke'&&zoom>=7&&<div style={{position:'absolute',width:zoom>=9?18:12,height:zoom>=9?18:12,borderRadius:'50%',background:`rgba(80,50,20,${.3+cf.intensity*.4})`,filter:'blur(4px)',transform:'translate(-50%,-50%)',animation:'smoke-drift 2s ease-out infinite',animationDelay:`${cf.intensity}s`}}/>}
              {cf.type==='contact'&&zoom>=8&&<div style={{position:'absolute',transform:'translate(-50%,-200%)',fontFamily:'Share Tech Mono,monospace',fontSize:zoom>=9?11:9,color:'#ff4400',fontWeight:700,letterSpacing:1,textShadow:'0 0 8px #ff440080',whiteSpace:'nowrap',animation:'contact-flash .6s ease-in-out infinite'}}>CONTACT</div>}
            </div>
          ))}
        </div>

        {/* Nodes */}
        <div style={{position:'absolute',inset:0,zIndex:20,pointerEvents:'none'}}>
          {GEO_NODES.map((node:TheaterNode)=>{
            const p=pos[node.id];if(!p) return null
            const u=unitOf(node.unitId)
            const status=u?u.status as string:'ACTIVE'
            const col=statusColor(node)
            const isSW=status==='STONEWALL',isAmb=status==='AMBER',isDark=status==='DARK'
            const rdns=u?Math.round(u.readiness):null
            const isSel=selNode?.id===node.id
            const nSize=zoom>=9?40:zoom>=7?33:zoom>=6?27:22
            const fontSize=zoom>=9?14:zoom>=7?13:zoom>=6?12:11

            return(
              <div key={node.id} onClick={()=>setSelNode(isSel?null:node)}
                style={{position:'absolute',left:p.x,top:p.y,transform:'translate(-50%,-50%)',pointerEvents:'all',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center'}}>
                {isDark && (
                  <div style={{position:'absolute',width:nSize+20,height:nSize+20,borderRadius:node.type==='circle'?'50%':node.type==='square'?4:0,border:'1px solid #ff000030',boxShadow:'0 0 20px rgba(0,0,0,0.9)',background:'rgba(0,0,0,0.6)',zIndex:2}}/>
                )}
                <div style={{position:'absolute',width:nSize+16,height:nSize+16,borderRadius:node.type==='circle'?'50%':node.type==='square'?4:0,border:`1px solid ${col}22`,boxShadow:`0 0 ${isSW?22:12}px ${col}${isSW?'50':'18'}`,animation:isSW?'sw-pulse 0.9s ease-in-out infinite':undefined}}/>
                <NATOSymbol
                  nodeType={node.nodeType}
                  unitId={node.unitId}
                  col={col}
                  size={nSize}
                  isDark={isDark}
                  isAmber={isAmb}
                  isStonewall={isSW}
                />
                {zoom>=5&&<div style={{position:'absolute',bottom:`calc(100% + 5px)`,whiteSpace:'nowrap',fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize,letterSpacing:.5,color:isSel?'#ffffff':col,textShadow:`0 0 8px ${col}70,0 1px 4px rgba(0,0,0,.95)`}}>{node.name}{isDark&&<span style={{color:'#ff3333',marginLeft:5,fontSize:10,letterSpacing:2}}> ◼ DARK</span>}</div>}
                {rdns!==null&&zoom>=6&&(
                  <div style={{position:'absolute',top:`calc(100% + 4px)`,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                    <div style={{width:nSize+4,height:4,background:'rgba(255,255,255,.08)',borderRadius:2,overflow:'hidden'}}>
                      <div style={{width:`${rdns}%`,height:'100%',background:col,transition:'width 1s ease',boxShadow:`0 0 4px ${col}`}}/>
                    </div>
                    <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:col}}>{rdns}%</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Scan line */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:5,overflow:'hidden',background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,12,6,.03) 3px,rgba(0,12,6,.03) 4px)'}}>
          <div style={{position:'absolute',left:0,right:0,height:'20%',background:'linear-gradient(to bottom,transparent,rgba(0,200,80,.012),transparent)',animation:'scan-move 6s linear infinite'}}/>
        </div>

        {/* BACK BUTTON — desktop only, on mobile use browser back */}
        {onBack && window.innerWidth >= 768 && (
          <div style={{position:'absolute',top:70,left:10,zIndex:100}}>
            {!showBackConfirm ? (
              <button onClick={()=>setShowBackConfirm(true)} style={{
                background:'rgba(3,10,6,.88)', border:'1px solid #2d5a32',
                color:'#2d5a32', padding:'6px 14px', borderRadius:3, cursor:'pointer',
                fontFamily:'Barlow Condensed,sans-serif', fontSize:13, letterSpacing:2,
                transition:'all .2s',
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#00ff88';(e.currentTarget as HTMLElement).style.borderColor='#00ff88'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='#2d5a32';(e.currentTarget as HTMLElement).style.borderColor='#2d5a32'}}>
                ← BACK TO SELECT
              </button>
            ) : (
              <div style={{background:'rgba(3,10,6,.96)',border:'1px solid #ff4444',borderRadius:4,padding:'10px 14px',display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#ff8888'}}>ABORT CAMPAIGN?</div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={onBack} style={{background:'rgba(255,68,68,.15)',border:'1px solid #ff4444',color:'#ff4444',padding:'5px 12px',borderRadius:3,cursor:'pointer',fontFamily:'Barlow Condensed,sans-serif',fontSize:12,fontWeight:700}}>ABORT</button>
                  <button onClick={()=>setShowBackConfirm(false)} style={{background:'transparent',border:'1px solid #2d5a32',color:'#2d5a32',padding:'5px 12px',borderRadius:3,cursor:'pointer',fontFamily:'Barlow Condensed,sans-serif',fontSize:12}}>CANCEL</button>
                </div>
              </div>
            )}
          </div>
        )}

        {selNode&&<NodeDetailPanel node={{...selNode,wx:0,wy:0}} onClose={()=>setSelNode(null)}/>}
        <WeatherOverlay/>
        <AttackAnimations mapRef={mapRef}/>
      </div>
      {window.innerWidth >= 768 && <BattlefieldFeed/>}
      <NewsFeedSystem />
    </div>
  )
}
