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

// ── ATTACK SPRITE SHEET MAPPING ─────────────────────────────────────────────
const ATK_SPRITE = '/sprites/attack-sprites.png'
const ASW = 512; const ASH = 512  // cell size

const ATK_SPRITES = {
  // Row 1 — projectiles
  rocket:        { x:0,       y:0,    w:ASW, h:ASH },
  cruise_missile:{ x:ASW,     y:0,    w:ASW, h:ASH },
  artillery:     { x:ASW*2,   y:0,    w:ASW, h:ASH },
  drone:         { x:ASW*3,   y:0,    w:ASW, h:ASH },
  // Row 2 — impacts
  impact_rocket: { x:0,       y:ASH,  w:ASW, h:ASH },
  impact_missile:{ x:ASW,     y:ASH,  w:ASW, h:ASH },
  impact_arty:   { x:ASW*2,   y:ASH,  w:ASW, h:ASH },
  impact_drone:  { x:ASW*3,   y:ASH,  w:ASW, h:ASH },
  // Row 3 — fire/sustained
  fire_small:    { x:0,       y:ASH*2,w:ASW, h:ASH },
  fire_large:    { x:ASW,     y:ASH*2,w:ASW, h:ASH },
  ied_blast:     { x:ASW*2,   y:ASH*2,w:ASW, h:ASH },
  smoke:         { x:ASW*3,   y:ASH*2,w:ASW, h:ASH },
  // Row 4 — markers
  crater:        { x:0,       y:ASH*3,w:ASW, h:ASH },
  bridge_demo:   { x:ASW,     y:ASH*3,w:ASW, h:ASH },
  interdiction:  { x:ASW*2,   y:ASH*3,w:ASW, h:ASH },
  route_clear:   { x:ASW*3,   y:ASH*3,w:ASW, h:ASH },
}

function getProjectileSprite(type: Projectile['type']): keyof typeof ATK_SPRITES {
  switch(type) {
    case 'ROCKET':         return 'rocket'
    case 'CRUISE_MISSILE': return 'cruise_missile'
    case 'ARTILLERY':      return 'artillery'
    case 'DRONE':          return 'drone'
  }
}

function getImpactSprite(type: Projectile['type']): keyof typeof ATK_SPRITES {
  switch(type) {
    case 'ROCKET':         return 'impact_rocket'
    case 'CRUISE_MISSILE': return 'impact_missile'
    case 'ARTILLERY':      return 'impact_arty'
    case 'DRONE':          return 'impact_drone'
  }
}

function AttackSprite({ name, size, angle=0, style={} }: {
  name: keyof typeof ATK_SPRITES; size: number; angle?: number; style?: React.CSSProperties
}) {
  const sp = ATK_SPRITES[name]
  const scale = size / sp.w
  // Full sheet is 4×4 cells = 2048×2048
  const sheetW = 4 * sp.w
  const sheetH = 4 * sp.h
  return (
    <div style={{
      width: size, height: size * (sp.h/sp.w),
      backgroundImage: `url(${ATK_SPRITE})`,
      backgroundPosition: `-${sp.x * scale}px -${sp.y * scale}px`,
      backgroundSize: `${sheetW * scale}px ${sheetH * scale}px`,
      backgroundRepeat: 'no-repeat',
      transform: `rotate(${angle}deg)`,
      imageRendering: 'auto',
      ...style,
    }}/>
  )
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
          const speeds: Record<string,number> = { ROCKET:0.018, DRONE:0.006, CRUISE_MISSILE:0.012, ARTILLERY:0.025 }
          const speed = speeds[p.type] || 0.015
          const newProgress = Math.min(1, p.progress + speed)
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

      {/* Projectiles — sprite sheet */}
      {projs.filter(p => p.active && !p.hit).map(p => {
        const pos = p.type === ('DRONE' as any)
          ? dronePoint(p.fromX, p.fromY, p.toX, p.toY, p.progress)
          : straightPoint(p.fromX, p.fromY, p.toX, p.toY, p.progress)
        const angle = Math.atan2(p.toY - p.fromY, p.toX - p.fromX) * 180 / Math.PI
        const spriteName = getProjectileSprite(p.type)
        const pSize = p.type==='CRUISE_MISSILE' ? 64 : p.type==='DRONE' ? 48 : 52

        return (
          <div key={p.id} style={{
            position:'absolute', left:pos.x, top:pos.y,
            transform:'translate(-50%,-50%)', pointerEvents:'none',
          }}>
            <AttackSprite name={spriteName} size={pSize} angle={angle} />
          </div>
        )
      })}
      {/* Hit effects — sprite sheet */}
      {hits.map(h => {
        const spriteName = getImpactSprite(h.type)
        const impactSize = h.type==='CRUISE_MISSILE' ? 96 : h.type==='ARTILLERY' ? 80 : 72
        return (
          <div key={h.id} style={{
            position:'absolute', left:h.x, top:h.y,
            transform:'translate(-50%,-50%)', pointerEvents:'none',
            animation:'atk-hit 0.8s ease-out forwards',
          }}>
            <AttackSprite name={spriteName} size={impactSize} />
          </div>
        )
      })}
    </div>
  )
}
