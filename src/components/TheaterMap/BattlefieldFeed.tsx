import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getTheaterNetwork } from '../../data/scenarioNodes'
import { getUnitRoster } from '../../data/unitRosters'
import {
  BattlefieldEvent, BattlefieldEventType,
  SEVERITY_COLORS, PRIORITY_COLORS, EVENT_TYPE_LABELS,
  generateBattlefieldEvent,
} from '../../data/BattlefieldEventSystem'

// Extract lat/lng from event for map fly-to
// Dynamic coordinate lookup — built from active scenario node data
// This is the SAME source of truth that renders the map icons, so zoom always lands on the icon
function useEventCoordLookup() {
  const scenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const theater    = getTheaterNetwork(scenarioId)
  const roster     = getUnitRoster(scenarioId)

  // Theater bounding box — don't fly outside it
  const lats = theater.nodes.map(n=>n.lat)
  const lngs = theater.nodes.map(n=>n.lng)
  const minLat = Math.min(...lats)-2, maxLat = Math.max(...lats)+2
  const minLng = Math.min(...lngs)-2, maxLng = Math.max(...lngs)+2

  const inBounds = (lat:number, lng:number) =>
    lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng

  return (ev: any): {lat:number;lng:number;zoom:number}|null => {
    const assets: string[] = ev.affectedAssets || []
    for (const asset of assets) {
      const rosterEntry = roster[asset]
      if (rosterEntry?.nodeId) {
        const node = theater.nodes.find(n => n.id === rosterEntry.nodeId)
        if (node && inBounds(node.lat, node.lng)) return { lat: node.lat, lng: node.lng, zoom: 9 }
      }
      const byId = theater.nodes.find(n => n.id === asset)
      if (byId && inBounds(byId.lat, byId.lng)) return { lat: byId.lat, lng: byId.lng, zoom: 9 }
      const byUnit = theater.nodes.find(n => n.unitId === asset)
      if (byUnit && inBounds(byUnit.lat, byUnit.lng)) return { lat: byUnit.lat, lng: byUnit.lng, zoom: 9 }
    }
    return null
  }
}

const ACTIVITY_BY_SCENARIO: Record<string,number> = {
  CAMPAIGN_1:0.35, CAMPAIGN_2:0.55, CAMPAIGN_3:0.50,
  CAMPAIGN_4:0.15, CAMPAIGN_5:0.40, CAMPAIGN_6:0.60,
}

