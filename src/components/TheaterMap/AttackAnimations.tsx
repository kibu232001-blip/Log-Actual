import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

interface Projectile {
  id: string
  type: 'ROCKET' | 'DRONE' | 'CRUISE_MISSILE' | 'ARTILLERY'
  fromX: number; fromY: number
  toX:   number; toY:   number
  progress: number   // 0-1
  active: boolean
  hit: boolean
}

function getProjectileStyle(type: Projectile['type']) {
  switch(type) {
    case 'ROCKET':        return { color:'#ff6600', size:8,  speed:0.018, trail:'#ff440060' }
    case 'DRONE':         return { color:'#8888ff', size:10, speed:0.006, trail:'#4444aa40' }
    case 'CRUISE_MISSILE':return { color:'#ff2200', size:7,  speed:0.012, trail:'#ff000050' }
    case 'ARTILLERY':     return { color:'#ffaa00', size:6,  speed:0.025, trail:'#ff880050' }
  }
}

// Straight line — rockets fly direct, no arc
function straightPoint(fx:number, fy:number, tx:number, ty:number, t:number) {
  return { x: fx + (tx-fx)*t, y: fy + (ty-fy)*t }
}

// Drone slight weave on straight path
function dronePoint(fx:number, fy:number, tx:number, ty:number, t:number) {
  const dx = tx-fx, dy = ty-fy
  const len = Math.sqrt(dx*dx+dy*dy)
  const nx = -dy/len, ny = dx/len   // perpendicular
  const weave = Math.sin(t*Math.PI*8)*8
  return {
    x: fx + dx*t + nx*weave,
    y: fy + dy*t + ny*weave,
  }
}

// Map attack type to projectile type
function getProjectileType(attackType: string): Projectile['type'] {
  if (attackType === 'DEPOT_STRIKE')   return 'CRUISE_MISSILE'
  if (attackType === 'FARP_STRIKE')    return 'DRONE'
  if (attackType === 'IED')            return 'ARTILLERY'
  if (attackType === 'FUEL_SABOTAGE')  return 'DRONE'
  return 'ROCKET'
}

// Attack origin — fire from off-screen east
function getAttackOrigin(mapEl: HTMLElement): { x: number; y: number } {
  const w = mapEl.offsetWidth
  const h = mapEl.offsetHeight
  const edge = Math.floor(Math.random() * 3)
  if (edge === 0) return { x: w + 60, y: Math.random() * h }
  if (edge === 1) return { x: Math.random() * w, y: -60 }
  return { x: -60, y: Math.random() * h }
}

// Target pixel from actual node positions — spread across all FOBs
function getTargetPixel(attack: any, mapEl: HTMLElement): { x: number; y: number } {
  const nodePositions = (window as any).__nodePositions || {}
  const geoNodes: any[] = (window as any).__geoNodes || []

  // Try to hit the actual targeted unit's node position
  const targetUnitId = attack.targetUnit || attack.targetNode
  if (targetUnitId) {
    const node = geoNodes.find(n => n.unitId === targetUnitId || n.id === targetUnitId)
    if (node && nodePositions[node.id]) {
      const p = nodePositions[node.id]
      return { x: p.x + (Math.random()-0.5)*20, y: p.y + (Math.random()-0.5)*20 }
    }
  }

  // Spread across all FOB nodes — pick a random unit node
  const unitNodes = geoNodes.filter(n => n.unitId && nodePositions[n.id])
  if (unitNodes.length > 0) {
    const picked = unitNodes[Math.floor(Math.random() * unitNodes.length)]
    const p = nodePositions[picked.id]
    return { x: p.x + (Math.random()-0.5)*15, y: p.y + (Math.random()-0.5)*15 }
  }

  // Final fallback
  const w = mapEl.offsetWidth, h = mapEl.offsetHeight
  return { x: w * 0.2 + Math.random() * w * 0.6, y: h * 0.2 + Math.random() * h * 0.5 }
}

