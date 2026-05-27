import React, { useEffect, useState } from 'react'

interface Props { onStart: () => void }

export default function SplashScreen({ onStart }: Props) {
  const [phase, setPhase] = useState(0)
  // 0: black, 1: classification fade in, 2: logo, 3: tagline, 4: ready

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div onClick={phase >= 4 ? onStart : undefined} style={{
      position:'fixed', inset:0, background:'#050e06',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      cursor: phase >= 4 ? 'pointer' : 'default',
      fontFamily:'Share Tech Mono, monospace',
      userSelect:'none',
    }}>

      {/* scanline overlay */}
      <div style={{
        position:'absolute', inset:0, zIndex:0,
        background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        pointerEvents:'none',
      }}/>

      {/* classification banner top */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        background:'#0a1a0c', borderBottom:'1px solid #1a3020',
        padding:'6px 0', textAlign:'center',
        fontSize:16, letterSpacing:3, color:'#2d5a32',
        opacity: phase >= 1 ? 1 : 0, transition:'opacity 0.8s',
      }}>
        UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY
      </div>

      {/* main content */}
      <div style={{ position:'relative', zIndex:1, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

        {/* logo */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition:'opacity 0.9s, transform 0.9s',
        }}>
          {/* KibuglogalVentures small mark */}
          <div style={{ fontSize:15, letterSpacing:4, color:'#2d5a32', marginBottom:24 }}>
            KIBUGLOGALVENTURES LLC
          </div>

          {/* LOG ACTUAL wordmark */}
          <div style={{
            fontSize: 88,
            fontFamily:'Barlow Condensed, sans-serif',
            fontWeight:700,
            letterSpacing:8,
            color:'#2ecc71',
            lineHeight:1,
            textShadow:'0 0 40px rgba(46,204,113,0.3)',
          }}>
            LOG
          </div>
          <div style={{
            fontSize:132,
            fontFamily:'Barlow Condensed, sans-serif',
            fontWeight:700,
            letterSpacing:8,
            color:'#c8e6c9',
            lineHeight:1,
            marginTop:-8,
          }}>
            ACTUAL
          </div>

          {/* divider line */}
          <div style={{
            width:320, height:1, background:'linear-gradient(90deg, transparent, #2ecc71, transparent)',
            margin:'20px auto',
          }}/>

          {/* subtitle */}
          <div style={{
            fontSize:21, letterSpacing:4, color:'#7aab7e',
            fontFamily:'Barlow Condensed, sans-serif', fontWeight:600,
          }}>
            STRATEGIC SUSTAINMENT
          </div>
        </div>

        {/* tagline */}
        <div style={{
          marginTop:40,
          opacity: phase >= 3 ? 1 : 0,
          transition:'opacity 1s',
          fontSize:18, color:'#2d5a32', letterSpacing:2,
          fontStyle:'italic', maxWidth:500, lineHeight:1.8,
          borderLeft:'2px solid #1a3020', paddingLeft:16,
        }}>
          "The object is not to win.<br/>
          It is to ensure your soldiers don't die<br/>
          from preventable causes while trying."
        </div>

        {/* prompt */}
        <div style={{
          marginTop:60,
          opacity: phase >= 4 ? 1 : 0,
          transition:'opacity 0.5s',
          animation: phase >= 4 ? 'blink 1.4s ease-in-out infinite' : 'none',
          fontSize:18, letterSpacing:4, color:'#2ecc71',
        }}>
          CLICK TO BEGIN
        </div>
      </div>

      {/* classification banner bottom */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        background:'#0a1a0c', borderTop:'1px solid #1a3020',
        padding:'6px 0', textAlign:'center',
        fontSize:16, letterSpacing:3, color:'#2d5a32',
        opacity: phase >= 1 ? 1 : 0, transition:'opacity 0.8s',
      }}>
        UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  )
}
