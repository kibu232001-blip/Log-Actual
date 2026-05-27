import React, { useEffect, useState } from 'react'
import { getRandomQuote } from '../../data/quotes'

interface Props {
  onComplete: () => void
  duration?: number  // ms, default 2500
}

export default function QuoteScreen({ onComplete, duration = 2500 }: Props) {
  const [quote] = useState(getRandomQuote)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    const t1 = setTimeout(() => setVisible(true), 50)
    // Hold then complete
    const t2 = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 600)
    }, duration)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'#030a04',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      zIndex:900,
      opacity: visible ? 1 : 0,
      transition:'opacity 0.5s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700&family=Barlow:ital,wght@0,400;1,400&display=swap');
      `}</style>

      {/* Scanlines */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,10,4,0.07) 3px,rgba(0,10,4,0.07) 4px)',
      }}/>

      {/* Classification */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        padding:'7px 0', textAlign:'center',
        fontFamily:'Share Tech Mono,monospace', fontSize:10,
        letterSpacing:3, color:'#1a3a20',
        borderBottom:'1px solid #0a2014',
      }}>
        UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY
      </div>

      {/* Quote block */}
      <div style={{ maxWidth:680, width:'88%', textAlign:'center' }}>
        {/* Decorative line */}
        <div style={{
          width:60, height:1,
          background:'linear-gradient(90deg,transparent,#2ecc71,transparent)',
          margin:'0 auto 28px',
        }}/>

        {/* Quote text */}
        <p style={{
          fontFamily:'Barlow,sans-serif', fontStyle:'italic',
          fontSize:22, lineHeight:1.7, color:'#c8e6c9',
          margin:'0 0 20px', fontWeight:400,
          textShadow:'0 0 30px rgba(46,204,113,0.15)',
        }}>
          "{quote.text}"
        </p>

        {/* Attribution */}
        <div style={{
          fontFamily:'Share Tech Mono,monospace', fontSize:12,
          letterSpacing:2, color:'#2d5a32',
        }}>
          {quote.attribution}
        </div>

        {/* Decorative line */}
        <div style={{
          width:60, height:1,
          background:'linear-gradient(90deg,transparent,#2ecc71,transparent)',
          margin:'28px auto 0',
        }}/>
      </div>

      {/* DEPLOYING text */}
      <div style={{
        position:'absolute', bottom:40,
        fontFamily:'Share Tech Mono,monospace', fontSize:11,
        letterSpacing:4, color:'#1a4a2a',
      }}>
        DEPLOYING TO THEATER...
      </div>

      {/* Classification bottom */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        padding:'7px 0', textAlign:'center',
        fontFamily:'Share Tech Mono,monospace', fontSize:10,
        letterSpacing:3, color:'#1a3a20',
        borderTop:'1px solid #0a2014',
      }}>
        UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY
      </div>
    </div>
  )
}
