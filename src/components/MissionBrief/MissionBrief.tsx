import React, { useState, useEffect } from 'react'
import { MissionScenario } from '../../data/scenarios'
import CommanderDialog from './CommanderDialog'
import { getBriefingTeam } from '../../data/briefingTeams'
import { useVoice } from './useVoice'

interface Props {
  scenario: MissionScenario
  onProceed: () => void
  onBack: () => void
}

type BriefTab = 'SITUATION' | 'MISSION' | 'EXECUTION' | 'SERVICE_SUPPORT' | 'COMMAND'

const DIFF_COLORS: Record<string,string> = { STANDARD:'#2ecc71', ELEVATED:'#f39c12', SEVERE:'#e74c3c' }

// Speaker icon component
function SpeakBtn({ onClick, speaking, small }: { onClick:()=>void; speaking:boolean; small?:boolean }) {
  return (
    <button onClick={onClick} title={speaking?'Stop':'Read aloud'} style={{
      background: speaking ? 'rgba(0,255,136,0.2)' : 'rgba(0,255,136,0.08)',
      border:`1px solid ${speaking?'#00ff88':'#2d5a32'}`,
      color: speaking ? '#00ff88' : '#2d5a32',
      borderRadius:3, cursor:'pointer',
      width: small?22:28, height: small?22:28,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: small?12:14,
      flexShrink:0,
      transition:'all 0.15s',
      animation: speaking ? 'speak-pulse 1s ease-in-out infinite' : 'none',
    }}>
      {speaking ? '■' : '▶'}
    </button>
  )
}

