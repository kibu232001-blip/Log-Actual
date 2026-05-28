import React, { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

// ── PARTICLE GENERATORS ───────────────────────────────────────────────────────
function makeDrops(count: number, angle = 15, lenMult = 1) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 120 - 10,
    delay: Math.random() * 2,
    duration: (0.3 + Math.random() * 0.5) / lenMult,
    opacity: 0.3 + Math.random() * 0.55,
    length: (8 + Math.random() * 16) * lenMult,
    angle: angle + (Math.random() - 0.5) * 10,
  }))
}

function makeSnow(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 110 - 5,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 5,
    opacity: 0.5 + Math.random() * 0.5,
    size: 2 + Math.random() * 5,
    drift: (Math.random() - 0.5) * 60,
  }))
}

function makeSand(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, top: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 0.6 + Math.random() * 1.0,
    opacity: 0.3 + Math.random() * 0.55,
    size: 1.5 + Math.random() * 4,
  }))
}

// Pre-generate particle sets
const RAIN_D     = makeDrops(90,  15, 1)
const STORM_D    = makeDrops(220, 22, 1.4)
const TYPHOON_D  = makeDrops(300, 32, 1.2)
const SQUALL_D   = makeDrops(160, 26, 1.1)
const SNOW_P     = makeSnow(120)
const SAND_P     = makeSand(200)

// ── CSS ANIMATIONS ────────────────────────────────────────────────────────────
const CSS = `
  @keyframes rain-fall {
    0%   { transform:translateY(-5vh) translateX(0); opacity:0 }
    8%   { opacity:1 }
    92%  { opacity:1 }
    100% { transform:translateY(110vh) translateX(-15px); opacity:0 }
  }
  @keyframes snow-fall {
    0%   { transform:translateY(-5vh) translateX(0); opacity:0 }
    10%  { opacity:1 }
    90%  { opacity:1 }
    100% { transform:translateY(110vh) translateX(var(--drift,30px)); opacity:0 }
  }
  @keyframes sand-blow {
    0%   { transform:translateX(-80px) scaleX(0.5); opacity:0 }
    8%   { opacity:1; transform:translateX(-40px) scaleX(1) }
    92%  { opacity:1 }
    100% { transform:translateX(110vw) scaleX(1.2); opacity:0 }
  }
  @keyframes lightning {
    0%,90%,94%,98%,100% { opacity:0 }
    91%,95% { opacity:0.45 }
    92%,96% { opacity:0.15 }
  }
  @keyframes lightning2 {
    0%,82%,86%,90%,100% { opacity:0 }
    83%,87% { opacity:0.5 }
    84%,88% { opacity:0.2 }
  }
  @keyframes fog-drift  { 0%,100%{transform:translateX(0);opacity:.22} 50%{transform:translateX(45px);opacity:.38} }
  @keyframes fog-drift2 { 0%,100%{transform:translateX(0);opacity:.14} 50%{transform:translateX(-35px);opacity:.26} }
  @keyframes fog-drift3 { 0%,100%{transform:translateX(0) translateY(0);opacity:.18} 50%{transform:translateX(20px) translateY(-15px);opacity:.30} }
  @keyframes typhoon-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes sand-haze  { 0%,100%{opacity:.35} 50%{opacity:.55} }
  @keyframes snow-haze  { 0%,100%{opacity:.12} 50%{opacity:.22} }
  @keyframes wx-fadein  { from{opacity:0} to{opacity:1} }
  @keyframes wx-fadeout { from{opacity:1} to{opacity:0} }
  @keyframes atk-hit    { 0%{transform:translate(-50%,-50%) scale(.2);opacity:1} 100%{transform:translate(-50%,-50%) scale(3);opacity:0} }
`

interface WxInfo { label: string; emoji: string; color: string }
const WX_INFO: Record<string, WxInfo> = {
  RAIN:      { label:'RAIN — CONVOY SPEED -30%',               emoji:'🌧', color:'#66aadd' },
  STORM:     { label:'STORM — AIR OPS SUSPENDED',              emoji:'⛈', color:'#88aaff' },
  FOG:       { label:'FOG — VISIBILITY DEGRADED',              emoji:'🌫', color:'#aaccbb' },
  SNOW:      { label:'SNOW — GROUND MOBILITY CRITICAL',        emoji:'❄️', color:'#c8e8ff' },
  SANDSTORM: { label:'SANDSTORM — ALL OPS DEGRADED',           emoji:'🌪', color:'#cc9944' },
  TYPHOON:   { label:'TYPHOON — ALL AIR/SEA SUSPENDED',        emoji:'🌀', color:'#8866ff' },
  SQUALL:    { label:'TROPICAL SQUALL — AIR CORRIDORS CLOSED', emoji:'⛈', color:'#44aacc' },
}

