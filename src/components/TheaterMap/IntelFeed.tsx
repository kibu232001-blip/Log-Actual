import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'

interface IntelReport {
  id: string
  dtg: string
  type: 'SIGACT' | 'LOGREP' | 'INTEL' | 'DOCTRINE' | 'STONEWALL' | 'CONVOY' | 'WARNING'
  title: string
  body: string
  unit?: string
  loc?: string
  priority: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH'
  day: number
  read: boolean
}

const TYPE_COLORS: Record<string,string> = {
  SIGACT:    '#ff4444',
  LOGREP:    '#00ff88',
  INTEL:     '#00aaff',
  DOCTRINE:  '#ffaa00',
  STONEWALL: '#ff4400',
  CONVOY:    '#00dd77',
  WARNING:   '#ff8800',
}

const PRIORITY_COLORS: Record<string,string> = {
  ROUTINE:   '#1a5a3a',
  PRIORITY:  '#ffaa00',
  IMMEDIATE: '#ff8800',
  FLASH:     '#ff4444',
}

// Generate a realistic DTG from campaign day
function makeDTG(day: number): string {
  const hour = 6 + Math.floor(Math.random() * 16)
  const min  = Math.floor(Math.random() * 60)
  return `${String(day).padStart(2,'0')}${String(hour).padStart(2,'0')}${String(min).padStart(2,'0')}ZMAY26`
}

// Doctrine nuggets tied to supply categories
const DOCTRINE_REFS = [
  { text:'ADP 4-0: Push distribution is the correct default for all anticipated requirements. Do not wait for formal requests during high-tempo operations.', cat:'PUSH' },
  { text:'ATP 4-0 para 3-14: Air resupply is appropriate when ground LOC is interdicted AND time is critical. Both conditions must be present to justify the sortie cost.', cat:'AIR' },
  { text:'ATP 4-0: Triage doctrine requires serving the unit closest to failure first — not the unit geographically closest, nor the unit you prefer.', cat:'TRIAGE' },
  { text:'ADP 4-0: Economy of force units accept degradation by design. Protecting them at the cost of the main effort inverts the operational priority.', cat:'ECON' },
  { text:'ATP 4-0 para 2-8: Request cycle time USL is 48 hours. Every hour above 48 is a doctrine failure, regardless of whether the unit entered stonewall.', cat:'RCT' },
  { text:'ADP 4-0: Lateral transfer is authorized when depot resupply is delayed. Verify the donor unit retains adequate supply before executing.', cat:'LATERAL' },
  { text:'ATP 4-0: Priority of sustainment follows priority of effort. The main effort gets supply priority — not the unit with the most compelling request.', cat:'PRIORITY' },
  { text:'ADP 4-0: Pre-positioning is not optional in high-tempo operations. Supply must arrive before the fight, not during it.', cat:'PREPOS' },
]

const ENEMY_REPORTS = [
  { title:'IED ACTIVITY — MSR IRON', body:'Enemy IED emplacement team observed on MSR IRON between GP 4523 and GP 4891. Three confirmed devices. Route assessed CLOSED. Recommend immediate alternate route activation or air resupply to FOB Iron.', loc:'MSR IRON', unit:'FOB IRON' },
  { title:'ENEMY CONVOY INTERDICTION', body:'OPFOR ambush element engaged friendly convoy LOGPAC-07 on Route AMBER at 0342Z. Two vehicles destroyed. Cargo lost. Recommend reroute all subsequent convoys via Route DELTA. RCT impact: +18 hours.', loc:'ROUTE AMBER', unit:'III CORPS' },
  { title:'SHORAD REPOSITIONING OBSERVED', body:'Enemy short-range air defense assets moved to new firing position near aerial port approach corridor. Air resupply sorties to FOB Valor assessed HIGH RISK until position is suppressed. Ground LOC priority elevated.', loc:'AERIAL PORT CORRIDOR', unit:'AVN BDE' },
  { title:'DEPOT ATTACK — INDIRECT FIRE', body:'Enemy artillery impacted Depot Alpha perimeter at 1847Z. Three Class V storage areas damaged. Stockage levels reduced 22%. Push resupply from Depot Bravo recommended within 24 hours.', loc:'DEPOT ALPHA', unit:'DEPOT ALPHA' },
  { title:'ENEMY LOC INTERDICTION PATTERN', body:'Intelligence pattern analysis indicates OPFOR is targeting convoy movements occurring on predictable schedules. Route usage data suggests enemy has identified primary distribution cycles. Recommend varying convoy departure times and routes.', loc:'THEATER-WIDE', unit:'ALL UNITS' },
  { title:'BRIDGE DAMAGE CONFIRMED', body:'Aerial reconnaissance confirms bridge on MSR BLUE destroyed by enemy engineering team overnight. Alternate Route DELTA adds 6 hours to all eastbound convoy times. Engineer repair estimated 48-72 hours.', loc:'MSR BLUE', unit:'FOB EAGLE AREA' },
  { title:'ENEMY SUPPLY DISRUPTION OPS', body:'OPFOR conducting deliberate logistics interdiction campaign. Three separate LOC attacks in past 24 hours. Enemy understands that supply chain disruption is more effective than direct combat power attrition. Sustainment posture is the target.', loc:'MULTIPLE', unit:'THEATER' },
]

