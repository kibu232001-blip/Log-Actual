import React, { useState } from 'react'
import AudioEngine from '../../engine/AudioEngine'
import { useGameStore } from '../../store/gameStore'
import { getTheaterNetwork } from '../../data/scenarioNodes'

type Tab = 'UNITS' | 'SUPPLY' | 'FEED'


// Color helper
function getColor(r: number): string {
  return r > 70 ? '#00ff88' : r > 40 ? '#ffaa00' : '#ff4444'
}

const CLS_LABELS = ['CL I','CL II','CL III','CL IV','CL V','CL VIII','CL IX']
const CLS_KEYS   = ['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX']

function FragoPanel({ selUnit, onClose }: { selUnit:any; onClose:()=>void }) {
  const allUnits       = useGameStore(s => Object.values(s.units) as any[])
  const standingOrders = useGameStore(s => (s as any).standingOrders || {})
  const setStandingOrder   = useGameStore(s => (s as any).setStandingOrder)
  const cancelStandingOrder= useGameStore(s => (s as any).cancelStandingOrder)
  const activeScenarioId   = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const storeLocs  = useGameStore(s => s.locs) as any

  const existing = standingOrders[selUnit.id]
  const [amounts, setAmounts] = React.useState<number[]>(
    existing?.cargo ? CLS_LABELS.map((_,i) => existing.cargo.find((c:any)=>c.supplyClass===i)?.amount||0) : [0,0,0,0,0,0,0]
  )
  const [sourceId, setSourceId]   = React.useState<string>(existing?.sourceUnitId || '')
  const [assetType, setAssetType] = React.useState<string>(existing?.assetType || 'GROUND')
  const [routeId, setRouteId]     = React.useState<string>(existing?.routeId || '')

  const sourceOptions = allUnits.filter((u:any) =>
    u.id !== selUnit.id && u.status !== 'DARK' &&
    Math.max(u.supplyLevels?.CL_I||0, u.supplyLevels?.CL_III||0, u.supplyLevels?.CL_V||0) > 5
  )
  const totalPerDay = amounts.reduce((a,b)=>a+b,0)
  const isActive = existing?.active

  // Routes for selected asset type
  const theater = getTheaterNetwork(activeScenarioId)
  const routes = theater.locs
    .filter((l:any) => assetType==='AIR'||assetType==='HELO' ? l.type==='AIR' : l.type!=='AIR')
    .map((l:any) => ({ ...l, status: storeLocs?.[l.id]?.status || l.status }))
    .slice(0,5)

  React.useEffect(() => {
    if (!sourceId && sourceOptions[0]) setSourceId(sourceOptions[0].id)
    if (!routeId && routes[0]) setRouteId(routes[0].id)
  }, [])

  const handleSet = () => {
    const cargo = amounts.map((amt,i)=>({supplyClass:i,amount:amt})).filter(c=>c.amount>0)
    if (!cargo.length || !sourceId || !routeId) return
    const src = allUnits.find((u:any)=>u.id===sourceId)
    const label = `${assetType} LOGPAC: ${cargo.map(c=>`${CLS_LABELS[c.supplyClass]}:${c.amount}%`).join(' ')} from ${src?.shortName||sourceId} via ${routeId}`
    setStandingOrder(selUnit.id, { sourceUnitId:sourceId, routeId, assetType, cargo, label })
    AudioEngine.playConvoyDispatch()
    onClose()
  }

  return (
    <div style={{borderTop:'1px solid rgba(204,136,255,0.25)',background:'rgba(60,0,100,0.15)',padding:'10px'}}>
      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#aa66dd',letterSpacing:3,marginBottom:8}}>
        FRAGO — STANDING LOGPAC → {selUnit.shortName||selUnit.name}
        <span style={{marginLeft:8,color:'#555',fontSize:7}}>ADP 4-0 §3-12 SUSTAINMENT PLANNING</span>
      </div>

      {isActive && (
        <div style={{padding:'5px 8px',marginBottom:8,background:'rgba(0,200,80,0.08)',border:'1px solid #00ff8840',borderRadius:3,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#00ff88'}}>✓ STANDING ORDER ACTIVE — AUTO-EXECUTES DAILY</span>
          <button onClick={()=>{cancelStandingOrder(selUnit.id);AudioEngine.playTick(false);onClose()}}
            style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#ff4444',background:'transparent',border:'1px solid #ff444440',padding:'2px 6px',borderRadius:2,cursor:'pointer'}}>
            CANCEL FRAGO
          </button>
        </div>
      )}

      {/* Source unit */}
      <div style={{marginBottom:8}}>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:4}}>① SOURCE UNIT (DAILY DONOR)</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {sourceOptions.map((u:any)=>{
            const minS=Math.round(Math.min(u.supplyLevels?.CL_I||100,u.supplyLevels?.CL_III||100,u.supplyLevels?.CL_V||100))
            const col=minS>50?'#00ff88':minS>25?'#ffaa00':'#ff6644'
            const isSel=sourceId===u.id
            return(<button key={u.id} onClick={()=>setSourceId(u.id)} style={{padding:'4px 8px',borderRadius:3,cursor:'pointer',background:isSel?`${col}20`:'rgba(0,0,0,0.3)',border:`${isSel?2:1}px solid ${isSel?col:'#1a3a20'}`,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:12,color:isSel?col:'#4a7a54',WebkitTapHighlightColor:'transparent'}}>
              {u.shortName||u.name} <span style={{fontSize:10}}>{minS}%</span>
            </button>)
          })}
        </div>
      </div>

      {/* Asset type */}
      <div style={{marginBottom:8}}>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:4}}>② TRANSPORT MODE</div>
        <div style={{display:'flex',gap:4}}>
          {[{id:'GROUND',icon:'🚛'},{id:'AIR',icon:'✈'},{id:'HELO',icon:'🚁'},{id:'SEA',icon:'⛴'}].map(a=>(
            <button key={a.id} onClick={()=>setAssetType(a.id)} style={{flex:1,padding:'4px 2px',borderRadius:3,cursor:'pointer',background:assetType===a.id?'rgba(0,255,136,0.15)':'rgba(0,0,0,0.3)',border:`${assetType===a.id?2:1}px solid ${assetType===a.id?'#00ff88':'#1a3a20'}`,color:assetType===a.id?'#00ff88':'#4a7a54',fontFamily:'Barlow Condensed,sans-serif',fontSize:11,WebkitTapHighlightColor:'transparent'}}>
              {a.icon} {a.id}
            </button>
          ))}
        </div>
      </div>

      {/* Route */}
      <div style={{marginBottom:8}}>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:4}}>③ DESIGNATED ROUTE</div>
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          {routes.slice(0,3).map((r:any)=>{
            const sc=r.status==='INTERDICTED'?'#ff2200':r.status==='CONTESTED'?'#ff8800':'#2d5a32'
            const isSel=routeId===r.id
            return(<button key={r.id} onClick={()=>setRouteId(r.id)} style={{display:'flex',justifyContent:'space-between',padding:'4px 8px',borderRadius:3,cursor:'pointer',background:isSel?`${sc}15`:'rgba(0,0,0,0.2)',border:`${isSel?2:1}px solid ${isSel?sc:'#1a3a20'}`,WebkitTapHighlightColor:'transparent'}}>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:isSel?sc:'#4a7a54'}}>{r.id.toUpperCase()} · {r.cargo}</span>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:sc}}>{r.status==='INTERDICTED'?'⛔ BLOCKED':r.status==='CONTESTED'?'⚠':r.threat+' THREAT'}</span>
            </button>)
          })}
        </div>
      </div>

      {/* Daily cargo amounts */}
      <div style={{marginBottom:10}}>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:6}}>
          ④ DAILY CARGO ALLOCATION — TOTAL: {totalPerDay}% PER DAY
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {[0,2,4,8].map(i=>( // CL I, III, V, IX — the critical four
            <div key={i} style={{display:'grid',gridTemplateColumns:'50px 1fr 35px',gap:6,alignItems:'center'}}>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:'#4a7a54'}}>{CLS_LABELS[i]}</span>
              <input type="range" min={0} max={40} step={5} value={amounts[i]}
                onChange={e=>{ const v=[...amounts]; v[i]=+e.target.value; setAmounts(v) }}
                style={{accentColor:'#00ff88',cursor:'pointer'}}/>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:amounts[i]>0?'#00ff88':'#2d5a32',textAlign:'right'}}>{amounts[i]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commit */}
      <div style={{display:'flex',gap:6}}>
        <button onClick={handleSet} disabled={totalPerDay===0||!sourceId||!routeId} style={{flex:1,padding:'8px',borderRadius:3,cursor:totalPerDay>0&&sourceId&&routeId?'pointer':'not-allowed',background:totalPerDay>0&&sourceId?'rgba(0,255,136,0.15)':'rgba(0,0,0,0.3)',border:`1px solid ${totalPerDay>0&&sourceId?'#00ff88':'#1a3a20'}`,color:totalPerDay>0&&sourceId?'#00ff88':'#2d5a32',fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:12,letterSpacing:2}}>
          {isActive ? '📋 UPDATE FRAGO' : '📋 ISSUE FRAGO'}
        </button>
        <button onClick={onClose} style={{padding:'8px 10px',borderRadius:3,cursor:'pointer',background:'transparent',border:'1px solid #1a3a20',color:'#2d5a32',fontFamily:'Barlow Condensed,sans-serif',fontSize:11}}>✕</button>
      </div>
    </div>
  )
}

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
        {tab === 'UNITS'  && <UnitsTab urgentUnits={urgentUnits} unitList={unitList} />}
        {tab === 'SUPPLY' && <SupplyTab allConvoys={allConvoys} currentDay={currentDay} />}
        {tab === 'FEED'   && <FeedTab  feedEvents={feedEvents} />}
      </div>

    </div>
  )
}

