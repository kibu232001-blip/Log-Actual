import React, { useState, useEffect } from 'react'
import { MissionScenario } from '../../data/scenarios'
import CommanderDialog from './CommanderDialog'
import { getBriefingTeam, BriefingTeam } from '../../data/briefingTeams'
import { useVoice } from './useVoice'
import { useGameStore } from '../../store/gameStore'

interface Props {
  scenario: MissionScenario
  onProceed: () => void
  onBack: () => void
}

type BriefTab = 'SITUATION' | 'MISSION' | 'EXECUTION' | 'SERVICE_SUPPORT' | 'COMMAND'

const DIFF_COLORS: Record<string,string> = { STANDARD:'#2ecc71', ELEVATED:'#f39c12', SEVERE:'#e74c3c' }

// Tab ID → briefingTeams tab string
const TAB_TO_BRIEF: Record<BriefTab, string> = {
  SITUATION:       'SITUATION',
  MISSION:         'MISSION',
  EXECUTION:       'EXECUTION',
  SERVICE_SUPPORT: 'SERVICE SUPPORT',
  COMMAND:         'COMMAND',
}

function SpeakBtn({ onClick, speaking }: { onClick:()=>void; speaking:boolean }) {
  return (
    <button onClick={onClick} style={{
      background: speaking ? 'rgba(0,255,136,0.2)' : 'rgba(0,255,136,0.08)',
      border:`1px solid ${speaking?'#00ff88':'#2d5a32'}`,
      color: speaking ? '#00ff88' : '#2d5a32',
      borderRadius:3, cursor:'pointer', width:28, height:28,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0,
      animation: speaking ? 'speak-pulse 1s ease-in-out infinite' : 'none',
    }}>{speaking ? '■' : '▶'}</button>
  )
}

