import React from 'react'
import { useGameStore } from '../../store/gameStore'

export default function CampaignAAR() {
  const { metrics, completedDecisions, currentDay, resetGame } = useGameStore()
  const failureReason = useGameStore(s => (s as any).failureReason)
  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const isFailed = !!failureReason
  const accentColor = isFailed ? '#ff4444' : '#2ecc71'
  const borderColor = isFailed ? '#5a1a1a' : '#2d5a32'
  const bgColor     = isFailed ? 'rgba(30,5,5,0.97)' : 'rgba(5,15,6,0.97)'

  const failureMessages: Record<string,string> = {
    'THEATER COLLAPSE — 40%+ UNITS IN STONEWALL':
      'Distribution network collapsed. Too many units ran dry simultaneously. The theater could not sustain itself. Enemy logistics interdiction succeeded.',
    'SIGMA COLLAPSE — DISTRIBUTION SYSTEM FAILED':
      'Theater sigma dropped below 1.0σ. The distribution system failed statistically. Request cycle times became unsustainable. Units stopped trusting the pipeline.',
    'FORCE ATTRITION — 3+ UNITS OFFLINE':
      'Three or more units went dark. Personnel strength collapsed under sustained operations without adequate Class VIII resupply. Combat power gone.',
    'EXTENDED STONEWALL — UNIT COMBAT INEFFECTIVE 5+ DAYS':
      'A unit held STONEWALL for five consecutive days. At that point the unit is combat ineffective regardless of what you push forward. The damage is done.',
  }

  const warCostStatement = () => {
    const sw = metrics.stonewallRate
    const sigma = metrics.sigmaLevel
    const rct = metrics.avgRequestCycleTime
    const decisions = completedDecisions.length
    const daysRan = currentDay

    if (isFailed) {
      return `Campaign terminated on Day ${daysRan}. ${failureReason}. Theater distribution failed to sustain combat operations. ${decisions} commander decisions executed — ${decisions === 0 ? 'none' : `${decisions} total`}. Every hour of STONEWALL represents soldiers waiting for supply that never came.`
    }
    return `Campaign sustained for ${daysRan} days. Final sigma: ${sigma.toFixed(1)}σ. Average request cycle time: ${rct}h. Stonewall rate: ${sw.toFixed(1)}%. ${decisions} doctrine decisions executed.`
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:bgColor,
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:800,
    }}>
      <div style={{
        background: isFailed ? '#1a0505' : '#0d1f10',
        border:`2px solid ${borderColor}`,
        borderTop:`4px solid ${accentColor}`,
        borderRadius:6, padding:32,
        maxWidth:600, width:'94%', maxHeight:'90vh', overflowY:'auto',
        boxShadow:`0 0 60px ${accentColor}25`,
      }}>

        {/* Header */}
        <div style={{ marginBottom:6 }}>
          <div style={{
            fontFamily:'Share Tech Mono,monospace', fontSize:10,
            letterSpacing:3, color: isFailed ? '#5a2a2a' : '#1a5a3a',
            marginBottom:8,
          }}>
            {isFailed ? '// CAMPAIGN FAILURE //' : '// CAMPAIGN COMPLETE //'}
          </div>
          <div style={{
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:30, letterSpacing:1,
            color: accentColor,
            textShadow:`0 0 20px ${accentColor}50`,
          }}>
            {isFailed ? 'THEATER COLLAPSED' : 'AFTER ACTION REVIEW'}
          </div>
          <div style={{
            fontFamily:'Share Tech Mono,monospace', fontSize:11,
            color: isFailed ? '#7a2a2a' : '#2a7a4a',
            marginTop:4, letterSpacing:1,
          }}>
            DAY {currentDay} / 30 — {activeScenarioId.replace('_', ' ')}
          </div>
        </div>

        {/* Failure reason banner */}
        {isFailed && (
          <div style={{
            margin:'16px 0',
            padding:'14px 16px',
            background:'rgba(255,30,30,0.08)',
            border:'1px solid #ff444440',
            borderLeft:'4px solid #ff4444',
            borderRadius:3,
          }}>
            <div style={{
              fontFamily:'Share Tech Mono,monospace', fontSize:9,
              color:'#5a2a2a', letterSpacing:2, marginBottom:6,
            }}>FAILURE CONDITION</div>
            <div style={{
              fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
              fontSize:16, color:'#ff6644', letterSpacing:1, marginBottom:8,
            }}>
              {failureReason}
            </div>
            <div style={{
              fontFamily:'Barlow,sans-serif', fontSize:13,
              color:'#aa6655', lineHeight:1.65,
            }}>
              {failureMessages[failureReason] || 'Campaign objectives not achieved. Review your distribution decisions.'}
            </div>
          </div>
        )}

        {/* Metrics grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
          {[
            { label:'SIGMA LEVEL', value:`${metrics.sigmaLevel.toFixed(1)}σ`,
              color: metrics.sigmaLevel >= 3 ? '#2ecc71' : metrics.sigmaLevel >= 2 ? '#f39c12' : '#e74c3c' },
            { label:'AVG RCT',     value:`${metrics.avgRequestCycleTime}h`,
              color: metrics.avgRequestCycleTime <= 32 ? '#2ecc71' : metrics.avgRequestCycleTime <= 48 ? '#f39c12' : '#e74c3c' },
            { label:'STONEWALL',   value:`${metrics.stonewallRate.toFixed(1)}%`,
              color: metrics.stonewallRate < 2 ? '#2ecc71' : metrics.stonewallRate < 10 ? '#f39c12' : '#e74c3c' },
            { label:'DAYS HELD',   value:currentDay,
              color: currentDay >= 25 ? '#2ecc71' : currentDay >= 15 ? '#f39c12' : '#e74c3c' },
            { label:'DECISIONS',   value:completedDecisions.length,   color:'#c8e6c9' },
            { label:'DOCTRINE',    value:`${metrics.doctrineAccuracy}%`,
              color: metrics.doctrineAccuracy >= 70 ? '#2ecc71' : '#f39c12' },
          ].map(m => (
            <div key={m.label} style={{
              background: isFailed ? '#1f0808' : '#0d1f10',
              border:`1px solid ${isFailed?'#3a1010':'#1a3a20'}`,
              borderRadius:4, padding:'10px 12px',
            }}>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
                color: isFailed ? '#5a2a2a' : '#1a5a3a', marginBottom:4 }}>{m.label}</div>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:20,
                fontWeight:700, color:m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* War cost statement */}
        <div style={{
          fontSize:13, color: isFailed ? '#aa6655' : '#7aab7e',
          lineHeight:1.75, marginBottom:24,
          borderLeft:`2px solid ${isFailed?'#5a1a1a':'#2d5a32'}`,
          paddingLeft:14, fontFamily:'Barlow,sans-serif',
        }}>
          {warCostStatement()}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => resetGame(activeScenarioId)} style={{
            flex:1, padding:12,
            background:`${accentColor}12`,
            border:`1px solid ${accentColor}60`,
            color:accentColor,
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:15, letterSpacing:2, borderRadius:4, cursor:'pointer',
          }}>
            {isFailed ? '↺ REDEPLOY — SAME CAMPAIGN' : '↺ NEW CAMPAIGN'}
          </button>
          <button onClick={() => resetGame()} style={{
            padding:'12px 18px',
            background:'transparent',
            border:'1px solid #1a3a20',
            color:'#1a5a3a',
            fontFamily:'Barlow Condensed,sans-serif',
            fontSize:13, letterSpacing:1, borderRadius:4, cursor:'pointer',
          }}>
            MISSION SELECT
          </button>
        </div>
      </div>
    </div>
  )
}
