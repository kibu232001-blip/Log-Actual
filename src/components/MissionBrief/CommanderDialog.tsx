import React, { useState, useEffect, useCallback } from 'react'
import { BriefingTeam, BriefingCharacter, BriefingSection } from '../../data/briefingTeams'
import AudioEngine from '../../engine/AudioEngine'

function Portrait({ style, color }: { style: string; color: string }) {
  const extras: Record<string,string> = {
    CDR:        `<rect x="26" y="13" width="28" height="6" rx="2" fill="${color}" opacity=".6"/><circle cx="29" cy="54" r="4" fill="${color}" opacity=".5"/><circle cx="40" cy="54" r="4" fill="${color}" opacity=".5"/><circle cx="51" cy="54" r="4" fill="${color}" opacity=".5"/>`,
    SGM:        `<path d="M22,56 L40,46 L58,56" fill="none" stroke="${color}" stroke-width="3" opacity=".6"/><path d="M22,63 L40,53 L58,63" fill="none" stroke="${color}" stroke-width="3" opacity=".6"/>`,
    S4:         `<rect x="28" y="48" width="24" height="18" rx="2" fill="${color}" opacity=".35"/><line x1="32" y1="55" x2="48" y2="55" stroke="${color}" stroke-width="2" opacity=".7"/><line x1="32" y1="60" x2="48" y2="60" stroke="${color}" stroke-width="2" opacity=".7"/>`,
    FEMALE_CDR: `<rect x="26" y="13" width="28" height="5" rx="2" fill="${color}" opacity=".6"/><ellipse cx="40" cy="54" rx="12" ry="8" fill="${color}" opacity=".2"/>`,
    WARRANT:    `<path d="M28,50 L52,50 L52,68 L28,68 Z" fill="${color}" opacity=".2"/><path d="M32,56 L48,56" stroke="${color}" stroke-width="2.5" opacity=".7"/>`,
    ALLIED:     `<path d="M28,54 L52,54" stroke="${color}" stroke-width="2" opacity=".6"/><path d="M28,60 L52,60" stroke="${color}" stroke-width="2" opacity=".4"/>`,
  }
  const svg = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="22" r="15" fill="${color}" opacity=".9"/><path d="M12,74 Q12,44 40,44 Q68,44 68,74" fill="${color}" opacity=".85"/>${extras[style]??extras.CDR}</svg>`
  return <div style={{ width:72, height:72 }} dangerouslySetInnerHTML={{ __html:svg }}/>
}

function TypeWriter({ text, speed=32, onDone }: { text:string; speed?:number; onDone:()=>void }) {
  const [shown, setShown] = useState('')
  const [finished, setFinished] = useState(false)
  useEffect(() => {
    setShown(''); setFinished(false); let i=0
    // Radio squelch open
    AudioEngine.resume()
    AudioEngine.playConvoyDispatch()
    const t = setInterval(()=>{
      i++; setShown(text.slice(0,i))
      // Subtle blip every 3 chars for texture
      if (i % 3 === 0) AudioEngine.playTick(false)
      if(i>=text.length){
        clearInterval(t)
        setFinished(true)
        // Radio squelch close
        setTimeout(() => AudioEngine.playTick(false), 80)
      }
    }, speed)
    return ()=>clearInterval(t)
  }, [text])
  return (
    <span onClick={() => { if(finished) onDone() }}>
      {shown}
      {!finished && <span style={{animation:'dlg-blink .7s infinite'}}>▮</span>}
    </span>
  )
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
  activeTab: string           // the briefing tab string e.g. 'SITUATION', 'SERVICE SUPPORT'
  selectedMemberId?: string | null
  onClose?: () => void
  onDeploy?: () => void
  scenarioId?: string
}

export default function CommanderDialog({ team, activeTab, selectedMemberId, onClose, onDeploy }: Props) {
  // Find section: prefer selected member on current tab, else current tab's default speaker
  const section: BriefingSection | undefined =
    (selectedMemberId
      ? team.sections.find(s => s.speakerId === selectedMemberId && s.tab === activeTab)
        || team.sections.find(s => s.speakerId === selectedMemberId)
      : team.sections.find(s => s.tab === activeTab))

  const char: BriefingCharacter | undefined =
    section ? team.characters.find(c => c.id === section.speakerId) : undefined

  const [lineIdx, setLineIdx] = useState(0)
  const [done, setDone]       = useState(false)

  // Reset on section/tab change
  useEffect(() => { setLineIdx(0); setDone(false) }, [activeTab, selectedMemberId])

  const advance = useCallback(() => {
    if (!section) return
    if (lineIdx < section.lines.length - 1) { setLineIdx(l=>l+1); setDone(false) }
    else setDone(true)
  }, [lineIdx, section])

  useEffect(() => {
    if (!section || !char) return
    const line = section.lines[lineIdx]
    if (line) speakLine(line, char)
  }, [lineIdx, activeTab, selectedMemberId])

  // Fallback: no data for this selection
  if (!section || !char) {
    return (
      <div style={{
        flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:24, fontFamily:'Share Tech Mono,monospace', color:'#2d5a32', fontSize:12, letterSpacing:2,
        textAlign:'center', gap:12,
      }}>
        <div style={{ fontSize:28, opacity:0.3 }}>◈</div>
        <div>NO BRIEFING ON RECORD</div>
        <div style={{ fontSize:10, opacity:0.5 }}>SELECT A TEAM MEMBER OR SWITCH TABS</div>
      </div>
    )
  }

  const line = section.lines[lineIdx]
  const c    = char.accentColor

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      fontFamily:'Barlow Condensed,sans-serif',
    }}>
      <style>{`@keyframes dlg-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      {/* Location bar */}
      <div style={{ padding:'6px 14px', background:'rgba(0,0,0,.4)',
        borderBottom:`1px solid ${c}15`, flexShrink:0,
        display:'flex', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:`${c}60`, letterSpacing:2 }}>
          {team.location}
        </div>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:`${c}40`, letterSpacing:1 }}>
          {team.briefingDate}
        </div>
      </div>

      {/* Main dialog area */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px' }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          {/* Portrait */}
          <div style={{ flexShrink:0,
            border:`2px solid ${c}40`, borderRadius:'50%', padding:4,
            background:`${c}08`, boxShadow:`0 0 18px ${c}20` }}>
            <Portrait style={char.portraitStyle} color={c}/>
          </div>

          {/* Name + speech */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:18, fontWeight:700, color:c, letterSpacing:1, marginBottom:1 }}>{char.name}</div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:`${c}60`, letterSpacing:1, marginBottom:4 }}>
              {char.rank} — {char.role}
            </div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:`${c}40`, letterSpacing:1, marginBottom:10, fontStyle:'italic' }}>
              {char.personality}
            </div>

            {/* Speech bubble */}
            <div
              onClick={() => { if(done) return; advance() }}
              style={{
                background:`${c}07`, border:`1px solid ${c}18`,
                borderRadius:'0 8px 8px 8px', padding:'12px 14px', position:'relative',
                boxShadow:`0 0 20px ${c}08`,
                cursor: done ? 'default' : 'pointer',
                WebkitTapHighlightColor:'transparent',
              }}>
              <div style={{ position:'absolute', left:-7, top:12, width:0, height:0,
                borderTop:'6px solid transparent', borderBottom:'6px solid transparent',
                borderRight:`7px solid ${c}18` }}/>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:16, lineHeight:1.8,
                color:'#c8e6c9', margin:0 }}>
                <TypeWriter key={`${activeTab}-${selectedMemberId}-${lineIdx}`} text={line} onDone={advance}/>
              </p>

              {/* Progress dots */}
              <div style={{ display:'flex', gap:4, marginTop:12, alignItems:'center' }}>
                {section.lines.map((_,i) => (
                  <div key={i} style={{
                    width: i===lineIdx ? 18 : 5, height:4, borderRadius:2,
                    background: i<=lineIdx ? c : `${c}20`,
                    transition:'all .3s',
                  }}/>
                ))}
                <span style={{ marginLeft:6, fontFamily:'Share Tech Mono,monospace',
                  fontSize:9, color:`${c}50` }}>
                  {lineIdx+1}/{section.lines.length}
                </span>
              </div>

              {/* Tap to continue prompt */}
              {!done && (
                <div style={{
                  marginTop:8, display:'flex', alignItems:'center', gap:6,
                  fontFamily:'Share Tech Mono,monospace', fontSize:9,
                  color:`${c}55`, letterSpacing:2,
                  animation:'dlg-blink 1.2s ease-in-out infinite',
                }}>
                  <span>▶</span><span>TAP TO CONTINUE</span>
                </div>
              )}

            </div>

            {/* Controls once all lines done */}
            {done && (
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                {lineIdx > 0 && (
                  <button onClick={()=>{setLineIdx(l=>l-1);setDone(false)}} style={{
                    background:'transparent', border:`1px solid ${c}30`, color:`${c}60`,
                    padding:'5px 12px', borderRadius:3, cursor:'pointer',
                    fontFamily:'Barlow Condensed,sans-serif', fontSize:13,
                    WebkitTapHighlightColor:'transparent',
                  }}>← BACK</button>
                )}
                <button onClick={()=>{setLineIdx(0);setDone(false)}} style={{
                  background:'transparent', border:`1px solid ${c}20`, color:`${c}40`,
                  padding:'5px 10px', borderRadius:3, cursor:'pointer',
                  fontFamily:'Barlow Condensed,sans-serif', fontSize:12,
                  WebkitTapHighlightColor:'transparent',
                }}>↺ REPLAY</button>
                <div style={{
                  marginLeft:'auto', display:'flex', alignItems:'center', gap:4,
                  fontFamily:'Share Tech Mono,monospace', fontSize:9,
                  color:`${c}50`, letterSpacing:2,
                }}>◼ END OF SECTION</div>
              </div>
            )}
          </div>
        </div>

        {/* Tab coverage legend */}
        <div style={{ marginTop:20, borderTop:`1px solid ${c}12`, paddingTop:12 }}>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:`${c}40`, letterSpacing:2, marginBottom:8 }}>
            AVAILABLE SECTIONS FOR {char.name}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['SITUATION','MISSION','EXECUTION','SERVICE SUPPORT','COMMAND'].map(tabName => {
              const has = team.sections.some(s => s.speakerId === char.id && s.tab === tabName)
              const isActive = tabName === activeTab
              return (
                <div key={tabName} style={{
                  padding:'3px 8px', borderRadius:3, fontSize:10, letterSpacing:1,
                  fontFamily:'Share Tech Mono,monospace',
                  background: isActive ? `${c}20` : 'transparent',
                  border:`1px solid ${has ? (isActive ? c+'80' : c+'30') : '#1a3020'}`,
                  color: has ? (isActive ? c : `${c}60`) : '#1a3020',
                }}>{tabName}</div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