const LOGREP_REPORTS = [
  { title:'CONVOY LOGPAC-12 DELIVERED', body:'Class III and Class V delivered to FOB Eagle. Unit readiness restored from 58% to 84%. Request cycle time: 31 hours — within USL. Convoy returned via Route CHARLIE without incident.', unit:'FOB EAGLE' },
  { title:'DEPOT BRAVO RESUPPLY COMPLETE', body:'Strategic lift from Port of Antwerp completed. Depot Bravo at 91% capacity across all classes. Push distribution to forward FOBs recommended within 24 hours before next operational surge.', unit:'DEPOT BRAVO' },
  { title:'AIR SORTIE COMPLETED', body:'Emergency Class I air delivery to FOB Iron completed at 0612Z. Unit Class I restored from 12% to 68%. Stonewall averted. Next sortie window opens 1800Z pending weather assessment.', unit:'FOB IRON' },
  { title:'CLASS V CRITICAL — FOB VALOR', body:'FOB Valor reports Class V at 28% and falling. At current consumption rate, unit will reach CRITICAL threshold in 18 hours. Ammo Supply Point convoy tasked, ETA 36 hours. RCT will exceed USL. Recommend air resupply assessment.', unit:'FOB VALOR' },
]

const WARNING_REPORTS = [
  { title:'REQUEST CYCLE TIME TRENDING ABOVE USL', body:'Theater RCT average now 44 hours and increasing. Four pending requests have been in queue for more than 36 hours. Push distribution on anticipated requirements would have prevented three of these violations. Recommend immediate review of distribution posture.' },
  { title:'STONEWALL CASCADE RISK DETECTED', body:'FOB Iron has been in AMBER for 3 consecutive days with no resupply. Supply momentum analysis indicates cascade risk to adjacent FOB Eagle within 48-72 hours if lateral transfer or direct resupply is not executed. FOB Eagle was used as lateral transfer donor on Day 4 — reserves are thin.' },
  { title:'ENEMY PATTERN EXPLOITATION WARNING', body:'OPFOR has successfully interdicted convoys on Route IRON twice in 6 days. Pattern analysis suggests enemy has identified your primary distribution route. Continued use of Route IRON without security escort risks additional convoy losses.' },
  { title:'WAR EXHAUSTION — READINESS CEILING DEGRADING', body:'Campaign Day 18. Theater-wide readiness ceiling has dropped 6% from Day 1 baseline due to cumulative sustainment stress. Units that entered stonewall earlier in the campaign retain permanent readiness penalties. This is expected and irreversible.' },
]

