import React, { useEffect, useState, useRef } from 'react'

import { getRandomQuote } from '../../data/quotes'

interface Props { onComplete: () => void }

// Random quote displayed first each time
const OPENING_QUOTE = getRandomQuote()

const LINES = [
  { text: `"${OPENING_QUOTE.text}"`, pause: 800 },
  { text: OPENING_QUOTE.attribution,             pause: 1000 },
  { text: '',                                    pause: 600  },
  { text: 'The conflict has been running for eleven days.',           pause: 900  },
  { text: 'You are not arriving to a clean slate.',                    pause: 800  },
  { text: '',                                                          pause: 400  },
  { text: 'Not by generals.',                                         pause: 500  },
  { text: 'Not by weapons.',                                          pause: 500  },
  { text: 'Not by courage alone.',                                    pause: 900  },
  { text: '',                                                          pause: 300  },
  { text: 'By the soldier who made sure the fuel was there.',         pause: 800  },
  { text: 'The NCO who pushed supply before the request came.',       pause: 800  },
  { text: 'The commander who knew the 48-hour rule was not a suggestion.', pause: 1000 },
  { text: '',                                                          pause: 500  },
  { text: 'You are the Distribution Commander.',                      pause: 700  },
  { text: 'Theater Sustainment.',                                     pause: 600  },
  { text: 'The unglamorous work that keeps armies alive.',            pause: 1000 },
  { text: '',                                                          pause: 400  },
  { text: 'While others fight — you sustain.',                        pause: 700  },
  { text: 'While others advance — you calculate.',                    pause: 700  },
  { text: 'While others sleep — your convoys move.',                  pause: 900  },
  { text: '',                                                          pause: 500  },
  { text: 'Conflict has erupted.',                                    pause: 600  },
  { text: 'Three theaters. Six operations.',                          pause: 600  },
  { text: 'Hundreds of lives waiting on your next decision.',         pause: 1100 },
  { text: '',                                                          pause: 500  },
  { text: 'The supply chain does not stop.',                          pause: 700  },
  { text: '',                                                          pause: 200  },
  { text: 'Neither do you.',                                          pause: 1400 },
  { text: '',                                                          pause: 600  },
  { text: 'LOG ACTUAL — you are on the net.',                         pause: 2000 },
]

const CHAR_SPEED = 32 // ms per character

// Radar blip positions (random but seeded for consistency)
const BLIPS = [
  { r:85,  a:23  }, { r:120, a:110 }, { r:60,  a:200 },
  { r:145, a:310 }, { r:95,  a:45  }, { r:170, a:155 },
  { r:55,  a:270 }, { r:130, a:330 }, { r:75,  a:80  },
  { r:160, a:220 }, { r:40,  a:140 }, { r:110, a:350 },
  { r:185, a:65  }, { r:100, a:185 }, { r:50,  a:300 },
]

