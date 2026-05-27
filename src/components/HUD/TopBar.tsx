import React, { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import AudioEngine from '../../engine/AudioEngine'

function pad(n: number) { return String(n).padStart(2,'0') }

interface CampaignPhase {
  id: string; label: string; full: string; color: string
  days: [number,number]; description: string
}

const CAMPAIGN_PHASES: CampaignPhase[] = [
  { id:'CONTACT',     label:'PH I',   full:'PHASE I: INITIAL CONTACT',   color:'#00aaff', days:[1,5],   description:'Enemy contact established. LOC threat LOW — window closing fast.' },
  { id:'ESCALATION',  label:'PH II',  full:'PHASE II: ESCALATION',       color:'#22ddaa', days:[6,12],  description:'Enemy increases pressure. First deliberate LOC interdiction.' },
  { id:'DECISIVE',    label:'PH III', full:'PHASE III: DECISIVE ACTION', color:'#ffcc00', days:[13,20], description:'Full combat operations. Maximum sustainment demand.' },
  { id:'ATTRITION',   label:'PH IV',  full:'PHASE IV: ATTRITION',        color:'#ff8800', days:[21,26], description:'Sustained high-intensity combat. Stonewall risk critical.' },
  { id:'CULMINATION', label:'PH V',   full:'PHASE V: CULMINATION',       color:'#ff4444', days:[27,30], description:'Breaking point. No second chances.' },
]

export function getCampaignPhase(day: number): CampaignPhase {
  return CAMPAIGN_PHASES.find(p => day >= p.days[0] && day <= p.days[1])
    ?? CAMPAIGN_PHASES[CAMPAIGN_PHASES.length - 1]
}

function Countdown({ seconds }: { seconds: number }) {
  const pct   = (seconds/120)*100
  const color = seconds < 20 ? '#ff4444' : seconds < 40 ? '#ffaa00' : '#00ff88'
  return (
    <div style={{ position:'relative', width:32, height:32, flexShrink:0 }}>
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
        fontSize:8, color, fontWeight:700, lineHeight:1 }}>
        {pad(Math.floor(seconds/60))}:{pad(seconds%60)}
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
    // Start ambient on first user interaction
    const startAudio = () => { AudioEngine.startAmbient(); document.removeEventListener('click', startAudio); document.removeEventListener('touchstart', startAudio) }
    document.addEventListener('click', startAudio)
    document.addEventListener('touchstart', startAudio)
    return () => { stopAutoAdvance(); document.removeEventListener('click', startAudio); document.removeEventListener('touchstart', startAudio) }
  }, [])

  // Track sigma changes for ambient stress audio
  useEffect(() => { AudioEngine.setSigma(metrics.sigmaLevel) }, [metrics.sigmaLevel])

  // Day advance sound
  const prevDay = React.useRef(currentDay)
  useEffect(() => {
    if (currentDay > prevDay.current) { AudioEngine.playDayAdvance(); prevDay.current = currentDay }
  }, [currentDay])

  const phase     = getCampaignPhase(currentDay)
  const isMobile  = window.innerWidth < 768

  const sigmaColor = metrics.sigmaLevel >= 3 ? '#00ff88' : metrics.sigmaLevel >= 2 ? '#ffaa00' : '#ff4444'

  // Sigma-reactive UI theming — theater collapse changes the visual atmosphere
  const sigmaLevel = metrics.sigmaLevel
  const barBg      = sigmaLevel >= 3 ? '#07100a' : sigmaLevel >= 2 ? '#100a04' : '#100404'
  const barBorder  = sigmaLevel >= 3 ? '#1a3a20' : sigmaLevel >= 2 ? '#3a2a10' : '#3a1010'
  const barPulse   = sigmaLevel < 2 ? `0 0 20px ${sigmaLevel < 1.5 ? 'rgba(255,50,50,0.25)' : 'rgba(255,150,0,0.15)'}` : 'none'
  const rctColor   = metrics.avgRequestCycleTime <= 32 ? '#00ff88' : metrics.avgRequestCycleTime <= 48 ? '#ffaa00' : '#ff4444'
  const swColor    = metrics.stonewallRate < 2 ? '#00ff88' : metrics.stonewallRate < 10 ? '#ffaa00' : '#ff4444'

  if (isMobile) {
    return (
      <div style={{
        background:'#07100a', borderBottom:'1px solid #1a3a20',
        flexShrink:0, fontFamily:'Barlow Condensed,sans-serif',
      }}>
        {/* Row 1: Title | Day | Phase | Controls */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'5px 10px', borderBottom:'1px solid #0d1f10',
        }}>
          <span style={{
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:17, letterSpacing:2, color:'#00ff88', flexShrink:0,
            textShadow:'0 0 10px rgba(0,255,136,0.3)',
          }}>LOG ACTUAL</span>

          <div style={{
            background:'#0d1f10', border:'1px solid #1a3a20', borderRadius:3,
            padding:'2px 8px', fontFamily:'Share Tech Mono,monospace',
            fontSize:13, color:'#00ff88', letterSpacing:1, flexShrink:0,
          }}>D{pad(currentDay)}/{totalDays}</div>

          {/* Campaign countdown pressure bar */}
          {(() => {
            const pct = (currentDay / totalDays) * 100
            const daysLeft = totalDays - currentDay
            const urgentColor = daysLeft <= 3 ? '#ff2200' : daysLeft <= 7 ? '#ff8800' : daysLeft <= 12 ? '#ffcc00' : '#00ff88'
            return (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, padding:'0 4px' }}>
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', width:`${pct}%`, borderRadius:2,
                    background:urgentColor,
                    boxShadow:`0 0 6px ${urgentColor}80`,
                    transition:'width 0.8s ease',
                    animation: daysLeft <= 3 ? 'sw-blink 0.6s infinite' : undefined,
                  }}/>
                </div>
                {daysLeft <= 7 && (
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:urgentColor, letterSpacing:1, textAlign:'center', animation: daysLeft <= 3 ? 'sw-blink 0.6s infinite' : undefined }}>
                    {daysLeft}D REMAINING
                  </div>
                )}
              </div>
            )
          })()}
          <div style={{
            padding:'2px 8px', borderRadius:3, flexShrink:0,
            background:`${phase.color}12`, border:`1px solid ${phase.color}40`,
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:13, letterSpacing:1, color:phase.color,
          }}>{phase.label}</div>

          <div style={{ flex:1 }}/>

          {/* Countdown ring */}
          <Countdown seconds={secondsToNextDay}/>

          {/* Pause */}
          <button onClick={isPaused ? resumeGame : pauseGame} style={{
            background: isPaused ? 'rgba(255,170,0,0.15)' : 'rgba(0,0,0,0.3)',
            border:`1px solid ${isPaused?'#ffaa00':'#1a3a20'}`,
            color: isPaused ? '#ffaa00' : '#1a5a3a',
            padding:'4px 8px', borderRadius:3, cursor:'pointer',
            fontFamily:'Share Tech Mono,monospace', fontSize:11, letterSpacing:1,
            WebkitTapHighlightColor:'transparent', flexShrink:0,
          }}>{isPaused ? '▶' : '⏸'}</button>

          {/* Skip */}
          <button onClick={advanceTurn} style={{
            background:'rgba(0,255,136,0.08)', border:'1px solid #1a4a2a',
            color:'#2a8a5a', padding:'4px 8px', borderRadius:3, cursor:'pointer',
            fontFamily:'Share Tech Mono,monospace', fontSize:11, letterSpacing:1,
            WebkitTapHighlightColor:'transparent', flexShrink:0,
          }}>SKIP</button>
        </div>

        {/* Row 2: Compact metrics strip - slim on mobile */}
        <div style={{
          display:'flex', padding:'2px 10px', gap:0,
          borderTop:'1px solid #0d1f10',
          background:'rgba(0,0,0,0.2)',
        }}>
          {[
            { label:'σ',    value:`${metrics.sigmaLevel.toFixed(1)}`,        color:sigmaColor },
            { label:'RCT',  value:`${metrics.avgRequestCycleTime}h`,         color:rctColor   },
            { label:'S/W',  value:`${metrics.stonewallRate.toFixed(0)}%`,    color:swColor    },
            { label:'RDNS', value:`${Math.round(metrics.avgReadiness??0)}%`, color: (metrics.avgReadiness??0)>70?'#00ff88':(metrics.avgReadiness??0)>50?'#ffaa00':'#ff4444' },
          ].map((m,i) => (
            <div key={m.label} style={{
              flex:1, textAlign:'center',
              borderLeft: i>0 ? '1px solid #0d1f10' : 'none',
              padding:'1px 4px',
            }}>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:7,
                color:'#2d5a32', letterSpacing:1 }}>{m.label} </span>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11,
                fontWeight:700, color:m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  const phaseDay = currentDay - phase.days[0] + 1
  const phaseLen = phase.days[1] - phase.days[0] + 1
  const phasePct = Math.round((phaseDay/phaseLen)*100)

  return (
    <div style={{
      background:barBg, borderBottom:`1px solid ${barBorder}`,
      display:'flex', alignItems:'center', padding:'0 14px',
      height:52, justifyContent:'space-between', gap:10, boxShadow:barPulse,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
          fontSize:22, letterSpacing:2, color:'#00ff88', flexShrink:0,
          textShadow:'0 0 12px rgba(0,255,136,0.4)' }}>LOG ACTUAL</span>

        <div style={{ background:'#0d1f10', border:'1px solid #1a3a20', borderRadius:3,
          padding:'2px 10px', fontFamily:'Share Tech Mono,monospace',
          fontSize:16, color:'#00ff88', letterSpacing:1, flexShrink:0 }}>
          D{pad(currentDay)}/{totalDays}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:1,
          padding:'2px 10px', borderRadius:3, flexShrink:0,
          background:`${phase.color}12`, border:`1px solid ${phase.color}40` }}>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:15, letterSpacing:1.5, color:phase.color, lineHeight:1.2 }}>
            {phase.full}
          </div>
          <div style={{ width:90, height:3, background:'rgba(255,255,255,.06)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ width:`${phasePct}%`, height:'100%', background:phase.color,
              borderRadius:2, transition:'width .8s ease' }}/>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Countdown seconds={secondsToNextDay}/>
        <button onClick={isPaused ? resumeGame : pauseGame} style={{
          background: isPaused ? 'rgba(255,170,0,0.15)' : 'rgba(0,0,0,0.3)',
          border:`1px solid ${isPaused?'#ffaa00':'#1a3a20'}`,
          color: isPaused ? '#ffaa00' : '#1a5a3a',
          padding:'3px 10px', borderRadius:3, cursor:'pointer',
          fontFamily:'Share Tech Mono,monospace', fontSize:13, letterSpacing:2,
        }}>{isPaused ? '▶ RESUME' : '⏸ PAUSE'}</button>
        <button onClick={advanceTurn} style={{
          background:'rgba(0,255,136,0.08)', border:'1px solid #1a4a2a',
          color:'#2a8a5a', padding:'3px 10px', borderRadius:3, cursor:'pointer',
          fontFamily:'Share Tech Mono,monospace', fontSize:13, letterSpacing:2,
        }}>SKIP →</button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        {[
          { label:'SIGMA', value:`${metrics.sigmaLevel.toFixed(1)}σ`, color:sigmaColor },
          { label:'RCT',   value:`${metrics.avgRequestCycleTime}h`,   color:rctColor  },
          { label:'S/W',   value:`${metrics.stonewallRate.toFixed(0)}%`, color:swColor },
          { label:'RDNS',  value:`${Math.round(metrics.avgReadiness??0)}%`, color:(metrics.avgReadiness??0)>70?'#00ff88':(metrics.avgReadiness??0)>50?'#ffaa00':'#ff4444' },
        ].map(m => (
          <div key={m.label} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'#1a5a3a', letterSpacing:1 }}>{m.label}</div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:19, color:m.color, fontWeight:700, lineHeight:1.2 }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