function generateReportsForDay(day: number, stonewallRate: number, rct: number, sigma: number): IntelReport[] {
  const reports: IntelReport[] = []

  // Always add a SIGACT report from day 3 onward
  if (day >= 3) {
    const enemyRpt = ENEMY_REPORTS[day % ENEMY_REPORTS.length]
    reports.push({
      id: `SIGACT-${day}-${Math.random().toString(36).slice(2,6)}`,
      dtg: makeDTG(day),
      type: 'SIGACT',
      title: enemyRpt.title,
      body: enemyRpt.body,
      unit: enemyRpt.unit,
      loc: enemyRpt.loc,
      priority: day > 15 ? 'IMMEDIATE' : 'PRIORITY',
      day,
      read: false,
    })
  }

  // LOGREP every other day
  if (day % 2 === 0) {
    const logRpt = LOGREP_REPORTS[Math.floor(day / 2) % LOGREP_REPORTS.length]
    reports.push({
      id: `LOGREP-${day}-${Math.random().toString(36).slice(2,6)}`,
      dtg: makeDTG(day),
      type: 'LOGREP',
      title: logRpt.title,
      body: logRpt.body,
      unit: logRpt.unit,
      priority: 'ROUTINE',
      day,
      read: false,
    })
  }

  // Doctrine reminder — daily, tied to performance
  const docRef = rct > 40
    ? DOCTRINE_REFS.find(d => d.cat === 'RCT')
    : stonewallRate > 10
    ? DOCTRINE_REFS.find(d => d.cat === 'TRIAGE')
    : DOCTRINE_REFS[day % DOCTRINE_REFS.length]

  if (docRef) {
    reports.push({
      id: `DOC-${day}-${Math.random().toString(36).slice(2,6)}`,
      dtg: makeDTG(day),
      type: 'DOCTRINE',
      title: 'DOCTRINE REFERENCE — DAILY SUSTAINMENT BRIEF',
      body: docRef.text,
      priority: 'ROUTINE',
      day,
      read: false,
    })
  }

  // Warning if metrics are bad
  if (stonewallRate > 10 && day > 5) {
    const w = WARNING_REPORTS[day % WARNING_REPORTS.length]
    reports.push({
      id: `WARN-${day}-${Math.random().toString(36).slice(2,6)}`,
      dtg: makeDTG(day),
      type: 'WARNING',
      title: w.title,
      body: w.body,
      priority: 'IMMEDIATE',
      day,
      read: false,
    })
  }

  // Stonewall alert
  if (stonewallRate > 0) {
    reports.push({
      id: `SW-${day}-${Math.random().toString(36).slice(2,6)}`,
      dtg: makeDTG(day),
      type: 'STONEWALL',
      title: `STONEWALL EVENT — THEATER ALERT`,
      body: `One or more units have entered STONEWALL status. Combat effectiveness: ZERO. Request cycle time failure confirmed. Root cause analysis required. Push distribution on next available convoy assets. Stonewall recovery requires minimum 35% supply restoration before unit exits STONEWALL designation.`,
      priority: 'FLASH',
      day,
      read: false,
    })
  }

  return reports
}

