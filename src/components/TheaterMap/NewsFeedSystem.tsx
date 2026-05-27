import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useGameStore } from '../../store/gameStore'
import AudioEngine from '../../engine/AudioEngine'

// ── LAYER 1: SCROLLING TICKER (ROUTINE) ──────────────────────────────────────
function TickerBar({ events }: { events: any[] }) {
  if (events.length === 0) return null
  const text = events.slice(0, 12).map(e => e.title).join('   ◆   ')
  const duration = Math.max(18, text.length * 0.07) + 's'

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 150,
      background: 'rgba(3,10,5,0.88)',
      borderTop: '1px solid #1a3a20',
      height: 26, overflow: 'hidden',
      display: 'flex', alignItems: 'center',
    }}>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(100vw) }
          100% { transform: translateX(-100%) }
        }
      `}</style>

      {/* INTEL label */}
      <div style={{
        flexShrink: 0, padding: '0 8px',
        background: '#0d1f10', borderRight: '1px solid #1a3a20',
        height: '100%', display: 'flex', alignItems: 'center',
        fontFamily: 'Share Tech Mono,monospace', fontSize: 9,
        letterSpacing: 2, color: '#2ecc71',
      }}>INTEL</div>

      {/* Scrolling text */}
      <div style={{ flex: 1, overflow: 'hidden', height: '100%', position: 'relative' }}>
        <div style={{
          position: 'absolute', whiteSpace: 'nowrap',
          top: '50%', transform: 'translateY(-50%)',
          animation: `ticker-scroll ${duration} linear infinite`,
          fontFamily: 'Share Tech Mono,monospace', fontSize: 10,
          color: '#4a8a54', letterSpacing: 0.5,
        }}>
          {text}
        </div>
      </div>
    </div>
  )
}

// ── LAYER 2: TOAST NOTIFICATIONS (PRIORITY / IMMEDIATE) ──────────────────────
interface Toast { id: string; title: string; body: string; priority: string; ts: number }

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id:string)=>void }) {
  const PRI_COLOR: Record<string,string> = {
    PRIORITY: '#f39c12', IMMEDIATE: '#ff6600',
  }
  return (
    <div style={{
      position: 'absolute', bottom: 34, right: 10, zIndex: 160,
      display: 'flex', flexDirection: 'column-reverse', gap: 6,
      maxWidth: 280, pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toast-in  { from { transform:translateX(120%); opacity:0 } to { transform:translateX(0); opacity:1 } }
        @keyframes toast-out { from { opacity:1 } to { opacity:0; transform:translateY(8px) } }
      `}</style>
      {toasts.map(t => {
        const c = PRI_COLOR[t.priority] || '#f39c12'
        const age = Date.now() - t.ts
        const fading = age > 2400
        return (
          <div key={t.id} style={{
            background: 'rgba(3,10,5,0.96)', border: `1px solid ${c}60`,
            borderLeft: `3px solid ${c}`, borderRadius: 4,
            padding: '8px 10px', pointerEvents: 'all',
            animation: fading ? 'toast-out 0.6s ease forwards' : 'toast-in 0.25s ease',
            boxShadow: `0 0 16px ${c}22, 0 4px 12px rgba(0,0,0,0.6)`,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 3 }}>
              <div style={{
                fontFamily: 'Share Tech Mono,monospace', fontSize: 8,
                color: c, letterSpacing: 2,
              }}>{t.priority}</div>
              <button onClick={() => onDismiss(t.id)} style={{
                background: 'transparent', border: 'none', color: '#2d5a32',
                fontSize: 12, cursor: 'pointer', lineHeight: 1, padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}>✕</button>
            </div>
            <div style={{
              fontFamily: 'Barlow Condensed,sans-serif', fontWeight: 700,
              fontSize: 13, color: '#c8e6c9', letterSpacing: 0.5, marginBottom: 2,
            }}>{t.title}</div>
            {t.body && (
              <div style={{
                fontFamily: 'Barlow,sans-serif', fontSize: 11,
                color: '#4a7a54', lineHeight: 1.4,
              }}>{t.body.slice(0, 100)}{t.body.length > 100 ? '…' : ''}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── LAYER 3: FLASH INTERRUPT (FLASH) ─────────────────────────────────────────
export function FlashModal({ event, onDismiss }: { event: any; onDismiss: ()=>void }) {
  const advanceTurn = useGameStore(s => s.advanceTurn)

  const modal = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(2,6,3,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
    }}>
      <style>{`@keyframes flash-border { 0%,100%{border-color:#ff4444} 50%{border-color:#ff000066} }`}</style>

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(8,4,4,0.98)', border: '2px solid #ff4444',
        borderRadius: 6, overflow: 'hidden',
        animation: 'flash-border 1.2s ease infinite',
        boxShadow: '0 0 40px rgba(255,68,68,0.3), 0 8px 32px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255,68,68,0.15)', borderBottom: '1px solid #ff444440',
          padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              background: '#ff4444', color: '#fff', fontFamily: 'Share Tech Mono,monospace',
              fontSize: 9, letterSpacing: 3, padding: '3px 8px', borderRadius: 2,
            }}>◉ FLASH</div>
            <div style={{ fontFamily: 'Share Tech Mono,monospace', fontSize: 9,
              color: '#ff444488', letterSpacing: 1 }}>IMMEDIATE ACTION REQUIRED</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 14px' }}>
          <div style={{
            fontFamily: 'Barlow Condensed,sans-serif', fontWeight: 700,
            fontSize: 20, color: '#ff6644', letterSpacing: 1, marginBottom: 10, lineHeight: 1.2,
          }}>{event.title}</div>
          <div style={{
            fontFamily: 'Barlow,sans-serif', fontSize: 14, color: '#c8a8a8',
            lineHeight: 1.7, marginBottom: 14,
          }}>{event.report || event.body || ''}</div>

          {/* Response options if present */}
          {event.responseOptions?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'Share Tech Mono,monospace', fontSize: 9,
                color: '#ff444466', letterSpacing: 2, marginBottom: 8 }}>SELECT RESPONSE:</div>
              {event.responseOptions.map((opt: any) => (
                <button key={opt.id} onClick={() => {
                  try {
                    const respond = (useGameStore.getState() as any).respondToEvent
                    if (respond) respond(event.id, opt)
                  } catch(e) {}
                  onDismiss()
                }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  marginBottom: 6, padding: '8px 12px',
                  background: 'rgba(255,68,68,0.08)', border: '1px solid #ff444440',
                  color: '#ff8866', borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'Barlow Condensed,sans-serif', fontSize: 14, letterSpacing: 1,
                  WebkitTapHighlightColor: 'transparent',
                }}>{opt.label}</button>
              ))}
            </div>
          )}

          <button onClick={onDismiss} style={{
            width: '100%', padding: '10px 0',
            background: 'rgba(255,68,68,0.12)', border: '1px solid #ff4444',
            color: '#ff4444', fontFamily: 'Barlow Condensed,sans-serif',
            fontWeight: 700, fontSize: 15, letterSpacing: 2, borderRadius: 4,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}>ACKNOWLEDGE</button>
        </div>
      </div>
    </div>
  )
  // Portal to document.body — escapes ALL parent transforms/overflow/containment
  return ReactDOM.createPortal(modal, document.body)
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function NewsFeedSystem() {
  const events = useGameStore(s => (s as any).appliedBattlefieldEvents || []) as any[]

  const [seenIds, setSeenIds]       = useState<Set<string>>(new Set())
  const [toasts, setToasts]         = useState<Toast[]>([])
  const [flashEvent, setFlashEvent] = useState<any>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Split by priority
  const routineEvents  = events.filter(e => e.priority === 'ROUTINE')

  // Watch for new non-routine events
  useEffect(() => {
    events.forEach(ev => {
      if (seenIds.has(ev.id)) return
      setSeenIds(prev => new Set([...prev, ev.id]))

      if (ev.priority === 'FLASH' || ev.priority === 'IMMEDIATE') {
        AudioEngine.resume()
        AudioEngine.playAlert('FLASH')
        if (!flashEvent) setFlashEvent(ev)
      } else if (ev.priority === 'PRIORITY') {
        AudioEngine.playAlert('PRIORITY')
        const toast: Toast = {
          id: ev.id,
          title: ev.title,
          body: ev.report || ev.body || '',
          priority: ev.priority,
          ts: Date.now(),
        }
        setToasts(prev => [...prev.slice(-3), toast]) // max 3 at a time

        // Auto-dismiss after 3s
        const t = setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== ev.id))
        }, 3200)
        timerRef.current.push(t)
      }
    })
  }, [events])

  useEffect(() => {
    return () => timerRef.current.forEach(clearTimeout)
  }, [])

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <>
      <TickerBar events={routineEvents} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
