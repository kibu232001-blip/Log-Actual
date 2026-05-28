/**
 * AttackAnimations — rockets, drones, artillery fly from enemy territory
 * to their target node/LOC and explode on impact.
 * Uses attack-sprites.png sprite sheet (4×4 grid, 512×512 per cell)
 */
import React, { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

// ── SPRITE SHEET ─────────────────────────────────────────────────────────────
const ATK_SPRITE = '/sprites/attack-sprites.png'
const ASZ = 512  // each cell is 512×512 in the 2048×2048 sheet

const SPRITES = {
  // Row 1 — projectiles in flight
  rocket:         { x:0,       y:0,       w:ASZ, h:ASZ },
  cruise_missile: { x:ASZ,     y:0,       w:ASZ, h:ASZ },
  artillery:      { x:ASZ*2,   y:0,       w:ASZ, h:ASZ },
  drone:          { x:ASZ*3,   y:0,       w:ASZ, h:ASZ },
  // Row 2 — impact explosions
  impact_rocket:  { x:0,       y:ASZ,     w:ASZ, h:ASZ },
  impact_missile: { x:ASZ,     y:ASZ,     w:ASZ, h:ASZ },
  impact_arty:    { x:ASZ*2,   y:ASZ,     w:ASZ, h:ASZ },
  impact_drone:   { x:ASZ*3,   y:ASZ,     w:ASZ, h:ASZ },
  // Row 3 — sustained fire
  fire_small:     { x:0,       y:ASZ*2,   w:ASZ, h:ASZ },
  fire_large:     { x:ASZ,     y:ASZ*2,   w:ASZ, h:ASZ },
  ied_blast:      { x:ASZ*2,   y:ASZ*2,   w:ASZ, h:ASZ },
  smoke:          { x:ASZ*3,   y:ASZ*2,   w:ASZ, h:ASZ },
  // Row 4 — markers
  crater:         { x:0,       y:ASZ*3,   w:ASZ, h:ASZ },
  bridge_demo:    { x:ASZ,     y:ASZ*3,   w:ASZ, h:ASZ },
  interdiction:   { x:ASZ*2,   y:ASZ*3,   w:ASZ, h:ASZ },
  route_clear:    { x:ASZ*3,   y:ASZ*3,   w:ASZ, h:ASZ },
}

function Sprite({ name, size, angle=0, opacity=1, style={} }: {
  name: keyof typeof SPRITES; size: number; angle?: number; opacity?: number; style?: React.CSSProperties
}) {
  const sp = SPRITES[name]
  const scale = size / sp.w
  return (
    <div style={{
      width: size, height: size,
      backgroundImage: `url(${ATK_SPRITE})`,
      backgroundPosition: `-${sp.x * scale}px -${sp.y * scale}px`,
      backgroundSize: `${4 * sp.w * scale}px ${4 * sp.h * scale}px`,
      backgroundRepeat: 'no-repeat',
      transform: `rotate(${angle}deg)`,
      opacity,
      ...style,
    }}/>
  )
}

// ── PROJECTILE TYPES ─────────────────────────────────────────────────────────
type ProjType = 'ROCKET' | 'CRUISE_MISSILE' | 'ARTILLERY' | 'DRONE'

function attackTypeToProj(type: string): ProjType {
  if (type === 'CRUISE_MISSILE') return 'CRUISE_MISSILE'
  if (type === 'ARTILLERY' || type === 'BARRAGE') return 'ARTILLERY'
  if (type === 'DRONE' || type === 'UAV') return 'DRONE'
  return 'ROCKET'
}

function projSprite(t: ProjType): keyof typeof SPRITES {
  return t === 'CRUISE_MISSILE' ? 'cruise_missile' : t === 'ARTILLERY' ? 'artillery' : t === 'DRONE' ? 'drone' : 'rocket'
}

function impactSprite(t: ProjType): keyof typeof SPRITES {
  return t === 'CRUISE_MISSILE' ? 'impact_missile' : t === 'ARTILLERY' ? 'impact_arty' : t === 'DRONE' ? 'impact_drone' : 'impact_rocket'
}

const PROJ_SPEED: Record<ProjType, number> = {
  ROCKET: 0.022, CRUISE_MISSILE: 0.014, ARTILLERY: 0.030, DRONE: 0.008
}

const PROJ_SIZE: Record<ProjType, number> = {
  ROCKET: 56, CRUISE_MISSILE: 64, ARTILLERY: 48, DRONE: 44
}

// ── INTERPOLATION ─────────────────────────────────────────────────────────────
function lerp(ax:number,ay:number,bx:number,by:number,t:number) {
  // Drone arcs up, others fly straight
  return { x: ax+(bx-ax)*t, y: ay+(by-ay)*t }
}

function droneArc(ax:number,ay:number,bx:number,by:number,t:number) {
  const mx=(ax+bx)/2, my=(ay+by)/2-80
  const t1=1-t
  return {
    x: t1*t1*ax+2*t1*t*mx+t*t*bx,
    y: t1*t1*ay+2*t1*t*my+t*t*by,
  }
}

// ── GET TARGET PIXEL FROM GAME STATE ─────────────────────────────────────────
function getTargetPixel(attack: any, mapEl: HTMLElement): {x:number;y:number} | null {
  const nodePositions: Record<string,{x:number;y:number}> = (window as any).__nodePositions || {}
  const geoNodes: any[] = (window as any).__geoNodes || []

  const targetId = attack.targetNode || attack.targetUnit || attack.targetLOC

  // 1. Direct node position lookup
  if (targetId && nodePositions[targetId]) return nodePositions[targetId]

  // 2. Find node by unitId or nodeId
  if (targetId) {
    const node = geoNodes.find((n:any) => n.id === targetId || n.unitId === targetId)
    if (node && nodePositions[node.id]) return nodePositions[node.id]
  }

  // 3. LOC attack — find midpoint of the LOC from nodePositions
  if (attack.targetLOC) {
    const geoNodes2 = geoNodes
    // Try to find a node near the LOC
    const anyNode = geoNodes2.find((n:any) => nodePositions[n.id])
    if (anyNode) return nodePositions[anyNode.id]
  }

  // 4. Fallback — pick any known node position
  const positions = Object.values(nodePositions)
  if (positions.length > 0) {
    return positions[Math.floor(Math.random() * positions.length)]
  }

  // 5. Final fallback — center of map
  const w = mapEl.offsetWidth, h = mapEl.offsetHeight
  return { x: w * 0.3 + Math.random() * w * 0.4, y: h * 0.2 + Math.random() * h * 0.5 }
}

// Origin: edge of map, opposite side from target
function getOrigin(target: {x:number;y:number}, mapEl: HTMLElement): {x:number;y:number} {
  const w = mapEl.offsetWidth, h = mapEl.offsetHeight
  const cx = w/2, cy = h/2

  // Come from the edge nearest to enemy territory (top-right or top for most scenarios)
  // Vary based on which quadrant target is in so rockets always cross the map
  if (target.x > cx && target.y > cy) {
    // target is bottom-right → come from top-left
    return { x: Math.random()*w*0.2 - w*0.1, y: Math.random()*h*0.2 - h*0.1 }
  } else if (target.x < cx && target.y > cy) {
    // target is bottom-left → come from top-right
    return { x: w*0.8 + Math.random()*w*0.2, y: Math.random()*h*0.2 - h*0.1 }
  } else if (target.x > cx) {
    // target is top-right → come from left
    return { x: -60, y: h*0.3 + Math.random()*h*0.4 }
  } else {
    // target is top-left → come from right
    return { x: w + 60, y: h*0.3 + Math.random()*h*0.4 }
  }
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const ATK_CSS = `
  @keyframes impact-pop  { 0%{transform:translate(-50%,-50%) scale(0.1);opacity:1} 40%{transform:translate(-50%,-50%) scale(1.4);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
  @keyframes impact-ring { 0%{transform:translate(-50%,-50%) scale(0.1);opacity:0.8} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
  @keyframes smoke-rise  { 0%{transform:translate(-50%,-80%) scale(0.3);opacity:0.8} 100%{transform:translate(-50%,-200%) scale(1.8);opacity:0} }
  @keyframes flash-white { 0%,100%{opacity:0} 10%,30%{opacity:0.15} 20%{opacity:0.05} }
`

interface Projectile {
  id: string; type: ProjType
  fromX:number; fromY:number; toX:number; toY:number
  progress: number; active: boolean; hit: boolean
}

interface Hit {
  id:string; x:number; y:number; type:ProjType; scale:number
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
interface Props { mapRef: React.RefObject<HTMLDivElement | null> }

export default function AttackAnimations({ mapRef }: Props) {
  const lastAttacks = useGameStore(s => (s as any).lastEnemyAttacks || []) as any[]
  const [projs, setProjs] = useState<Projectile[]>([])
  const [hits,  setHits]  = useState<Hit[]>([])
  const rafRef       = useRef<number>(0)
  const seenIds      = useRef<Set<string>>(new Set())
  const lastFrameRef = useRef<number>(0)

  // Launch projectiles when new attacks arrive
  useEffect(() => {
    if (!mapRef.current || !lastAttacks.length) return
    const mapEl = mapRef.current

    const newProjs: Projectile[] = []
    lastAttacks.forEach((atk:any) => {
      if (seenIds.current.has(atk.id)) return
      seenIds.current.add(atk.id)

      const target = getTargetPixel(atk, mapEl)
      if (!target) return

      const origin = getOrigin(target, mapEl)
      const ptype  = attackTypeToProj(atk.type || 'ROCKET')

      // MLRS-style: fire multiple rockets per ROCKET/BARRAGE attack
      const volley = ptype === 'ROCKET' ? Math.floor(1 + Math.random()*2) : 1
      for (let v = 0; v < volley; v++) {
        const spread = volley > 1 ? (Math.random()-0.5)*40 : 0
        newProjs.push({
          id: `${atk.id}_${v}`,
          type: ptype,
          fromX: origin.x + (Math.random()-0.5)*30,
          fromY: origin.y + (Math.random()-0.5)*30,
          toX: target.x + spread,
          toY: target.y + spread,
          progress: v * -0.08, // stagger volley
          active: true, hit: false,
        })
      }
    })

    if (newProjs.length) setProjs(p => [...p, ...newProjs])
  }, [lastAttacks])

  // Animation loop
  useEffect(() => {
    let running = true
    const FRAME_MS = 16 // ~60fps

    const tick = (now: number) => {
      if (!running) return
      rafRef.current = requestAnimationFrame(tick)
      if (now - lastFrameRef.current < FRAME_MS) return
      lastFrameRef.current = now

      setProjs(prev => {
        const next = prev.map(p => {
          if (!p.active || p.hit) return p
          if (p.progress < 0) return { ...p, progress: p.progress + PROJ_SPEED[p.type] }
          const np = Math.min(1, p.progress + PROJ_SPEED[p.type])
          if (np >= 1) {
            // Spawn hit effect
            setHits(h => [...h, {
              id: `hit_${p.id}_${Date.now()}`,
              x: p.toX, y: p.toY,
              type: p.type,
              scale: p.type === 'CRUISE_MISSILE' ? 1.4 : p.type === 'ARTILLERY' ? 1.2 : 1.0,
            }])
            setTimeout(() => setHits(h => h.filter(hh => !hh.id.startsWith(`hit_${p.id}`))), 2200)
            return { ...p, hit:true, active:false, progress:1 }
          }
          return { ...p, progress: np }
        }).filter(p => p.active)
        return next
      })
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  if (!projs.length && !hits.length) return null

  return (
    <div style={{position:'absolute',inset:0,zIndex:60,pointerEvents:'none',overflow:'visible'}}>
      <style>{ATK_CSS}</style>

      {/* Flash on impact */}
      {hits.length > 0 && (
        <div style={{position:'absolute',inset:0,animation:'flash-white 0.4s ease-out forwards'}}/>
      )}

      {/* ── PROJECTILES IN FLIGHT ── */}
      {projs.filter(p => p.active && !p.hit && p.progress >= 0).map(p => {
        const pos = p.type === 'DRONE'
          ? droneArc(p.fromX, p.fromY, p.toX, p.toY, p.progress)
          : lerp(p.fromX, p.fromY, p.toX, p.toY, p.progress)

        const dx = p.toX - p.fromX
        const dy = p.toY - p.fromY
        const angle = Math.atan2(dy, dx) * 180 / Math.PI

        const sz = PROJ_SIZE[p.type]

        return (
          <div key={p.id} style={{
            position:'absolute',
            left: pos.x, top: pos.y,
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
            zIndex: 61,
          }}>
            {/* Exhaust trail */}
            <div style={{
              position:'absolute',
              left:'50%', top:'50%',
              width: sz * 1.2, height: p.type === 'DRONE' ? 4 : 3,
              transform: `translate(-100%,-50%) rotate(0deg)`,
              background: p.type === 'DRONE'
                ? 'linear-gradient(to right, transparent, rgba(100,200,255,0.6))'
                : 'linear-gradient(to right, transparent, rgba(255,140,40,0.8))',
              borderRadius: 2,
              filter: 'blur(2px)',
            }}/>
            <Sprite
              name={projSprite(p.type)}
              size={sz}
              angle={angle}
            />
          </div>
        )
      })}

      {/* ── IMPACT EXPLOSIONS ── */}
      {hits.map(h => (
        <div key={h.id} style={{position:'absolute', left:h.x, top:h.y, pointerEvents:'none', zIndex:62}}>
          {/* Main explosion sprite */}
          <div style={{animation:`impact-pop 1.2s ease-out forwards`}}>
            <Sprite name={impactSprite(h.type)} size={Math.round(90 * h.scale)} style={{marginLeft:`-${45*h.scale}px`,marginTop:`-${45*h.scale}px`}}/>
          </div>
          {/* Shockwave ring */}
          <div style={{
            position:'absolute',
            left:0, top:0,
            width: 60*h.scale, height: 60*h.scale,
            border: `3px solid ${h.type==='DRONE'?'rgba(100,180,255,0.7)':'rgba(255,100,20,0.7)'}`,
            borderRadius: '50%',
            animation: 'impact-ring 0.9s ease-out forwards',
          }}/>
          {/* Smoke rising */}
          <div style={{animation:'smoke-rise 1.8s ease-out 0.3s forwards', opacity:0}}>
            <Sprite name="smoke" size={60} style={{marginLeft:'-30px',marginTop:'-30px'}}/>
          </div>
        </div>
      ))}
    </div>
  )
}
