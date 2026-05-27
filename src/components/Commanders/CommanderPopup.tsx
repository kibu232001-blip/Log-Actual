import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { CommanderEvent, CDR_MAP } from '../../data/Commanders'
import AudioEngine from '../../engine/AudioEngine'

function Portrait({ style, color }: { style: string; color: string }) {
  const extras: Record<string, string> = {
    CDR:`<rect x="26" y="14" width="28" height="6" rx="2" fill="${color}" opacity="0.6"/><circle cx="29" cy="54" r="3" fill="${color}" opacity="0.5"/><circle cx="40" cy="54" r="3" fill="${color}" opacity="0.5"/><circle cx="51" cy="54" r="3" fill="${color}" opacity="0.5"/>`,
    SGM:`<path d="M24,56 L40,48 L56,56" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.6"/><path d="M24,62 L40,54 L56,62" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.6"/>`,
    S4:`<rect x="30" y="50" width="20" height="14" rx="2" fill="${color}" opacity="0.4"/><line x1="33" y1="55" x2="47" y2="55" stroke="${color}" stroke-width="1.5" opacity="0.7"/>`,
    ENEMY_GEN:`<path d="M20,48 L60,48 L60,68 L20,68 Z" fill="${color}" opacity="0.3"/><path d="M26,54 L54,54" stroke="${color}" stroke-width="2.5" opacity="0.7"/><path d="M26,60 L54,60" stroke="${color}" stroke-width="2.5" opacity="0.7"/><circle cx="40" cy="46" r="4" fill="${color}" opacity="0.6"/>`,
    ENEMY_COL:`<path d="M24,50 L56,50 L56,68 L24,68 Z" fill="${color}" opacity="0.25"/><path d="M28,56 L52,56" stroke="${color}" stroke-width="2" opacity="0.6"/><circle cx="32" cy="53" r="2.5" fill="${color}" opacity="0.6"/><circle cx="48" cy="53" r="2.5" fill="${color}" opacity="0.6"/>`,
  }
  const svg = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="22" r="14" fill="${color}" opacity="0.9"/><path d="M14,72 Q14,45 40,45 Q66,45 66,72" fill="${color}" opacity="0.85"/>${extras[style]||extras['CDR']}</svg>`
  return <div style={{ width:56, height:56 }} dangerouslySetInnerHTML={{ __html: svg }}/>
}

function TypeLine({ text, onDone }: { text:string; onDone:()=>void }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown(''); let i=0
    AudioEngine.resume()
    AudioEngine.playConvoyDispatch()
    const t = setInterval(() => {
      i++; setShown(text.slice(0,i))
      if (i % 3 === 0) AudioEngine.playTick(false)
      if(i>=text.length){ clearInterval(t); setTimeout(onDone,500) }
    }, 24)
    return () => clearInterval(t)
  }, [text])
  return <span>{shown}<span style={{ animation:'cdr-blink .7s infinite' }}>▮</span></span>
}

interface Props { event: CommanderEvent; onAction:(e:CommanderEvent)=>void; onDismiss:(e:CommanderEvent)=>void }

export default function CommanderPopup({ event, onAction, onDismiss }: Props) {
  const cdr = CDR_MAP[event.commanderId]
  if (!cdr) return null
  const [lineIdx, setLineIdx] = useState(0)
  const [allDone, setAllDone] = useState(false)
  const isEnemy = cdr.side === 'ENEMY'
  const bc = isEnemy ? '#ff3300' : cdr.color
  const isMobile = window.innerWidth < 768

  const advance = useCallback(() => {
    if (lineIdx < event.lines.length-1) setLineIdx(l=>l+1)
    else setAllDone(true)
  }, [lineIdx, event.lines.length])

  useEffect(() => { const t=setTimeout(()=>setAllDone(true),10000); return()=>clearTimeout(t) }, [])

  const popup = (
    <>
      <style>{`
        @keyframes cdr-slide-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cdr-blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes cdr-enemy-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,51,0,.5)}50%{box-shadow:0 0 0 10px rgba(255,51,0,0)}}
        @keyframes cdr-friendly-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,.3)}50%{box-shadow:0 0 0 8px rgba(0,255,136,0)}}
      `}</style>

      {/* Mobile backdrop */}
      {isMobile && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:8998 }}
          onClick={allDone ? ()=>onDismiss(event) : undefined}/>
      )}

      {/* Popup card */}
      <div style={{
        position: 'fixed',
        zIndex: 8999,
        animation: 'cdr-slide-in .35s cubic-bezier(.16,1,.3,1)',
        // MOBILE: centered, full width with padding
        ...(isMobile ? {
          left: 12, right: 12, bottom: 100,
          width: 'auto',
        } : {
          // DESKTOP: bottom-right corner
          bottom: 80, right: 340, width: 420,
        }),
      }}>
        <div style={{
          background: isEnemy?'rgba(25,3,3,.97)':'rgba(3,18,6,.97)',
          border:`2px solid ${bc}`, borderRadius:4, overflow:'hidden',
          boxShadow:`0 8px 40px rgba(0,0,0,.8),0 0 30px ${bc}25`,
          animation: isEnemy?'cdr-enemy-pulse 1.5s infinite':'cdr-friendly-pulse 2s infinite',
        }}>
          {/* Header */}
          <div style={{ background:isEnemy?'rgba(40,6,6,.9)':'rgba(6,24,10,.9)', borderBottom:`1px solid ${bc}40`, padding:'7px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:bc, boxShadow:`0 0 7px ${bc}`, animation:'cdr-blink .9s infinite' }}/>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:isMobile?11:14, letterSpacing:2, color:isEnemy?'#ff8866':'#2a8a5a' }}>
                {isEnemy ? '⚠ ENEMY CONTACT' : '▶ FRIENDLY COMMS'}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:bc, letterSpacing:1 }}>{event.priority}</span>
              {/* Quick dismiss on mobile */}
              {isMobile && (
                <button onClick={()=>onDismiss(event)} style={{ background:'transparent', border:`1px solid ${bc}40`, color:`${bc}80`, padding:'2px 6px', fontSize:11, borderRadius:2, cursor:'pointer', fontFamily:'Share Tech Mono,monospace' }}>✕</button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ flexShrink:0, border:`2px solid ${bc}50`, borderRadius:'50%', padding:3, background:`${bc}0a`, boxShadow:`0 0 14px ${bc}25` }}>
              <Portrait style={cdr.portraitStyle} color={bc}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:isMobile?20:24, color:bc, letterSpacing:1, marginBottom:1 }}>{cdr.name}</div>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:`${bc}70`, letterSpacing:1, marginBottom:8 }}>{cdr.rank} — {cdr.role}</div>
              <div style={{ background:`${bc}08`, border:`1px solid ${bc}20`, borderRadius:'0 8px 8px 8px', padding:'10px 12px', position:'relative' }}>
                <div style={{ position:'absolute', left:-7, top:10, width:0, height:0, borderTop:'6px solid transparent', borderBottom:'6px solid transparent', borderRight:`7px solid ${bc}20` }}/>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:isMobile?16:20, lineHeight:1.75, color:isEnemy?'#ffcccc':'#c8e6c9', margin:0 }}>
                  <TypeLine key={lineIdx} text={event.lines[lineIdx]} onDone={advance}/>
                </p>
                <div style={{ display:'flex', gap:4, marginTop:8 }}>
                  {event.lines.map((_,i)=>(
                    <div key={i} style={{ width:i===lineIdx?16:5, height:4, borderRadius:2, background:i<=lineIdx?bc:`${bc}20`, transition:'all .3s' }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding:'0 14px 6px', fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:14, letterSpacing:2, color:`${bc}55` }}>{event.title}</div>

          {allDone && (
            <div style={{ padding:'10px 14px 14px', borderTop:`1px solid ${bc}20`, display:'flex', gap:8 }}>
              {event.actionLabel && (
                <button onClick={()=>onAction(event)} style={{ flex:1, padding:'9px 0', background:`${bc}18`, border:`2px solid ${bc}`, color:bc, fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:isMobile?15:18, letterSpacing:2, borderRadius:3, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                  {event.actionLabel}
                </button>
              )}
              <button onClick={()=>onDismiss(event)} style={{ padding:'9px 14px', background:'transparent', border:'1px solid #1a3a20', color:'#2a5a3a', fontFamily:'Barlow Condensed,sans-serif', fontSize:isMobile?13:16, borderRadius:3, cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                {event.dismissLabel || 'ACKNOWLEDGED'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )

  // Portal to body — escapes all parent transforms and overflow
  return ReactDOM.createPortal(popup, document.body)
}
