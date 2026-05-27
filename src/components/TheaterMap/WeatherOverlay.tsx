import React, { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

function makeDrops(count: number, angle = 15) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 110 - 5,
    delay: Math.random() * 2,
    duration: 0.3 + Math.random() * 0.6,
    opacity: 0.3 + Math.random() * 0.5,
    length: 8 + Math.random() * 18,
    angle: angle + (Math.random() - 0.5) * 8,
  }))
}

function makeSandParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, top: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 0.8 + Math.random() * 1.2,
    opacity: 0.4 + Math.random() * 0.5,
    size: 2 + Math.random() * 4,
    speed: 0.6 + Math.random() * 0.8,
  }))
}

const RAIN_DROPS     = makeDrops(80, 15)
const STORM_DROPS    = makeDrops(200, 20)
const TYPHOON_DROPS  = makeDrops(300, 35)
const SQUALL_DROPS   = makeDrops(150, 25)
const SAND_PARTICLES = makeSandParticles(180)

const CSS = `
  @keyframes rain-fall    { 0%{transform:translateY(-20px);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(110vh);opacity:0} }
  @keyframes sand-blow    { 0%{transform:translateX(-60px);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateX(110vw);opacity:0} }
  @keyframes lightning    { 0%,91%,94%,97%,100%{opacity:0} 92%,95%{opacity:.4} 93%,96%{opacity:.2} }
  @keyframes typhoon-spin { 0%{transform:rotate(0deg) translateX(40px)} 100%{transform:rotate(360deg) translateX(40px)} }
  @keyframes fog-drift    { 0%{transform:translateX(0);opacity:.2} 50%{transform:translateX(40px);opacity:.35} 100%{transform:translateX(0);opacity:.2} }
  @keyframes fog-drift2   { 0%{transform:translateX(0);opacity:.15} 50%{transform:translateX(-30px);opacity:.25} 100%{transform:translateX(0);opacity:.15} }
  @keyframes wx-fadein    { from{opacity:0} to{opacity:1} }
  @keyframes wx-fadeout   { from{opacity:1} to{opacity:0} }
  @keyframes squall-flash { 0%,85%,100%{opacity:0} 87%,92%{opacity:.25} }
  @keyframes sand-haze    { 0%,100%{opacity:.3} 50%{opacity:.5} }
`

interface WxInfo { label: string; emoji: string; color: string; bg: string }
const WX_INFO: Record<string, WxInfo> = {
  RAIN:      { label:'RAIN — CONVOY SPEED -30%',            emoji:'🌧', color:'#66aadd', bg:'rgba(10,20,35,.28)' },
  STORM:     { label:'STORM — AIR OPS SUSPENDED',           emoji:'⛈', color:'#88aaff', bg:'rgba(5,10,25,.45)' },
  FOG:       { label:'FOG — VISIBILITY DEGRADED',           emoji:'🌫', color:'#aaccbb', bg:'rgba(20,30,25,.22)' },
  SANDSTORM: { label:'SANDSTORM — ALL OPS DEGRADED',        emoji:'🌪', color:'#cc9944', bg:'rgba(30,20,5,.55)' },
  TYPHOON:   { label:'TYPHOON — ALL AIR/SEA SUSPENDED',     emoji:'🌀', color:'#8866ff', bg:'rgba(10,5,30,.55)' },
  SQUALL:    { label:'TROPICAL SQUALL — AIR CORRIDORS CLOSED', emoji:'⛈', color:'#44aacc', bg:'rgba(5,15,25,.4)' },
}

