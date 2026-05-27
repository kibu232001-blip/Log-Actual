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

export default function MissionSelect({ onSelect, onBack }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapInst = useRef<L.Map | null>(null)
  const [sel, setSel]     = useState<MissionScenario | null>(null)
  const [thtr, setThtr]   = useState<TheaterRegion>('EUROPE')

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    const map = L.map(mapRef.current, { center:[45,30], zoom:3 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© OpenStreetMap', className:'map-dark',
    }).addTo(map)
    mapInst.current = map

    ALL_SCENARIOS.forEach(s => {
      const c = DCOL[s.difficulty]
      const icon = L.divIcon({
        className:'',
        html:'<div style="width:16px;height:16px;border-radius:50%;background:' + c + ';border:2px solid rgba(0,0,0,0.6);box-shadow:0 0 10px ' + c + '80;cursor:pointer;"></div>',
        iconSize:[16,16], iconAnchor:[8,8],
      })
      L.marker([s.mapCenter[0], s.mapCenter[1]], { icon })
        .addTo(map)
        .bindTooltip(s.operationName, { direction:'top', offset:[0,-10], className:'map-tt' })
        .on('click', () => { setSel(s); setThtr(s.theater) })
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
            <button onClick={() => onSelect(sel)} style={{
              width:'100%', padding:'11px 0',
              background:'rgba(46,204,113,0.2)', border:'2px solid #2ecc71',
              color:'#2ecc71', fontFamily:'Barlow Condensed,sans-serif',
              fontWeight:700, fontSize:15, letterSpacing:3, borderRadius:3, cursor:'pointer',
            }}>MISSION BRIEF →</button>
          </div>
        )}

        <div style={{ padding:'0 16px 16px', marginTop:'auto' }}>
          <button onClick={onBack} style={{ width:'100%', padding:8, background:'transparent', border:'1px solid #2d5a32', color:'#7aab7e', fontFamily:'Barlow Condensed,sans-serif', fontSize:12, letterSpacing:2, borderRadius:3, cursor:'pointer' }}>← BACK</button>
        </div>
      </div>
    </div>
  )
}