const ATK_CSS = `
  @keyframes exhaust-flicker { 0%,100%{opacity:.7;transform:scaleX(1)} 50%{opacity:.9;transform:scaleX(1.15)} }

  @keyframes atk-hit    { 0%{transform:translate(-50%,-50%) scale(.2);opacity:1} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
  @keyframes atk-smoke  { 0%{transform:translate(-50%,-50%) scale(.3);opacity:.8} 100%{transform:translate(-50%,-50%) scale(2.5) translateY(-20px);opacity:0} }
  @keyframes atk-ring   { 0%{transform:translate(-50%,-50%) scale(.1);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.8);opacity:0} }
  @keyframes drone-blink{ 0%,100%{opacity:1} 50%{opacity:.4} }
`

interface Props { mapRef: React.RefObject<HTMLDivElement | null> }

export default function AttackAnimations({ mapRef }: Props) {
  const lastAttacks   = useGameStore(s => (s as any).lastEnemyAttacks || [])
  const [projs, setProjs] = useState<Projectile[]>([])
  const [hits, setHits]   = useState<Array<{id:string;x:number;y:number;type:Projectile['type']}>>([])
  const rafRef = useRef<number>(0)
  const prevAttackIds = useRef<Set<string>>(new Set())

  // Launch projectiles when new attacks fire
  useEffect(() => {
    if (!mapRef.current || !lastAttacks.length) return
    const mapEl = mapRef.current

    const newProjs: Projectile[] = []
    lastAttacks.forEach((atk: any) => {
      if (prevAttackIds.current.has(atk.id)) return
      prevAttackIds.current.add(atk.id)

      const origin = getAttackOrigin(mapEl)
      const target = getTargetPixel(atk, mapEl)
      if (!target) return

      newProjs.push({
        id: atk.id,
        type: getProjectileType(atk.type),
        fromX: origin.x, fromY: origin.y,
        toX: target.x,   toY: target.y,
        progress: 0,
        active: true,
        hit: false,
      })
    })

    if (newProjs.length > 0) {
      setProjs(prev => [...prev.filter(p => p.active), ...newProjs])
    }
  }, [lastAttacks])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setProjs(prev => {
        const updated = prev.map(p => {
          if (!p.active || p.hit) return p
          const style = getProjectileStyle(p.type)
          const newProgress = Math.min(1, p.progress + style.speed)
          if (newProgress >= 1) {
            // Trigger hit effect
            setHits(h => [...h, { id:`hit_${p.id}_${Date.now()}`, x:p.toX, y:p.toY, type:p.type }])
            setTimeout(() => setHits(h => h.filter(hh => !hh.id.startsWith(`hit_${p.id}`))), 2000)
            return { ...p, hit: true, active: false, progress: 1 }
          }
          return { ...p, progress: newProgress }
        }).filter(p => p.active)
        return updated
      })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (!projs.length && !hits.length) return null

  return (
    <div style={{ position:'absolute', inset:0, zIndex:60, pointerEvents:'none', overflow:'hidden' }}>
      <style>{ATK_CSS}</style>

      {/* Projectiles */}
      {projs.filter(p => p.active && !p.hit).map(p => {
        const style = getProjectileStyle(p.type)
        const pos = p.type === ('DRONE' as any)
          ? dronePoint(p.fromX, p.fromY, p.toX, p.toY, p.progress)
          : straightPoint(p.fromX, p.fromY, p.toX, p.toY, p.progress)

        const angle = Math.atan2(p.toY - p.fromY, p.toX - p.fromX) * 180 / Math.PI

        return (
          <div key={p.id} style={{ position:'absolute', left:pos.x, top:pos.y, transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
            {/* Exhaust smoke trail */}
            {p.type !== 'DRONE' && (
              <div style={{
                position:'absolute',
                width: p.type==='CRUISE_MISSILE'?60:p.type==='ROCKET'?45:30,
                height: p.type==='CRUISE_MISSILE'?6:4,
                background:`linear-gradient(${angle>90||angle<-90?'to right':'to left'},${style.trail},rgba(100,80,50,.3),transparent)`,
                left: p.type==='DRONE'?undefined:'calc(100% + 2px)',
                right: p.type==='DRONE'?'100%':undefined,
                top:'50%', transform:'translateY(-50%)',
                borderRadius:4,
                filter:'blur(3px)',
              }}/>
            )}
            {/* Military missile silhouettes — detailed SVG profiles */}
            {p.type === ('DRONE' as any) && (
              <svg width="36" height="20" viewBox="0 0 36 20"
                style={{ transform:`rotate(${angle}deg)`, animation:'drone-blink .6s infinite', overflow:'visible' }}>
                {/* Fuselage */}
                <rect x="8" y="8" width="16" height="4" rx="1" fill={style.color}/>
                {/* Nose pod */}
                <ellipse cx="25" cy="10" rx="3" ry="2" fill={style.color}/>
                <circle cx="26.5" cy="10" r="1" fill="#222" opacity=".8"/>
                {/* Tail */}
                <rect x="6" y="9" width="3" height="2" rx="0.5" fill={style.color} opacity=".8"/>
                {/* Main wings — straight wide */}
                <path d="M12,8 L10,2 L22,8" fill={style.color} opacity=".85"/>
                <path d="M12,12 L10,18 L22,12" fill={style.color} opacity=".85"/>
                {/* Wing tips */}
                <rect x="9.5" y="1" width="1.5" height="3" rx=".5" fill={style.color} opacity=".7"/>
                <rect x="9.5" y="16" width="1.5" height="3" rx=".5" fill={style.color} opacity=".7"/>
                {/* T-tail */}
                <rect x="7" y="6" width="1.5" height="8" rx=".5" fill={style.color} opacity=".7"/>
                <rect x="5" y="5.5" width="4" height="1.5" rx=".5" fill={style.color} opacity=".7"/>
                {/* Payload/sensor */}
                <ellipse cx="18" cy="10" rx="2" ry="1.5" fill="#444" opacity=".6"/>
              </svg>
            )}
            {p.type === 'ROCKET' && (
              <svg width="44" height="14" viewBox="0 0 44 14"
                style={{ transform:`rotate(${angle}deg)`, overflow:'visible' }}>
                {/* Exhaust flame — multi-layer for realism */}
                <ellipse cx="5" cy="7" rx="8" ry="4" fill="#ff4400" opacity=".6"/>
                <ellipse cx="4" cy="7" rx="5" ry="2.5" fill="#ff7700" opacity=".8"/>
                <ellipse cx="3" cy="7" rx="3" ry="1.5" fill="#ffcc00" opacity=".95"/>
                {/* Cruciform tail fins */}
                <path d="M10,7 L8,3  L12,6 Z" fill={style.color}/>
                <path d="M10,7 L8,11 L12,8 Z" fill={style.color}/>
                <rect x="8" y="6.2" width="4" height="1.6" fill={style.color} opacity=".5"/>
                {/* Main body — tapered */}
                <path d="M10,4.5 L32,3.5 L32,10.5 L10,9.5 Z" fill={style.color}/>
                {/* Guidance ring / seeker band */}
                <rect x="28" y="3.5" width="2" height="7" fill="#888" opacity=".7"/>
                {/* Forward body taper */}
                <path d="M32,3.5 L37,5 L37,9 L32,10.5 Z" fill={style.color}/>
                {/* Nose cone — sharp */}
                <path d="M37,5 L44,7 L37,9 Z" fill={style.color}/>
                {/* Wing strakes */}
                <path d="M18,4.5 L16,1 L22,4 Z" fill={style.color} opacity=".75"/>
                <path d="M18,9.5 L16,13 L22,10 Z" fill={style.color} opacity=".75"/>
              </svg>
            )}
            {p.type === 'CRUISE_MISSILE' && (
              <svg width="52" height="18" viewBox="0 0 52 18"
                style={{ transform:`rotate(${angle}deg)`, overflow:'visible' }}>
                {/* Jet exhaust — small, rear-mounted */}
                <ellipse cx="5" cy="9" rx="6" ry="3" fill="#ff5500" opacity=".5"/>
                <ellipse cx="4" cy="9" rx="4" ry="2" fill="#ff9900" opacity=".7"/>
                <ellipse cx="3" cy="9" rx="2.5" ry="1.2" fill="#ffee00" opacity=".9"/>
                {/* Cruciform tail fins */}
                <path d="M10,9 L8,4  L13,7.5 Z" fill={style.color}/>
                <path d="M10,9 L8,14 L13,10.5 Z" fill={style.color}/>
                <rect x="8.5" y="8.2" width="4.5" height="1.6" fill={style.color} opacity=".6"/>
                {/* Air intake */}
                <ellipse cx="14" cy="12" rx="2" ry="1.5" fill="#222" opacity=".8"/>
                <rect x="13" y="11" width="3" height="4" rx=".5" fill={style.color} opacity=".7"/>
                {/* Main body */}
                <path d="M10,6 L40,5 L40,13 L10,12 Z" fill={style.color}/>
                {/* Center stripe detail */}
                <rect x="18" y="5" width="18" height="8" fill={style.color} opacity=".2"/>
                {/* Large swept delta wings */}
                <path d="M20,5 L14,0 L34,5" fill={style.color} opacity=".82"/>
                <path d="M20,13 L14,18 L34,13" fill={style.color} opacity=".82"/>
                {/* Wing tip fins */}
                <rect x="13" y="0" width="1.5" height="4" rx=".5" fill={style.color}/>
                <rect x="13" y="14" width="1.5" height="4" rx=".5" fill={style.color}/>
                {/* Guidance seeker */}
                <ellipse cx="42" cy="9" rx="3" ry="3.5" fill={style.color}/>
                <circle cx="43" cy="9" r="1.5" fill="#888" opacity=".8"/>
                {/* Nose cone */}
                <path d="M44,6.5 L52,9 L44,11.5 Z" fill={style.color}/>
              </svg>
            )}
            {p.type === 'ARTILLERY' && (
              <svg width="32" height="12" viewBox="0 0 32 12"
                style={{ transform:`rotate(${angle}deg)`, overflow:'visible' }}>
                {/* Propellant flash */}
                <ellipse cx="3" cy="6" rx="6" ry="3.5" fill="#ff6600" opacity=".7"/>
                <ellipse cx="2" cy="6" rx="4" ry="2" fill="#ffaa00" opacity=".85"/>
                <ellipse cx="1" cy="6" rx="2" ry="1" fill="#ffee88" opacity=".95"/>
                {/* Shell boattail */}
                <path d="M6,4 L10,3 L10,9 L6,8 Z" fill={style.color}/>
                {/* Main body — cylindrical */}
                <rect x="10" y="3" width="14" height="6" fill={style.color}/>
                {/* Rotating band */}
                <rect x="15" y="3" width="2.5" height="6" fill="#cc9944" opacity=".9"/>
                {/* Forward taper */}
                <path d="M24,3 L28,4 L28,8 L24,9 Z" fill={style.color}/>
                {/* Ogive nose */}
                <path d="M28,4 L32,6 L28,8 Z" fill={style.color}/>
                {/* Stabilizer fins */}
                <path d="M8,4 L6,1 L10,3.5 Z" fill={style.color} opacity=".8"/>
                <path d="M8,8 L6,11 L10,8.5 Z" fill={style.color} opacity=".8"/>
              </svg>
            )}
          </div>
        )
      })}

      {/* Hit effects */}
      {hits.map(h => (
        <div key={h.id} style={{ position:'absolute', left:h.x, top:h.y, pointerEvents:'none' }}>
          {/* Explosion ring */}
          <div style={{
            position:'absolute', width:60, height:60,
            border:`3px solid ${h.type==='DRONE'?'#8888ff':'#ff6600'}`,
            borderRadius:'50%',
            boxShadow:`0 0 20px ${h.type==='DRONE'?'#8888ff':'#ff440080'}`,
            animation:'atk-ring 0.8s ease-out forwards',
          }}/>
          {/* Fire core */}
          <div style={{
            position:'absolute', width:20, height:20,
            borderRadius:'50%',
            background:h.type==='DRONE'?'#aaaaff':'#ff6600',
            boxShadow:`0 0 30px ${h.type==='DRONE'?'#8888ff':'#ff4400'}`,
            animation:'atk-hit 0.6s ease-out forwards',
          }}/>
          {/* Smoke */}
          <div style={{
            position:'absolute', width:30, height:30,
            borderRadius:'50%',
            background:'rgba(80,50,20,.6)',
            filter:'blur(6px)',
            animation:'atk-smoke 1.5s ease-out 0.3s forwards',
          }}/>
        </div>
      ))}
    </div>
  )
}