export default function CinematicIntro({ onComplete }: Props) {
  const [displayedLines, setDisplayedLines]     = useState<string[]>([])
  const [currentLineText, setCurrentLineText]   = useState('')
  const [lineIndex, setLineIndex]               = useState(0)
  const [charIndex, setCharIndex]               = useState(0)
  const [waitingPause, setWaitingPause]         = useState(false)
  const [radarAngle, setRadarAngle]             = useState(0)
  const [activeBlips, setActiveBlips]           = useState<number[]>([])
  const [fading, setFading]                     = useState(false)
  const [done, setDone]                         = useState(false)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const rafRef     = useRef<number>(0)
  const lastTime   = useRef<number>(0)

  // Radar sweep animation
  useEffect(() => {
    const spin = (ts: number) => {
      if (!lastTime.current) lastTime.current = ts
      const dt = ts - lastTime.current
      lastTime.current = ts
      setRadarAngle(a => (a + dt * 0.06) % 360)
      rafRef.current = requestAnimationFrame(spin)
    }
    rafRef.current = requestAnimationFrame(spin)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Activate blips as sweep passes over them
  useEffect(() => {
    const deg = radarAngle
    BLIPS.forEach((b, i) => {
      const diff = ((deg - b.a) + 360) % 360
      if (diff < 4) {
        setActiveBlips(prev => prev.includes(i) ? prev : [...prev, i])
        setTimeout(() => setActiveBlips(prev => prev.filter(x => x !== i)), 2200)
      }
    })
  }, [Math.floor(radarAngle)])

  // Typewriter engine
  useEffect(() => {
    if (done) return
    if (lineIndex >= LINES.length) {
      setTimeout(() => {
        setFading(true)
        setTimeout(onComplete, 1200)
      }, 600)
      setDone(true)
      return
    }

    const line = LINES[lineIndex]

    if (waitingPause) return

    if (charIndex < line.text.length) {
      const t = setTimeout(() => {
        setCurrentLineText(line.text.slice(0, charIndex + 1))
        setCharIndex(c => c + 1)
      }, CHAR_SPEED)
      return () => clearTimeout(t)
    } else {
      // Line complete — wait pause then move to next
      const t = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line.text])
        setCurrentLineText('')
        setCharIndex(0)
        setLineIndex(l => l + 1)
        setWaitingPause(false)
      }, line.pause)
      setWaitingPause(true)
      return () => clearTimeout(t)
    }
  }, [lineIndex, charIndex, waitingPause, done])

  // Auto-scroll text
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [displayedLines, currentLineText])

  // Skip on click
  const skip = () => {
    setFading(true)
    setTimeout(onComplete, 1000)
  }

  // Radar center
  const cx = 200, cy = 200, maxR = 192
  const sweepRad = (radarAngle - 90) * Math.PI / 180

  return (
    <div onClick={skip} style={{
      position:'fixed', inset:0,
      background:'#020a06',
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer',
      opacity: fading ? 0 : 1,
      transition:'opacity 1.1s ease',
      overflow:'hidden',
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@600;700&display=swap');
        @keyframes blip-fade { 0%{opacity:1;r:5} 100%{opacity:0;r:3} }
        @keyframes scan-pass { 0%{transform:translateY(-100%);opacity:.05} 100%{transform:translateY(200%);opacity:.05} }
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>

      {/* Scanlines */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,10,4,0.08) 3px,rgba(0,10,4,0.08) 4px)',
      }}/>
      <div style={{
        position:'absolute', left:0, right:0, height:'20%',
        background:'linear-gradient(to bottom,transparent,rgba(0,200,80,0.018),transparent)',
        animation:'scan-pass 6s linear infinite',
        pointerEvents:'none',
      }}/>

      {/* Classification top */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        background:'rgba(0,10,4,0.9)', borderBottom:'1px solid #0a2a14',
        padding:'6px 0', textAlign:'center',
        fontFamily:'Share Tech Mono,monospace', fontSize:10,
        letterSpacing:3, color:'#1a4a2a',
      }}>
        UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY
      </div>

      {/* Main content */}
      <div style={{
        display:'flex', alignItems:'center', gap:60,
        maxWidth:1000, width:'94%',
      }}>

        {/* ── RADAR SCREEN ── */}
        <div style={{ flexShrink:0 }}>
          <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#001808" stopOpacity="1"/>
                <stop offset="100%" stopColor="#000c04" stopOpacity="1"/>
              </radialGradient>
              <filter id="radar-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="blip-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              {/* Sweep trail gradient */}
              <radialGradient id="sweep-grad" cx={cx/400} cy={cy/400} r="0.5">
                <stop offset="0%"   stopColor="#00ff44" stopOpacity="0.0"/>
                <stop offset="85%"  stopColor="#00ff44" stopOpacity="0.0"/>
                <stop offset="100%" stopColor="#00ff44" stopOpacity="0.0"/>
              </radialGradient>
            </defs>

            {/* Radar background */}
            <circle cx={cx} cy={cy} r={maxR+4} fill="url(#radar-bg)" stroke="#0a2a14" strokeWidth="2"/>

            {/* Range rings */}
            {[48, 96, 144, 192].map(r => (
              <circle key={r} cx={cx} cy={cy} r={r}
                fill="none" stroke="#0a3a18" strokeWidth="0.8" opacity="0.8"/>
            ))}

            {/* Crosshairs */}
            <line x1={cx-maxR} y1={cy} x2={cx+maxR} y2={cy} stroke="#0a3a18" strokeWidth="0.8" opacity="0.6"/>
            <line x1={cx} y1={cy-maxR} x2={cx} y2={cy+maxR} stroke="#0a3a18" strokeWidth="0.8" opacity="0.6"/>
            {/* Diagonal crosses */}
            {[45,135].map(deg => {
              const r = (deg-90)*Math.PI/180
              return (
                <line key={deg}
                  x1={cx + Math.cos(r)*maxR} y1={cy + Math.sin(r)*maxR}
                  x2={cx - Math.cos(r)*maxR} y2={cy - Math.sin(r)*maxR}
                  stroke="#0a3a18" strokeWidth="0.6" opacity="0.4"/>
              )
            })}

            {/* Sweep trail — multiple fading arcs behind the sweep line */}
            {[8,16,24,32,40,50,62,75].map((deg, ti) => {
              const trailAng = ((radarAngle - deg) + 360) % 360
              const trailRad = (trailAng - 90) * Math.PI / 180
              const ex = cx + Math.cos(trailRad) * maxR
              const ey = cy + Math.sin(trailRad) * maxR
              const largeArc = deg > 180 ? 1 : 0
              const prevRad  = (trailRad - (2 * Math.PI / 180))
              const px = cx + Math.cos(prevRad) * maxR
              const py = cy + Math.sin(prevRad) * maxR
              return (
                <line key={ti}
                  x1={cx} y1={cy} x2={ex} y2={ey}
                  stroke="#00ff44"
                  strokeWidth={1.5 - ti*0.15}
                  opacity={(0.45 - ti*0.055) * 0.85}
                  filter="url(#radar-glow)"
                />
              )
            })}

            {/* Active sweep line */}
            <line
              x1={cx} y1={cy}
              x2={cx + Math.cos(sweepRad) * maxR}
              y2={cy + Math.sin(sweepRad) * maxR}
              stroke="#00ff44" strokeWidth="2"
              opacity="0.95" filter="url(#radar-glow)"
            />

            {/* Center dot */}
            <circle cx={cx} cy={cy} r="4" fill="#00ff44" filter="url(#radar-glow)" opacity="0.9"/>
            <circle cx={cx} cy={cy} r="2" fill="#00ff44"/>

            {/* Blips */}
            {BLIPS.map((b, i) => {
              const isActive = activeBlips.includes(i)
              if (!isActive) return null
              const rad = (b.a - 90) * Math.PI / 180
              const bx  = cx + Math.cos(rad) * b.r
              const by  = cy + Math.sin(rad) * b.r
              return (
                <g key={i} filter="url(#blip-glow)">
                  <circle cx={bx} cy={by} r="5" fill="#00ff44" opacity="0.9"
                    style={{ animation:'blip-fade 2.2s ease-out forwards' }}/>
                  <circle cx={bx} cy={by} r="2.5" fill="#88ffaa" opacity="0.95"/>
                </g>
              )
            })}

            {/* Border */}
            <circle cx={cx} cy={cy} r={maxR+4}
              fill="none" stroke="#1a6a30" strokeWidth="1.5" opacity="0.6"
              filter="url(#radar-glow)"/>

            {/* Compass labels */}
            {[{l:'N',x:cx,y:cy-maxR-12},{l:'E',x:cx+maxR+12,y:cy+4},{l:'S',x:cx,y:cy+maxR+16},{l:'W',x:cx-maxR-14,y:cy+4}].map(c=>(
              <text key={c.l} x={c.x} y={c.y} fill="#1a6a30" fontSize="11"
                textAnchor="middle" fontFamily="Share Tech Mono,monospace" opacity="0.7">{c.l}</text>
            ))}

            {/* Range labels */}
            {[{r:48,l:'25km'},{r:96,l:'50km'},{r:144,l:'75km'},{r:192,l:'100km'}].map(rl=>(
              <text key={rl.r} x={cx+rl.r+3} y={cy-3} fill="#0a4a20" fontSize="8"
                fontFamily="Share Tech Mono,monospace">{rl.l}</text>
            ))}

            {/* STATUS box */}
            <rect x="8" y="360" width="384" height="32" rx="2" fill="rgba(0,10,4,0.8)" stroke="#0a3a14" strokeWidth="1"/>
            <text x="16" y="374" fill="#1a4a2a" fontSize="9" fontFamily="Share Tech Mono,monospace" letterSpacing="1">STATUS</text>
            <text x="62" y="374" fill="#00ff44" fontSize="9" fontFamily="Share Tech Mono,monospace" letterSpacing="1">ACTIVE</text>
            <text x="16" y="386" fill="#1a4a2a" fontSize="9" fontFamily="Share Tech Mono,monospace" letterSpacing="1">CONTACTS</text>
            <text x="75" y="386" fill="#00ff44" fontSize="9" fontFamily="Share Tech Mono,monospace">{activeBlips.length}</text>
            <text x="130" y="386" fill="#1a4a2a" fontSize="9" fontFamily="Share Tech Mono,monospace" letterSpacing="1">SWEEP</text>
            <text x="172" y="386" fill="#00ff44" fontSize="9" fontFamily="Share Tech Mono,monospace">{Math.round(radarAngle)}°</text>
            <text x="240" y="380" fill="#0a3a14" fontSize="9" fontFamily="Share Tech Mono,monospace" letterSpacing="1">LOG ACTUAL // THEATER NET</text>
          </svg>
        </div>

        {/* ── TYPEWRITER TEXT ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

          {/* Header */}
          <div style={{
            fontFamily:'Barlow Condensed,sans-serif', fontWeight:700,
            fontSize:11, letterSpacing:4, color:'#1a4a2a',
            marginBottom:20,
          }}>
            THEATER SUSTAINMENT COMMAND // INCOMING TRANSMISSION
          </div>

          {/* Text scroll area */}
          <div ref={scrollRef} style={{
            height:320, overflowY:'hidden',
            display:'flex', flexDirection:'column', justifyContent:'flex-end',
          }}>
            <div>
              {displayedLines.map((line, i) => (
                <div key={i} style={{
                  fontFamily:'Share Tech Mono,monospace',
                  fontSize: line === '' ? 8 : 15,
                  lineHeight: line === '' ? '0.8' : '1.85',
                  color: line.startsWith('LOG ACTUAL') ? '#00ff88'
                       : line.startsWith('Conflict')   ? '#ffaa00'
                       : line.startsWith('You are')    ? '#c8e6c9'
                       : line.startsWith('Three')      ? '#ffaa00'
                       : '#4a8a6a',
                  opacity: Math.max(0.3, 1 - (displayedLines.length - i) * 0.08),
                  textShadow: line.startsWith('LOG ACTUAL') ? '0 0 20px rgba(0,255,136,0.5)' : 'none',
                  letterSpacing: line.startsWith('LOG ACTUAL') ? '2px' : '0.5px',
                }}>
                  {line || '\u00A0'}
                </div>
              ))}

              {/* Current typing line */}
              {lineIndex < LINES.length && (
                <div style={{
                  fontFamily:'Share Tech Mono,monospace',
                  fontSize: LINES[lineIndex].text === '' ? 8 : 15,
                  lineHeight:1.85, color:'#c8e6c9', letterSpacing:'0.5px',
                }}>
                  {currentLineText}
                  <span style={{ animation:'cursor-blink 0.7s infinite', color:'#00ff88' }}>▮</span>
                </div>
              )}
            </div>
          </div>

          {/* Skip prompt */}
          <div style={{
            marginTop:24,
            fontFamily:'Share Tech Mono,monospace',
            fontSize:10, color:'#1a3a20', letterSpacing:2,
            animation:'cursor-blink 2s ease-in-out infinite',
          }}>
            [ CLICK ANYWHERE TO SKIP ]
          </div>
        </div>
      </div>

      {/* Classification bottom */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'rgba(0,10,4,0.9)', borderTop:'1px solid #0a2a14',
        padding:'6px 0', textAlign:'center',
        fontFamily:'Share Tech Mono,monospace', fontSize:10,
        letterSpacing:3, color:'#1a4a2a',
      }}>
        UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY
      </div>
    </div>
  )
}