export default function IntelFeed() {
  const { currentDay, metrics } = useGameStore()
  const [reports, setReports]   = useState<IntelReport[]>([])
  const [filter, setFilter]     = useState<string>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const lastDay = useRef(0)

  // Generate reports when day advances
  useEffect(() => {
    if (currentDay === lastDay.current) return
    lastDay.current = currentDay
    const newReports = generateReportsForDay(
      currentDay,
      metrics.stonewallRate,
      metrics.avgRequestCycleTime,
      metrics.sigmaLevel,
    )
    setReports(prev => [...newReports, ...prev].slice(0, 40))
    // Auto-expand FLASH reports
    const flash = newReports.find(r => r.priority === 'FLASH')
    if (flash) setExpanded(flash.id)
  }, [currentDay])

  // Seed initial reports on mount
  useEffect(() => {
    const initial = generateReportsForDay(1, 0, 38, 1.8)
    setReports(initial)
  }, [])

  const markRead = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, read:true } : r))
  }

  const filtered = filter === 'ALL' ? reports : reports.filter(r => r.type === filter)
  const unread   = reports.filter(r => !r.read).length

  const FILTERS = ['ALL','SIGACT','LOGREP','INTEL','DOCTRINE','WARNING','STONEWALL']

  return (
    <div style={{
      width:320, background:'#020c08',
      borderLeft:'1px solid #0a2a14',
      display:'flex', flexDirection:'column',
      fontFamily:'Barlow Condensed,sans-serif',
      overflow:'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding:'8px 12px', borderBottom:'1px solid #0a2a14',
        background:'#030e09',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{ fontSize:10, letterSpacing:3, color:'#1a5a3a',
            fontFamily:'Share Tech Mono,monospace' }}>
            THEATER INTEL FEED
          </div>
          {unread > 0 && (
            <div style={{
              background:'#ff4444', color:'white', borderRadius:10,
              fontSize:9, padding:'1px 7px', fontFamily:'Share Tech Mono,monospace',
              animation:'sw-blink 1.5s infinite',
            }}>{unread} NEW</div>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter===f ? `${TYPE_COLORS[f]||'#00ff88'}20` : 'transparent',
              border:`1px solid ${filter===f ? (TYPE_COLORS[f]||'#00ff88')+'60' : '#0a2a14'}`,
              color: filter===f ? (TYPE_COLORS[f]||'#00ff88') : '#1a4a2a',
              padding:'2px 6px', borderRadius:2, cursor:'pointer',
              fontFamily:'Share Tech Mono,monospace', fontSize:8, letterSpacing:1,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div ref={feedRef} style={{ flex:1, overflowY:'auto', padding:'4px 0' }}>
        {filtered.map(report => {
          const tc = TYPE_COLORS[report.type] || '#00ff88'
          const pc = PRIORITY_COLORS[report.priority]
          const isExpanded = expanded === report.id
          return (
            <div key={report.id}
              onClick={() => { setExpanded(isExpanded ? null : report.id); markRead(report.id) }}
              style={{
                padding:'8px 12px', cursor:'pointer',
                borderBottom:'1px solid #0a1a0c',
                background: !report.read
                  ? `${tc}06`
                  : isExpanded ? 'rgba(0,0,0,0.3)' : 'transparent',
                borderLeft:`2px solid ${report.read ? '#0a2a14' : tc}`,
                transition:'background 0.15s',
              }}
            >
              {/* Report header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{
                    fontSize:8, padding:'1px 5px', borderRadius:2, letterSpacing:1,
                    background:`${tc}20`, color:tc, border:`1px solid ${tc}40`,
                    fontFamily:'Share Tech Mono,monospace',
                  }}>{report.type}</span>
                  <span style={{
                    fontSize:8, padding:'1px 5px', borderRadius:2, letterSpacing:1,
                    background:`${pc}15`, color:pc,
                    fontFamily:'Share Tech Mono,monospace',
                    animation: report.priority==='FLASH' ? 'sw-blink 1s infinite' : undefined,
                  }}>{report.priority}</span>
                </div>
                <span style={{ fontSize:8, color:'#1a3a20',
                  fontFamily:'Share Tech Mono,monospace', letterSpacing:0.5 }}>
                  D{report.day}
                </span>
              </div>

              {/* DTG */}
              <div style={{ fontSize:8, color:'#1a3a20', marginBottom:4,
                fontFamily:'Share Tech Mono,monospace', letterSpacing:1 }}>
                {report.dtg}
                {report.unit && <span style={{ marginLeft:8, color:'#1a4a2a' }}>{report.unit}</span>}
              </div>

              {/* Title */}
              <div style={{
                fontSize:12, fontWeight:700, color: report.read ? '#2a6a3a' : tc,
                lineHeight:1.3, letterSpacing:0.5, marginBottom: isExpanded ? 6 : 0,
              }}>
                {report.title}
              </div>

              {/* Body (expanded) */}
              {isExpanded && (
                <div style={{
                  fontSize:11, color:'#4a8a6a', lineHeight:1.7,
                  fontFamily:'Barlow,sans-serif', fontWeight:400,
                  borderTop:`1px solid ${tc}20`, paddingTop:6, marginTop:4,
                  animation:'fade-in 0.2s ease',
                }}>
                  {report.body}
                  {report.loc && (
                    <div style={{ marginTop:6, fontSize:9, color:'#1a4a2a',
                      fontFamily:'Share Tech Mono,monospace', letterSpacing:1 }}>
                      LOCATION: {report.loc}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding:20, textAlign:'center', color:'#1a3a20',
            fontFamily:'Share Tech Mono,monospace', fontSize:10 }}>
            NO REPORTS FOR THIS FILTER
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding:'6px 12px', borderTop:'1px solid #0a2a14',
        background:'#030e09', display:'flex', justifyContent:'space-between',
      }}>
        <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8,
          color:'#1a3a20', letterSpacing:1 }}>
          {reports.length} REPORTS // D{currentDay}
        </span>
        <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'#1a3a20' }}>
          σ {metrics.sigmaLevel.toFixed(1)} // RCT {metrics.avgRequestCycleTime}h
        </span>
      </div>

      <style>{`
        @keyframes sw-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