export default function WeatherOverlay() {
  const weather = (useGameStore(s => s.weather as string) || 'CLEAR')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (weather !== 'CLEAR') setVisible(true)
    else { const t = setTimeout(() => setVisible(false), 900); return () => clearTimeout(t) }
  }, [weather])

  if (!visible && weather === 'CLEAR') return null
  const info = WX_INFO[weather] || WX_INFO['RAIN']
  const fading = weather === 'CLEAR'

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:50, pointerEvents:'none', overflow:'hidden',
      animation: fading ? 'wx-fadeout .9s forwards' : 'wx-fadein .5s forwards',
    }}>
      <style>{CSS}</style>

      {/* ── RAIN ─────────────────────────────────────────────────────────── */}
      {weather === 'RAIN' && (<>
        <div style={{position:'absolute',inset:0,background:'rgba(5,15,25,.22)'}}/>
        {RAIN_D.map(d=>(
          <div key={d.id} style={{
            position:'absolute', left:`${d.left}%`, top:0,
            width:'1.5px', height:`${d.length}px`,
            background:`rgba(140,200,255,${d.opacity*.75})`,
            transform:`rotate(${d.angle}deg)`,
            animation:`rain-fall ${d.duration}s linear ${d.delay}s infinite`,
            borderRadius:'1px',
          }}/>
        ))}
        {/* Puddle shimmer on ground */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'18%',
          background:'linear-gradient(to top,rgba(80,130,180,.08),transparent)',
          animation:'fog-drift 7s ease-in-out infinite'}}/>
      </>)}

      {/* ── SNOW ─────────────────────────────────────────────────────────── */}
      {weather === 'SNOW' && (<>
        <div style={{position:'absolute',inset:0,background:'rgba(180,210,240,.06)',animation:'snow-haze 8s ease-in-out infinite'}}/>
        {SNOW_P.map(p=>(
          <div key={p.id} style={{
            position:'absolute', left:`${p.left}%`, top:0,
            width:`${p.size}px`, height:`${p.size}px`,
            background:`rgba(220,235,255,${p.opacity})`,
            borderRadius:'50%',
            filter:'blur(0.5px)',
            // @ts-ignore
            '--drift':`${p.drift}px`,
            animation:`snow-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}/>
        ))}
        {/* Ground snow accumulation */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'6px',
          background:'linear-gradient(to top,rgba(200,225,255,.15),transparent)'}}/>
        {/* White-out haze */}
        <div style={{position:'absolute',inset:0,
          background:'radial-gradient(ellipse 140% 60% at 50% 100%,rgba(200,220,255,.08),transparent 70%)',
          animation:'fog-drift 12s ease-in-out infinite'}}/>
      </>)}

      {/* ── STORM ─────────────────────────────────────────────────────────── */}
      {weather === 'STORM' && (<>
        <div style={{position:'absolute',inset:0,background:'rgba(4,7,18,.50)'}}/>
        {STORM_D.map(d=>(
          <div key={d.id} style={{
            position:'absolute', left:`${d.left}%`, top:0,
            width:'2px', height:`${d.length}px`,
            background:`rgba(170,195,255,${d.opacity})`,
            transform:`rotate(${d.angle}deg)`,
            animation:`rain-fall ${d.duration}s linear ${d.delay}s infinite`,
          }}/>
        ))}
        {/* Lightning flashes — two independent timings */}
        <div style={{position:'absolute',inset:0,background:'rgba(200,215,255,.95)',animation:'lightning 5s linear infinite'}}/>
        <div style={{position:'absolute',inset:0,background:'rgba(180,200,255,.7)',animation:'lightning2 7s linear 1.3s infinite'}}/>
        {/* Storm cloud layer */}
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(180deg,rgba(5,8,20,.55) 0%,rgba(8,12,28,.3) 40%,transparent 100%)'}}/>
      </>)}

      {/* ── FOG ───────────────────────────────────────────────────────────── */}
      {weather === 'FOG' && (<>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(180deg,rgba(55,75,65,.34) 0%,rgba(35,55,45,.16) 50%,rgba(55,75,65,.34) 100%)',
          animation:'fog-drift 9s ease-in-out infinite', backdropFilter:'blur(1.5px)'}}/>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(90deg,rgba(45,65,55,.2) 0%,transparent 40%,rgba(45,65,55,.2) 100%)',
          animation:'fog-drift2 13s ease-in-out infinite'}}/>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(135deg,transparent 30%,rgba(50,70,60,.15) 50%,transparent 70%)',
          animation:'fog-drift3 17s ease-in-out infinite'}}/>
        <div style={{position:'absolute',inset:0,
          background:'radial-gradient(ellipse 150% 60% at 50% 50%,transparent 20%,rgba(35,55,45,.30) 100%)'}}/>
      </>)}

      {/* ── SANDSTORM ────────────────────────────────────────────────────── */}
      {weather === 'SANDSTORM' && (<>
        <div style={{position:'absolute',inset:0,background:'rgba(90,55,8,.60)',animation:'sand-haze 3.5s ease-in-out infinite'}}/>
        {/* Moving wall of sand */}
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(92deg,rgba(160,110,20,.45),rgba(130,85,12,.20),rgba(170,120,28,.50))',
          animation:'fog-drift 5s ease-in-out infinite'}}/>
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(88deg,rgba(140,95,15,.35),rgba(180,130,35,.20),rgba(145,100,18,.40))',
          animation:'fog-drift2 7s ease-in-out infinite'}}/>
        {/* Sand particles */}
        {SAND_P.map(p=>(
          <div key={p.id} style={{
            position:'absolute', top:`${p.top}%`, left:'-10px',
            width:`${p.size * 3}px`, height:`${p.size * 0.5}px`,
            background:`rgba(190,140,55,${p.opacity})`,
            borderRadius:'50%',
            animation:`sand-blow ${p.duration}s linear ${p.delay}s infinite`,
          }}/>
        ))}
        {/* Visibility stripes */}
        <div style={{position:'absolute',inset:0,
          background:'repeating-linear-gradient(4deg,transparent,transparent 16px,rgba(165,115,22,.05) 16px,rgba(165,115,22,.05) 17px)'}}/>
        {/* Sun blotted out — dim warm haze */}
        <div style={{position:'absolute',inset:0,
          background:'radial-gradient(ellipse 80% 40% at 70% 20%,rgba(220,160,40,.08),transparent)'}}/>
      </>)}

      {/* ── TYPHOON ───────────────────────────────────────────────────────── */}
      {weather === 'TYPHOON' && (<>
        <div style={{position:'absolute',inset:0,background:'rgba(8,4,28,.62)'}}/>
        {TYPHOON_D.map(d=>(
          <div key={d.id} style={{
            position:'absolute', left:`${d.left}%`, top:0,
            width:'2px', height:`${d.length}px`,
            background:`rgba(140,175,255,${d.opacity})`,
            transform:`rotate(${d.angle}deg)`,
            animation:`rain-fall ${d.duration*.55}s linear ${d.delay}s infinite`,
          }}/>
        ))}
        {/* Rotating spiral eye wall */}
        <div style={{position:'absolute',top:'15%',left:'35%',width:200,height:200,opacity:.12}}>
          {[0,1,2,3,4].map(i=>(
            <div key={i} style={{
              position:'absolute',
              inset: `${i*16}px`,
              border:`${3-i*0.4}px solid rgba(160,120,255,.9)`,
              borderRadius:'50%',
              animation:`typhoon-spin ${2.5+i*0.6}s linear ${i%2===0?'':'reverse'} infinite`,
            }}/>
          ))}
          {/* Eye */}
          <div style={{position:'absolute',inset:'72px',borderRadius:'50%',
            background:'rgba(20,10,50,.5)',border:'1px solid rgba(140,100,255,.4)'}}/>
        </div>
        {/* Purple lightning */}
        <div style={{position:'absolute',inset:0,background:'rgba(180,150,255,.35)',animation:'lightning 3s linear infinite'}}/>
        <div style={{position:'absolute',inset:0,background:'rgba(160,130,255,.25)',animation:'lightning2 4.5s linear .8s infinite'}}/>
        {/* Surge bands */}
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(135deg,rgba(120,80,255,.12) 0%,transparent 50%,rgba(100,60,220,.15) 100%)',
          animation:'fog-drift 6s ease-in-out infinite'}}/>
      </>)}

      {/* ── TROPICAL SQUALL ───────────────────────────────────────────────── */}
      {weather === 'SQUALL' && (<>
        <div style={{position:'absolute',inset:0,background:'rgba(4,14,26,.42)'}}/>
        {SQUALL_D.map(d=>(
          <div key={d.id} style={{
            position:'absolute', left:`${d.left}%`, top:0,
            width:'2px', height:`${d.length}px`,
            background:`rgba(90,200,220,${d.opacity})`,
            transform:`rotate(${d.angle}deg)`,
            animation:`rain-fall ${d.duration}s linear ${d.delay}s infinite`,
          }}/>
        ))}
        <div style={{position:'absolute',inset:0,background:'rgba(80,195,215,.22)',animation:'lightning 4.5s linear infinite'}}/>
        <div style={{position:'absolute',inset:0,background:'rgba(60,180,200,.15)',animation:'lightning2 6s linear 1.5s infinite'}}/>
        {/* Humidity haze */}
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(180deg,rgba(0,30,40,.35) 0%,rgba(0,20,30,.15) 50%,transparent 100%)'}}/>
      </>)}

      {/* ── STATUS BADGE ──────────────────────────────────────────────────── */}
      <div style={{
        position:'absolute', top:65, right:300,
        background:'rgba(4,8,12,.90)',
        border:`1px solid ${info.color}60`,
        borderRadius:3, padding:'5px 13px',
        fontFamily:'Share Tech Mono,monospace', fontSize:11,
        letterSpacing:2, color:info.color,
        display:'flex', alignItems:'center', gap:8,
        boxShadow:`0 0 16px ${info.color}20`,
      }}>
        <span style={{fontSize:15}}>{info.emoji}</span>
        {info.label}
      </div>
    </div>
  )
}