export default function MissionBrief({ scenario, onProceed, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<BriefTab>('SITUATION')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedDiff, setSelectedDiff] = useState<'EASY'|'STANDARD'|'HARD'|'SFC_CHALLENGE'>('STANDARD')
  const setDifficulty = useGameStore(s => (s as any).setDifficulty)
  const { speak, stop, speaking } = useVoice()

  const stopAllAudio = () => {
    stop()
    // Stop ElevenLabs audio
    const a = (window as any).__activeCommanderAudio
    if (a) { a.pause(); a.currentTime = 0; (window as any).__activeCommanderAudio = null }
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }

  // Close dialog + stop all audio when switching tabs
  useEffect(() => {
    setDialogOpen(false)
    setSelectedMemberId(null)
    stopAllAudio()
  }, [activeTab])

  useEffect(() => { return () => stopAllAudio() }, [])

  const diffColor = DIFF_COLORS[scenario.difficulty] || '#2ecc71'
  const team: BriefingTeam = getBriefingTeam(scenario.id)

  const openDialog = (memberId?: string) => {
    stop()
    // Find the character + figure out which tab they speak on
    const charId = memberId || team.characters[0].id
    // Find a section for this character and current tab, else pick first section for char
    const section = team.sections.find(s => s.speakerId === charId && s.tab === TAB_TO_BRIEF[activeTab])
      || team.sections.find(s => s.speakerId === charId)
    if (section) {
      setSelectedMemberId(charId)
    } else {
      // Fallback: open CDR for current tab
      setSelectedMemberId(team.characters[0].id)
    }
    setDialogOpen(true)
  }

  const readTab = () => {
    if (speaking) { stop(); return }
    const texts: Record<BriefTab, string> = {
      SITUATION:       `Enemy forces. ${scenario.enemyForces}. Friendly forces. ${scenario.friendlyForces}. Theater assessment. ${scenario.situation}`,
      MISSION:         `Mission. ${scenario.mission}. Commander's intent. ${scenario.commandersIntent}`,
      EXECUTION:       `Execution. Campaign duration: ${scenario.duration} days. Difficulty: ${scenario.difficultyLabel}. Enemy activity level: ${Math.round(scenario.enemyActivityLevel*100)} percent.`,
      SERVICE_SUPPORT: `Service support. ${scenario.serviceSupportNote}. Starting sigma: ${scenario.startingSigma}. Stonewall rate: ${scenario.startingStonewallRate} percent. Average request cycle time: ${scenario.startingRCT} hours.`,
      COMMAND:         `Command and signal. Success criteria. Sigma level three point zero or above. Stonewall rate below two percent. Request cycle time at or below thirty-two hours average.`,
    }
    speak(texts[activeTab], 'NARRATOR')
  }

  const tabs: { id: BriefTab; label: string }[] = [
    { id:'SITUATION',       label:'1 — SITUATION'       },
    { id:'MISSION',         label:'2 — MISSION'         },
    { id:'EXECUTION',       label:'3 — EXECUTION'       },
    { id:'SERVICE_SUPPORT', label:'4 — SERVICE SUPPORT' },
    { id:'COMMAND',         label:'5 — COMMAND & SIG'   },
  ]

  const MEMBER_COLORS: Record<string,string> = {
    CDR:'#2ecc71', SGM:'#f39c12', S4:'#3498db', SPO:'#9b59b6', INTEL:'#e74c3c',
    LTG_HAYES:'#00ff88', MAJ_CHEN:'#00aaff', SGM_FORD:'#ffaa00',
    BG_WALSH:'#00ff88', COL_ANDERS:'#3498db', CW3_BANKS:'#f39c12',
    COL_PETERSEN:'#00ff88', SGM_RIVERS:'#f39c12', LT_COLE:'#3498db',
    COL_MARTINEZ:'#00ff88', LTC_AL_RASHID:'#3498db', CW4_NGUYEN:'#f39c12',
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'#050e06',
      display:'flex', flexDirection:'column',
      fontFamily:'Barlow Condensed, sans-serif', color:'#c8e6c9',
      overflow:'hidden',
    }}>
      <style>{`
        @keyframes speak-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0.4)} 50%{box-shadow:0 0 0 6px rgba(0,255,136,0)} }
        @keyframes dlg-slide-up { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500&display=swap');
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        background:'#0d1f0f', borderBottom:'1px solid #2d5a32',
        padding:'8px 12px', flexShrink:0,
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
      }}>
        <div style={{ flex:1, minWidth:0, paddingRight:8 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:'#2d5a32', marginBottom:2,
            fontFamily:'Share Tech Mono,monospace' }}>{scenario.classification}</div>
          <div style={{ fontSize:11, letterSpacing:2, color:'#7aab7e', marginBottom:2 }}>
            OPERATION ORDER — {scenario.theater.replace('_',' ')} THEATER
          </div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:1, color:'#2ecc71', lineHeight:1.1 }}>
            {scenario.operationName}
          </div>
          <div style={{ fontSize:13, color:'#7aab7e', marginTop:2 }}>{scenario.subtitle}</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ display:'inline-block', padding:'3px 10px', borderRadius:3,
            background:`${diffColor}15`, border:`1px solid ${diffColor}40`,
            color:diffColor, fontSize:13, letterSpacing:2, marginBottom:6 }}>{scenario.difficulty}</div>
          <div style={{ display:'flex', gap:10, fontFamily:'Share Tech Mono,monospace', fontSize:13, color:'#7aab7e' }}>
            <span>D-{scenario.duration}</span>
            <span>σ{scenario.startingSigma}</span>
            <span>{scenario.startingRCT}h</span>
          </div>
        </div>
      </div>

      {/* ── BRIEFING TEAM ROW ──────────────────────────────────────── */}
      <div style={{
        background:'#081408', borderBottom:'1px solid #1a3020',
        padding:'8px 12px', flexShrink:0,
      }}>
        <div style={{ fontSize:9, letterSpacing:3, color:'#2d5a32', marginBottom:6,
          fontFamily:'Share Tech Mono,monospace' }}>BRIEFING TEAM — TAP TO HEAR FROM THEM</div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:2 }}>
          {team.characters.map(char => {
            const c = char.accentColor || MEMBER_COLORS[char.id] || '#2ecc71'
            const initials = char.id.split('_').map((w:string)=>w[0]).slice(0,3).join('')
            const hasSection = team.sections.some(s => s.speakerId === char.id)
            return (
              <button
                key={char.id}
                onClick={() => openDialog(char.id)}
                disabled={!hasSection}
                style={{
                  flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  background:'transparent', border:'none', cursor: hasSection ? 'pointer' : 'default',
                  padding:'4px 6px', borderRadius:8,
                  opacity: hasSection ? 1 : 0.3,
                  WebkitTapHighlightColor:'transparent',
                }}
              >
                <div style={{
                  width:44, height:44, borderRadius:'50%',
                  background:`${c}18`, border:`2px solid ${c}55`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700, color:c, letterSpacing:0.5,
                  fontFamily:'Share Tech Mono,monospace',
                  boxShadow:`0 0 10px ${c}22`,
                }}>
                  {initials || char.id.slice(0,3)}
                </div>
                <div style={{ fontSize:9, color:'#7aab7e', letterSpacing:0.5, textAlign:'center', maxWidth:48, lineHeight:1.2 }}>
                  {char.name.replace(/^(LTG|BG|COL|LTC|MAJ|CPT|LT|SGM|CW4|CW3)\s/,'').slice(0,8)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── OPORD TABS ─────────────────────────────────────────────── */}
      <div style={{
        background:'#0a1a0c', borderBottom:'1px solid #2d5a32',
        display:'flex', overflowX:'auto', flexShrink:0, padding:'0',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flexShrink:0, padding:'10px 14px',
            background: activeTab===tab.id ? 'rgba(46,204,113,0.12)' : 'transparent',
            borderBottom: activeTab===tab.id ? '3px solid #2ecc71' : '3px solid transparent',
            border:'none', color: activeTab===tab.id ? '#2ecc71' : '#7aab7e',
            fontSize:12, letterSpacing:1, cursor:'pointer',
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:600,
            whiteSpace:'nowrap', transition:'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px' }}>

        {activeTab === 'SITUATION' && (
          <div>
            <h2 style={{ fontSize:20, color:'#2ecc71', margin:'0 0 14px', letterSpacing:2 }}>1. SITUATION</h2>
            {[
              { label:'a. ENEMY FORCES',       text: scenario.enemyForces    },
              { label:'b. FRIENDLY FORCES',    text: scenario.friendlyForces },
              { label:'c. THEATER ASSESSMENT', text: scenario.situation      },
            ].map(s => (
              <div key={s.label} style={{ borderLeft:'3px solid #2d5a32', paddingLeft:12, marginBottom:18 }}>
                <div style={{ fontSize:11, letterSpacing:2, color:'#7aab7e', marginBottom:6 }}>{s.label}</div>
                <p style={{ fontSize:16, lineHeight:1.75, color:'#c8e6c9', margin:0, fontFamily:'Barlow,sans-serif' }}>{s.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'MISSION' && (
          <div>
            <h2 style={{ fontSize:20, color:'#2ecc71', margin:'0 0 14px', letterSpacing:2 }}>2. MISSION</h2>
            <div style={{ background:'#132415', border:'1px solid #2ecc71', borderRadius:4,
              padding:16, marginBottom:20 }}>
              <p style={{ fontSize:17, lineHeight:1.8, color:'#c8e6c9', margin:0,
                fontStyle:'italic', fontFamily:'Barlow,sans-serif' }}>{scenario.mission}</p>
            </div>
            <div style={{ borderLeft:'3px solid #f39c12', paddingLeft:12 }}>
              <div style={{ fontSize:11, letterSpacing:2, color:'#f39c12', marginBottom:8 }}>COMMANDER'S INTENT</div>
              <p style={{ fontSize:16, lineHeight:1.75, color:'#c8e6c9', margin:0, fontFamily:'Barlow,sans-serif' }}>
                {scenario.commandersIntent}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'EXECUTION' && (
          <div>
            <h2 style={{ fontSize:20, color:'#2ecc71', margin:'0 0 14px', letterSpacing:2 }}>3. EXECUTION</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {[
                { label:'Duration',       value:`${scenario.duration} Days`                          },
                { label:'Difficulty',     value: scenario.difficulty                                 },
                { label:'Enemy Activity', value:`${Math.round(scenario.enemyActivityLevel*100)}%`    },
                { label:'Theater',        value: scenario.theater.replace('_',' ')                   },
              ].map(m => (
                <div key={m.label} style={{ background:'#132415', border:'1px solid #2d5a32',
                  borderRadius:4, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:'#7aab7e', marginBottom:3 }}>{m.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'#c8e6c9' }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:11, letterSpacing:2, color:'#7aab7e', marginBottom:8 }}>THEATER NODES</div>
              {scenario.nodes.map(n => (
                <div key={n.id} style={{ display:'flex', gap:10, alignItems:'center',
                  padding:'6px 10px', background:'#132415', borderRadius:3, marginBottom:4 }}>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'#3498db', minWidth:44 }}>{n.shortName}</span>
                  <span style={{ fontSize:15, color:'#c8e6c9' }}>{n.name}</span>
                  <span style={{ marginLeft:'auto', fontSize:12,
                    color: n.status==='ACTIVE'?'#2ecc71':n.status==='INTERDICTED'?'#e74c3c':'#f39c12' }}>{n.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SERVICE_SUPPORT' && (
          <div>
            <h2 style={{ fontSize:20, color:'#2ecc71', margin:'0 0 14px', letterSpacing:2 }}>4. SERVICE SUPPORT</h2>
            <div style={{ background:'#132415', border:'1px solid #2d5a32', borderRadius:4,
              padding:16, marginBottom:18 }}>
              <p style={{ fontSize:16, lineHeight:1.75, color:'#c8e6c9', margin:0, fontFamily:'Barlow,sans-serif' }}>
                {scenario.serviceSupportNote}
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { label:'Sigma',     value:`${scenario.startingSigma}σ`,         color: scenario.startingSigma>=2?'#2ecc71':'#f39c12' },
                { label:'Stonewall', value:`${scenario.startingStonewallRate}%`,  color: scenario.startingStonewallRate<10?'#f39c12':'#e74c3c' },
                { label:'Avg RCT',   value:`${scenario.startingRCT}h`,            color: scenario.startingRCT<=40?'#f39c12':'#e74c3c' },
              ].map(m => (
                <div key={m.label} style={{ background:'#0a1a0c', border:`1px solid ${m.color}40`,
                  borderRadius:4, padding:'12px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:'#7aab7e', marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:28, fontWeight:700, color:m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'COMMAND' && (
          <div>
            <h2 style={{ fontSize:20, color:'#2ecc71', margin:'0 0 14px', letterSpacing:2 }}>5. COMMAND & SIGNAL</h2>
            <div style={{ borderLeft:'3px solid #2d5a32', paddingLeft:12, marginBottom:18 }}>
              <div style={{ fontSize:11, letterSpacing:2, color:'#7aab7e', marginBottom:10 }}>SUCCESS CRITERIA</div>
              {['Sigma level ≥ 3.0σ at campaign end', 'Stonewall rate < 2%',
                'Request cycle time ≤ 32 hours average',
                'Zero unit-days above Stonewall threshold in final 5 days'].map((c,i) => (
                <div key={i} style={{ display:'flex', gap:10, fontSize:15, color:'#c8e6c9', marginBottom:7, fontFamily:'Barlow,sans-serif' }}>
                  <span style={{ color:'#2ecc71' }}>▶</span>{c}
                </div>
              ))}
            </div>
            <div style={{ background:'#132415', border:'1px solid #e74c3c40', borderRadius:4, padding:14 }}>
              <div style={{ fontSize:11, letterSpacing:2, color:'#e74c3c', marginBottom:10 }}>FAILURE CONDITIONS</div>
              {['Main effort unit in Stonewall for 3+ consecutive days',
                'Theater sigma drops below 1.0σ',
                'More than 40% of units simultaneously in Stonewall'].map((c,i) => (
                <div key={i} style={{ display:'flex', gap:10, fontSize:15, color:'#c8e6c9', marginBottom:7, fontFamily:'Barlow,sans-serif' }}>
                  <span style={{ color:'#e74c3c' }}>■</span>{c}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── READ ALOUD BAR ─────────────────────────────────────────── */}
      <div style={{
        background:'#081408', borderTop:'1px solid #1a3020',
        padding:'8px 12px', flexShrink:0,
        display:'flex', alignItems:'center', gap:10,
      }}>
        <SpeakBtn onClick={readTab} speaking={speaking}/>
        <span style={{ fontSize:13, color: speaking ? '#00ff88' : '#2d5a32',
          fontFamily:'Share Tech Mono,monospace', letterSpacing:1, flex:1 }}>
          {speaking ? '● READING ALOUD...' : 'READ THIS SECTION ALOUD'}
        </span>
        {speaking && (
          <button onClick={stop} style={{ background:'transparent', border:'1px solid #2d5a32',
            color:'#7aab7e', padding:'3px 10px', borderRadius:3, cursor:'pointer',
            fontFamily:'Barlow Condensed,sans-serif', fontSize:13 }}>STOP ■</button>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <div style={{
        background:'#0d1f0f', borderTop:'1px solid #2d5a32',
        padding:'10px 12px', flexShrink:0,
        display:'flex', gap:8,
      }}>
        <button onClick={onBack} style={{
          flex:1, background:'transparent', border:'1px solid #2d5a32', color:'#7aab7e',
          padding:'10px 0', borderRadius:4, cursor:'pointer',
          fontFamily:'Barlow Condensed,sans-serif', fontSize:14, letterSpacing:1,
          WebkitTapHighlightColor:'transparent',
        }}>← BACK</button>

        <button onClick={() => openDialog()} style={{
          flex:2, background:'rgba(52,152,219,0.15)', border:'1px solid #3498db60', color:'#3498db',
          padding:'10px 0', borderRadius:4, cursor:'pointer',
          fontFamily:'Barlow Condensed,sans-serif', fontSize:14, letterSpacing:1,
          WebkitTapHighlightColor:'transparent',
        }}>▶ COMMANDER BRIEF</button>

        <button onClick={() => { setDifficulty && setDifficulty(selectedDiff); stop(); onProceed() }} style={{
          flex:2, background:'rgba(46,204,113,0.2)', border:'1px solid #2ecc71', color:'#2ecc71',
          padding:'10px 0', borderRadius:4, cursor:'pointer',
          fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:16, letterSpacing:2,
          WebkitTapHighlightColor:'transparent',
        }}>DEPLOY →</button>
      </div>

      {/* ── DIFFICULTY SELECTOR ────────────────────────────────────── */}
      <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(0,0,0,0.3)', borderRadius:4, border:'1px solid #1a3a20' }}>
        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'#2d5a32', letterSpacing:3, marginBottom:8 }}>OPERATIONAL DIFFICULTY</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:5 }}>
          {([
            { id:'EASY',          label:'EASY',      sub:'Reduced enemy', col:'#2ecc71' },
            { id:'STANDARD',      label:'STANDARD',  sub:'Balanced',      col:'#f39c12' },
            { id:'HARD',          label:'HARD',      sub:'Aggressive AI', col:'#e67e22' },
            { id:'SFC_CHALLENGE', label:'SFC',       sub:'Unforgiving',   col:'#e74c3c' },
          ] as const).map(d => (
            <button key={d.id} onClick={() => setSelectedDiff(d.id)} style={{
              padding:'7px 4px', borderRadius:3, cursor:'pointer', textAlign:'center',
              background: selectedDiff===d.id ? `${d.col}22` : 'rgba(0,0,0,0.2)',
              border: `${selectedDiff===d.id ? 2 : 1}px solid ${selectedDiff===d.id ? d.col : d.col+'44'}`,
              WebkitTapHighlightColor:'transparent', transition:'all .15s',
            }}>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:12, color:d.col, letterSpacing:1 }}>{d.label}</div>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:`${d.col}88`, marginTop:2 }}>{d.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── COMMANDER DIALOG OVERLAY ───────────────────────────────── */}
      {dialogOpen && (
        <div style={{
          position:'fixed', inset:0, zIndex:900,
          background:'rgba(3,10,5,0.96)',
          display:'flex', flexDirection:'column',
          animation:'dlg-slide-up .25s ease',
        }}>
          {/* Dialog header */}
          <div style={{
            background:'#0d1f0f', borderBottom:'1px solid #2d5a32',
            padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center',
            flexShrink:0,
          }}>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, letterSpacing:2, color:'#2d5a32' }}>
              COMMANDER BRIEFING // {team.teamName}
            </div>
            <button onClick={() => setDialogOpen(false)} style={{
              background:'transparent', border:'1px solid #2d5a32', color:'#7aab7e',
              padding:'4px 12px', borderRadius:3, cursor:'pointer',
              fontFamily:'Barlow Condensed,sans-serif', fontSize:13,
            }}>✕ CLOSE</button>
          </div>

          {/* Tab switcher inside dialog */}
          <div style={{
            background:'#081408', borderBottom:'1px solid #1a3020',
            display:'flex', overflowX:'auto', flexShrink:0,
          }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flexShrink:0, padding:'9px 12px',
                background: activeTab===tab.id ? 'rgba(46,204,113,0.12)' : 'transparent',
                borderBottom: activeTab===tab.id ? '2px solid #2ecc71' : '2px solid transparent',
                border:'none', color: activeTab===tab.id ? '#2ecc71' : '#7aab7e',
                fontSize:11, letterSpacing:1, cursor:'pointer',
                fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, whiteSpace:'nowrap',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Character roster row */}
          <div style={{
            background:'#081408', borderBottom:'1px solid #1a3020',
            padding:'8px 12px', flexShrink:0, display:'flex', gap:8, overflowX:'auto',
          }}>
            {team.characters.map(char => {
              const c = char.accentColor || '#2ecc71'
              const isActive = char.id === selectedMemberId
              const initials = char.id.split('_').map((w:string)=>w[0]).slice(0,3).join('')
              return (
                <button key={char.id} onClick={() => setSelectedMemberId(char.id)} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:8,
                  background: isActive ? `${c}15` : 'transparent',
                  border:`1px solid ${isActive ? c+'60' : 'transparent'}`,
                  borderRadius:20, padding:'4px 10px 4px 4px', cursor:'pointer',
                  WebkitTapHighlightColor:'transparent',
                }}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%',
                    background:`${c}20`, border:`2px solid ${isActive ? c : c+'40'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700, color:c,
                    fontFamily:'Share Tech Mono,monospace',
                  }}>{initials}</div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:12, color: isActive ? c : '#7aab7e', fontWeight:700 }}>{char.name}</div>
                    <div style={{ fontSize:9, color:'#4a7a54', fontFamily:'Share Tech Mono,monospace' }}>{char.role.slice(0,22)}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Dialog content */}
          <div style={{ flex:1, overflow:'hidden' }}>
            <CommanderDialog
              team={team}
              activeTab={TAB_TO_BRIEF[activeTab]}
              selectedMemberId={selectedMemberId}
              onClose={() => setDialogOpen(false)}
              onDeploy={() => { setDialogOpen(false); stop(); onProceed() }}
            />
          </div>

          {/* Dialog footer */}
          <div style={{
            background:'#0d1f0f', borderTop:'1px solid #2d5a32',
            padding:'10px 12px', display:'flex', gap:8, flexShrink:0,
          }}>
            <button onClick={() => setDialogOpen(false)} style={{
              flex:1, background:'transparent', border:'1px solid #2d5a32', color:'#7aab7e',
              padding:'10px 0', borderRadius:4, cursor:'pointer',
              fontFamily:'Barlow Condensed,sans-serif', fontSize:14, letterSpacing:1,
              WebkitTapHighlightColor:'transparent',
            }}>← BACK TO OPORD</button>
            <button onClick={() => { setDialogOpen(false); stop(); onProceed() }} style={{
              flex:2, background:'rgba(46,204,113,0.2)', border:'1px solid #2ecc71', color:'#2ecc71',
              padding:'10px 0', borderRadius:4, cursor:'pointer',
              fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:16, letterSpacing:2,
              WebkitTapHighlightColor:'transparent',
            }}>DEPLOY →</button>
          </div>
        </div>
      )}
    </div>
  )
}
