import React, { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

interface NodeData { id:string; name:string; type:string; unitId:string|null; wx:number; wy:number }
interface Props { node:NodeData; onClose:()=>void }

const AUTHORIZED_STRENGTH: Record<string,number> = {
  III_CORPS:2200, FOB1:4500, FOB2:4500, FOB3:4500, '4ID':17000, AVN_BDE:3200,
}

const CLS = [
  { key:'CL_I',    label:'CL I',    name:'Food / Water',     color:'#00ff88', rate:0 },
  { key:'CL_II',   label:'CL II',   name:'Clothing / Equip', color:'#00aaff', rate:0 },
  { key:'CL_III',  label:'CL III',  name:'Fuel (POL)',        color:'#ff8800', rate:0 },
  { key:'CL_IV',   label:'CL IV',   name:'Construction',      color:'#aaaaaa', rate:0 },
  { key:'CL_V',    label:'CL V',    name:'Ammunition',        color:'#ff4444', rate:0 },
  { key:'CL_VIII', label:'CL VIII', name:'Medical Materiel',  color:'#ff66cc', rate:0 },
  { key:'CL_IX',   label:'CL IX',   name:'Repair Parts',      color:'#8888ff', rate:0 },
]

type ActionMode = null|'CONVOY'|'AIR'|'LATERAL'|'PRIORITY'


// ── CONVOY DISPATCH — multi-class cargo builder ─────────────────────────────
interface DispatchProps {
  node:any; unit:any; currentDay:number
  onDispatch:(cargo:Array<{supplyClass:number;amount:number}>, assetType:string)=>void
  onCancel:()=>void
}

function ConvoyDispatch({ node, unit, currentDay, onDispatch, onCancel }: DispatchProps) {
  const [assetType, setAssetType] = React.useState<'GROUND'|'AIR'|'HELO'|'SEA'>('GROUND')
  const [loads, setLoads] = React.useState<number[]>([0,0,0,0,0,0,0])
  const travelDays = assetType==='AIR'?1:assetType==='HELO'?1:assetType==='SEA'?3:2
  const totalLoad = loads.reduce((a,b)=>a+b,0)

  const assets = [
    { id:'GROUND', label:'GROUND CONVOY', icon:'🚛', color:'#00ff88', max:60 },
    { id:'AIR',    label:'AIR SORTIE',    icon:'✈',  color:'#00aaff', max:30 },
    { id:'HELO',   label:'HELICOPTER',    icon:'🚁',  color:'#88ddff', max:20 },
    { id:'SEA',    label:'SEA LIFT',      icon:'⛴',  color:'#4488ff', max:80 },
  ]
  const selectedAsset = assets.find(a=>a.id===assetType)!

  const handleDispatch = () => {
    const cargo = loads
      .map((amt,i)=>({supplyClass:i,amount:amt}))
      .filter(c=>c.amount>0)
    if(cargo.length===0) return
    onDispatch(cargo, assetType)
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:13,color:selectedAsset.color,letterSpacing:1,fontWeight:700,fontFamily:'Barlow Condensed,sans-serif'}}>
        CONFIGURE CONVOY → {node.name}
      </div>

      {/* Asset type selector */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
        {assets.map(a=>(
          <button key={a.id} onClick={()=>setAssetType(a.id as any)}
            style={{padding:'6px 4px',background:assetType===a.id?`${a.color}20`:'transparent',border:`1px solid ${assetType===a.id?a.color:'#1a3a20'}`,color:assetType===a.id?a.color:'#1a5a3a',borderRadius:3,cursor:'pointer',fontFamily:'Share Tech Mono,monospace',fontSize:10,letterSpacing:1}}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Cargo sliders per class */}
      <div style={{fontSize:9,color:'#1a5a3a',fontFamily:'Share Tech Mono,monospace',letterSpacing:2,marginTop:2}}>
        CARGO MANIFEST — SELECT CLASSES TO LOAD
      </div>
      {CLS.map((cls,i)=>{
        const unitLvl = unit?.supplyLevels?.[cls.key] ?? 100
        const deficit = Math.max(0, 60-unitLvl)  // show deficit
        return(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:cls.color,width:50,flexShrink:0}}>{cls.label}</span>
            <div style={{flex:1}}>
              <input type="range" min={0} max={selectedAsset.max} step={5} value={loads[i]}
                onChange={e=>{ const v=Number(e.target.value); setLoads(l=>{const n=[...l];n[i]=v;return n}) }}
                style={{accentColor:loads[i]>0?cls.color:'#1a3a20',width:'100%'}}/>
            </div>
            <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:loads[i]>0?cls.color:'#1a4a2a',width:30,textAlign:'right'}}>{loads[i]}%</span>
            {deficit>10&&loads[i]===0&&<span style={{fontSize:8,color:'#ff4444',fontFamily:'Share Tech Mono,monospace'}}>-{Math.round(deficit)}%</span>}
          </div>
        )
      })}

      {totalLoad===0&&<div style={{fontSize:10,color:'#ff4444',fontFamily:'Share Tech Mono,monospace',textAlign:'center'}}>SELECT AT LEAST ONE CLASS TO LOAD</div>}

      <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Share Tech Mono,monospace',fontSize:10,color:'#1a5a3a',padding:'4px 0',borderTop:'1px solid #1a3a20'}}>
        <span>TOTAL LOAD: {totalLoad}%</span>
        <span>ETA: D+{travelDays}</span>
      </div>

      <div style={{display:'flex',gap:6}}>
        <button onClick={handleDispatch} disabled={totalLoad===0}
          style={{flex:1,padding:'9px',background:totalLoad>0?`${selectedAsset.color}20`:'rgba(0,0,0,.3)',border:`1px solid ${totalLoad>0?selectedAsset.color:'#1a3a20'}`,color:totalLoad>0?selectedAsset.color:'#1a4a2a',fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,letterSpacing:2,borderRadius:3,cursor:totalLoad>0?'pointer':'not-allowed'}}>
          {selectedAsset.icon} DISPATCH {assetType}
        </button>
        <button onClick={onCancel} style={{padding:'9px 12px',background:'transparent',border:'1px solid #1a3a20',color:'#1a5a3a',fontFamily:'Barlow Condensed,sans-serif',fontSize:12,borderRadius:3,cursor:'pointer'}}>✕</button>
      </div>
    </div>
  )
}

