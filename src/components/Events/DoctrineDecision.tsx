import React from 'react'
import { useGameStore } from '../../store/gameStore'

const outcomeColors: Record<string,string> = { OPTIMAL:'#2ecc71', ACCEPTABLE:'#f39c12', SUBOPTIMAL:'#e67e22', FAILURE:'#e74c3c' }

export default function DoctrineDecisionModal() {
  const { pendingDecision, resolveDecision } = useGameStore()
  if (!pendingDecision) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,15,6,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#132415', border:'1px solid #2d5a32', borderRadius:6, padding:24, maxWidth:480, width:'94%', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontSize:11, letterSpacing:2, color:'#7aab7e', textTransform:'uppercase', marginBottom:6 }}>
          Doctrine Decision — Day {pendingDecision.day} · {pendingDecision.type.replace('_',' ')}
          <span style={{ float:'right', color:'#2ecc71', fontSize:9 }}>FORCE MULTIPLIER +{pendingDecision.forceMultiplierBonus}% if optimal</span>
        </div>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:20, color:'#2ecc71', marginBottom:10, lineHeight:1.2 }}>{pendingDecision.title}</div>
        <div style={{ fontSize:13, color:'#c8e6c9', lineHeight:1.6, marginBottom:14, borderLeft:'2px solid #2d5a32', paddingLeft:10 }}>{pendingDecision.situation}</div>
        <div style={{ fontSize:11, color:'#f39c12', fontFamily:'Share Tech Mono,monospace', marginBottom:10 }}>⚠ COMMANDER, YOUR DECISION:</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {pendingDecision.choices.map(choice => (
            <button key={choice.id} onClick={() => resolveDecision(pendingDecision.id, choice.id)}
              style={{ background:'#1a3020', border:'1px solid #2d5a32', borderRadius:4, padding:'9px 12px', textAlign:'left', cursor:'pointer', fontSize:12, color:'#c8e6c9', fontFamily:'Barlow,sans-serif', transition:'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='#2ecc71', e.currentTarget.style.color='#2ecc71')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='#2d5a32', e.currentTarget.style.color='#c8e6c9')}>
              <span style={{ fontFamily:'Share Tech Mono,monospace', color:'#f39c12', fontSize:11, marginRight:6 }}>{choice.id}.</span>
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
