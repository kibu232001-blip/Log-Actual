import React, { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import AudioEngine from '../../engine/AudioEngine'

export default function CampaignAAR() {
  const { metrics, completedDecisions, currentDay, totalDays, resetGame } = useGameStore()
  const failureReason    = useGameStore(s => (s as any).failureReason)
  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const campaignVictory  = useGameStore(s => (s as any).campaignVictory)
  const campaignGrade    = useGameStore(s => (s as any).campaignGrade || 'F')
  const victorySigma     = useGameStore(s => (s as any).victorySigma)
  const victoryRCT       = useGameStore(s => (s as any).victoryRCT)
  const convoyStats      = useGameStore(s => (s as any).convoyStats || { dispatched:0, delivered:0, interdicted:0 })
  const airSorties       = useGameStore(s => (s as any).airSorties ?? 4)
  const difficulty       = useGameStore(s => (s as any).difficulty || 'STANDARD')
  const [visible, setVisible] = useState(false)

  const isFailed = !!failureReason || !campaignVictory

  const gradeColor = campaignGrade === 'A' ? '#00ff88'
                   : campaignGrade === 'B' ? '#88ff44'
                   : campaignGrade === 'C' ? '#ffcc00'
                   : campaignGrade === 'D' ? '#ff8800'
                   : '#ff2200'

  const scenarioName = activeScenarioId.replace('CAMPAIGN_','C').replace(/_/g,' ')

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    AudioEngine.resume()
    if (!isFailed) {
      AudioEngine.playDecisionCorrect()
      setTimeout(() => AudioEngine.playDecisionCorrect(), 400)
    } else {
      AudioEngine.playStonewallAlarm()
      window.dispatchEvent(new CustomEvent('TRIGGER_SCREEN_SHAKE', { detail: { intensity: 12 } }))
    }
  }, [])

  const statRow = (label: string, value: string, color: string, sub?: string) => (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#2d5a32', letterSpacing:2 }}>{label}</div>
        {sub && <div style={{ fontFamily:'Barlow,sans-serif', fontSize:10, color:'#4a7a54', marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:16, fontWeight:700, color }}>{value}</div>
    </div>
  )

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:2000,
      background: isFailed ? 'rgba(8,0,0,0.98)' : 'rgba(0,8,4,0.98)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16,
      opacity: visible ? 1 : 0, transition:'opacity 0.5s ease',
    }}>
      <div style={{
        width:'100%', maxWidth:480,
        background: isFailed ? '#120404' : '#041208',
        border:`2px solid ${gradeColor}`,
        borderRadius:6,
        boxShadow:`0 0 80px ${gradeColor}22`,
        overflow:'hidden',
        fontFamily:'Barlow Condensed,sans-serif',
      }}>

        {/* Header */}
        <div style={{
          padding:'16px 20px',
          background:`${gradeColor}10`,
          borderBottom:`1px solid ${gradeColor}30`,
          textAlign:'center',
        }}>
          <div style={{ fontSize:10, color:gradeColor, letterSpacing:4, fontFamily:'Share Tech Mono,monospace', marginBottom:6 }}>
            {scenarioName} — CAMPAIGN COMPLETE
          </div>
          <div style={{ fontSize:32, fontWeight:700, color:'#ffffff', letterSpacing:2, marginBottom:4 }}>
            {isFailed ? 'MISSION FAILURE' : 'MISSION COMPLETE'}
          </div>
          <div style={{ fontSize:13, color: isFailed ? '#aa4444' : '#44aa66' }}>
            {isFailed ? (failureReason || 'Theater collapsed') : `Theater sustained through D${currentDay} of ${totalDays}`}
          </div>
        </div>

        {/* Grade */}
        <div style={{
          padding:'20px', textAlign:'center',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize:10, letterSpacing:3, color:'#2d5a32', fontFamily:'Share Tech Mono,monospace', marginBottom:8 }}>
            COMMAND PERFORMANCE GRADE
          </div>
          <div style={{
            fontSize:72, fontWeight:900, color:gradeColor, lineHeight:1,
            textShadow:`0 0 40px ${gradeColor}80`,
            fontFamily:'Share Tech Mono,monospace',
          }}>{campaignGrade}</div>
          <div style={{ fontSize:12, color:gradeColor, letterSpacing:2, marginTop:6 }}>
            {campaignGrade==='A'?'DISTINGUISHED PERFORMANCE':campaignGrade==='B'?'COMMENDABLE':campaignGrade==='C'?'ADEQUATE':campaignGrade==='D'?'MARGINAL':'FAILED'}
          </div>
        </div>

        {/* Stats */}
        <div style={{ margin:'0 0' }}>
          {statRow('FINAL SIGMA', `${metrics.sigmaLevel.toFixed(1)}σ`,
            metrics.sigmaLevel >= 3 ? '#00ff88' : metrics.sigmaLevel >= 2 ? '#ffcc00' : '#ff4444',
            victorySigma)}
          {statRow('REQUEST CYCLE TIME', `${metrics.avgRequestCycleTime}h`,
            metrics.avgRequestCycleTime <= 32 ? '#00ff88' : metrics.avgRequestCycleTime <= 48 ? '#ffcc00' : '#ff4444',
            victoryRCT)}
          {statRow('THEATER READINESS', `${Math.round(metrics.avgReadiness)}%`,
            metrics.avgReadiness >= 70 ? '#00ff88' : metrics.avgReadiness >= 50 ? '#ffcc00' : '#ff4444')}
          {statRow('STONEWALL RATE', `${metrics.stonewallRate}%`,
            metrics.stonewallRate === 0 ? '#00ff88' : metrics.stonewallRate < 15 ? '#ffcc00' : '#ff4444')}
          {statRow('DAYS SURVIVED', `${currentDay} / ${totalDays}`,
            currentDay >= totalDays ? '#00ff88' : '#ffaa00')}
          {statRow('DECISIONS MADE', `${completedDecisions?.length || 0}`, '#00aaff')}
          {/* Convoy survival stats */}
          {convoyStats.dispatched > 0 && statRow(
            'CONVOY SURVIVAL',
            `${convoyStats.delivered} / ${convoyStats.dispatched}`,
            convoyStats.delivered / Math.max(1, convoyStats.dispatched) >= 0.8 ? '#00ff88'
            : convoyStats.delivered / Math.max(1, convoyStats.dispatched) >= 0.5 ? '#ffcc00' : '#ff4444'
          )}
          {statRow('DIFFICULTY', difficulty, difficulty==='SFC_CHALLENGE'?'#ff4444':difficulty==='HARD'?'#ff8800':difficulty==='STANDARD'?'#ffcc00':'#00ff88')}
        </div>

        {/* Doctrine summary */}
        <div style={{
          padding:'12px 16px',
          borderTop:'1px solid rgba(255,255,255,0.06)',
          fontFamily:'Barlow,sans-serif', fontSize:12,
          color: isFailed ? '#8a5050' : '#5a8a60',
          lineHeight:1.6,
        }}>
          {isFailed
            ? `The theater distribution system failed on Day ${currentDay}. Units could not sustain combat operations without adequate supply. Review your resupply timing and convoy routing decisions.`
            : `Theater logistics sustained through the campaign. Your supply chain decisions kept units combat-effective across ${currentDay} days of operations. The distribution system held.`}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, padding:16 }}>
          <button onClick={() => resetGame(activeScenarioId)} style={{
            flex:1, padding:'11px 0',
            background:`${gradeColor}15`, border:`1px solid ${gradeColor}`,
            color:gradeColor, fontFamily:'Barlow Condensed,sans-serif',
            fontWeight:700, fontSize:15, letterSpacing:2, borderRadius:4, cursor:'pointer',
          }}>REPLAY CAMPAIGN</button>
          <button onClick={() => resetGame()} style={{
            flex:1, padding:'11px 0',
            background:'rgba(0,0,0,0.3)', border:'1px solid #2d5a32',
            color:'#4a7a54', fontFamily:'Barlow Condensed,sans-serif',
            fontWeight:700, fontSize:15, letterSpacing:2, borderRadius:4, cursor:'pointer',
          }}>MISSION SELECT</button>
        </div>
      </div>
    </div>
  )
}
