import React, { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ALL_SCENARIOS, SCENARIOS_BY_THEATER, MissionScenario, TheaterRegion } from '../../data/scenarios'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props { onSelect: (s: MissionScenario) => void; onBack: () => void }

const THEATERS: Record<TheaterRegion, { lat:number; lng:number; zoom:number; label:string }> = {
  EUROPE:      { lat:54,  lng:16,  zoom:5, label:'European Theater'    },
  MIDDLE_EAST: { lat:30,  lng:44,  zoom:5, label:'Middle East Theater' },
  PACIFIC:     { lat:22,  lng:140, zoom:4, label:'Pacific Theater'     },
}

const DCOL: Record<string,string> = { STANDARD:'#2ecc71', ELEVATED:'#f39c12', SEVERE:'#e74c3c' }

const MAP_CSS = `
  .map-dark { filter:brightness(0.35) saturate(0.25) hue-rotate(90deg); }
  .leaflet-control-attribution { background:rgba(13,31,15,0.8)!important; color:#2d5a32!important; font-size:9px!important; }
  .leaflet-control-zoom a { background:#132415!important; color:#2ecc71!important; border-color:#2d5a32!important; }
  .map-tt.leaflet-tooltip { background:#0d1f0f!important; border:1px solid #2d5a32!important; color:#2ecc71!important; font-family:'Barlow Condensed',sans-serif!important; font-size:12px!important; }
  .map-tt.leaflet-tooltip::before { border-top-color:#2d5a32!important; }
`

