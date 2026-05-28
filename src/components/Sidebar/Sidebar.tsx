import React from 'react'
import { useGameStore } from '../../store/gameStore'

const cls = ['CL I','CL II','CL III','CL IV','CL V','CL IX']
const clColors = ['#2ecc71','#7aab7e','#e74c3c','#7aab7e','#f39c12','#3498db']

export default function Sidebar() {
  const { units, advanceTurn, currentPhase, pendingDecision } = useGameStore()
  const nextResupplyDay = useGameStore(s => (s as any).nextTheaterResupplyDay ?? 5)
  const currentDay = useGameStore(s => s.currentDay)
  const daysToResupply = Math.max(0, nextResupplyDay - currentDay)
  const unitList = Object.values(units) as any[]
  return (
    <div style={{ width:280, background:'#132415', borderLeft:'1px solid #2d5a32', display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid #2d5a32' }}>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontSize:16, letterSpacing:2, color:'#7aab7e', textTransform:'uppercase', marginBottom:8 }}>Unit Readiness</div>

        {/* Theater Resupply Countdown */}
        <div style={{
          marginBottom:12, padding:'8px 10px', borderRadius:4,
          background: daysToResupply===0 ? 'rgba(0,255,136,0.1)' : daysToResupply<=2 ? 'rgba(255,170,0,0.08)' : 'rgba(0,0,0,0.3)',
          border: `1px solid ${daysToResupply===0?'#00ff88':daysToResupply<=2?'#ffaa00':'#1a3a20'}`,
        }}>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#2d5a32', letterSpacing:2, marginBottom:4 }}>
            THEATER RESUPPLY PUSH
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:22,
              color: daysToResupply===0 ? '#00ff88' : daysToResupply<=2 ? '#ffaa00' : '#4a8a5a' }}>
              {daysToResupply===0 ? '✓ ARRIVED TODAY' : `D+${daysToResupply}`}
            </span>
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#2d5a32' }}>
              {daysToResupply===0 ? 'CL I/III/V/IX INBOUND' : `NEXT PUSH D${nextResupplyDay}`}
            </span>
          </div>
          {daysToResupply > 0 && (
            <div style={{ marginTop:5, height:3, background:'#0d1f10', borderRadius:2 }}>
              <div style={{ height:'100%', borderRadius:2, transition:'width .5s',
                background: daysToResupply<=2 ? '#ffaa00' : '#2d5a32',
                width:`${Math.max(5, 100 - (daysToResupply / 8 * 100))}%`
              }}/>
            </div>
          )}
        </div>
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

      </div>
    </div>
  )
}
