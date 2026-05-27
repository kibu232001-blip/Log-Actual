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
  const currentDay  = useGameStore(s => s.currentDay)
  // Convoy data at top level — hooks cannot be called inside IIFE/conditionals
  const allConvoys  = useGameStore(s => (s as any).realConvoys || []) as any[]
  const inTransit   = allConvoys.filter((c:any) => c.status === 'EN_ROUTE')
  const delivered   = allConvoys.filter((c:any) => c.status === 'DELIVERED')

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

        {tab === 'UNITS' && (() => {
          const executeAction = (useGameStore.getState() as any).executeCommanderAction
          const [selId, setSelId] = React.useState<string|null>(urgentUnits[0]?.id || null)
          const selUnit = selId ? unitList.find((u:any)=>u.id===selId) : null
          const okUnits = unitList.filter((u:any)=>!urgentUnits.find((x:any)=>x.id===u.id))

          return (
            <div>
              {urgentUnits.length > 0 ? (<>
                {/* Crisis selector */}
                <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#ff4400',letterSpacing:3,marginBottom:8}}>SELECT UNIT TO RESPOND</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                  {urgentUnits.map((u:any)=>{
                    const minC=Math.min(u.supplyLevels?.CL_I||100,u.supplyLevels?.CL_III||100,u.supplyLevels?.CL_V||100)
                    const col=u.status==='STONEWALL'?'#ff2200':'#ff8800'
                    const isSel=selId===u.id
                    return(<button key={u.id} onClick={()=>{AudioEngine.resume();AudioEngine.playTick(true);setSelId(u.id)}} style={{padding:'6px 12px',borderRadius:4,cursor:'pointer',background:isSel?`${col}30`:'rgba(0,0,0,0.4)',border:`2px solid ${isSel?col:col+'50'}`,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,color:isSel?col:`${col}90`,WebkitTapHighlightColor:'transparent'}}>
                      {u.shortName}<span style={{marginLeft:6,fontSize:11}}>{Math.round(minC)}%</span>
                    </button>)
                  })}
                </div>

                {/* Action deck */}
                {selUnit && (<div style={{borderRadius:4,border:'1px solid rgba(255,100,0,0.3)',overflow:'hidden',marginBottom:8}}>
                  <div style={{padding:'6px 10px',background:'rgba(255,50,0,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:14,color:'#ff8800'}}>{selUnit.name}</span>
                    <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:getColor(selUnit.readiness)}}>RDNS {Math.round(selUnit.readiness)}%</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:8,background:'rgba(0,0,0,0.3)'}}>
                    {[
                      {type:'AIR_EMERGENCY',icon:'⚡',label:'AIR SORTIE',sub:'+40% CL III',col:'#00aaff'},
                      {type:'LATERAL_EMERGENCY',icon:'↔',label:'LATERAL XFER',sub:'Best FOB →',col:'#ffaa00'},
                      {type:'PRIORITY_PUSH',icon:'★',label:'SET PRIORITY',sub:'+8% RDNS',col:'#ff8800'},
                    ].map((a:any)=>(<button key={a.type} onClick={()=>{AudioEngine.resume();AudioEngine.playAlert('PRIORITY');if(executeAction)executeAction({unitId:selUnit.id,actionType:a.type})}} style={{padding:'8px 4px',borderRadius:3,cursor:'pointer',background:`${a.col}12`,border:`1px solid ${a.col}50`,color:a.col,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:12,lineHeight:1.3,textAlign:'center',WebkitTapHighlightColor:'transparent'}}>
                      <div style={{fontSize:16,marginBottom:2}}>{a.icon}</div>{a.label}
                      <div style={{fontSize:8,fontFamily:'Share Tech Mono,monospace',marginTop:3,opacity:0.7}}>{a.sub}</div>
                    </button>))}
                  </div>
                </div>)}

                {/* Non-critical compact list */}
                {okUnits.length>0&&(<div style={{borderTop:'1px solid #1a3a20',paddingTop:6}}>
                  <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:5}}>OTHER UNITS</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3}}>
                    {okUnits.map((u:any)=>(<div key={u.id} style={{display:'flex',alignItems:'center',gap:5,padding:'3px 6px',background:'rgba(0,0,0,0.2)',borderRadius:3}}>
                      <span style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:11,color:'#4a7a54',flex:1}}>{u.shortName}</span>
                      <div style={{width:28,height:3,background:'#0d1f10',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${u.readiness}%`,background:getColor(u.readiness)}}/></div>
                      <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:getColor(u.readiness),width:28,textAlign:'right'}}>{Math.round(u.readiness)}%</span>
                    </div>))}
                  </div>
                </div>)}
              </>) : (<>
                {/* Theater nominal — compact 2-col grid */}
                <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#00ff88',letterSpacing:2,marginBottom:8,textAlign:'center'}}>✓ THEATER NOMINAL</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                  {unitList.map((u:any)=>(<div key={u.id} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px',background:'rgba(0,0,0,0.2)',borderRadius:3,border:`1px solid ${getColor(u.readiness)}15`}}>
                    <span style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:12,fontWeight:700,color:'#4a8a5a',flex:1}}>{u.shortName}</span>
                    <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:getColor(u.readiness)}}>{Math.round(u.readiness)}%</span>
                    <div style={{width:6,height:6,borderRadius:'50%',background:getColor(u.readiness)}}/>
                  </div>))}
                </div>
              </>)}
            </div>
          )
        })()}

        {tab === 'SUPPLY' && (
          <div>
            <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:'#2d5a32',marginBottom:10}}>
              LIVE CONVOY MISSIONS — {inTransit.length} IN TRANSIT
            </div>
            {inTransit.length === 0 && (
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#1a3a20',textAlign:'center',padding:'20px 0'}}>
                NO CONVOYS IN TRANSIT — DISPATCH FROM MAP
              </div>
            )}
            {inTransit.map((c:any, idx:number) => {
              if (!c) return null
              const daysLeft = Math.max(0, c.travelDays - (currentDay - c.departedDay))
              const pct = Math.min(100, Math.round(c.departedDay ? (currentDay - c.departedDay) / c.travelDays * 100 : 0))
              const col = c.assetType==='AIR'||c.assetType==='HELO' ? '#00aaff' : c.assetType==='SEA' ? '#4488ff' : '#00ff88'
              const icon = c.assetType==='AIR'?'✈':c.assetType==='HELO'?'🚁':c.assetType==='SEA'?'⛴':'🚚'
              const CLS = ['','CL I','CL II','CL III','CL IV','CL V','CL VIII','CL IX']
              const cargoStr = (c.cargo||[]).filter((x:any)=>x.amount>0).map((x:any)=>`${CLS[x.supplyClass]||'CL?'}:${x.amount}%`).join(' ')
              return (
                <div key={c.id} style={{marginBottom:8,padding:'8px 10px',borderRadius:4,background:`${col}08`,border:`1px solid ${col}30`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <span style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:14,color:col}}>{icon} {c.assetType} → {(c.toUnitId||'').replace(/_/g,' ')}</span>
                    <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:daysLeft<=1?'#ff8800':col}}>ETA D+{daysLeft}</span>
                  </div>
                  <div style={{height:4,background:'#0d1f10',borderRadius:2,marginBottom:4}}>
                    <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:2,transition:'width .5s'}}/>
                  </div>
                  <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:`${col}80`}}>{cargoStr || 'CARGO EN ROUTE'}</div>
                </div>
              )
            })}
            {delivered.length > 0 && (
              <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #1a3a20'}}>
                <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:5}}>DELIVERED: {delivered.length}</div>
                {delivered.slice(-3).map((c:any) => (
                  <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'3px 6px',fontSize:10,fontFamily:'Share Tech Mono,monospace',color:'#2d5a32'}}>
                    <span>✓ {c.assetType} → {(c.toUnitId||'').replace(/_/g,' ')}</span>
                    <span>D{c.departedDay}+{c.travelDays}</span>
                  </div>
                ))}
              </div>
            )}
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
            {feedEvents.slice(0,12).map((ev:any, idx:number) => {
              if (!ev) return null
              const isFlash    = ev.priority === 'FLASH'
              const isPriority = ev.priority === 'PRIORITY'
              const accent = isFlash ? '#ff4444' : isPriority ? '#ff8800' : '#2ecc71'
              const title = ev.title || ev.report?.slice(0,40) || 'INTEL'
              const body  = (ev.report || ev.text || '').slice(0,120)
              return (
                <div key={ev.id || idx} style={{
                  marginBottom:8, padding:'8px 10px', borderRadius:4,
                  background: isFlash ? 'rgba(255,50,50,.08)' : 'rgba(0,20,8,.5)',
                  border:`1px solid ${accent}30`,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
                      fontSize:13, color:accent, flex:1, marginRight:6 }}>{title}</span>
                    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8,
                      color:accent, border:`1px solid ${accent}60`, padding:'1px 5px',
                      borderRadius:2, flexShrink:0 }}>
                      {ev.priority || 'ROUTINE'}
                    </span>
                  </div>
                  {body.length > 0 && (
                    <div style={{ fontFamily:'Barlow,sans-serif', fontSize:11,
                      color:'#4a7a54', lineHeight:1.4 }}>
                      {body}{(ev.report?.length??0)>120?'…':''}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}