// Mobile retractable campaign list
// Mission popup card - floats above the tapped diamond icon
function MissionPopup({ selected, onProceed, onBrief, onDismiss }: any) {
  if (!selected) return null
  const DIFF_COLORS: Record<string,string> = { STANDARD:'#2ecc71', ELEVATED:'#f39c12', SEVERE:'#e74c3c' }
  const DIFF_LABEL: Record<string,string>  = { STANDARD:'● STANDARD', ELEVATED:'● ELEVATED', SEVERE:'● SEVERE' }
  const c = DIFF_COLORS[selected.difficulty] || '#2ecc71'
  return (
    <div
      onTouchStart={(e)=>e.stopPropagation()}
      onTouchEnd={(e)=>e.stopPropagation()}
      onClick={(e)=>e.stopPropagation()}
      style={{
        position:'fixed', bottom:24, left:12, right:12,
        zIndex:600,
        background:'rgba(4,12,6,.97)',
        border:`1px solid ${c}`,
        borderRadius:10,
        padding:'16px',
        boxShadow:`0 0 24px ${c}44, 0 8px 32px rgba(0,0,0,0.8)`,
        animation:'popup-rise .25s ease',
      }}>
      <style>{`@keyframes popup-rise{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* Dismiss */}
      <button
        onTouchEnd={(e)=>{ e.stopPropagation(); e.preventDefault(); onDismiss() }}
        onClick={(e)=>{ e.stopPropagation(); onDismiss() }}
        style={{
        position:'absolute',top:10,right:12,
        background:'transparent',border:'none',color:'#2d5a32',
        fontSize:20,cursor:'pointer',lineHeight:1,padding:4,
        WebkitTapHighlightColor:'transparent',
      }}>✕</button>

      {/* Header */}
      <div style={{marginBottom:10}}>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:c,marginBottom:4}}>
          {DIFF_LABEL[selected.difficulty]}
        </div>
        <div style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:22,color:'#fff',letterSpacing:1,lineHeight:1.1}}>
          {selected.operationName}
        </div>
        <div style={{fontFamily:'Barlow,sans-serif',fontSize:12,color:'#7aab7e',marginTop:3}}>
          {selected.subtitle}
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[
          {label:'DAYS', value:`D-${selected.duration}`},
          {label:'SIGMA', value:`σ${selected.startingSigma}`},
          {label:'RCT', value:`${selected.startingRCT}h`},
        ].map(m=>(
          <div key={m.label} style={{
            flex:1,background:'rgba(0,0,0,.4)',border:'1px solid #1a3a20',
            borderRadius:4,padding:'6px 8px',textAlign:'center',
          }}>
            <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:1}}>{m.label}</div>
            <div style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:16,color:c}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{display:'flex',gap:8}}>
        <button
          onTouchEnd={(e)=>{ e.stopPropagation(); e.preventDefault(); onBrief() }}
          onClick={(e)=>{ e.stopPropagation(); onBrief() }}
          style={{
          flex:1,padding:'12px 0',
          background:'transparent',border:`1px solid ${c}60`,color:'#7aab7e',
          fontFamily:'Barlow Condensed,sans-serif',fontWeight:600,fontSize:14,letterSpacing:2,
          borderRadius:5,cursor:'pointer', WebkitTapHighlightColor:'transparent',
        }}>▶ BRIEFING</button>
        <button
          onTouchEnd={(e)=>{ e.stopPropagation(); e.preventDefault(); onProceed() }}
          onClick={(e)=>{ e.stopPropagation(); onProceed() }}
          style={{
          flex:2,padding:'12px 0',
          background:`${c}22`,border:`1px solid ${c}`,color:c,
          fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:16,letterSpacing:2,
          borderRadius:5,cursor:'pointer', WebkitTapHighlightColor:'transparent',
        }}>DEPLOY →</button>
      </div>
    </div>
  )
}

// Nav arrows pointing to off-screen missions
function NavArrows({ scenarios, mapRef, onFly }: any) {
  const [arrows, setArrows] = React.useState<any[]>([])
  const DIFF_COLORS: Record<string,string> = { STANDARD:'#2ecc71', ELEVATED:'#f39c12', SEVERE:'#e74c3c' }

  React.useEffect(() => {
    const update = () => {
      if (!mapRef.current) return
      const rect = mapRef.current.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      const result: any[] = []

      scenarios.forEach((s: any) => {
        // Get pixel position of marker via lat/lng
        const el = mapRef.current?.querySelector(`[data-scenario="${s.id}"]`) as HTMLElement
        if (!el) return
        const r = el.getBoundingClientRect()
        const mx = r.left + r.width/2 - rect.left
        const my = r.top + r.height/2 - rect.top
        const onscreen = mx > 20 && mx < rect.width-20 && my > 20 && my < rect.height-20
        if (onscreen) return

        // Calculate angle from center to marker
        const dx = mx - cx
        const dy = my - cy
        const angle = Math.atan2(dy, dx) * 180 / Math.PI

        // Clamp to screen edge
        const margin = 40
        const dist = Math.sqrt(dx*dx+dy*dy)
        const ex = cx + (dx/dist) * (cx - margin)
        const ey = cy + (dy/dist) * (cy - margin)

        result.push({ s, angle, x: Math.max(margin, Math.min(rect.width-margin, ex)), y: Math.max(margin, Math.min(rect.height-margin, ey)) })
      })
      setArrows(result)
    }
    const iv = setInterval(update, 500)
    update()
    return () => clearInterval(iv)
  }, [scenarios])

  return (
    <>
      <style>{`
        @keyframes arrow-pulse{0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)}50%{opacity:0.6;transform:translate(-50%,-50%) scale(0.85)}}
      `}</style>
      {arrows.map(({s,angle,x,y})=>{
        const c = DIFF_COLORS[s.difficulty]||'#2ecc71'
        const abbr = s.operationName.replace('OPERATION ','').slice(0,8)
        return (
          <div key={s.id} onClick={()=>onFly(s)} style={{
            position:'absolute', left:x, top:y,
            transform:'translate(-50%,-50%)',
            zIndex:300, cursor:'pointer', pointerEvents:'all',
            animation:'arrow-pulse 1.6s ease-in-out infinite',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
          }}>
            <div style={{
              width:36,height:36,borderRadius:'50%',
              background:`${c}22`,border:`2px solid ${c}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:16,
              transform:`rotate(${angle}deg)`,
            }}>→</div>
            <div style={{
              fontFamily:'Share Tech Mono,monospace',fontSize:8,color:c,
              letterSpacing:1,whiteSpace:'nowrap',
              background:'rgba(4,12,6,.85)',padding:'2px 4px',borderRadius:2,
            }}>{abbr}</div>
          </div>
        )
      })}
    </>
  )
}