export default function NodeDetailPanel({ node, onClose }: Props) {
  const { units, currentDay } = useGameStore()
  const unit = node.unitId ? (Object.values(units) as any[]).find(u=>u.id===node.unitId) : null
  const [action, setAction] = useState<ActionMode>(null)
  const [convoyClass, setConvoyClass] = useState(2)
  const [convoyAmt, setConvoyAmt] = useState(30)
  const [lateralFrom, setLateralFrom] = useState('')
  const [injected, setInjected] = useState<string[]>([])
  const [flashIdxs, setFlashIdxs] = useState<number[]>([])
  const prevLevels = React.useRef<number[]>([])

  const supply: number[] = unit ? CLS.map(c => unit.supplyLevels?.[c.key] ?? 0) : []
  const consumption: number[] = unit ? CLS.map(c => unit.dailyConsumption?.[c.key] ?? 0) : []
  const maint = unit?.maintenance || null

  useEffect(()=>{
    if(supply.length===0) return
    if(prevLevels.current.length===0){prevLevels.current=supply;return}
    const dropped=supply.map((v,i)=>v<prevLevels.current[i]?i:-1).filter(i=>i>=0)
    if(dropped.length>0){setFlashIdxs(dropped);setTimeout(()=>setFlashIdxs([]),800)}
    prevLevels.current=supply
  },[supply.join(',')])

  const daysLeft=(lvl:number,rate:number)=>rate>0?Math.floor(lvl/rate):99
  const critCount=supply.filter((v,i)=>v<20).length
  const statusColor=!unit?'#00cc66':unit.status==='GREEN'?'#00ff88':unit.status==='AMBER'?'#ffaa00':unit.status==='STONEWALL'?'#ff4400':'#ff4444'
  const otherUnits=(Object.values(units) as any[]).filter(u=>u.id!==node.unitId)

  const injectAction=(msg:string)=>{
    setInjected(prev=>[`D${currentDay} — ${msg}`,...prev.slice(0,4)])
    setAction(null)
  }

  return(
    <div style={{
      position:'fixed',
      // Mobile: full-width bottom sheet
      ...(window.innerWidth < 768 ? {
        bottom:0, left:0, right:0, top:'auto',
        maxHeight:'72vh', borderRadius:'12px 12px 0 0',
        borderTop:`2px solid ${statusColor}`,
        borderLeft:`1px solid ${statusColor}30`,
        borderRight:`1px solid ${statusColor}30`,
      } : {
        top:10, right:8, width:340, maxHeight:'calc(100% - 80px)',
        borderRadius:4, border:`1px solid ${statusColor}50`,
        borderTop:`2px solid ${statusColor}`,
      }),
      zIndex:2000,
      background:'rgba(3,12,8,.97)',
      display:'flex', flexDirection:'column',
      fontFamily:'Barlow Condensed,sans-serif',
      boxShadow:`0 0 30px ${statusColor}18, 0 -4px 20px rgba(0,0,0,.8)`,
      overflow:'hidden',
      animation:'sheet-up .2s ease',
    }}>

      {/* Header */}
      <div style={{padding:'11px 14px 9px',borderBottom:'1px solid rgba(255,255,255,.06)',background:`${statusColor}08`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:11,letterSpacing:3,color:'#1a5a3a',marginBottom:3,fontFamily:'Share Tech Mono,monospace'}}>{node.type} // NODE DETAIL</div>
            <div style={{fontSize:20,fontWeight:700,color:statusColor,letterSpacing:1,textShadow:`0 0 12px ${statusColor}60`}}>{node.name}</div>
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid #1a3a20',color:'#1a5a3a',cursor:'pointer',fontSize:14,width:26,height:26,borderRadius:2,lineHeight:'24px',textAlign:'center'}}>✕</button>
        </div>
        {unit?.isDark && (
          <div style={{padding:'6px 10px',marginTop:6,background:'rgba(0,0,0,0.5)',border:'1px solid #ff220040',borderRadius:3,fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#ff4444',letterSpacing:1,textAlign:'center',animation:'sw-blink 1.4s infinite'}}>
            ◼ UNIT OFFLINE — NODE DARK — AWAITING RECONSTITUTION
          </div>
        )}
        {unit&&(
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:7}}>
            <div style={{padding:'2px 10px',borderRadius:2,fontSize:12,fontWeight:700,letterSpacing:2,background:`${statusColor}20`,color:statusColor,border:`1px solid ${statusColor}40`,animation:unit.status==='STONEWALL'?'sw-blink 1.3s infinite':undefined}}>{unit.status}</div>
            <div style={{flex:1,height:6,background:'rgba(255,255,255,.08)',borderRadius:3,overflow:'hidden'}}>
              <div style={{width:`${unit.readiness}%`,height:'100%',background:statusColor,borderRadius:3,transition:'width .8s ease'}}/>
            </div>
            <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:13,color:statusColor}}>{Math.round(unit.readiness)}%</span>
          </div>
        )}
        {unit&&unit.personnelStrength!==undefined&&(
          <div style={{marginTop:6}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#1a5a3a',letterSpacing:2}}>PERSONNEL STRENGTH</span>
              <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:unit.personnelStrength<25?'#ff4444':unit.personnelStrength<50?'#ffaa00':'#00ff88',fontWeight:700}}>{Math.round(unit.personnelStrength)}%</span>
            </div>
            <div style={{height:5,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden'}}>
              <div style={{width:`${unit.personnelStrength}%`,height:'100%',borderRadius:3,background:unit.personnelStrength<25?'#ff4444':unit.personnelStrength<50?'#ffaa00':'#00ff88',transition:'width 1s ease'}}/>
            </div>
            {unit.stonewallStreak>0&&<div style={{fontSize:9,color:'#ff4444',fontFamily:'Share Tech Mono,monospace',marginTop:2,letterSpacing:1}}>STONEWALL STREAK: {unit.stonewallStreak} DAYS{unit.stonewallStreak>=3?' — DARK IMMINENT':''}</div>}
          </div>
        )}
      </div>

      <div style={{overflowY:'auto',flex:1}}>

        {/* MAINTENANCE STATUS */}
        {maint&&(
          <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
            <div style={{fontSize:10,letterSpacing:3,color:'#1a5a3a',marginBottom:8,fontFamily:'Share Tech Mono,monospace'}}>MAINTENANCE STATUS // ERR</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
              {[
                {label:'EQUIP RDNS RATE',value:`${maint.equipmentReadinessRate}%`,color:maint.equipmentReadinessRate>=85?'#00ff88':maint.equipmentReadinessRate>=70?'#ffaa00':'#ff4444'},
                {label:'VEHICLES DEADLINED',value:maint.vehiclesDeadlined,color:maint.vehiclesDeadlined>8?'#ff4444':maint.vehiclesDeadlined>4?'#ffaa00':'#00ff88'},
                {label:'WORK ORDERS',value:maint.pendingWorkOrders,color:maint.pendingWorkOrders>15?'#ff4444':maint.pendingWorkOrders>8?'#ffaa00':'#00ff88'},
                {label:'PARTS SHORTAGE',value:maint.repairPartsShortage?'YES':'NO',color:maint.repairPartsShortage?'#ff4444':'#00ff88'},
              ].map(m=>(
                <div key={m.label} style={{background:'#1a3020',borderRadius:3,padding:'6px 8px'}}>
                  <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:9,color:'#1a5a3a',marginBottom:3}}>{m.label}</div>
                  <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:15,fontWeight:600,color:m.color}}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGSTAT — ALL 7 CLASSES */}
        {unit&&(
          <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
            <div style={{fontSize:10,letterSpacing:3,color:'#1a5a3a',marginBottom:8,fontFamily:'Share Tech Mono,monospace'}}>LOGSTAT // CLASSES OF SUPPLY</div>
            {CLS.map((cls,i)=>{
              const lvl=supply[i]??0
              const rate=consumption[i]??0
              const days=daysLeft(lvl,rate)
              const color=lvl<20?'#ff4444':lvl<40?'#ffaa00':cls.color
              const isFlash=flashIdxs.includes(i)
              const isCrit=lvl<20
              return(
                <div key={cls.key} style={{marginBottom:9,background:isFlash?'rgba(255,68,68,.08)':'transparent',borderRadius:3,padding:'2px 0',transition:'background .3s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:3}}>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{fontSize:11,color,fontFamily:'Share Tech Mono,monospace',fontWeight:600,minWidth:52}}>{cls.label}</span>
                      <span style={{fontSize:10,color:'#1a5a3a'}}>{cls.name}</span>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'baseline'}}>
                      <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:13,color,fontWeight:600,animation:isCrit?'sw-blink 1.4s infinite':undefined}}>{Math.round(lvl)}%</span>
                      <span style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:days<=1?'#ff4444':days<=3?'#ffaa00':'#1a5a3a'}}>{days>=99?'∞':`${days}d`}</span>
                    </div>
                  </div>
                  <div style={{position:'relative',height:7,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${lvl}%`,background:color,borderRadius:3,transition:'width 1s ease',boxShadow:isCrit?`0 0 8px ${color}`:`0 0 4px ${color}60`}}/>
                    <div style={{position:'absolute',top:0,bottom:0,left:`${Math.max(0,lvl-rate)}%`,width:'2px',background:`${color}60`}}/>
                  </div>
                  <div style={{fontSize:10,color:'#1a3a20',marginTop:2,fontFamily:'Share Tech Mono,monospace'}}>
                    ↓ {rate}/day{isCrit&&<span style={{color:'#ff4444',marginLeft:8,fontWeight:700}}>⚠ CRITICAL</span>}
                  </div>
                </div>
              )
            })}
            <div style={{marginTop:6,padding:'6px 10px',background:'rgba(0,0,0,.3)',borderRadius:3,border:`1px solid ${critCount>0?'#ff444430':'#1a3a2030'}`,display:'flex',justifyContent:'space-between'}}>
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#1a5a3a'}}>CRITICAL CLASSES</div>
              <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:14,color:critCount>0?'#ff4444':'#00ff88',fontWeight:700}}>{critCount} / 7</div>
            </div>
          </div>
        )}

        {/* COMMANDER ACTIONS */}
        <div style={{padding:'10px 14px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
          <div style={{fontSize:10,letterSpacing:3,color:'#1a5a3a',marginBottom:8,fontFamily:'Share Tech Mono,monospace'}}>COMMANDER ACTIONS</div>
          {action===null&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {id:'CONVOY',label:'DISPATCH CONVOY',color:'#00ff88',icon:'🚛'},
                {id:'AIR',   label:'AIR RESUPPLY',   color:'#00aaff',icon:'✈'},
                {id:'LATERAL',label:'LATERAL XFER',  color:'#ffaa00',icon:'↔'},
                {id:'PRIORITY',label:'SET PRIORITY', color:'#ff8800',icon:'⚡'},
              ].map(a=>(
                <button key={a.id} onClick={()=>setAction(a.id as ActionMode)} style={{background:`${a.color}10`,border:`1px solid ${a.color}40`,color:a.color,padding:'8px 0',fontFamily:'Barlow Condensed,sans-serif',fontSize:13,fontWeight:700,letterSpacing:1,borderRadius:3,cursor:'pointer'}}>
                  <span style={{marginRight:4}}>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          )}

          {action==='CONVOY'&&(
            <ConvoyDispatch
              node={node}
              unit={unit}
              currentDay={currentDay}
              onDispatch={(cargo, assetType)=>{
                const dispatchConvoy = (window as any).__dispatchConvoy
                if(dispatchConvoy) {
                  const depotId = 'DEP_BYD'  // nearest depot
                  dispatchConvoy(depotId, node.unitId||node.id, cargo, assetType)
                }
                const cls = ['CL I','CL II','CL III','CL IV','CL V','CL VIII','CL IX']
                const desc = cargo.map((c:any)=>`${cls[c.supplyClass]}:${c.amount}%`).join(' ')
                injectAction(`${assetType} DISPATCHED → ${node.name} | ${desc} | ETA D+${assetType==='AIR'||assetType==='HELO'?1:assetType==='SEA'?3:2}`)
                setAction(null)
              }}
              onCancel={()=>setAction(null)}
            />
          )}

          {action==='PRIORITY'&&(
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              <div style={{padding:'8px 10px',background:'rgba(255,136,0,.08)',border:'1px solid #ff880030',borderRadius:3,fontSize:13,color:'#c8a060',fontFamily:'Barlow,sans-serif',lineHeight:1.6}}>Designating {node.name} as PRIORITY elevates all pending requests above standard queue.</div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>injectAction(`PRIORITY DESIGNATED → ${node.name} | ALL REQUESTS ELEVATED`)} style={{flex:1,background:'rgba(255,136,0,.15)',border:'1px solid #ff8800',color:'#ff8800',padding:'8px',borderRadius:3,cursor:'pointer',fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13,letterSpacing:1}}>DESIGNATE ⚡</button>
                <button onClick={()=>setAction(null)} style={{background:'transparent',border:'1px solid #1a3a20',color:'#1a5a3a',padding:'8px 12px',borderRadius:3,cursor:'pointer',fontFamily:'Barlow Condensed,sans-serif',fontSize:12}}>✕</button>
              </div>
            </div>
          )}

          {action==='AIR'&&(
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              <div style={{fontSize:13,color:'#00aaff',letterSpacing:1}}>AIR RESUPPLY → {node.name}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {CLS.map((c,i)=>(
                  <button key={i} onClick={()=>setConvoyClass(i)} style={{background:convoyClass===i?`${c.color}30`:'transparent',border:`1px solid ${convoyClass===i?c.color:'#1a3a20'}`,color:convoyClass===i?c.color:'#1a5a3a',padding:'3px 8px',borderRadius:2,cursor:'pointer',fontFamily:'Share Tech Mono,monospace',fontSize:11}}>{c.label}</button>
                ))}
              </div>
              <div style={{background:'rgba(0,170,255,.08)',border:'1px solid #00aaff30',borderRadius:3,padding:'6px 8px',fontSize:11,color:'#00aaff',fontFamily:'Share Tech Mono,monospace'}}>✈ SORTIE AVAILABLE — Weather: CLEAR</div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>injectAction(`AIR SORTIE TASKED → ${node.name} | ${CLS[convoyClass].label} | TONIGHT`)} style={{flex:1,background:'rgba(0,170,255,.15)',border:'1px solid #00aaff',color:'#00aaff',padding:'8px',borderRadius:3,cursor:'pointer',fontFamily:'Barlow Condensed,sans-serif',fontWeight:700,fontSize:13}}>TASK SORTIE →</button>
                <button onClick={()=>setAction(null)} style={{background:'transparent',border:'1px solid #1a3a20',color:'#1a5a3a',padding:'8px 12px',borderRadius:3,cursor:'pointer',fontFamily:'Barlow Condensed,sans-serif',fontSize:12}}>✕</button>
              </div>
            </div>
          )}
        </div>

        {/* Commander log */}
        {injected.length>0&&(
          <div style={{padding:'10px 14px'}}>
            <div style={{fontSize:10,letterSpacing:3,color:'#1a5a3a',marginBottom:8,fontFamily:'Share Tech Mono,monospace'}}>COMMANDER LOG</div>
            {injected.map((msg,i)=>(
              <div key={i} style={{padding:'5px 8px',marginBottom:4,borderRadius:3,background:'rgba(0,255,136,.05)',border:'1px solid rgba(0,255,136,.12)',fontSize:11,color:'#4a8a6a',fontFamily:'Share Tech Mono,monospace',lineHeight:1.5,opacity:1-i*.18}}>{msg}</div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes sw-blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes sheet-up{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}
