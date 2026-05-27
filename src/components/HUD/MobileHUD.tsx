import React, { useState } from 'react'
import AudioEngine from '../../engine/AudioEngine'
import { useGameStore } from '../../store/gameStore'

type Tab = 'UNITS' | 'SUPPLY' | 'FEED'

export default function MobileHUD() {
  const [tab, setTab] = useState<Tab>('UNITS')
  const units      = useGameStore(s => s.units)
  const metrics    = useGameStore(s => s.metrics)
  const feedEvents = useGameStore(s => (s as any).appliedBattlefieldEvents || [])
  const pendingDecision = useGameStore(s => s.pendingDecision)
  const advanceTurn = useGameStore(s => s.advanceTurn)

  const unitList   = Object.values(units) as any[]
  const flashCount = feedEvents.filter((e:any) => e.priority === 'FLASH' && !e.acknowledged).length
  const getColor   = (r:number) => r >= 70 ? '#2ecc71' : r >= 40 ? '#f39c12' : '#e74c3c'

  const TAB_BTN = (id: Tab, icon: string, label: string, badge?: number) => {
    const active = tab === id
    const alertColor = id === 'FEED' && flashCount > 0 ? '#ff4444' : '#2ecc71'
    return (
      <button
        key={id}
        onClick={() => setTab(id)}
        style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center',
          gap:2, padding:'8px 0',
          background: active ? `${alertColor}14` : 'transparent',
          borderBottom: active ? `2px solid ${alertColor}` : '2px solid transparent',
          border:'none', cursor:'pointer',
          fontFamily:'Share Tech Mono,monospace', fontSize:9, letterSpacing:1,
          color: active ? alertColor : '#2d5a32',
          position:'relative',
          WebkitTapHighlightColor:'transparent',
          transition:'all 0.15s',
        }}>
        {badge != null && badge > 0 && (
          <div style={{
            position:'absolute', top:4, right:'calc(50% - 18px)',
            background:'#ff4444', color:'#fff', borderRadius:'50%',
            width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:9, fontWeight:700, lineHeight:1,
          }}>{badge}</div>
        )}
        <span style={{ fontSize:16 }}>{icon}</span>
        <span>{label}</span>
      </button>
    )
  }

  // Build urgent action list — units needing immediate resupply
  const urgentUnits = unitList.filter((u:any) => {
    if (u.status === 'STONEWALL' || u.status === 'DARK') return true
    const minCrit = Math.min(u.supplyLevels?.CL_I||100, u.supplyLevels?.CL_III||100, u.supplyLevels?.CL_V||100)
    const minRate = Math.max(1, Math.min(u.dailyConsumption?.CL_I||5, u.dailyConsumption?.CL_III||8, u.dailyConsumption?.CL_V||6))
    return minCrit < 25 || (minCrit / minRate) < 3  // <25% OR <3 days remaining
  })

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      background:'#081408', borderTop:'1px solid #1a3a20',
      overflow:'hidden', height:'100%',
    }}>

      {/* ── URGENT ACTIONS STRIP ── */}
      {urgentUnits.length > 0 && (
        <div style={{
          flexShrink:0, background:'rgba(255,50,30,0.08)',
          borderBottom:'1px solid rgba(255,68,0,0.4)',
          padding:'6px 10px',
          display:'flex', gap:8, overflowX:'auto',
        }}>
          <div style={{
            flexShrink:0, display:'flex', alignItems:'center', gap:4,
            fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#ff4400', letterSpacing:2,
            animation:'sw-blink 1.2s infinite',
          }}>
            <span>⚠</span><span>ACTION REQ</span>
          </div>
          {urgentUnits.map((u:any) => {
            const minCrit = Math.min(u.supplyLevels?.CL_I||100, u.supplyLevels?.CL_III||100, u.supplyLevels?.CL_V||100)
            const isStonewall = u.status === 'STONEWALL'
            const col = isStonewall ? '#ff2200' : '#ff8800'
            return (
              <div key={u.id} onClick={() => { setTab('UNITS') }} style={{
                flexShrink:0, background:`${col}18`,
                border:`1px solid ${col}60`, borderRadius:4,
                padding:'4px 8px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:6,
                WebkitTapHighlightColor:'transparent',
              }}>
                <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:12, color:col }}>
                  {u.shortName}
                </div>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:`${col}cc` }}>
                  {isStonewall ? 'STONEWALL' : `${Math.round(minCrit)}%`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── DECISION ALERT ── */}
      <style>{`@keyframes sw-blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      {pendingDecision && (
        <div style={{
          padding:'6px 12px', background:'rgba(231,76,60,0.12)',
          borderBottom:'1px solid rgba(231,76,60,0.3)',
          display:'flex', alignItems:'center', gap:8, flexShrink:0,
        }}>
          <span style={{ color:'#e74c3c', fontSize:14 }}>⚡</span>
          <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontSize:13,
            color:'#e74c3c', letterSpacing:1, flex:1 }}>DOCTRINE DECISION PENDING</span>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div style={{
        display:'flex', borderBottom:'1px solid #1a3a20', flexShrink:0,
        background:'#050e06',
      }}>
        {TAB_BTN('UNITS', '⬡', 'UNITS')}
        {TAB_BTN('SUPPLY', '◈', 'SUPPLY')}
        {TAB_BTN('FEED', '◉', 'FEED', flashCount)}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>

        {tab === 'UNITS' && (
          <div>
            {unitList.map((u:any) => {
              const c = getColor(u.readiness)
              const isStonewall = u.status === 'STONEWALL'
              const isDark = u.status === 'DARK'
              return (
                <div key={u.id} style={{
                  display:'flex', alignItems:'center', gap:8, marginBottom:10,
                  padding:'6px 8px', borderRadius:4,
                  background: isStonewall ? 'rgba(255,68,0,0.08)' : isDark ? 'rgba(40,40,60,0.5)' : 'transparent',
                  border: isStonewall ? '1px solid rgba(255,68,0,0.3)' : isDark ? '1px solid rgba(80,80,120,0.3)' : '1px solid transparent',
                }}>
                  <div style={{
                    fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
                    fontSize:14, color: isDark ? '#555' : '#c8e6c9', width:80, flexShrink:0,
                  }}>{u.shortName}</div>
                  <div style={{ flex:1, height:7, background:'#0d1f10', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${u.readiness}%`, background:c,
                      borderRadius:3, transition:'width .3s' }}/>
                  </div>
                  <div style={{
                    fontFamily:'Share Tech Mono,monospace', fontSize:13, color:c,
                    width:36, textAlign:'right', flexShrink:0,
                  }}>{Math.round(u.readiness)}%</div>
                  <div style={{
                    width:7, height:7, borderRadius:'50%', background:c, flexShrink:0,
                    boxShadow: isStonewall ? `0 0 6px ${c}` : 'none',
                  }}/>
                </div>
              )
            })}

            {/* Metrics footer */}
            <div style={{
              marginTop:6, paddingTop:8, borderTop:'1px solid #1a3a20',
              display:'flex', gap:0,
            }}>
              {[
                { label:'SIGMA',  value:`${metrics.sigmaLevel.toFixed(1)}σ`,          color: metrics.sigmaLevel>=3?'#2ecc71':metrics.sigmaLevel>=2?'#f39c12':'#e74c3c' },
                { label:'RCT',    value:`${metrics.avgRequestCycleTime}h`,             color: metrics.avgRequestCycleTime<=32?'#2ecc71':metrics.avgRequestCycleTime<=48?'#f39c12':'#e74c3c' },
                { label:'S/W',    value:`${metrics.stonewallRate.toFixed(0)}%`,        color: metrics.stonewallRate<2?'#2ecc71':metrics.stonewallRate<10?'#f39c12':'#e74c3c' },
                { label:'RDNS',   value:`${Math.round(metrics.avgReadiness??0)}%`,     color: (metrics.avgReadiness??0)>70?'#2ecc71':(metrics.avgReadiness??0)>50?'#f39c12':'#e74c3c' },
              ].map(m => (
                <div key={m.label} style={{ flex:1, textAlign:'center' }}>
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#2d5a32', letterSpacing:1 }}>{m.label}</div>
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:16, fontWeight:700, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Advance button */}

          </div>
        )}

        {tab === 'SUPPLY' && (
          <div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
              letterSpacing:3, color:'#2d5a32', marginBottom:10 }}>THEATER SUPPLY — AVERAGE ACROSS ALL UNITS</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {(['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_IX'] as const).map((cls,i) => {
                const labels = ['CL I','CL II','CL III','CL IV','CL V','CL IX']
                const avg = unitList.length
                  ? Math.round(unitList.reduce((a:number,u:any)=>a+(u.supplyLevels?.[cls]??0),0)/unitList.length)
                  : 0
                const col = avg >= 60 ? '#2ecc71' : avg >= 30 ? '#f39c12' : '#e74c3c'
                return (
                  <div key={cls} style={{ background:'#0d1f10', border:`1px solid ${col}30`,
                    borderRadius:4, padding:'8px 10px' }}>
                    <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
                      color:'#2d5a32', marginBottom:5, letterSpacing:1 }}>{labels[i]}</div>
                    <div style={{ height:5, background:'#050e06', borderRadius:2, marginBottom:5 }}>
                      <div style={{ height:'100%', width:`${avg}%`, background:col, borderRadius:2,
                        transition:'width .3s' }}/>
                    </div>
                    <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:20,
                      fontWeight:700, color:col }}>{avg}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'FEED' && (
          <div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
              letterSpacing:3, color:'#2d5a32', marginBottom:10 }}>BATTLEFIELD INTEL FEED</div>
            {feedEvents.length === 0 && (
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11,
                color:'#1a3a20', textAlign:'center', padding:'24px 0' }}>
                NO ACTIVE EVENTS
              </div>
            )}
            {feedEvents.slice(0,12).map((ev:any) => {
              const isFlash    = ev.priority === 'FLASH'
              const isPriority = ev.priority === 'PRIORITY'
              const accent = isFlash ? '#ff4444' : isPriority ? '#ff8800' : '#2ecc71'
              return (
                <div key={ev.id} style={{
                  marginBottom:8, padding:'8px 10px', borderRadius:4,
                  background: isFlash ? 'rgba(255,50,50,.08)' : 'rgba(0,20,8,.5)',
                  border:`1px solid ${accent}30`,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
                      fontSize:13, color:accent }}>{ev.title}</span>
                    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8,
                      color:accent, border:`1px solid ${accent}60`, padding:'1px 5px', borderRadius:2 }}>
                      {ev.priority}
                    </span>
                  </div>
                  <div style={{ fontFamily:'Barlow,sans-serif', fontSize:11,
                    color:'#4a7a54', lineHeight:1.4 }}>
                    {(ev.report||'').slice(0,120)}{(ev.report?.length??0)>120?'…':''}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