// ── UNITS TAB ─────────────────────────────────────────────────────────────────
function UnitsTab({ urgentUnits, unitList }: { urgentUnits:any[]; unitList:any[] }) {
  const executeAction = useGameStore(s => (s as any).executeCommanderAction)
  const [selId, setSelId] = useState<string|null>(urgentUnits[0]?.id || null)
  const [fragoOpen, setFragoOpen] = useState(false)
  const selUnit = selId ? unitList.find((u:any) => u.id === selId) : null
  const okUnits = unitList.filter((u:any) => !urgentUnits.find((x:any) => x.id === u.id))

  if (urgentUnits.length === 0) return (
    <div>
      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#00ff88',letterSpacing:2,marginBottom:8,textAlign:'center'}}>✓ THEATER NOMINAL</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
        {unitList.map((u:any) => (
          <div key={u.id} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px',background:'rgba(0,0,0,0.2)',borderRadius:3,border:`1px solid ${getColor(u.readiness)}15`}}>
            <span style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:12,fontWeight:700,color:'#4a8a5a',flex:1}}>{u.shortName}</span>
            <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:getColor(u.readiness)}}>{Math.round(u.readiness)}%</span>
            <div style={{width:6,height:6,borderRadius:'50%',background:getColor(u.readiness)}}/>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#ff4400',letterSpacing:3,marginBottom:8}}>SELECT UNIT TO RESPOND</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
        {urgentUnits.map((u:any) => {
          const minC = Math.min(u.supplyLevels?.CL_I||100, u.supplyLevels?.CL_III||100, u.supplyLevels?.CL_V||100)
          const col = u.status==='STONEWALL' ? '#ff2200' : '#ff8800'
          const isSel = selId === u.id
          return (
            <button key={u.id} onClick={() => { AudioEngine.resume(); AudioEngine.playTick(true); setSelId(u.id); setFragoOpen(false) }}
              style={{padding:'6px 12px',borderRadius:4,cursor:'pointer',background:isSel?`${col}30`:'rgba(0,0,0,0.4)',border:`2px solid ${isSel?col:col+'50'}`,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,color:isSel?col:`${col}90`,WebkitTapHighlightColor:'transparent'}}>
              {u.shortName}<span style={{marginLeft:6,fontSize:11}}>{Math.round(minC)}%</span>
            </button>
          )
        })}
      </div>

      {selUnit && (
        <div style={{borderRadius:4,border:'1px solid rgba(255,100,0,0.3)',overflow:'hidden',marginBottom:8}}>
          <div style={{padding:'6px 10px',background:'rgba(255,50,0,0.08)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:14,color:'#ff8800'}}>{selUnit.name}</span>
            <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:getColor(selUnit.readiness)}}>RDNS {Math.round(selUnit.readiness)}%</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,padding:8,background:'rgba(0,0,0,0.3)'}}>
            {[
              {type:'AIR_EMERGENCY', icon:'⚡', label:'AIR SORTIE',   sub:'+40% CL III',    col:'#00aaff'},
              {type:'FRAGO',         icon:'📋', label:'ISSUE FRAGO',  sub:'Standing LOGPAC', col:'#cc88ff'},
              {type:'PRIORITY_PUSH', icon:'★',  label:'SET PRIORITY', sub:'+8% RDNS',        col:'#ff8800'},
            ].map((a:any) => (
              <button key={a.type} onClick={() => {
                AudioEngine.resume()
                if (a.type === 'FRAGO') { AudioEngine.playTick(true); setFragoOpen(fo => !fo) }
                else { AudioEngine.playAlert('PRIORITY'); if (executeAction) executeAction({ unitId:selUnit.id, actionType:a.type }) }
              }} style={{padding:'8px 4px',borderRadius:3,cursor:'pointer',
                background: a.type==='FRAGO'&&fragoOpen ? `${a.col}25` : `${a.col}12`,
                border:`1px solid ${a.type==='FRAGO'&&fragoOpen ? a.col : a.col+'50'}`,
                color:a.col,fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:12,
                lineHeight:1.3,textAlign:'center',WebkitTapHighlightColor:'transparent'}}>
                <div style={{fontSize:16,marginBottom:2}}>{a.icon}</div>{a.label}
                <div style={{fontSize:8,fontFamily:'Share Tech Mono,monospace',marginTop:3,opacity:0.7}}>{a.sub}</div>
              </button>
            ))}
          </div>
          {fragoOpen && <FragoPanel selUnit={selUnit} onClose={() => setFragoOpen(false)} />}
        </div>
      )}

      {okUnits.length > 0 && (
        <div style={{borderTop:'1px solid #1a3a20',paddingTop:6}}>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:5}}>OTHER UNITS</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3}}>
            {okUnits.map((u:any) => (
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:5,padding:'3px 6px',background:'rgba(0,0,0,0.2)',borderRadius:3}}>
                <span style={{fontFamily:'Barlow Condensed,sans-serif',fontSize:11,color:'#4a7a54',flex:1}}>{u.shortName}</span>
                <div style={{width:28,height:3,background:'#0d1f10',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${u.readiness}%`,background:getColor(u.readiness)}}/>
                </div>
                <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:getColor(u.readiness),width:28,textAlign:'right'}}>{Math.round(u.readiness)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SUPPLY TAB ────────────────────────────────────────────────────────────────
function SupplyTab({ allConvoys, currentDay }: { allConvoys:any[]; currentDay:number }) {
  const CLS = ['CL I','CL II','CL III','CL IV','CL V','CL VIII','CL IX']
  const safe = (allConvoys||[]).filter(Boolean)
  const transit = safe.filter((c:any) => c?.status === 'EN_ROUTE')
  const done    = safe.filter((c:any) => c?.status === 'DELIVERED')
  const standingOrders = useGameStore(s => (s as any).standingOrders || {})
  const activeOrders = Object.entries(standingOrders).filter(([,o]:any) => o?.active)

  return (
    <div>
      {activeOrders.length > 0 && (
        <div style={{marginBottom:10,padding:'8px 10px',background:'rgba(0,255,136,0.05)',border:'1px solid #00ff8830',borderRadius:4}}>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#00ff88',letterSpacing:2,marginBottom:5}}>
            ✓ STANDING ORDERS — {activeOrders.length} FRAGO{activeOrders.length>1?'s':''}
          </div>
          {activeOrders.map(([destId, o]:any) => (
            <div key={destId} style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#2d5a32',padding:'2px 0'}}>
              → {destId.replace(/_/g,' ')} · {o.assetType} · {(o.cargo||[]).filter((c:any)=>c?.amount>0).map((c:any)=>`${CLS[c.supplyClass]??'?'}:${c.amount}%`).join(' ')}
            </div>
          ))}
        </div>
      )}

      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:'#2d5a32',marginBottom:10}}>
        LIVE CONVOY MISSIONS — {transit.length} IN TRANSIT
      </div>

      {transit.length === 0 && (
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#1a3a20',textAlign:'center',padding:'20px 0'}}>
          NO CONVOYS IN TRANSIT — DISPATCH FROM MAP
        </div>
      )}

      {transit.map((c:any, idx:number) => {
        if (!c?.toUnitId) return null
        const travel  = Math.max(1, c.travelDays || 1)
        const elapsed = Math.max(0, (currentDay||1) - (c.departedDay||1))
        const daysLeft = Math.max(0, travel - elapsed)
        const pct = Math.min(100, Math.round((elapsed / travel) * 100))
        const col  = c.assetType==='AIR'||c.assetType==='HELO' ? '#00aaff' : c.assetType==='SEA' ? '#4488ff' : '#00ff88'
        const icon = c.assetType==='AIR' ? '✈' : c.assetType==='HELO' ? '🚁' : c.assetType==='SEA' ? '⛴' : '🚚'
        const cargoStr = (c.cargo||[]).filter((x:any) => x?.amount>0).map((x:any) => `${CLS[x.supplyClass]??'?'}:${x.amount}%`).join(' ')
        return (
          <div key={c.id||idx} style={{marginBottom:8,padding:'8px 10px',borderRadius:4,background:`${col}08`,border:`1px solid ${col}30`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
              <span style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:14,color:col}}>
                {icon} {c.assetType||'GND'} → {(c.toUnitId||'').replace(/_/g,' ')}
                {c.isStandingOrder && <span style={{marginLeft:6,fontSize:9,color:`${col}70`}}>AUTO</span>}
              </span>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:daysLeft<=1?'#ff8800':col}}>ETA D+{daysLeft}</span>
            </div>
            <div style={{height:4,background:'#0d1f10',borderRadius:2,marginBottom:4}}>
              <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:2,transition:'width .5s'}}/>
            </div>
            <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:`${col}80`}}>{cargoStr||'CARGO EN ROUTE'}</div>
          </div>
        )
      })}

      {done.length > 0 && (
        <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #1a3a20'}}>
          <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',letterSpacing:2,marginBottom:5}}>DELIVERED: {done.length}</div>
          {done.slice(-3).map((c:any, idx:number) => (
            <div key={c?.id||idx} style={{display:'flex',justifyContent:'space-between',padding:'3px 6px',fontSize:10,fontFamily:'Share Tech Mono,monospace',color:'#2d5a32'}}>
              <span>✓ {c?.assetType||'GND'} → {(c?.toUnitId||'').replace(/_/g,' ')}</span>
              <span>D{c?.departedDay}+{c?.travelDays}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── FEED TAB ──────────────────────────────────────────────────────────────────
function FeedTab({ feedEvents }: { feedEvents:any[] }) {
  const [expanded, setExpanded] = useState<string|null>(null)

  if (!feedEvents?.length) return (
    <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#1a3a20',textAlign:'center',padding:'24px 0'}}>
      NO ACTIVE EVENTS
    </div>
  )

  const acknowledge = (evId: string) => {
    const store = useGameStore.getState() as any
    if (store.appliedBattlefieldEvents) {
      const updated = store.appliedBattlefieldEvents.map((e:any) =>
        e.id === evId ? { ...e, acknowledged: true } : e
      )
      useGameStore.setState({ appliedBattlefieldEvents: updated } as any)
    }
  }

  return (
    <div>
      <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:3,color:'#2d5a32',marginBottom:10}}>
        BATTLEFIELD INTEL FEED — TAP TO ACKNOWLEDGE
      </div>
      {feedEvents.slice(0,15).map((ev:any, idx:number) => {
        if (!ev) return null
        const isFlash    = ev.priority === 'FLASH'
        const isPriority = ev.priority === 'PRIORITY'
        const isAck      = ev.acknowledged
        const accent     = isFlash ? '#ff4444' : isPriority ? '#ff8800' : '#2ecc71'
        const dimmed     = isAck ? 0.45 : 1
        const title      = ev.title || (ev.report||'').slice(0,40) || 'INTEL'
        const body       = (ev.report || ev.text || '')
        const isExpanded = expanded === (ev.id||String(idx))
        const evId       = ev.id || String(idx)

        return (
          <div key={evId}
            onClick={() => {
              setExpanded(isExpanded ? null : evId)
              if (!isAck) acknowledge(evId)
            }}
            style={{
              marginBottom:6, padding:'8px 10px', borderRadius:4,
              background: isFlash && !isAck ? 'rgba(255,50,50,.10)' : 'rgba(0,20,8,.5)',
              border:`1px solid ${isAck ? accent+'20' : accent+'50'}`,
              cursor:'pointer', opacity:dimmed,
              WebkitTapHighlightColor:'transparent',
              transition:'opacity .3s, border-color .3s',
            }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:isExpanded?6:0}}>
              <span style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,color:isAck?accent+'80':accent,flex:1,marginRight:6,lineHeight:1.2}}>
                {!isAck && (isFlash||isPriority) && <span style={{marginRight:5}}>●</span>}
                {title}
              </span>
              <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:accent,border:`1px solid ${accent}60`,padding:'1px 5px',borderRadius:2}}>
                  {ev.priority||'ROUTINE'}
                </span>
                <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:accent+'60'}}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>
            </div>
            {isExpanded && body && (
              <div style={{fontFamily:'Barlow,sans-serif',fontSize:11,color:'#4a7a54',lineHeight:1.5,marginTop:4,paddingTop:4,borderTop:`1px solid ${accent}20`}}>
                {body}
              </div>
            )}
            {isExpanded && isAck && (
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:8,color:'#2d5a32',marginTop:4,letterSpacing:1}}>
                ✓ ACKNOWLEDGED
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