export default function BattlefieldFeed() {
  const { currentDay, metrics, units } = useGameStore()
  const activeScenarioId = useGameStore(s => (s as any).activeScenarioId || 'CAMPAIGN_1')
  const SCENARIO_ACTIVITY = ACTIVITY_BY_SCENARIO[activeScenarioId] ?? 0.45
  const [events, setEvents]           = useState<BattlefieldEvent[]>([])
  const [expanded, setExpanded]       = useState<string | null>(null)
  const lastEnemyAttacks = useGameStore(s => (s as any).lastEnemyAttacks || [])
  const appliedBattlefieldEvents = useGameStore(s => (s as any).appliedBattlefieldEvents || [])
  const flyToLocation    = useGameStore(s => (s as any).flyToLocation)
  const getEventCoords   = useEventCoordLookup()
  const applyEventResponse      = useGameStore(s => (s as any).applyEventResponse)
  const setPendingDecisionEvent = useGameStore(s => { const st = s as any; return (ev:any)=>{ if(st.pendingDecisionEvent===null && (ev as any)?.responseOptions?.length>0) (s as any).clearDecisionEvent?.(); (s as any).__set?.({pendingDecisionEvent:ev})} })
  const setWeather    = useGameStore(s => (s as any).setWeather)
  const realtimeFeedEvents = useGameStore(s => (s as any).realtimeFeedEvents || [])
  const [recentTypes, setRecentTypes] = useState<BattlefieldEventType[]>([])
  const [filter, setFilter]           = useState<'ALL'|'FLASH'|'LOG'>('ALL')
  const feedRef = useRef<HTMLDivElement>(null)
  const lastDay = useRef(0)

  // Generate events when day advances
  useEffect(() => {
    if (currentDay === lastDay.current) return
    lastDay.current = currentDay

    // 1–3 events per day depending on activity
    const count = 1 + Math.floor(Math.random() * 2)
    const newEvents: BattlefieldEvent[] = []

    for (let i = 0; i < count; i++) {
      const ev = generateBattlefieldEvent(currentDay, SCENARIO_ACTIVITY, recentTypes)
      if (ev) {
        newEvents.push(ev)
        setRecentTypes(prev => [...prev.slice(-5), ev.type])
      }
    }

    if (newEvents.length > 0) {
      setEvents(prev => [...newEvents, ...prev].slice(0, 50))
      // Auto-expand FLASH events
      const flash = newEvents.find(e => e.priority === 'FLASH')
      if (flash) setExpanded(flash.id)
    }
  }, [currentDay])

  // Pull sub-day real-time tactical events
  useEffect(() => {
    if (!realtimeFeedEvents || realtimeFeedEvents.length === 0) return
    const newest = realtimeFeedEvents.slice(0, 2)
    setEvents(prev => {
      const existingIds = new Set(prev.map((e: any) => e.id))
      const fresh = newest.filter((e: any) => !existingIds.has(e.id))
      if (fresh.length === 0) return prev
      return [...fresh, ...prev].slice(0, 50)
    })
  }, [realtimeFeedEvents])

  // Use appliedBattlefieldEvents — generated AFTER effects are applied
  // These show REAL supply numbers, not template text
  useEffect(() => {
    if (!appliedBattlefieldEvents || appliedBattlefieldEvents.length === 0) return
    setEvents(prev => {
      const existingIds = new Set(prev.map((e: any) => e.id))
      const fresh = appliedBattlefieldEvents.filter((e: any) => !existingIds.has(e.id))
      if (fresh.length === 0) return prev
      return [...fresh, ...prev].slice(0, 60)
    })
    const flash = appliedBattlefieldEvents.find((e: any) => e.priority === 'FLASH')
    if (flash) setExpanded(flash.id)
  }, [appliedBattlefieldEvents])

  // Seed day-1 events
  useEffect(() => {
    const seed = generateBattlefieldEvent(1, SCENARIO_ACTIVITY, [])
    if (seed) setEvents([seed])
  }, [])

  const acknowledge = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, acknowledged:true } : e))
  }

  const mitigate = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, mitigated:true, acknowledged:true } : e))
    setTimeout(() => setEvents(prev => prev.filter(e => e.id !== id)), 1200)
  }

  // Radio transmission VOT for commander actions
  const radioTransmit = (option: any) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const radioLines = [
      `${option.label}. Executing now.`,
      `Command, this is theater. ${option.label} in effect. Out.`,
      `All stations, all stations. ${option.label}. Acknowledge. Out.`,
      `Roger, executing ${option.label}. Wilco. Out.`,
      `Solid copy. ${option.label}. Elements are moving. Out.`,
    ]
    const text = radioLines[Math.floor(Math.random() * radioLines.length)]
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate  = 1.05
    utter.pitch = 0.85
    utter.volume = 0.9
    // Try to get a male voice for radio
    const voices = window.speechSynthesis.getVoices()
    const male = voices.find(v => v.lang.startsWith('en') && /male|man|david|daniel|mark/i.test(v.name))
                ?? voices.find(v => v.lang.startsWith('en'))
    if (male) utter.voice = male
    window.speechSynthesis.speak(utter)
  }

  const mitigateWithOption = (id: string, option: any) => {
    // Apply option consequence text visually
    setEvents(prev => prev.map(e => e.id === id ? {
      ...e,
      mitigated: true,
      acknowledged: true,
      chosenOption: option,
      report: e.report + `

▶ COMMANDER RESPONSE: ${option.label}
${option.consequence}`,
    } : e))
    setExpanded(null)
    // TODO: wire option.effects to game store in future pass
  }

  const filtered = events.filter(e =>
    filter === 'ALL' ? true :
    filter === 'FLASH' ? (e.priority === 'FLASH' || e.priority === 'IMMEDIATE') :
    e.acknowledged
  )

  const unacked = events.filter(e => !e.acknowledged).length

  return (
    <div style={{
      width: 320, background:'#020c08',
      borderLeft:'1px solid #0a2a14',
      display:'flex', flexDirection:'column',
      fontFamily:'Barlow Condensed,sans-serif',
      flexShrink: 0,
    }}>
      <style>{`
        @keyframes flash-border { 0%,100%{border-color:#ff220040} 50%{border-color:#ff2200} }
        @keyframes blink-badge  { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes slide-in     { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* Header */}
      <div style={{ padding:'8px 12px', borderBottom:'1px solid #0a2a14', background:'#030e09' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div>
            <div style={{ fontSize:15, letterSpacing:3, color:'#1a5a3a',
              fontFamily:'Share Tech Mono,monospace', marginBottom:1 }}>BATTLEFIELD FEED</div>
            <div style={{ fontSize:12, color:'#0a3a20', fontFamily:'Share Tech Mono,monospace' }}>
              LIVE // THEATER // SIGACTS + LOGISTICS
            </div>
          </div>
          {unacked > 0 && (
            <div style={{
              background:'#ff2200', color:'white', borderRadius:10,
              fontSize:15, padding:'2px 8px', fontFamily:'Share Tech Mono,monospace',
              fontWeight:700, animation:'blink-badge 1s infinite',
            }}>{unacked}</div>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:4 }}>
          {(['ALL','FLASH','LOG'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex:1, background: filter===f ? 'rgba(0,255,136,0.12)' : 'transparent',
              border:`1px solid ${filter===f?'#2ecc71':'#0a2a14'}`,
              color: filter===f ? '#2ecc71' : '#1a4a2a',
              padding:'3px 0', borderRadius:2, cursor:'pointer',
              fontFamily:'Share Tech Mono,monospace', fontSize:12, letterSpacing:1,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Event feed */}
      <div ref={feedRef} style={{ flex:1, overflowY:'auto' }}>
        {filtered.map(ev => {
          const sc   = SEVERITY_COLORS[ev.severity]
          const pc   = PRIORITY_COLORS[ev.priority]
          const isEx = expanded === ev.id
          const isFlash = ev.priority === 'FLASH'
          return (
            <div key={ev.id}
              onClick={() => {
          const wasExpanded = isEx
          setExpanded(wasExpanded ? null : ev.id)
          acknowledge(ev.id)
          // Fly map to event location if coordinates available
          if (!wasExpanded && flyToLocation) {
            const coords = getEventCoords(ev)
            if (coords) flyToLocation(coords.lat, coords.lng, coords.zoom)
          }
          // Trigger weather effect if weather event
          if (!wasExpanded && setWeather && ev.type === ('WEATHER' as any)) {
            const wx = ev.title.toLowerCase().includes('storm') ? 'STORM'
                     : ev.title.toLowerCase().includes('fog') ? 'FOG' : 'RAIN'
            setWeather(wx)
            setTimeout(() => setWeather('CLEAR'), 30000)
          }
        }}
              style={{
                padding:'8px 12px', cursor:'pointer',
                borderBottom:'1px solid #0a1a0c',
                borderLeft:`3px solid ${ev.acknowledged ? '#0a2a14' : sc}`,
                background: isFlash && !ev.acknowledged
                  ? 'rgba(255,34,0,0.05)'
                  : isEx ? 'rgba(0,0,0,0.25)' : 'transparent',
                animation: isFlash && !ev.acknowledged ? 'flash-border 1.2s infinite' : 'slide-in 0.3s ease',
                transition:'background 0.15s',
              }}
            >
              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  <span style={{
                    fontSize:12, padding:'1px 5px', borderRadius:2, letterSpacing:1,
                    background:`${sc}20`, color:sc, border:`1px solid ${sc}40`,
                    fontFamily:'Share Tech Mono,monospace',
                  }}>{EVENT_TYPE_LABELS[ev.type]}</span>
                  <span style={{
                    fontSize:12, padding:'1px 5px', borderRadius:2,
                    background:`${pc}15`, color:pc,
                    fontFamily:'Share Tech Mono,monospace',
                    animation: isFlash ? 'blink-badge 0.8s infinite' : 'none',
                  }}>{ev.priority}</span>
                </div>
                <span style={{ fontSize:12, color:'#1a3a20', fontFamily:'Share Tech Mono,monospace' }}>
                  D{ev.day} {ev.timeInDay}
                </span>
              </div>

              {/* Title */}
              <div style={{
                fontSize:18, fontWeight:700, letterSpacing:.5, lineHeight:1.3,
                color: ev.mitigated ? '#1a5a3a' : ev.acknowledged ? '#2a6a3a' : sc,
                marginBottom:2,
              }}>
                {ev.mitigated && <span style={{ marginRight:6, fontSize:14 }}>✓ MITIGATED</span>}
                {ev.title}
              </div>

              {/* Location */}
              <div style={{ fontSize:14, color:'#1a4a2a', fontFamily:'Share Tech Mono,monospace' }}>
                {ev.location}
                {ev.affectedAssets.length > 0 && (
                  <span style={{ marginLeft:8, color:'#1a3a20' }}>
                    AFFECTS: {ev.affectedAssets.join(', ')}
                  </span>
                )}
              </div>

              {/* Expanded body */}
              {isEx && (
                <div style={{ marginTop:8, animation:'slide-in .2s ease' }}>
                  <p style={{
                    fontSize:16, color:'#4a8a6a', lineHeight:1.7, margin:'0 0 8px',
                    fontFamily:'Barlow,sans-serif', fontWeight:400,
                    borderTop:'1px solid #0a2a14', paddingTop:8,
                  }}>
                    {ev.report}
                  </p>

                  {/* Effects */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:12, letterSpacing:2, color:'#1a4a2a',
                      fontFamily:'Share Tech Mono,monospace', marginBottom:5 }}>
                      MECHANICAL EFFECTS
                    </div>
                    {ev.effects.map((eff,i) => (
                      <div key={i} style={{
                        display:'flex', justifyContent:'space-between',
                        padding:'3px 8px', marginBottom:3, borderRadius:2,
                        background:'rgba(255,34,0,0.06)',
                        border:'1px solid rgba(255,34,0,0.15)',
                      }}>
                        <span style={{ fontSize:14, color:'#ff6600',
                          fontFamily:'Share Tech Mono,monospace' }}>{eff.type}</span>
                        <span style={{ fontSize:14, color:'#ff4444',
                          fontFamily:'Share Tech Mono,monospace' }}>
                          {eff.target} -{eff.magnitude}%
                          {eff.durationDays ? ` / ${eff.durationDays}d` : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Doctrine implication */}
                  <div style={{
                    padding:'6px 8px', borderRadius:3,
                    background:'rgba(255,170,0,0.06)',
                    border:'1px solid rgba(255,170,0,0.2)',
                    marginBottom:8,
                  }}>
                    <div style={{ fontSize:12, color:'#ffaa00', letterSpacing:2,
                      fontFamily:'Share Tech Mono,monospace', marginBottom:4 }}>
                      DOCTRINE IMPLICATION
                    </div>
                    <p style={{ fontSize:15, color:'#c8a060', lineHeight:1.6, margin:0,
                      fontFamily:'Barlow,sans-serif' }}>
                      {ev.doctrineImplication}
                    </p>
                  </div>

                  {/* Multi-option response */}
                  {!ev.mitigated && (ev as any)?.responseOptions && (
                    <div style={{ marginTop:6 }}>
                      <div style={{ fontSize:14, letterSpacing:2, color:'#1a5a3a', marginBottom:6, fontFamily:'Share Tech Mono,monospace' }}>
                        COMMANDER — SELECT RESPONSE:
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        {((ev as any)?.responseOptions as any[]).map((opt: any) => {
                          const riskColor = opt.risk==='CRITICAL'?'#ff2200':opt.risk==='HIGH'?'#ff6600':opt.risk==='MEDIUM'?'#ffaa00':'#00ff88'
                          return (
                            <button key={opt.id} onClick={e=>{ e.stopPropagation(); mitigateWithOption(ev.id, opt) }}
                              style={{
                                background:`${riskColor}08`, border:`1px solid ${riskColor}40`,
                                borderRadius:3, padding:'7px 10px', cursor:'pointer',
                                textAlign:'left', transition:'all .15s',
                              }}
                              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${riskColor}18`}}
                              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${riskColor}08`}}
                            >
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:18, color:riskColor, letterSpacing:1 }}>
                                  {opt.id}. {opt.label}
                                </span>
                                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:riskColor, padding:'1px 5px', border:`1px solid ${riskColor}40`, borderRadius:2 }}>
                                  {opt.risk}
                                </span>
                              </div>
                              <div style={{ fontSize:15, color:'#4a8a6a', lineHeight:1.5, marginBottom:2 }}>{opt.description}</div>
                              <div style={{ fontSize:14, color:'#2a5a3a', fontFamily:'Share Tech Mono,monospace' }}>
                                COST: {opt.cost}
                              </div>
                            </button>
                          )
                        })}
                        <button onClick={e=>{ e.stopPropagation(); acknowledge(ev.id); setExpanded(null) }}
                          style={{ background:'transparent', border:'1px solid #0a2a14', color:'#1a4a2a', padding:'5px', borderRadius:3, cursor:'pointer', fontFamily:'Barlow Condensed,sans-serif', fontSize:16 }}>
                          DEFER — NO ACTION NOW
                        </button>
                      </div>
                    </div>
                  )}
                  {!ev.mitigated && !(ev as any)?.responseOptions && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={e => { e.stopPropagation(); mitigate(ev.id) }} style={{ flex:1, background:'rgba(0,255,136,0.12)', border:'1px solid #2ecc71', color:'#2ecc71', padding:'6px 0', borderRadius:3, cursor:'pointer', fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:16 }}>
                        ✓ ACKNOWLEDGE
                      </button>
                      <button onClick={e => { e.stopPropagation(); acknowledge(ev.id); setExpanded(null) }} style={{ background:'transparent', border:'1px solid #0a2a14', color:'#1a4a2a', padding:'6px 10px', borderRadius:3, cursor:'pointer', fontFamily:'Barlow Condensed,sans-serif', fontSize:16 }}>DISMISS</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding:24, textAlign:'center', color:'#0a2a14',
            fontFamily:'Share Tech Mono,monospace', fontSize:14, letterSpacing:2 }}>
            NO EVENTS // AWAITING CONTACT
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'5px 12px', borderTop:'1px solid #0a2a14', background:'#030e09',
        display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'#0a3a20' }}>
          {events.length} EVENTS // D{currentDay}
        </span>
        <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12,
          color: unacked > 0 ? '#ff4444' : '#0a3a20',
          animation: unacked > 0 ? 'blink-badge 1.5s infinite' : 'none',
        }}>
          {unacked > 0 ? `${unacked} UNACKED` : 'ALL CLEAR'}
        </span>
      </div>
    </div>
  )
}
