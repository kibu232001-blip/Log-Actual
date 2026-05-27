import React, { useState } from 'react'
import { useGameStore } from '../../store/gameStore'

type Panel = 'UNITS' | 'SUPPLY' | 'FEED' | null

export default function MobileHUD() {
  const [open, setOpen] = useState<Panel>(null)
  const units   = useGameStore(s => s.units)
  const metrics = useGameStore(s => s.metrics)
  const feedEvents = useGameStore(s => (s as any).appliedBattlefieldEvents || [])

  const toggle = (p: Panel) => setOpen(o => o === p ? null : p)

  const unitList = Object.values(units) as any[]
  const flashCount = feedEvents.filter((e:any) => e.priority === 'FLASH' && !e.acknowledged).length

  const getColor = (r: number) => r >= 70 ? '#2ecc71' : r >= 40 ? '#f39c12' : '#e74c3c'

  const BTN = {
    display:'flex' as const, flexDirection:'column' as const, alignItems:'center' as const,
    gap:3, padding:'8px 10px', borderRadius:6, cursor:'pointer' as const,
    fontFamily:'Share Tech Mono,monospace', fontSize:9, letterSpacing:1,
    border:'1px solid #1a3a20', background:'rgba(5,15,8,.92)',
    minWidth:52,
  }

  return (
    <>
      {/* ── FLOATING BUTTON ROW ── */}
      <div style={{
        position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
        display:'flex', gap:8, zIndex:200,
      }}>
        {/* Units */}
        <button onClick={() => toggle('UNITS')} style={{
          ...BTN,
          background: open==='UNITS' ? 'rgba(0,255,136,.15)' : 'rgba(5,15,8,.92)',
          borderColor: open==='UNITS' ? '#00ff88' : '#1a3a20',
          color: open==='UNITS' ? '#00ff88' : '#4a7a54',
        }}>
          <span style={{fontSize:18}}>⬡</span>
          <span>UNITS</span>
        </button>

        {/* Supply */}
        <button onClick={() => toggle('SUPPLY')} style={{
          ...BTN,
          background: open==='SUPPLY' ? 'rgba(0,255,136,.15)' : 'rgba(5,15,8,.92)',
          borderColor: open==='SUPPLY' ? '#00ff88' : '#1a3a20',
          color: open==='SUPPLY' ? '#00ff88' : '#4a7a54',
        }}>
          <span style={{fontSize:18}}>📦</span>
          <span>SUPPLY</span>
        </button>

        {/* Feed */}
        <button onClick={() => toggle('FEED')} style={{
          ...BTN,
          background: open==='FEED' ? 'rgba(255,60,60,.15)' : 'rgba(5,15,8,.92)',
          borderColor: open==='FEED' ? (flashCount > 0 ? '#ff4444' : '#00ff88') : '#1a3a20',
          color: open==='FEED' ? '#ff9944' : '#4a7a54',
          position:'relative',
        }}>
          {flashCount > 0 && (
            <div style={{
              position:'absolute', top:-6, right:-6,
              background:'#ff4444', color:'white', borderRadius:'50%',
              width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:10, fontWeight:700,
            }}>{flashCount}</div>
          )}
          <span style={{fontSize:18}}>📡</span>
          <span>FEED</span>
        </button>
      </div>

      {/* ── PANELS ── */}
      {open && (
        <div style={{
          position:'absolute', bottom:80, left:0, right:0, zIndex:190,
          background:'rgba(5,12,7,.96)', borderTop:'2px solid #1a3a20',
          maxHeight:'55vh', overflowY:'auto',
          padding:'12px 14px 16px',
          animation:'panel-up .2s ease',
        }}>
          <style>{`@keyframes panel-up { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>

          {/* Close */}
          <button onClick={() => setOpen(null)} style={{
            position:'absolute', top:10, right:12,
            background:'transparent', border:'none', color:'#1a5a3a',
            fontSize:18, cursor:'pointer', lineHeight:1,
          }}>✕</button>

          {/* UNITS PANEL */}
          {open === 'UNITS' && (
            <div>
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:'#1a5a3a',marginBottom:10}}>UNIT READINESS</div>
              {unitList.map((u:any) => (
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,color:'#c8e6c9',width:90,flexShrink:0}}>{u.name}</div>
                  <div style={{flex:1,height:8,background:'#0d1f10',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${u.readiness}%`,background:getColor(u.readiness),borderRadius:4,transition:'width .3s'}}/>
                  </div>
                  <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:12,color:getColor(u.readiness),width:38,textAlign:'right'}}>{Math.round(u.readiness)}%</div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:getColor(u.readiness),flexShrink:0}}/>
                </div>
              ))}
              <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #1a3a20',display:'flex',gap:16,fontFamily:'Share Tech Mono,monospace',fontSize:10,color:'#1a5a3a'}}>
                <span>σ {metrics.sigmaLevel.toFixed(1)}</span>
                <span>RCT {metrics.avgRequestCycleTime}h</span>
                <span>SW {metrics.stonewallRate.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* SUPPLY PANEL */}
          {open === 'SUPPLY' && (
            <div>
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:'#1a5a3a',marginBottom:10}}>THEATER SUPPLY STATUS</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {(['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_IX'] as const).map((cls,i) => {
                  const labels = ['CL I','CL II','CL III','CL IV','CL V','CL IX']
                  const avg = unitList.length ? Math.round(unitList.reduce((a:number,u:any)=>a+(u.supplyLevels?.[cls]??0),0)/unitList.length) : 0
                  const col = avg >= 60 ? '#2ecc71' : avg >= 30 ? '#f39c12' : '#e74c3c'
                  return (
                    <div key={cls} style={{background:'#0d1f10',border:'1px solid #1a3a20',borderRadius:4,padding:'8px 10px'}}>
                      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#1a5a3a',marginBottom:4,letterSpacing:1}}>{labels[i]}</div>
                      <div style={{height:4,background:'#050e06',borderRadius:2,marginBottom:4}}>
                        <div style={{height:'100%',width:`${avg}%`,background:col,borderRadius:2}}/>
                      </div>
                      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:16,fontWeight:700,color:col}}>{avg}%</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* FEED PANEL */}
          {open === 'FEED' && (
            <div>
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:'#1a5a3a',marginBottom:10}}>BATTLEFIELD FEED</div>
              {feedEvents.slice(0,8).map((ev:any) => (
                <div key={ev.id} style={{
                  marginBottom:8,padding:'8px 10px',borderRadius:3,
                  background: ev.priority==='FLASH' ? 'rgba(255,50,50,.1)' : 'rgba(0,20,8,.6)',
                  border:`1px solid ${ev.priority==='FLASH'?'#ff4444':ev.priority==='PRIORITY'?'#ff8800':'#1a3a20'}`,
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <span style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,
                      color:ev.priority==='FLASH'?'#ff6644':ev.priority==='PRIORITY'?'#ffaa44':'#00ff88'}}>
                      {ev.title}
                    </span>
                    <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,
                      color:ev.priority==='FLASH'?'#ff4444':'#1a5a3a',border:'1px solid currentColor',padding:'1px 5px',borderRadius:2}}>
                      {ev.priority}
                    </span>
                  </div>
                  <div style={{fontFamily:'Barlow,sans-serif',fontSize:11,color:'#4a7a54',lineHeight:1.4}}>
                    {(ev.report||'').slice(0,100)}{ev.report?.length>100?'...':''}
                  </div>
                </div>
              ))}
              {feedEvents.length === 0 && (
                <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#1a3a20',textAlign:'center',padding:'20px 0'}}>
                  NO ACTIVE EVENTS
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