export default function MissionBrief({ scenario, onProceed, onBack }: Props) {
  const [activeTab, setActiveTab]           = useState<BriefTab>('SITUATION')
  const [showDialog, setShowDialog]         = useState(false)
  const [dialogDone, setDialogDone]         = useState(false)
  const { speak, stop, speaking, currentSpeaker } = useVoice()

  // Stop speech when tab changes
  useEffect(() => { stop() }, [activeTab])
  useEffect(() => { return () => stop() }, [])

  const diffColor = DIFF_COLORS[scenario.difficulty]

  // Read the active tab's content
  const readTab = () => {
    if (speaking) { stop(); return }
    const texts: Record<BriefTab, string> = {
      SITUATION: `Enemy forces. ${scenario.enemyForces}. Friendly forces. ${scenario.friendlyForces}. Theater assessment. ${scenario.situation}`,
      MISSION: `Mission. ${scenario.mission}. Commander's intent. ${scenario.commandersIntent}`,
      EXECUTION: `Execution. Campaign duration: ${scenario.duration} days. Difficulty: ${scenario.difficultyLabel}. Enemy activity level: ${Math.round(scenario.enemyActivityLevel*100)} percent.`,
      SERVICE_SUPPORT: `Service support. ${scenario.serviceSupportNote}. Starting sigma: ${scenario.startingSigma}. Stonewall rate: ${scenario.startingStonewallRate} percent. Average request cycle time: ${scenario.startingRCT} hours.`,
      COMMAND: `Command and signal. Success criteria. Sigma level three point zero or above. Stonewall rate below two percent. Request cycle time at or below thirty-two hours average. Zero unit-days above stonewall threshold in the final five days.`,
    }
    speak(texts[activeTab], 'NARRATOR')
  }

  const tabs: { id:BriefTab; label:string }[] = [
    { id:'SITUATION',      label:'1 — SITUATION'      },
    { id:'MISSION',        label:'2 — MISSION'        },
    { id:'EXECUTION',      label:'3 — EXECUTION'      },
    { id:'SERVICE_SUPPORT',label:'4 — SERVICE SUPPORT'},
    { id:'COMMAND',        label:'5 — COMMAND & SIG'  },
  ]

  if (showDialog && !dialogDone) {
    return (
      <CommanderDialog team={getBriefingTeam(scenario.id)}
        lines={scenario.openingDialog}
        title={`${scenario.operationName} — PRE-MISSION BRIEF`}
        onComplete={() => { setDialogDone(true); setShowDialog(false) }}
      />
    )
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'#050e06',
      display:'grid', gridTemplateRows:'auto 1fr auto',
      fontFamily:'Barlow Condensed, sans-serif', color:'#c8e6c9',
    }}>
      <style>{`
        @keyframes speak-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0.4)} 50%{box-shadow:0 0 0 6px rgba(0,255,136,0)} }
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500&display=swap');
      `}</style>

      {/* HEADER */}
      <div style={{ background:'#0d1f0f', borderBottom:'1px solid #2d5a32', padding:'14px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:14, letterSpacing:3, color:'#2d5a32', marginBottom:4,
            fontFamily:'Share Tech Mono,monospace' }}>{scenario.classification}</div>
          <div style={{ fontSize:16, letterSpacing:2, color:'#7aab7e', marginBottom:4 }}>
            OPERATION ORDER — {scenario.theater.replace('_',' ')} THEATER
          </div>
          <div style={{ fontSize:39, fontWeight:700, letterSpacing:3, color:'#2ecc71', lineHeight:1 }}>
            {scenario.operationName}
          </div>
          <div style={{ fontSize:18, color:'#7aab7e', marginTop:5 }}>{scenario.subtitle}</div>
        </div>
        <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <div style={{ display:'inline-block', padding:'3px 12px', borderRadius:3,
            background:`${diffColor}15`, border:`1px solid ${diffColor}40`,
            color:diffColor, fontSize:16, letterSpacing:2 }}>{scenario.difficulty}</div>
          <div style={{ display:'flex', gap:14, fontFamily:'Share Tech Mono,monospace',
            fontSize:16, color:'#7aab7e' }}>
            <span>D-{scenario.duration}</span>
            <span>σ {scenario.startingSigma}</span>
            <span>RCT {scenario.startingRCT}h</span>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', overflow:'hidden' }}>

        {/* TAB LIST */}
        <div style={{ background:'#0a1a0c', borderRight:'1px solid #2d5a32',
          display:'flex', flexDirection:'column', padding:'12px 0', overflowY:'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width:'100%', textAlign:'left', padding:'10px 20px',
              background: activeTab===tab.id ? 'rgba(46,204,113,0.1)' : 'transparent',
              borderLeft: activeTab===tab.id ? '3px solid #2ecc71' : '3px solid transparent',
              border:'none', color: activeTab===tab.id ? '#2ecc71' : '#7aab7e',
              fontSize:18, letterSpacing:1, cursor:'pointer',
              fontFamily:'Barlow Condensed,sans-serif', fontWeight:600, transition:'all 0.15s',
            }}>{tab.label}</button>
          ))}

          {/* Briefing team */}
          <div style={{ padding:'16px 20px', borderTop:'1px solid #1a3020', marginTop:12 }}>
            <div style={{ fontSize:14, letterSpacing:2, color:'#2d5a32', marginBottom:10 }}>BRIEFING TEAM</div>
            {Object.entries({CDR:'COL Drake',SGM:'SGM Harris',S4:'CPT Okafor',SPO:'MAJ Reyes',INTEL:'LT Park'})
              .map(([key,name]) => {
                const c = ({CDR:'#2ecc71',SGM:'#f39c12',S4:'#3498db',SPO:'#9b59b6',INTEL:'#e74c3c'} as Record<string,string>)[key]
                return (
                  <div key={key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%',
                      background:`${c}15`, border:`1px solid ${c}40`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, color:c, fontWeight:700 }}>{key}</div>
                    <span style={{ fontSize:15, color:'#7aab7e' }}>{name}</span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div style={{ padding:'24px 32px', overflowY:'auto' }}>

          {/* Read-aloud control bar */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20,
            padding:'8px 12px', background:'rgba(0,0,0,0.3)',
            border:'1px solid #1a3020', borderRadius:4 }}>
            <SpeakBtn onClick={readTab} speaking={speaking}/>
            <span style={{ fontSize:16, color: speaking ? '#00ff88' : '#2d5a32',
              fontFamily:'Share Tech Mono,monospace', letterSpacing:1 }}>
              {speaking ? '● READING ALOUD...' : 'READ THIS SECTION ALOUD'}
            </span>
            {speaking && (
              <button onClick={stop} style={{
                marginLeft:'auto', background:'transparent', border:'1px solid #2d5a32',
                color:'#7aab7e', padding:'3px 10px', borderRadius:3, cursor:'pointer',
                fontFamily:'Barlow Condensed,sans-serif', fontSize:16,
              }}>STOP ■</button>
            )}
          </div>

          {activeTab === 'SITUATION' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <h2 style={{ fontSize:27, color:'#2ecc71', margin:0, letterSpacing:2 }}>1. SITUATION</h2>
              </div>
              {[
                { label:'a. ENEMY FORCES',      text:scenario.enemyForces    },
                { label:'b. FRIENDLY FORCES',   text:scenario.friendlyForces },
                { label:'c. THEATER ASSESSMENT',text:scenario.situation      },
              ].map(s => (
                <div key={s.label} style={{ borderLeft:'3px solid #2d5a32', paddingLeft:16, marginBottom:22 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <h3 style={{ fontSize:16, letterSpacing:2, color:'#7aab7e', margin:0 }}>{s.label}</h3>
                    <SpeakBtn small onClick={() => speaking ? stop() : speak(s.text,'NARRATOR')} speaking={speaking}/>
                  </div>
                  <p style={{ fontSize:21, lineHeight:1.8, color:'#c8e6c9', margin:0, fontFamily:'Barlow,sans-serif' }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'MISSION' && (
            <div>
              <h2 style={{ fontSize:27, color:'#2ecc71', marginBottom:16, letterSpacing:2 }}>2. MISSION</h2>
              <div style={{ background:'#132415', border:'1px solid #2ecc71', borderRadius:4,
                padding:20, marginBottom:24, display:'flex', gap:12, alignItems:'flex-start' }}>
                <SpeakBtn onClick={() => speaking ? stop() : speak(scenario.mission,'CDR')} speaking={speaking && currentSpeaker==='CDR'}/>
                <p style={{ fontSize:22, lineHeight:1.8, color:'#c8e6c9', margin:0,
                  fontStyle:'italic', fontFamily:'Barlow,sans-serif' }}>{scenario.mission}</p>
              </div>
              <div style={{ borderLeft:'3px solid #f39c12', paddingLeft:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <h3 style={{ fontSize:16, letterSpacing:2, color:'#f39c12', margin:0 }}>COMMANDER'S INTENT</h3>
                  <SpeakBtn small onClick={() => speaking ? stop() : speak(scenario.commandersIntent,'CDR')} speaking={speaking && currentSpeaker==='CDR'}/>
                </div>
                <p style={{ fontSize:21, lineHeight:1.8, color:'#c8e6c9', margin:0, fontFamily:'Barlow,sans-serif' }}>
                  {scenario.commandersIntent}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'EXECUTION' && (
            <div>
              <h2 style={{ fontSize:27, color:'#2ecc71', marginBottom:16, letterSpacing:2 }}>3. EXECUTION</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
                {[
                  { label:'Duration',        value:`${scenario.duration} Days` },
                  { label:'Difficulty',      value:scenario.difficulty         },
                  { label:'Enemy Activity',  value:`${Math.round(scenario.enemyActivityLevel*100)}%` },
                  { label:'Theater',         value:scenario.theater.replace('_',' ') },
                ].map(m => (
                  <div key={m.label} style={{ background:'#132415', border:'1px solid #2d5a32',
                    borderRadius:4, padding:'12px 16px' }}>
                    <div style={{ fontSize:15, letterSpacing:2, color:'#7aab7e', marginBottom:4 }}>{m.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:'#c8e6c9' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ fontSize:16, letterSpacing:2, color:'#7aab7e', marginBottom:10 }}>THEATER NODES</h3>
                {scenario.nodes.map(n => (
                  <div key={n.id} style={{ display:'flex', gap:12, alignItems:'center',
                    padding:'6px 12px', background:'#132415', borderRadius:3, marginBottom:4 }}>
                    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:15,
                      color:'#3498db', minWidth:50 }}>{n.shortName}</span>
                    <span style={{ fontSize:20, color:'#c8e6c9' }}>{n.name}</span>
                    <span style={{ marginLeft:'auto', fontSize:15,
                      color:n.status==='ACTIVE'?'#2ecc71':n.status==='INTERDICTED'?'#e74c3c':'#f39c12' }}>
                      {n.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SERVICE_SUPPORT' && (
            <div>
              <h2 style={{ fontSize:27, color:'#2ecc71', marginBottom:16, letterSpacing:2 }}>4. SERVICE SUPPORT</h2>
              <div style={{ background:'#132415', border:'1px solid #2d5a32', borderRadius:4,
                padding:20, marginBottom:24, display:'flex', gap:12, alignItems:'flex-start' }}>
                <SpeakBtn onClick={() => speaking ? stop() : speak(scenario.serviceSupportNote,'S4')} speaking={speaking && currentSpeaker==='S4'}/>
                <p style={{ fontSize:21, lineHeight:1.8, color:'#c8e6c9', margin:0, fontFamily:'Barlow,sans-serif' }}>
                  {scenario.serviceSupportNote}
                </p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {[
                  { label:'Starting Sigma',    value:`${scenario.startingSigma}σ`,       color: scenario.startingSigma>=2?'#2ecc71':'#f39c12' },
                  { label:'Stonewall Rate',     value:`${scenario.startingStonewallRate}%`, color: scenario.startingStonewallRate<10?'#f39c12':'#e74c3c' },
                  { label:'Avg RCT',            value:`${scenario.startingRCT}h`,          color: scenario.startingRCT<=40?'#f39c12':'#e74c3c' },
                ].map(m => (
                  <div key={m.label} style={{ background:'#0a1a0c', border:`1px solid ${m.color}40`,
                    borderRadius:4, padding:'14px 16px', textAlign:'center' }}>
                    <div style={{ fontSize:14, letterSpacing:2, color:'#7aab7e', marginBottom:6 }}>{m.label}</div>
                    <div style={{ fontSize:42, fontWeight:700, color:m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'COMMAND' && (
            <div>
              <h2 style={{ fontSize:27, color:'#2ecc71', marginBottom:16, letterSpacing:2 }}>5. COMMAND &amp; SIGNAL</h2>
              <div style={{ borderLeft:'3px solid #2d5a32', paddingLeft:16, marginBottom:20 }}>
                <h3 style={{ fontSize:16, letterSpacing:2, color:'#7aab7e', marginBottom:10 }}>SUCCESS CRITERIA</h3>
                {['Sigma level ≥ 3.0σ at campaign end','Stonewall rate < 2%',
                  'Request cycle time ≤ 32 hours average',
                  'Zero unit-days above Stonewall threshold in final 5 days'].map((c,i) => (
                  <div key={i} style={{ display:'flex', gap:10, fontSize:20, color:'#c8e6c9', marginBottom:6, fontFamily:'Barlow,sans-serif' }}>
                    <span style={{ color:'#2ecc71' }}>▶</span>{c}
                  </div>
                ))}
              </div>
              <div style={{ background:'#132415', border:'1px solid #e74c3c40', borderRadius:4, padding:16 }}>
                <h3 style={{ fontSize:16, letterSpacing:2, color:'#e74c3c', marginBottom:10 }}>FAILURE CONDITIONS</h3>
                {['Main effort unit in Stonewall for 3+ consecutive days',
                  'Theater sigma drops below 1.0σ',
                  'More than 40% of units simultaneously in Stonewall'].map((c,i) => (
                  <div key={i} style={{ display:'flex', gap:10, fontSize:20, color:'#c8e6c9', marginBottom:6, fontFamily:'Barlow,sans-serif' }}>
                    <span style={{ color:'#e74c3c' }}>■</span>{c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#0d1f0f', borderTop:'1px solid #2d5a32', padding:'12px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={onBack} style={{
          background:'transparent', border:'1px solid #2d5a32', color:'#7aab7e',
          padding:'8px 20px', borderRadius:3, cursor:'pointer',
          fontFamily:'Barlow Condensed,sans-serif', fontSize:18, letterSpacing:2,
        }}>← BACK TO MAP</button>

        <div style={{ display:'flex', gap:12 }}>
          {!dialogDone && (
            <button onClick={() => { stop(); setShowDialog(true) }} style={{
              background:'rgba(52,152,219,0.15)', border:'1px solid #3498db40', color:'#3498db',
              padding:'8px 20px', borderRadius:3, cursor:'pointer',
              fontFamily:'Barlow Condensed,sans-serif', fontSize:18, letterSpacing:2,
            }}>
              ▶ COMMANDER BRIEFING
            </button>
          )}
          <button onClick={() => { stop(); onProceed() }} style={{
            background:'rgba(46,204,113,0.2)', border:'1px solid #2ecc71', color:'#2ecc71',
            padding:'10px 28px', borderRadius:3, cursor:'pointer',
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:21, letterSpacing:2,
          }}>
            DEPLOY →
          </button>
        </div>
      </div>
    </div>
  )
}
