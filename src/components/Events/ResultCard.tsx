import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import AudioEngine from '../../engine/AudioEngine'

function OdometerValue({ target, color, prefix='' }: { target: number; color: string; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 900
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = progress * (2 - progress) // ease-out quad
      setDisplay(Math.round(ease * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  const sign = target >= 0 ? '+' : ''
  return (
    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:22, fontWeight:700, color }}>
      {prefix}{sign}{display}
    </span>
  )
}

export default function ResultCard() {
  const { lastDecisionResult, showResultCard, dismissResult } = useGameStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (showResultCard && lastDecisionResult) {
      setVisible(false)
      setTimeout(() => setVisible(true), 50)
      // Audio feedback
      AudioEngine.resume()
      if (lastDecisionResult.outcome === 'OPTIMAL') AudioEngine.playDecisionCorrect()
      else if (lastDecisionResult.outcome === 'FAILURE') {
        AudioEngine.playDecisionWrong()
        window.dispatchEvent(new CustomEvent('TRIGGER_SCREEN_SHAKE', { detail: { intensity: 8 } }))
      } else {
        AudioEngine.playConvoyDispatch()
      }
    }
  }, [showResultCard, lastDecisionResult])

  if (!showResultCard || !lastDecisionResult) return null

  const isOptimal  = lastDecisionResult.outcome === 'OPTIMAL'
  const isFailure  = lastDecisionResult.outcome === 'FAILURE'
  const borderColor = isOptimal  ? '#00ff88'
                    : lastDecisionResult.outcome === 'ACCEPTABLE'   ? '#f39c12'
                    : lastDecisionResult.outcome === 'SUBOPTIMAL'   ? '#ff6600'
                    : '#ff2200'

  const label = isOptimal  ? '✓ DOCTRINE CORRECT'
              : lastDecisionResult.outcome === 'ACCEPTABLE'  ? '↗ ACCEPTABLE'
              : lastDecisionResult.outcome === 'SUBOPTIMAL'  ? '↘ SUBOPTIMAL'
              : '✗ DOCTRINE FAILURE'

  // Extract numeric effects for odometer display
  const readinessDelta = lastDecisionResult.effects
    ?.filter((e:any) => e.type === 'READINESS' || e.type === 'READINESS_DELTA')
    .reduce((acc:number, e:any) => acc + (e.delta || e.magnitude || 0), 0) || 0

  const rctDelta = lastDecisionResult.effects
    ?.filter((e:any) => e.type === 'RCT' || e.type === 'RCT_DELTA')
    .reduce((acc:number, e:any) => acc + (e.delta || e.magnitude || 0), 0) || 0

  const sigmaDelta = lastDecisionResult.effects
    ?.filter((e:any) => e.type === 'SIGMA')
    .reduce((acc:number, e:any) => acc + (e.delta || 0), 0) || 0

  return (
    <div style={{
      position:'fixed', inset:0,
      background: isFailure ? 'rgba(20,0,0,0.95)' : 'rgba(3,12,6,0.95)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:950,
      opacity: visible ? 1 : 0, transition:'opacity 0.3s ease',
    }}>
      <div style={{
        background: isFailure ? '#140404' : '#0d1f0f',
        border:`2px solid ${borderColor}`,
        borderRadius:6, padding:24, maxWidth:420, width:'94%',
        boxShadow:`0 0 60px ${borderColor}22, 0 0 120px ${borderColor}11`,
        animation: isFailure ? 'sw-critical 1.5s ease infinite' : undefined,
      }}>
        <style>{`@keyframes sw-critical{0%,100%{box-shadow:0 0 60px ${borderColor}22}50%{box-shadow:0 0 80px ${borderColor}55}}`}</style>

        {/* Outcome badge */}
        <div style={{
          display:'flex', alignItems:'center', gap:10, marginBottom:14,
          paddingBottom:12, borderBottom:`1px solid ${borderColor}30`,
        }}>
          <div style={{
            padding:'4px 12px', borderRadius:3,
            background:`${borderColor}18`, border:`1px solid ${borderColor}60`,
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:16, letterSpacing:2, color:borderColor,
          }}>{label}</div>
        </div>

        {/* Doctrine note */}
        <div style={{
          fontFamily:'Barlow,sans-serif', fontSize:13,
          color: isFailure ? '#aa7070' : '#7aab7e',
          lineHeight:1.65, marginBottom:16,
        }}>{lastDecisionResult.doctrineNote}</div>

        {/* Odometer metrics */}
        {(readinessDelta !== 0 || rctDelta !== 0 || sigmaDelta !== 0) && (
          <div style={{
            display:'flex', gap:8, marginBottom:16,
            padding:'10px 12px', background:'rgba(0,0,0,0.3)',
            borderRadius:4, border:`1px solid ${borderColor}20`,
          }}>
            {readinessDelta !== 0 && (
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#2d5a32', letterSpacing:2, marginBottom:4 }}>READINESS</div>
                <OdometerValue target={readinessDelta} color={readinessDelta >= 0 ? '#00ff88' : '#ff4444'} />
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#1a3a20' }}>%</div>
              </div>
            )}
            {rctDelta !== 0 && (
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#2d5a32', letterSpacing:2, marginBottom:4 }}>RCT DELTA</div>
                <OdometerValue target={rctDelta} color={rctDelta <= 0 ? '#00ff88' : '#ff4444'} />
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#1a3a20' }}>h</div>
              </div>
            )}
            {sigmaDelta !== 0 && (
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#2d5a32', letterSpacing:2, marginBottom:4 }}>SIGMA</div>
                <OdometerValue target={Math.round(sigmaDelta * 10)} color={sigmaDelta >= 0 ? '#00ff88' : '#ff4444'} prefix={sigmaDelta >= 0 ? '+' : ''} />
                <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#1a3a20' }}>×0.1σ</div>
              </div>
            )}
          </div>
        )}

        {/* Effect descriptions */}
        <div style={{ marginBottom:16 }}>
          {lastDecisionResult.effects?.map((e:any, i:number) => (
            <div key={i} style={{
              display:'flex', gap:8, alignItems:'flex-start',
              padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)',
              fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#4a7a54',
              lineHeight:1.5,
            }}>
              <span style={{ color:borderColor, flexShrink:0 }}>▶</span>
              <span>{e.description}</span>
            </div>
          ))}
        </div>

        <button onClick={dismissResult} style={{
          width:'100%', padding:'10px 0',
          background:`${borderColor}18`, border:`1px solid ${borderColor}`,
          color:borderColor, fontFamily:'Barlow Condensed,sans-serif',
          fontWeight:700, fontSize:15, letterSpacing:2, borderRadius:4, cursor:'pointer',
          WebkitTapHighlightColor:'transparent',
        }}>ACKNOWLEDGED →</button>
      </div>
    </div>
  )
}
