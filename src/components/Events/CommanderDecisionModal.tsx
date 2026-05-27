import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'

// ── WORST OPTION SELECTOR ─────────────────────────────────────────────────────
function getWorstOption(options: any[]): any {
  if (!options?.length) return null
  // Prefer CRITICAL risk, then HIGH risk non-doctrine
  const critical = options.find(o => o.risk === 'CRITICAL')
  if (critical) return critical
  const high = options.find(o => o.risk === 'HIGH' && !o.isDoctrineCorrect)
  if (high) return high
  const nonDoc = options.find(o => !o.isDoctrineCorrect)
  if (nonDoc) return nonDoc
  return options[options.length - 1]
}

const TIMER_SECONDS = 10

interface Props {
  event: any
  onResolved: () => void
}

export default function CommanderDecisionModal({ event, onResolved }: Props) {
  const applyEventResponse = useGameStore(s => (s as any).applyEventResponse)

  const [timeLeft, setTimeLeft]       = useState(TIMER_SECONDS)
  const [selected, setSelected]       = useState<any>(null)
  const [timedOut, setTimedOut]       = useState(false)
  const [resolving, setResolving]     = useState(false)
  const [hoveredId, setHoveredId]     = useState<string|null>(null)
  const intervalRef                   = useRef<any>(null)
  const worst                         = getWorstOption(event.responseOptions || [])

  // Don't pause — game keeps running while you decide
  // The 10-second modal timer creates urgency without blocking day advancement

  // Countdown
  useEffect(() => {
    if (selected || resolving) return
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [selected, resolving])

  const handleTimeout = useCallback(() => {
    clearInterval(intervalRef.current)
    setTimedOut(true)
    setResolving(true)
    setTimeout(() => {
      if (worst && applyEventResponse) applyEventResponse(event.id, worst)
      else if (applyEventResponse) applyEventResponse(event.id, { label:'NO RESPONSE', effects:[], consequence:'Commander failed to respond. Worst outcome applied by default.' })
      setTimeout(() => { onResolved() }, 1800)
    }, 1200)
  }, [worst, event, applyEventResponse])

  const handleSelect = useCallback((option: any) => {
    if (selected || resolving) return
    clearInterval(intervalRef.current)
    setSelected(option)
    setResolving(true)
    setTimeout(() => {
      if (applyEventResponse) applyEventResponse(event.id, option)
      setTimeout(() => { onResolved() }, 1200)
    }, 600)
  }, [selected, resolving, event, applyEventResponse])

  const options: any[] = event.responseOptions || []
  const pct = (timeLeft / TIMER_SECONDS) * 100
  const timerColor = timeLeft <= 3 ? '#ff2200' : timeLeft <= 6 ? '#ff8800' : '#ffcc00'
  const circumference = 2 * Math.PI * 40

  const priorityColor = event.priority === 'FLASH' ? '#ff2200' : event.priority === 'IMMEDIATE' ? '#ff8800' : '#ffaa00'

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:900,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.88)',
      animation:'cdm-in .25s ease',
    }}>
      <style>{`
        @keyframes cdm-in    { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes cdm-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,34,0,.5)} 50%{box-shadow:0 0 0 16px rgba(255,34,0,0)} }
        @keyframes cdm-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @keyframes cdm-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      <div style={{
        width: 'min(520px, 94vw)',
        background:'#060d08',
        border:`2px solid ${timedOut?'#ff2200':priorityColor}`,
        borderRadius:6,
        boxShadow:`0 0 60px ${timedOut?'rgba(255,34,0,.4)':priorityColor+'44'}`,
        overflow:'hidden',
        animation: timedOut ? 'cdm-shake .4s ease' : undefined,
      }}>

        {/* Header */}
        <div style={{
          background: timedOut ? 'rgba(50,0,0,.95)' : `${priorityColor}15`,
          borderBottom:`1px solid ${timedOut?'#ff220060':priorityColor+'40'}`,
          padding:'8px 14px', display:'flex', alignItems:'center', gap:10,
        }}>
          <div style={{
            fontFamily:'Share Tech Mono,monospace', fontSize:10, letterSpacing:3,
            color: timedOut ? '#ff4444' : priorityColor,
            animation: timedOut ? 'cdm-blink .4s infinite' : 'cdm-blink .8s infinite',
          }}>
            {timedOut ? '⚠ COMMANDER FAILED TO RESPOND' : `⚠ ${event.priority} — COMMANDER DECISION REQUIRED`}
          </div>
        </div>

        {/* Event summary */}
        <div style={{ padding:'14px 18px 10px', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style={{
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:20, letterSpacing:1, color:'#ffffff', marginBottom:6,
          }}>
            {event.title}
          </div>
          <p style={{
            fontFamily:'Barlow,sans-serif', fontSize:13, lineHeight:1.65,
            color:'#88aa88', margin:0,
          }}>
            {/* Show first 180 chars of report */}
            {(event.report || '').slice(0, 200)}{event.report?.length > 200 ? '...' : ''}
          </p>
        </div>

        {/* Timer + options */}
        <div style={{ padding:'14px 18px 18px' }}>

          {/* Countdown */}
          {!selected && !timedOut && (
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ position:'relative', width:90, height:90, flexShrink:0 }}>
                <svg viewBox="0 0 90 90" style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="5"/>
                  <circle cx="45" cy="45" r="40" fill="none" stroke={timerColor} strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - pct/100)}
                    strokeLinecap="round"
                    style={{ transition:'stroke-dashoffset 1s linear, stroke .3s' }}/>
                </svg>
                <div style={{
                  position:'absolute', inset:0, display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                }}>
                  <span style={{
                    fontFamily:'Share Tech Mono,monospace', fontSize:30, fontWeight:700,
                    color:timerColor, lineHeight:1,
                    animation: timeLeft <= 3 ? 'cdm-blink .4s infinite' : undefined,
                  }}>{timeLeft}</span>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#2a5a3a', letterSpacing:1 }}>SEC</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontSize:16, color:'#ffcc00', fontWeight:700, marginBottom:4 }}>
                  SELECT A RESPONSE
                </div>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#1a4a2a', lineHeight:1.6 }}>
                  No decision in {timeLeft} seconds.<br/>
                  <span style={{ color:'#ff4444' }}>Worst outcome will be applied automatically.</span>
                </div>
              </div>
            </div>
          )}

          {/* Timed out banner */}
          {timedOut && (
            <div style={{
              padding:'12px 16px', marginBottom:14,
              background:'rgba(80,0,0,.6)', border:'1px solid #ff220060', borderRadius:4,
              fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'#ff6644',
              letterSpacing:1, textAlign:'center',
              animation:'cdm-blink .6s infinite',
            }}>
              NO RESPONSE — {worst?.label || 'WORST OUTCOME'} APPLIED BY DEFAULT
            </div>
          )}

          {/* Selected banner */}
          {selected && (
            <div style={{
              padding:'12px 16px', marginBottom:14,
              background:'rgba(0,40,0,.6)', border:'1px solid #00ff8840', borderRadius:4,
              fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'#00ff88',
              letterSpacing:1, textAlign:'center',
            }}>
              ✓ {selected.label} — EXECUTING
            </div>
          )}

          {/* Response options */}
          {!resolving && options.map(opt => {
            const riskColor = opt.risk==='CRITICAL'?'#ff2200':opt.risk==='HIGH'?'#ff6600':opt.risk==='MEDIUM'?'#ffaa00':'#00ff88'
            const isWorst   = opt.id === worst?.id
            const isHovered = hoveredId === opt.id
            return (
              <button key={opt.id}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHoveredId(opt.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width:'100%', display:'block', textAlign:'left',
                  marginBottom:8, padding:'11px 14px',
                  background: isWorst && timeLeft <= 4
                    ? `rgba(255,34,0,0.15)`
                    : isHovered ? `${riskColor}15` : `${riskColor}06`,
                  border:`1px solid ${isWorst && timeLeft<=4 ? '#ff2200' : riskColor}${isHovered?'':'50'}`,
                  borderRadius:4, cursor:'pointer',
                  transition:'all .15s',
                  animation: isWorst && timeLeft <= 3 ? 'cdm-pulse 1s infinite' : undefined,
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:15, color:riskColor, letterSpacing:1 }}>
                    {opt.id}. {opt.label}
                    {isWorst && timeLeft <= 4 && <span style={{ marginLeft:8, fontSize:10, color:'#ff4444', animation:'cdm-blink .4s infinite' }}> ← DEFAULT IF NO RESPONSE</span>}
                  </span>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:riskColor, padding:'2px 7px', border:`1px solid ${riskColor}40`, borderRadius:2 }}>
                    {opt.risk}
                  </span>
                </div>
                <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'#6a9a7a', lineHeight:1.5, marginBottom:4 }}>
                  {opt.description}
                </div>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#ff8844', lineHeight:1.4 }}>
                  CONSEQUENCE: {opt.consequence?.slice(0,120)}{opt.consequence?.length>120?'...':''}
                </div>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#2a5a3a', marginTop:3 }}>
                  COST: {opt.cost}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