export default function WeatherOverlay() {
  const weather     = useGameStore(s => s.weather as string) || 'CLEAR'
  const scenarioId  = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (weather !== 'CLEAR') setVisible(true)
    else { const t = setTimeout(() => setVisible(false), 800); return () => clearTimeout(t) }
  }, [weather])

  if (!visible && weather === 'CLEAR') return null
  const info = WX_INFO[weather] || WX_INFO['RAIN']
  const fading = weather === 'CLEAR'

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:50, pointerEvents:'none', overflow:'hidden',
      animation: fading ? 'wx-fadeout .8s forwards' : 'wx-fadein .6s forwards',
    }}>
      <style>{CSS}</style>

      {/* ── RAIN ──────────────────────────────────────────────────────────── */}
      {weather === 'RAIN' && (
        <>
          <div style={{ position:'absolute', inset:0, background:'rgba(5,15,25,.22)' }}/>
          {RAIN_DROPS.map(d => (
            <div key={d.id} style={{
              position:'absolute', left:`${d.left}%`, top:0,
              width:'1.5px', height:`${d.length}px`,
              background:`rgba(140,200,255,${d.opacity*.7})`,
              transform:`rotate(${d.angle}deg)`,
              animation:`rain-fall ${d.duration}s linear ${d.delay}s infinite`,
              borderRadius:'1px',
            }}/>
          ))}
        </>
      )}

      {/* ── STORM ─────────────────────────────────────────────────────────── */}
      {weather === 'STORM' && (
        <>
          <div style={{ position:'absolute', inset:0, background:'rgba(5,8,20,.48)' }}/>
          {STORM_DROPS.map(d => (
            <div key={d.id} style={{
              position:'absolute', left:`${d.left}%`, top:0,
              width:'2px', height:`${d.length}px`,
              background:`rgba(180,200,255,${d.opacity})`,
              transform:`rotate(${d.angle}deg)`,
              animation:`rain-fall ${d.duration}s linear ${d.delay}s infinite`,
            }}/>
          ))}
          <div style={{ position:'absolute', inset:0, background:'rgba(200,210,255,.95)', animation:'lightning 5s linear infinite' }}/>
          <div style={{ position:'absolute', inset:0, background:'rgba(180,190,255,.6)',  animation:'lightning 8s linear 2s infinite' }}/>
        </>
      )}

      {/* ── FOG ───────────────────────────────────────────────────────────── */}
      {weather === 'FOG' && (
        <>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(60,80,70,.32) 0%,rgba(40,60,50,.16) 50%,rgba(60,80,70,.32) 100%)', animation:'fog-drift 9s ease-in-out infinite', backdropFilter:'blur(1px)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(50,70,60,.18) 0%,transparent 40%,rgba(50,70,60,.18) 100%)', animation:'fog-drift2 13s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 150% 60% at 50% 50%,transparent 25%,rgba(40,60,50,.28) 100%)' }}/>
        </>
      )}

      {/* ── SANDSTORM ─────────────────────────────────────────────────────── */}
      {weather === 'SANDSTORM' && (
        <>
          <div style={{ position:'absolute', inset:0, background:'rgba(80,50,10,.55)', animation:'sand-haze 4s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,rgba(150,100,20,.4),rgba(120,80,10,.2),rgba(160,110,30,.4))', animation:'fog-drift 6s ease-in-out infinite' }}/>
          {SAND_PARTICLES.map(p => (
            <div key={p.id} style={{
              position:'absolute', top:`${p.top}%`, left:'-10px',
              width:`${p.size}px`, height:`${p.size * 0.4}px`,
              background:`rgba(180,130,50,${p.opacity})`,
              borderRadius:'50%',
              animation:`sand-blow ${p.duration}s linear ${p.delay}s infinite`,
            }}/>
          ))}
          {/* Visibility haze layers */}
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(5deg,transparent,transparent 18px,rgba(160,110,20,.06) 18px,rgba(160,110,20,.06) 19px)' }}/>
        </>
      )}

      {/* ── TYPHOON ───────────────────────────────────────────────────────── */}
      {weather === 'TYPHOON' && (
        <>
          <div style={{ position:'absolute', inset:0, background:'rgba(10,5,30,.58)' }}/>
          {TYPHOON_DROPS.map(d => (
            <div key={d.id} style={{
              position:'absolute', left:`${d.left}%`, top:0,
              width:'2px', height:`${d.length}px`,
              background:`rgba(150,180,255,${d.opacity})`,
              transform:`rotate(${d.angle}deg)`,
              animation:`rain-fall ${d.duration * 0.6}s linear ${d.delay}s infinite`,
            }}/>
          ))}
          {/* Typhoon spiral indicator */}
          <div style={{ position:'absolute', top:'30%', left:'40%', width:120, height:120, opacity:.15 }}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{
                position:'absolute', inset:0,
                border:'3px solid rgba(140,100,255,.8)',
                borderRadius:'50%',
                transform:`scale(${0.3+i*0.25})`,
                animation:`typhoon-spin ${3+i}s linear infinite`,
              }}/>
            ))}
          </div>
          <div style={{ position:'absolute', inset:0, background:'rgba(180,160,255,.3)', animation:'lightning 3s linear infinite' }}/>
        </>
      )}

      {/* ── TROPICAL SQUALL ───────────────────────────────────────────────── */}
      {weather === 'SQUALL' && (
        <>
          <div style={{ position:'absolute', inset:0, background:'rgba(5,15,28,.4)' }}/>
          {SQUALL_DROPS.map(d => (
            <div key={d.id} style={{
              position:'absolute', left:`${d.left}%`, top:0,
              width:'2px', height:`${d.length}px`,
              background:`rgba(100,200,220,${d.opacity})`,
              transform:`rotate(${d.angle}deg)`,
              animation:`rain-fall ${d.duration}s linear ${d.delay}s infinite`,
            }}/>
          ))}
          <div style={{ position:'absolute', inset:0, background:'rgba(100,200,220,.2)', animation:'squall-flash 4s linear infinite' }}/>
        </>
      )}

      {/* ── STATUS BADGE ──────────────────────────────────────────────────── */}
      <div style={{
        position:'absolute', top:65, right:300,
        background:`rgba(5,8,12,.88)`,
        border:`1px solid ${info.color}60`,
        borderRadius:3, padding:'5px 13px',
        fontFamily:'Share Tech Mono,monospace', fontSize:11,
        letterSpacing:2, color:info.color,
        display:'flex', alignItems:'center', gap:8,
        boxShadow:`0 0 16px ${info.color}20`,
      }}>
        <span style={{ fontSize:15 }}>{info.emoji}</span>
        {info.label}
      </div>
    </div>
  )
}
