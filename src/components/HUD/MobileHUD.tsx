import React, { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import BattlefieldFeed from '../TheaterMap/BattlefieldFeed'

type Panel = 'feed' | 'readiness' | 'supply' | null

const CSS = `
  @keyframes panel-up   { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes panel-down { from{transform:translateY(0);opacity:1} to{transform:translateY(100%);opacity:0} }
  @keyframes badge-pop  { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
`

export default function MobileHUD() {
  const [open, setOpen] = useState<Panel>(null)
  const units           = useGameStore(s => s.units)
  const metrics         = useGameStore(s => s.metrics)
  const appliedEvents   = useGameStore(s => (s as any).appliedBattlefieldEvents || [])

  const toggle = (p: Panel) => setOpen(prev => prev === p ? null : p)

  const unread   = appliedEvents.filter((e:any) => !e.acknowledged && !e.mitigated).length
  const flash    = appliedEvents.some((e:any) => e.priority === 'FLASH' && !e.acknowledged)

  const unitList = Object.values(units) as any[]
  const critUnit = unitList.reduce((a:any,b:any) => (a.readiness||100) < (b.readiness||100) ? a : b, unitList[0])

  // Supply levels (theater avg)
  const avgSupply = (key: string) => {
    const vals = unitList.map((u:any) => u.supplyLevels?.[key] ?? 0)
    return Math.round(vals.reduce((a:number,b:number) => a+b,0) / Math.max(vals.length,1))
  }

  const statusColor = (r: number) => r >= 70 ? '#00ff88' : r >= 40 ? '#f39c12' : '#e74c3c'

  return (
    <>
      <style>{CSS}</style>

      {/* ── BOTTOM TAB BAR ────────────────────────────────────────────── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:200,
        background:'rgba(3,10,4,.96)',
        borderTop:'1px solid #1a3a20',
        display:'flex', alignItems:'stretch',
        height:56, backdropFilter:'blur(8px)',
      }}>

        {/* FEED tab */}
        <button onClick={() => toggle('feed')} style={{
          flex:1, background: open==='feed' ? 'rgba(0,255,136,.12)' : 'transparent',
          border:'none', borderRight:'1px solid #1a3a20',
          color: open==='feed' ? '#00ff88' : '#2a6a3a',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:2, cursor:'pointer', position:'relative', padding:0,
        }}>
          {unread > 0 && (
            <div style={{
              position:'absolute', top:6, right:'calc(50% - 16px)',
              background: flash ? '#ff2200' : '#ff8800',
              color:'#fff', borderRadius:10, minWidth:16, height:16,
              fontSize:9, fontFamily:'Share Tech Mono,monospace',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'0 4px',
              animation: flash ? 'badge-pop .6s infinite' : undefined,
            }}>{unread}</div>
          )}
          <span style={{ fontSize:18 }}>📡</span>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, letterSpacing:1 }}>FEED</span>
        </button>

        {/* READINESS tab */}
        <button onClick={() => toggle('readiness')} style={{
          flex:1, background: open==='readiness' ? 'rgba(0,255,136,.12)' : 'transparent',
          border:'none', borderRight:'1px solid #1a3a20',
          color: open==='readiness' ? '#00ff88' : '#2a6a3a',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:2, cursor:'pointer', padding:0,
        }}>
          <span style={{ fontSize:18 }}>🪖</span>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, letterSpacing:1 }}>UNITS</span>
        </button>

        {/* SUPPLY tab */}
        <button onClick={() => toggle('supply')} style={{
          flex:1, background: open==='supply' ? 'rgba(0,255,136,.12)' : 'transparent',
          border:'none', borderRight:'1px solid #1a3a20',
          color: open==='supply' ? '#00ff88' : '#2a6a3a',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:2, cursor:'pointer', padding:0,
        }}>
          <span style={{ fontSize:18 }}>📦</span>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, letterSpacing:1 }}>SUPPLY</span>
        </button>

        {/* SIGMA / METRICS mini display */}
        <div style={{
          flex:1.2, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:1, padding:'4px 6px',
        }}>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#1a5a3a', letterSpacing:1 }}>σ / RCT</div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:14, color:'#00ff88', fontWeight:700, lineHeight:1 }}>
            {metrics.sigmaLevel?.toFixed(1) || '—'}
          </div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#f39c12' }}>
            {metrics.avgRequestCycleTime || '—'}h
          </div>
        </div>
      </div>

      {/* ── SLIDE-UP PANELS ───────────────────────────────────────────── */}

      {/* FEED PANEL */}
      {open === 'feed' && (
        <div style={{
          position:'fixed', bottom:56, left:0, right:0, zIndex:190,
          height:'65vh', background:'rgba(3,10,4,.97)',
          borderTop:'2px solid #00ff88',
          animation:'panel-up .25s ease',
          overflow:'hidden', display:'flex', flexDirection:'column',
        }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 14px', borderBottom:'1px solid #1a3a20',
          }}>
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#00ff88', letterSpacing:2 }}>
              BATTLEFIELD FEED
            </span>
            <button onClick={() => setOpen(null)} style={{
              background:'transparent', border:'1px solid #1a3a20', color:'#1a5a3a',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, padding:'3px 10px',
              borderRadius:2, cursor:'pointer',
            }}>✕ CLOSE</button>
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <BattlefieldFeed />
          </div>
        </div>
      )}

      {/* UNIT READINESS PANEL */}
      {open === 'readiness' && (
        <div style={{
          position:'fixed', bottom:56, left:0, right:0, zIndex:190,
          background:'rgba(3,10,4,.97)', borderTop:'2px solid #00ff88',
          animation:'panel-up .25s ease',
          maxHeight:'65vh', overflowY:'auto',
        }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 14px', borderBottom:'1px solid #1a3a20', position:'sticky', top:0,
            background:'rgba(3,10,4,.97)',
          }}>
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#00ff88', letterSpacing:2 }}>
              UNIT READINESS
            </span>
            <button onClick={() => setOpen(null)} style={{
              background:'transparent', border:'1px solid #1a3a20', color:'#1a5a3a',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, padding:'3px 10px',
              borderRadius:2, cursor:'pointer',
            }}>✕</button>
          </div>
          <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {unitList.map((u:any) => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{
                  fontFamily:'Barlow Condensed,monospace', fontWeight:700,
                  fontSize:13, color:'#c8e6c9', width:90, flexShrink:0,
                }}>{u.name || u.id}</span>
                <div style={{ flex:1, height:6, background:'#0d1f10', borderRadius:3, overflow:'hidden' }}>
                  <div style={{
                    width:`${u.readiness||0}%`, height:'100%',
                    background:statusColor(u.readiness||0),
                    borderRadius:3, transition:'width .5s',
                  }}/>
                </div>
                <span style={{
                  fontFamily:'Share Tech Mono,monospace', fontSize:12,
                  color:statusColor(u.readiness||0), width:40, textAlign:'right',
                }}>{Math.round(u.readiness||0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPLY STATUS PANEL */}
      {open === 'supply' && (
        <div style={{
          position:'fixed', bottom:56, left:0, right:0, zIndex:190,
          background:'rgba(3,10,4,.97)', borderTop:'2px solid #00ff88',
          animation:'panel-up .25s ease',
          maxHeight:'65vh', overflowY:'auto',
        }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 14px', borderBottom:'1px solid #1a3a20', position:'sticky', top:0,
            background:'rgba(3,10,4,.97)',
          }}>
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#00ff88', letterSpacing:2 }}>
              THEATER SUPPLY STATUS
            </span>
            <button onClick={() => setOpen(null)} style={{
              background:'transparent', border:'1px solid #1a3a20', color:'#1a5a3a',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, padding:'3px 10px',
              borderRadius:2, cursor:'pointer',
            }}>✕</button>
          </div>
          <div style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { key:'CL_I',    label:'CL I',    desc:'Food/Water' },
              { key:'CL_II',   label:'CL II',   desc:'Equipment' },
              { key:'CL_III',  label:'CL III',  desc:'Fuel/POL' },
              { key:'CL_IV',   label:'CL IV',   desc:'Construction' },
              { key:'CL_V',    label:'CL V',    desc:'Ammunition' },
              { key:'CL_VIII', label:'CL VIII', desc:'Medical' },
              { key:'CL_IX',   label:'CL IX',   desc:'Repair Parts' },
            ].map(cls => {
              const val = avgSupply(cls.key)
              const col = val < 25 ? '#e74c3c' : val < 50 ? '#f39c12' : '#00ff88'
              return (
                <div key={cls.key} style={{
                  background:'#0d1f10', border:`1px solid ${col}30`,
                  borderRadius:4, padding:'8px 10px',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:col, letterSpacing:1 }}>{cls.label}</span>
                    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:14, color:col, fontWeight:700 }}>{val}%</span>
                  </div>
                  <div style={{ height:4, background:'#1a3a20', borderRadius:2 }}>
                    <div style={{ width:`${val}%`, height:'100%', background:col, borderRadius:2 }}/>
                  </div>
                  <div style={{ fontFamily:'Barlow,sans-serif', fontSize:9, color:'#1a5a3a', marginTop:3 }}>{cls.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