export default function MissionSelect({ onSelect, onBack }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapInst = useRef<L.Map | null>(null)
  const [sel, setSel]     = useState<MissionScenario | null>(null)
  const [thtr, setThtr]   = useState<TheaterRegion>('EUROPE')
  const musicRef = useRef<HTMLAudioElement | null>(null)

  // Mission select music — fade in on mount, fade out on exit
  useEffect(() => {
    const audio = new Audio('/audio/mission-select.mp3')
    audio.volume = 0
    audio.loop = true
    musicRef.current = audio
    audio.play().catch(() => {})
    let vol = 0
    const fadeIn = setInterval(() => {
      vol = Math.min(0.22, vol + 0.01)
      audio.volume = vol
      if (vol >= 0.22) clearInterval(fadeIn)
    }, 60)
    return () => {
      clearInterval(fadeIn)
      // Fade out on unmount
      let v = audio.volume
      const fadeOut = setInterval(() => {
        v = Math.max(0, v - 0.05)
        audio.volume = v
        if (v <= 0) { clearInterval(fadeOut); audio.pause() }
      }, 40)
    }
  }, [])

  const handleSelect = (s: MissionScenario) => {
    // Fade out music when proceeding to briefing
    const audio = musicRef.current
    if (audio) {
      let v = audio.volume
      const fadeOut = setInterval(() => {
        v = Math.max(0, v - 0.06)
        audio.volume = v
        if (v <= 0) { clearInterval(fadeOut); audio.pause() }
      }, 40)
    }
    onSelect(s)
  }

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    const worldBounds: L.LatLngBoundsExpression = [[-82, -180], [82, 180]]
    const map = L.map(mapRef.current, {
      center:[45,30], zoom:3,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 2,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© OpenStreetMap', className:'map-dark',
    }).addTo(map)
    mapInst.current = map

    ALL_SCENARIOS.forEach(s => {
      const c = DCOL[s.difficulty]
      const isMob = window.innerWidth < 768
      // 3D diamond SVG icon
      const cl = c.replace('#','')
      const diamondSvg = isMob ? `
        <div style="width:52px;height:60px;position:relative;cursor:pointer;animation:diamond-float 2.4s ease-in-out infinite;">
          <style>
            @keyframes diamond-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
            @keyframes diamond-pulse{0%{transform:translate(-50%,-50%) scale(0.6);opacity:0.8}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
          </style>
          <!-- pulse ring -->
          <div style="position:absolute;bottom:4px;left:50%;width:28px;height:8px;border-radius:50%;background:${c};transform:translate(-50%,-50%);animation:diamond-pulse 1.8s ease-out infinite;opacity:0.6;filter:blur(2px);"></div>
          <!-- 3D diamond SVG -->
          <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px ${c}99)">
            <defs>
              <linearGradient id="dg-top-${cl}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${c}" stop-opacity="1"/>
                <stop offset="100%" stop-color="${c}" stop-opacity="0.6"/>
              </linearGradient>
              <linearGradient id="dg-left-${cl}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${c}" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="${c}" stop-opacity="0.5"/>
              </linearGradient>
              <linearGradient id="dg-right-${cl}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${c}" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="${c}" stop-opacity="0.2"/>
              </linearGradient>
              <linearGradient id="dg-bot-${cl}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${c}" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="${c}" stop-opacity="0.1"/>
              </linearGradient>
            </defs>
            <!-- top-left face (bright) -->
            <polygon points="26,4 8,20 26,28" fill="url(#dg-top-${cl})"/>
            <!-- top-right face (mid) -->
            <polygon points="26,4 44,20 26,28" fill="url(#dg-left-${cl})"/>
            <!-- bottom-left face (dark) -->
            <polygon points="8,20 26,28 26,48" fill="url(#dg-right-${cl})"/>
            <!-- bottom-right face (darkest) -->
            <polygon points="44,20 26,28 26,48" fill="url(#dg-bot-${cl})"/>
            <!-- edge highlights -->
            <polygon points="26,4 8,20 26,28 44,20" fill="none" stroke="${c}" stroke-width="0.8" stroke-opacity="0.6"/>
            <line x1="26" y1="4" x2="26" y2="48" stroke="${c}" stroke-width="0.5" stroke-opacity="0.3"/>
            <line x1="8" y1="20" x2="44" y2="20" stroke="${c}" stroke-width="0.5" stroke-opacity="0.3"/>
            <!-- top sparkle -->
            <circle cx="26" cy="4" r="2" fill="white" opacity="0.9"/>
          </svg>
        </div>` 
        : (() => {
          const sz = 40
          return `<div style="width:${sz}px;height:${sz+8}px;position:relative;cursor:pointer;animation:diamond-float 2.4s ease-in-out infinite;"><style>@keyframes diamond-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes diamond-pulse{0%{transform:translate(-50%,-50%) scale(0.6);opacity:0.8}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}</style><div style="position:absolute;bottom:2px;left:50%;width:20px;height:6px;border-radius:50%;background:${c};transform:translate(-50%,-50%);animation:diamond-pulse 1.8s ease-out infinite;opacity:0.5;filter:blur(2px);"></div><svg width="${sz}" height="${sz}" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px ${c}99)"><defs><linearGradient id="dg-top-${cl}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c}" stop-opacity="1"/><stop offset="100%" stop-color="${c}" stop-opacity="0.6"/></linearGradient><linearGradient id="dg-left-${cl}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c}" stop-opacity="0.9"/><stop offset="100%" stop-color="${c}" stop-opacity="0.5"/></linearGradient><linearGradient id="dg-right-${cl}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c}" stop-opacity="0.2"/></linearGradient><linearGradient id="dg-bot-${cl}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${c}" stop-opacity="0.3"/><stop offset="100%" stop-color="${c}" stop-opacity="0.1"/></linearGradient></defs><polygon points="26,4 8,20 26,28" fill="url(#dg-top-${cl})"/><polygon points="26,4 44,20 26,28" fill="url(#dg-left-${cl})"/><polygon points="8,20 26,28 26,48" fill="url(#dg-right-${cl})"/><polygon points="44,20 26,28 26,48" fill="url(#dg-bot-${cl})"/><polygon points="26,4 8,20 26,28 44,20" fill="none" stroke="${c}" stroke-width="0.8" stroke-opacity="0.6"/><circle cx="26" cy="4" r="2" fill="white" opacity="0.9"/></svg></div>`
        })()
      const icon = L.divIcon({
        className:'',
        html: diamondSvg,
        iconSize: isMob ? [52,60] : [40,48],
        iconAnchor: isMob ? [26,48] : [20,44],
      })
      L.marker([s.mapCenter[0], s.mapCenter[1]], { icon })
        .addTo(map)
        .bindTooltip(s.operationName, { direction:'top', offset:[0, isMob ? -50 : -44], className:'map-tt' })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); setSel(s); setThtr(s.theater) })
    })
    return () => { map.remove(); mapInst.current = null }
  }, [])

  const flyTo = (t: TheaterRegion) => {
    const c = THEATERS[t]
    mapInst.current?.flyTo([c.lat, c.lng], c.zoom, { duration:1.2 })
    setThtr(t); setSel(null)
  }
  const flyToS = (s: MissionScenario) => {
    mapInst.current?.flyTo(s.mapCenter, s.mapZoom, { duration:1.0 })
    setSel(s); setThtr(s.theater)
  }

  const isMobile = window.innerWidth < 768

  const [showBrief, setShowBrief] = React.useState(false)

  if (showBrief && sel) {
    return null // App will render MissionBrief — handled by onSelect
  }

  if (isMobile) {
    return (
      <div style={{ position:'fixed', inset:0, background:'#050e06' }}>
        <style>{MAP_CSS}</style>
        {/* Map fills full screen */}
        <div ref={mapRef} style={{ position:'absolute', inset:0 }} />

        {/* Dismiss overlay — sits above map, below popup; only when popup is open */}
        {sel && (
          <div
            onClick={() => setSel(null)}
            style={{ position:'absolute', inset:0, zIndex:490, background:'transparent' }}
          />
        )}

        {/* Theater filter — top left, compact */}
        <div style={{ position:'absolute', top:12, left:12, zIndex:400, display:'flex', flexDirection:'column', gap:5 }}>
          {(Object.keys(THEATERS) as TheaterRegion[]).map(t => (
            <button key={t} onClick={(e) => { e.stopPropagation(); flyTo(t) }} style={{
              background: thtr===t ? 'rgba(46,204,113,0.25)' : 'rgba(4,12,6,0.92)',
              border:'1px solid ' + (thtr===t ? '#2ecc71' : '#2d5a32'),
              color: thtr===t ? '#2ecc71' : '#7aab7e',
              padding:'5px 10px', borderRadius:3, cursor:'pointer', fontSize:10,
              letterSpacing:1, fontWeight:600, fontFamily:'Barlow Condensed,sans-serif',
            }}>{THEATERS[t].label.toUpperCase()}</button>
          ))}
        </div>

        {/* Hint text when nothing selected */}
        {!sel && (
          <div style={{
            position:'absolute', top:12, right:12, zIndex:400,
            fontFamily:'Share Tech Mono,monospace', fontSize:9, letterSpacing:1,
            color:'#2d5a32', background:'rgba(4,12,6,.85)',
            padding:'6px 10px', borderRadius:4, border:'1px solid #1a3a20',
            textAlign:'right',
          }}>
            TAP A DIAMOND<br/>TO SELECT MISSION
          </div>
        )}

        {/* Nav arrows for off-screen missions */}
        <NavArrows scenarios={ALL_SCENARIOS} mapRef={mapRef} onFly={flyToS} />

        {/* Mission popup card */}
        <MissionPopup
          selected={sel}
          onDismiss={() => setSel(null)}
          onBrief={() => { if(sel) handleSelect(sel) }}
          onProceed={() => { if(sel) handleSelect(sel) }}
        />
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#050e06', display:'grid', gridTemplateColumns:'1fr 340px', fontFamily:'Barlow Condensed,sans-serif' }}>
      <style>{MAP_CSS}</style>

      <div style={{ position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

        <div style={{ position:'absolute', top:12, left:12, zIndex:1000, display:'flex', flexDirection:'column', gap:6 }}>
          {(Object.keys(THEATERS) as TheaterRegion[]).map(t => (
            <button key={t} onClick={() => flyTo(t)} style={{
              background: thtr===t ? 'rgba(46,204,113,0.25)' : 'rgba(13,31,15,0.92)',
              border:'1px solid ' + (thtr===t ? '#2ecc71' : '#2d5a32'),
              color: thtr===t ? '#2ecc71' : '#7aab7e',
              padding:'6px 14px', borderRadius:3, cursor:'pointer', fontSize:12,
              letterSpacing:2, fontWeight:600, fontFamily:'Barlow Condensed,sans-serif',
            }}>{THEATERS[t].label.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ position:'absolute', bottom:12, left:12, zIndex:1000, background:'rgba(13,31,15,0.92)', border:'1px solid #2d5a32', borderRadius:4, padding:'8px 12px', display:'flex', flexDirection:'column', gap:5 }}>
          {([['STANDARD','#2ecc71'],['ELEVATED','#f39c12'],['SEVERE','#e74c3c']] as [string,string][]).map(([lbl,clr]) => (
            <div key={lbl} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:clr }}/>
              <span style={{ fontSize:10, color:'#7aab7e', fontFamily:'Share Tech Mono,monospace' }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'#0d1f0f', borderLeft:'1px solid #2d5a32', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid #2d5a32' }}>
          <div style={{ fontSize:10, letterSpacing:3, color:'#2d5a32', marginBottom:4, fontFamily:'Share Tech Mono,monospace' }}>SELECT OPERATION</div>
          <div style={{ fontSize:22, fontWeight:700, color:'#2ecc71', letterSpacing:2 }}>CAMPAIGN SELECT</div>
          <div style={{ fontSize:11, color:'#7aab7e', marginTop:4 }}>6 operations · 3 theaters · click map or list</div>
        </div>

        {(Object.keys(SCENARIOS_BY_THEATER) as TheaterRegion[]).map(t => (
          <div key={t}>
            <div style={{ padding:'8px 16px', background:'#0a1a0c', borderBottom:'1px solid #2d5a32', fontSize:10, letterSpacing:3, color:'#7aab7e' }}>
              {t.replace('_',' ')} THEATER
            </div>
            {SCENARIOS_BY_THEATER[t].map(s => (
              <div key={s.id} onClick={() => flyToS(s)} style={{
                padding:'12px 16px', borderBottom:'1px solid #1a3020', cursor:'pointer',
                background: sel?.id===s.id ? 'rgba(46,204,113,0.08)' : 'transparent',
                borderLeft:'3px solid ' + (sel?.id===s.id ? '#2ecc71' : 'transparent'),
                transition:'all 0.15s',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#c8e6c9', letterSpacing:1 }}>{s.operationName}</div>
                  <span style={{ fontSize:9, padding:'2px 6px', borderRadius:2, flexShrink:0, marginLeft:8, background:DCOL[s.difficulty]+'20', color:DCOL[s.difficulty], border:'1px solid ' + DCOL[s.difficulty]+'40' }}>{s.difficulty}</span>
                </div>
                <div style={{ fontSize:10, color:'#7aab7e', marginBottom:6 }}>{s.subtitle}</div>
                <div style={{ display:'flex', gap:12, fontSize:10, fontFamily:'Share Tech Mono,monospace', color:'#2d5a32' }}>
                  <span>D{s.duration}</span><span>s{s.startingSigma}</span><span>RCT {s.startingRCT}h</span>
                </div>
              </div>
            ))}
          </div>
        ))}

        {sel && (
          <div style={{ margin:16, padding:16, background:'#132415', border:'1px solid #2ecc71', borderRadius:4 }}>
            <div style={{ fontSize:10, letterSpacing:2, color:'#7aab7e', marginBottom:6 }}>SELECTED</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#2ecc71', marginBottom:8 }}>{sel.operationName}</div>
            <div style={{ fontSize:11, color:'#c8e6c9', lineHeight:1.6, marginBottom:14 }}>{sel.thumbnailDesc}</div>
            <button onClick={() => handleSelect(sel)} style={{
              width:'100%', padding:'11px 0',
              background:'rgba(46,204,113,0.2)', border:'2px solid #2ecc71',
              color:'#2ecc71', fontFamily:'Barlow Condensed,sans-serif',
              fontWeight:700, fontSize:15, letterSpacing:3, borderRadius:3, cursor:'pointer',
            }}>MISSION BRIEF →</button>
          </div>
        )}

        <div style={{ padding:'0 16px 16px', marginTop:'auto' }}>
          <button onClick={() => {
              const audio = musicRef.current
              if (audio) {
                let v = audio.volume
                const fo = setInterval(() => { v = Math.max(0,v-0.06); audio.volume=v; if(v<=0){clearInterval(fo);audio.pause()} }, 40)
              }
              onBack()
            }} style={{ width:'100%', padding:8, background:'transparent', border:'1px solid #2d5a32', color:'#7aab7e', fontFamily:'Barlow Condensed,sans-serif', fontSize:12, letterSpacing:2, borderRadius:3, cursor:'pointer' }}>← BACK</button>
        </div>
      </div>
    </div>
  )
}
