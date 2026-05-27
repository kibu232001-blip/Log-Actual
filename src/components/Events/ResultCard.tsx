import React from 'react'
import { useGameStore } from '../../store/gameStore'

export default function ResultCard() {
  const { lastDecisionResult, showResultCard, dismissResult } = useGameStore()
  if (!showResultCard || !lastDecisionResult) return null
  const borderColor = lastDecisionResult.outcome==='OPTIMAL'?'#27ae60':lastDecisionResult.outcome==='ACCEPTABLE'?'#f39c12':lastDecisionResult.outcome==='SUBOPTIMAL'?'#e67e22':'#e74c3c'
  const titleColor = borderColor
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,15,6,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#132415', border:`1px solid ${borderColor}`, borderRadius:6, padding:20, maxWidth:380, width:'94%' }}>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:16, color:titleColor, marginBottom:8 }}>
          {lastDecisionResult.outcome === 'OPTIMAL' ? '✓ DOCTRINE CORRECT' : lastDecisionResult.outcome === 'ACCEPTABLE' ? '↗ ACCEPTABLE' : lastDecisionResult.outcome === 'SUBOPTIMAL' ? '↘ SUBOPTIMAL' : '✗ DOCTRINE FAILURE'}
        </div>
        <div style={{ fontSize:12, color:'#7aab7e', lineHeight:1.6, marginBottom:10 }}>{lastDecisionResult.doctrineNote}</div>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, padding:'6px 8px', background:'rgba(255,255,255,0.04)', borderRadius:3, color:titleColor, marginBottom:12 }}>
          {lastDecisionResult.effects.map((e,i) => <div key={i}>{e.description}</div>)}
        </div>
        <button onClick={dismissResult} style={{ width:'100%', padding:8, background:'rgba(46,204,113,0.12)', border:'1px solid #27ae60', color:'#2ecc71', fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, fontSize:13, borderRadius:4, cursor:'pointer' }}>Continue →</button>
      </div>
    </div>
  )
}
