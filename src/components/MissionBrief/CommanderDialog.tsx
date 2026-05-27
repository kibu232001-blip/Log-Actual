import React, { useState, useEffect, useCallback } from 'react'
import { BriefingTeam, BriefingCharacter, BriefingSection } from '../../data/briefingTeams'

// SVG portrait per style
function Portrait({ style, color }: { style: string; color: string }) {
  const extras: Record<string,string> = {
    CDR:         `<rect x="26" y="13" width="28" height="6" rx="2" fill="${color}" opacity=".6"/><circle cx="29" cy="54" r="4" fill="${color}" opacity=".5"/><circle cx="40" cy="54" r="4" fill="${color}" opacity=".5"/><circle cx="51" cy="54" r="4" fill="${color}" opacity=".5"/>`,
    SGM:         `<path d="M22,56 L40,46 L58,56" fill="none" stroke="${color}" stroke-width="3" opacity=".6"/><path d="M22,63 L40,53 L58,63" fill="none" stroke="${color}" stroke-width="3" opacity=".6"/>`,
    S4:          `<rect x="28" y="48" width="24" height="18" rx="2" fill="${color}" opacity=".35"/><line x1="32" y1="55" x2="48" y2="55" stroke="${color}" stroke-width="2" opacity=".7"/><line x1="32" y1="60" x2="48" y2="60" stroke="${color}" stroke-width="2" opacity=".7"/>`,
    FEMALE_CDR:  `<rect x="26" y="13" width="28" height="5" rx="2" fill="${color}" opacity=".6"/><ellipse cx="40" cy="54" rx="12" ry="8" fill="${color}" opacity=".2"/><circle cx="33" cy="52" r="3" fill="${color}" opacity=".5"/><circle cx="47" cy="52" r="3" fill="${color}" opacity=".5"/>`,
    WARRANT:     `<path d="M28,50 L52,50 L52,68 L28,68 Z" fill="${color}" opacity=".2"/><path d="M32,56 L48,56" stroke="${color}" stroke-width="2.5" opacity=".7"/><circle cx="40" cy="47" r="5" fill="${color}" opacity=".4"/>`,
    ALLIED:      `<rect x="24,48" width="32" height="20" rx="1" fill="${color}" opacity=".15"/><path d="M28,54 L52,54" stroke="${color}" stroke-width="2" opacity=".6"/><path d="M28,60 L52,60" stroke="${color}" stroke-width="2" opacity=".4"/><rect x="36" y="44" width="8" height="10" fill="${color}" opacity=".5"/>`,
  }
  const svg = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="22" r="15" fill="${color}" opacity=".9"/><path d="M12,74 Q12,44 40,44 Q68,44 68,74" fill="${color}" opacity=".85"/>${extras[style]??extras.CDR}</svg>`
  return <div style={{ width:80, height:80 }} dangerouslySetInnerHTML={{ __html:svg }}/>
}

function TypeWriter({ text, speed=26, onDone }: { text:string; speed?:number; onDone:()=>void }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown(''); let i=0
    const t = setInterval(()=>{ i++; setShown(text.slice(0,i)); if(i>=text.length){clearInterval(t);setTimeout(onDone,500)} }, speed)
    return ()=>clearInterval(t)
  }, [text])
  return <span>{shown}<span style={{animation:'dlg-blink .7s infinite'}}>▮</span></span>
}

function speakLine(text: string, char: BriefingCharacter) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate  = char.voice.rate
  utter.pitch = char.voice.pitch
  utter.volume = 0.85
  const voices = window.speechSynthesis.getVoices()
  const match = voices.find(v =>
    v.lang.startsWith('en') &&
    (char.voice.gender === 'F' ? /female|zira|samantha|karen|moira|fiona|victoria/i.test(v.name)
                               : /male|david|daniel|mark|alex|fred/i.test(v.name))
  ) ?? voices.find(v => v.lang.startsWith('en'))
  if (match) utter.voice = match
  window.speechSynthesis.speak(utter)
}

interface Props {
  team: BriefingTeam
  activeTab: string
  onClose?: () => void
  scenarioId?: string
}

export default function CommanderDialog({ team, activeTab, onClose, scenarioId }: Props) {
  const section: BriefingSection | undefined = team.sections.find(s => s.tab === activeTab)
  const char: BriefingCharacter | undefined  = section ? team.characters.find(c => c.id === section.speakerId) : undefined

  const [lineIdx, setLineIdx] = useState(0)
  const [done, setDone]       = useState(false)

  // Reset when section changes
  useEffect(() => { setLineIdx(0); setDone(false) }, [activeTab])

  const advance = useCallback(() => {
    if (!section) return
    if (lineIdx < section.lines.length - 1) { setLineIdx(l=>l+1); setDone(false) }
    else setDone(true)
  }, [lineIdx, section])

  useEffect(() => {
    if (!section || !char) return
    const line = section.lines[lineIdx]
    if (line) speakLine(line, char)
  }, [lineIdx, activeTab])

  if (!section || !char) return null

  const line = section.lines[lineIdx]

  return (
    <div style={{
      background:'rgba(3,12,6,.98)', border:`1px solid ${char.accentColor}30`,
      borderTop:`2px solid ${char.accentColor}`, borderRadius:4,
      fontFamily:'Barlow Condensed,sans-serif',
      boxShadow:`0 0 30px ${char.accentColor}12`,
    }}>
      <style>{`@keyframes dlg-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      {/* Team header */}
      <div style={{ padding:'7px 16px', background:'rgba(0,0,0,.4)',
        borderBottom:`1px solid ${char.accentColor}20`,
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10,
          color:`${char.accentColor}70`, letterSpacing:2 }}>
          {team.teamName} // {team.location}
        </div>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10,
          color:`${char.accentColor}50`, letterSpacing:1 }}>
          {team.briefingDate}
        </div>
      </div>

      {/* Character + dialog */}
      <div style={{ display:'flex', gap:16, padding:'14px 16px', alignItems:'flex-start' }}>
        {/* Portrait */}
        <div style={{ flexShrink:0, border:`2px solid ${char.accentColor}40`,
          borderRadius:'50%', padding:4,
          background:`${char.accentColor}08`,
          boxShadow:`0 0 18px ${char.accentColor}20` }}>
          <Portrait style={char.portraitStyle} color={char.accentColor}/>
        </div>

        {/* Name + speech */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:700, color:char.accentColor,
            letterSpacing:1, marginBottom:1 }}>{char.name}</div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
            color:`${char.accentColor}60`, letterSpacing:1, marginBottom:10 }}>
            {char.rank} — {char.role}
          </div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
            color:`${char.accentColor}40`, letterSpacing:2, marginBottom:6, fontStyle:'italic' }}>
            {char.personality}
          </div>

          {/* Speech bubble */}
          <div style={{ background:`${char.accentColor}07`,
            border:`1px solid ${char.accentColor}18`,
            borderRadius:'0 8px 8px 8px', padding:'11px 14px', position:'relative' }}>
            <div style={{ position:'absolute', left:-7, top:12, width:0, height:0,
              borderTop:'6px solid transparent', borderBottom:'6px solid transparent',
              borderRight:`7px solid ${char.accentColor}18` }}/>
            <p style={{ fontFamily:'Barlow,sans-serif', fontSize:15, lineHeight:1.75,
              color:'#c8e6c9', margin:0 }}>
              <TypeWriter key={`${activeTab}-${lineIdx}`} text={line} onDone={advance}/>
            </p>

            {/* Line progress */}
            <div style={{ display:'flex', gap:4, marginTop:10, alignItems:'center' }}>
              {section.lines.map((_,i) => (
                <div key={i} style={{
                  width:i===lineIdx?20:5, height:4, borderRadius:2,
                  background:i<=lineIdx?char.accentColor:`${char.accentColor}20`,
                  transition:'all .3s',
                }}/>
              ))}
              <span style={{ marginLeft:6, fontFamily:'Share Tech Mono,monospace',
                fontSize:9, color:`${char.accentColor}50` }}>
                {lineIdx+1}/{section.lines.length}
              </span>
            </div>
          </div>

          {/* Controls */}
          {done && (
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              {lineIdx > 0 && (
                <button onClick={()=>{setLineIdx(l=>l-1);setDone(false)}}
                  style={{ background:'transparent', border:`1px solid ${char.accentColor}30`,
                    color:`${char.accentColor}60`, padding:'5px 12px', borderRadius:3,
                    cursor:'pointer', fontFamily:'Barlow Condensed,sans-serif', fontSize:13 }}>
                  ← BACK
                </button>
              )}
              <button onClick={()=>{setLineIdx(0);setDone(false)}}
                style={{ background:'transparent', border:`1px solid ${char.accentColor}20`,
                  color:`${char.accentColor}40`, padding:'5px 10px', borderRadius:3,
                  cursor:'pointer', fontFamily:'Barlow Condensed,sans-serif', fontSize:12 }}>
                ↺ REPLAY
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Character roster */}
      <div style={{ padding:'8px 16px 12px', borderTop:`1px solid ${char.accentColor}10`,
        display:'flex', gap:10 }}>
        {team.characters.map(c => (
          <div key={c.id} style={{
            display:'flex', alignItems:'center', gap:6,
            opacity: c.id === char.id ? 1 : 0.35,
            transition:'opacity .3s',
          }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background: c.id === char.id ? c.accentColor : '#1a3a20',
              boxShadow: c.id === char.id ? `0 0 6px ${c.accentColor}` : 'none',
            }}/>
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9,
              color: c.id === char.id ? c.accentColor : '#1a4a2a',
              letterSpacing:1 }}>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
