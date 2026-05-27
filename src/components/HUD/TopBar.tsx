import React, { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

function pad(n: number) { return String(n).padStart(2,'0') }

// ── ARMY DOCTRINE CAMPAIGN PHASES (FM 4-0 / OPORD structure) ────────────────
// Maps campaign day to correct operational phase
interface CampaignPhase {
  id:    string
  label: string    // Short display label
  full:  string    // Full name
  color: string
  days:  [number, number]  // inclusive day range
  description: string
}

// NOTE: Conflict was already ongoing before Phase I.
// Forward units entered theater with degraded stocks.
// Distribution pipeline was under stress before Day 1.
// These phases reflect ESCALATING CONFLICT INTENSITY — not logistics milestones.

const CAMPAIGN_PHASES: CampaignPhase[] = [
  {
    id:'CONTACT', label:'PH I — CONTACT', full:'PHASE I: INITIAL CONTACT',
    color:'#00aaff', days:[1,5],
    description:'Enemy contact established. Forward units already reporting shortages from pre-deployment friction. LOC threat LOW — window closing fast.',
  },
  {
    id:'ESCALATION', label:'PH II — ESCALATION', full:'PHASE II: ESCALATION',
    color:'#22ddaa', days:[6,12],
    description:'Enemy increases pressure. First deliberate LOC interdiction. Ambush frequency rising. Commodity stress becomes visible across all classes.',
  },
  {
    id:'DECISIVE', label:'PH III — DECISIVE ACTION', full:'PHASE III: DECISIVE ACTION',
    color:'#ffcc00', days:[13,20],
    description:'Full combat operations. Maximum sustainment demand. Enemy targeting your distribution network as a primary objective. Every class under stress.',
  },
  {
    id:'ATTRITION', label:'PH IV — ATTRITION', full:'PHASE IV: ATTRITION',
    color:'#ff8800', days:[21,26],
    description:'Sustained high-intensity combat. Personnel strength degrading. Multiple LOCs interdicted simultaneously. Enemy knows your routes. Stonewall risk critical.',
  },
  {
    id:'CULMINATION', label:'PH V — CULMINATION', full:'PHASE V: CULMINATION',
    color:'#ff4444', days:[27,30],
    description:'Breaking point. One side folds. Either your distribution holds and the enemy culminates — or your units go dark and the theater collapses. No second chances.',
  },
]

export function getCampaignPhase(day: number): CampaignPhase {
  return CAMPAIGN_PHASES.find(p => day >= p.days[0] && day <= p.days[1])
    ?? CAMPAIGN_PHASES[CAMPAIGN_PHASES.length - 1]
}

// ── COUNTDOWN RING ─────────────────────────────────────────────────────────
function Countdown({ seconds }: { seconds: number }) {
  const mins  = Math.floor(seconds/60)
  const secs  = seconds%60
  const pct   = (seconds/120)*100   // 2-minute day
  const color = seconds < 20 ? '#ff4444' : seconds < 40 ? '#ffaa00' : '#00ff88'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ position:'relative', width:32, height:32 }}>
        <svg viewBox="0 0 32 32" style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
          <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5"/>
          <circle cx="16" cy="16" r="13" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${2*Math.PI*13}`}
            strokeDashoffset={`${2*Math.PI*13*(1-pct/100)}`}
            strokeLinecap="round"
            style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center', fontFamily:'Share Tech Mono,monospace',
          fontSize:11, color, fontWeight:700 }}>
          {pad(mins)}:{pad(secs)}
        </div>
      </div>
      <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:13, color:'#1a5a3a', letterSpacing:1 }}>
        NEXT DAY
      </div>
    </div>
  )
}

export default function TopBar() {
  const {
    currentDay, totalDays, metrics,
    advanceTurn, secondsToNextDay,
    startAutoAdvance, stopAutoAdvance, isPaused, pauseGame, resumeGame,
  } = useGameStore()

  const startTacticalFeed = (useGameStore.getState() as any).startTacticalFeed

  useEffect(() => {
    startAutoAdvance()
    if (startTacticalFeed) startTacticalFeed()
    return () => stopAutoAdvance()
  }, [])

  const phase      = getCampaignPhase(currentDay)
  const sigmaColor = metrics.sigmaLevel >= 3 ? '#00ff88' : metrics.sigmaLevel >= 2 ? '#ffaa00' : '#ff4444'
  const rctColor   = metrics.avgRequestCycleTime <= 32 ? '#00ff88' : metrics.avgRequestCycleTime <= 48 ? '#ffaa00' : '#ff4444'
  const swColor    = metrics.stonewallRate < 2 ? '#00ff88' : metrics.stonewallRate < 10 ? '#ffaa00' : '#ff4444'
  const rdnsColor  = (metrics.avgReadiness??0)>70?'#00ff88':(metrics.avgReadiness??0)>50?'#ffaa00':'#ff4444'

  // Phase progress within its window
  const phaseDay   = currentDay - phase.days[0] + 1
  const phaseLen   = phase.days[1] - phase.days[0] + 1
  const phasePct   = Math.round((phaseDay/phaseLen)*100)

  return (
    <div style={{
      background:'#07100a', borderBottom:'1px solid #1a3a20',
      display:'flex', alignItems:'center', padding:'0 14px',
      height:52, justifyContent:'space-between', gap:10,
    }}>

      {/* LEFT — title + day + phase */}
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
          fontSize:22, letterSpacing:2, color:'#00ff88', flexShrink:0,
          textShadow:'0 0 12px rgba(0,255,136,0.4)' }}>
          LOG ACTUAL
        </span>

        <div style={{ background:'#0d1f10', border:'1px solid #1a3a20', borderRadius:3,
          padding:'2px 10px', fontFamily:'Share Tech Mono,monospace',
          fontSize:16, color:'#00ff88', letterSpacing:1, flexShrink:0 }}>
          D{pad(currentDay)}/{totalDays}
        </div>

        {/* Phase badge — full doctrine label */}
        <div style={{
          display:'flex', flexDirection:'column', gap:1,
          padding:'2px 10px', borderRadius:3, flexShrink:0,
          background:`${phase.color}12`,
          border:`1px solid ${phase.color}40`,
        }}>
          <div style={{
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:15, letterSpacing:1.5, color:phase.color,
            lineHeight:1.2,
          }}>
            {phase.label}
          </div>
          {/* Phase progress bar */}
          <div style={{ width:90, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ width:`${phasePct}%`, height:'100%', background:phase.color,
              borderRadius:2, transition:'width .8s ease' }}/>
          </div>
        </div>
      </div>

      {/* CENTER — countdown + day + controls */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Countdown seconds={secondsToNextDay}/>
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center',
          background:'#0d1f10', border:'1px solid #1a3a20', borderRadius:3,
          padding:'3px 10px', minWidth:56,
        }}>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#1a5a3a', letterSpacing:2 }}>DAY</span>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:22, color:'#00ff88', fontWeight:700, lineHeight:1.1 }}>
            {pad(currentDay)}
          </span>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#1a3a20' }}>/{totalDays}</span>
        </div>
        <button onClick={isPaused ? resumeGame : pauseGame} style={{
          background: isPaused ? 'rgba(255,170,0,0.15)' : 'rgba(0,0,0,0.3)',
          border:`1px solid ${isPaused?'#ffaa00':'#1a3a20'}`,
          color: isPaused ? '#ffaa00' : '#1a5a3a',
          padding:'3px 10px', borderRadius:3, cursor:'pointer',
          fontFamily:'Share Tech Mono,monospace', fontSize:13, letterSpacing:2,
        }}>
          {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
        <button onClick={advanceTurn} style={{
          background:'rgba(0,255,136,0.08)', border:'1px solid #1a4a2a',
          color:'#2a8a5a', padding:'3px 10px', borderRadius:3, cursor:'pointer',
          fontFamily:'Share Tech Mono,monospace', fontSize:13, letterSpacing:2,
        }}>
          SKIP →
        </button>
      </div>

      {/* RIGHT — live metrics */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        {[
          { label:'SIGMA', value:`${metrics.sigmaLevel.toFixed(1)}σ`, color:sigmaColor },
          { label:'RCT',   value:`${metrics.avgRequestCycleTime}h`,   color:rctColor  },
          { label:'S/W',   value:`${metrics.stonewallRate.toFixed(0)}%`, color:swColor },
          { label:'RDNS',  value:`${Math.round(metrics.avgReadiness??0)}%`, color:rdnsColor },
        ].map(m => (
          <div key={m.label} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11,
              color:'#1a5a3a', letterSpacing:1 }}>{m.label}</div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:19,
              color:m.color, fontWeight:700, lineHeight:1.2 }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
