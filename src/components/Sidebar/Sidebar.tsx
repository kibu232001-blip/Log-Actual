import React from 'react'
import { useGameStore } from '../../store/gameStore'

const cls = ['CL I','CL II','CL III','CL IV','CL V','CL IX']
const clColors = ['#2ecc71','#7aab7e','#e74c3c','#7aab7e','#f39c12','#3498db']

export default function Sidebar() {
  const { units, advanceTurn, currentPhase, pendingDecision } = useGameStore()
  const unitList = Object.values(units) as any[]
  return (
    <div style={{ width:280, background:'#132415', borderLeft:'1px solid #2d5a32', display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #2d5a32' }}>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontSize:16, letterSpacing:2, color:'#7aab7e', textTransform:'uppercase', marginBottom:8 }}>Unit Readiness</div>
        {unitList.map((unit:any) => {
          const color = unit.status==='GREEN'?'#2ecc71':unit.status==='AMBER'?'#f39c12':'#e74c3c'
          return (
            <div key={unit.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, fontSize:18, color:'#c8e6c9', flex:'0 0 72px' }}>{unit.shortName}</span>
              <div style={{ flex:1, height:8, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${unit.readiness}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.5s' }}/>
              </div>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:15, color, minWidth:32, textAlign:'right' }}>{Math.round(unit.readiness)}%</span>
              <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0, animation:unit.status==='STONEWALL'?'pulse-red 1.4s infinite':undefined }}/>
            </div>
          )
        })}
      </div>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #2d5a32' }}>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontSize:16, letterSpacing:2, color:'#7aab7e', textTransform:'uppercase', marginBottom:8 }}>Supply Status</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          {cls.map((name,i) => {
            const firstUnit = unitList[0]
            const levels = firstUnit ? Object.values(firstUnit.supplyLevels) as number[] : []
            const pct = levels[i] ?? 50
            const color = pct > 60 ? '#2ecc71' : pct > 30 ? '#f39c12' : '#e74c3c'
            return (
              <div key={name} style={{ background:'#1a3020', borderRadius:3, padding:'5px 6px' }}>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:14, color:'#7aab7e', marginBottom:2 }}>{name}</div>
                <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:2 }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:2 }}/>
                </div>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:15, color }}>{Math.round(pct)}%</span>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ padding:'10px 12px' }}>
        {pendingDecision && (
          <button onClick={() => useGameStore.getState().setActivePanel('UNITS')} style={{ width:'100%', padding:8, marginBottom:6, background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.4)', color:'#e74c3c', fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, fontSize:20, letterSpacing:1, borderRadius:4, cursor:'pointer', textTransform:'uppercase' }}>
            ⚡ DOCTRINE DECISION PENDING
          </button>
        )}
        <button onClick={advanceTurn} style={{ width:'100%', padding:8, background:'rgba(46,204,113,0.12)', border:'1px solid #27ae60', color:'#2ecc71', fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, fontSize:20, letterSpacing:1, borderRadius:4, cursor:'pointer', textTransform:'uppercase' }}>
          ⏩ FORCE DAY ADVANCE
        </button>
      </div>
    </div>
  )
}
