import React, { useState } from 'react'
import { MissionScenario } from './data/scenarios'
import CinematicIntro from './components/Splash/CinematicIntro'
import SplashScreen from './components/Splash/SplashScreen'
import MissionSelect from './components/MissionBrief/MissionSelect'
import MissionBrief from './components/MissionBrief/MissionBrief'
import QuoteScreen from './components/Splash/QuoteScreen'
import TopBar from './components/HUD/TopBar'
import TheaterMap from './components/TheaterMap/TheaterMap'
import Sidebar from './components/Sidebar/Sidebar'
import DoctrineDecisionModal from './components/Events/DoctrineDecision'
import ResultCard from './components/Events/ResultCard'
import CampaignAAR from './components/Campaign/CampaignAAR'
import CommanderPopup from './components/Commanders/CommanderPopup'
import CommanderDecisionModal from './components/Events/CommanderDecisionModal'
import MobileHUD from './components/HUD/MobileHUD'
import { FlashModal } from './components/TheaterMap/NewsFeedSystem'
import { useGameStore } from './store/gameStore'
import { applySigmaTheme } from './styles/sigmaTheme'

type Screen = 'CINEMATIC' | 'SPLASH' | 'MISSION_SELECT' | 'MISSION_BRIEF' | 'DEPLOYING' | 'GAME'


// ── ERROR BOUNDARY ─────────────────────────────────────────────────────────────
class GameErrorBoundary extends React.Component<{children:React.ReactNode},{error:string|null}> {
  constructor(props:any) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e:any) { return { error: String(e?.message || e) } }
  componentDidCatch(e:any) { console.error('Game screen crash:', e) }
  render() {
    if (this.state.error) return (
      <div style={{position:'fixed',inset:0,background:'#030a04',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#ff4444',letterSpacing:2,marginBottom:16}}>SYSTEM FAULT — THEATER INITIALIZATION FAILED</div>
        <div style={{fontFamily:'Share Tech Mono,monospace',fontSize:10,color:'#ff222280',maxWidth:320,textAlign:'center',lineHeight:1.6,marginBottom:24}}>{this.state.error}</div>
        <button onClick={()=>window.location.reload()} style={{fontFamily:'Share Tech Mono,monospace',fontSize:11,color:'#00ff88',background:'transparent',border:'1px solid #00ff88',padding:'8px 20px',cursor:'pointer',letterSpacing:2}}>
          RELOAD
        </button>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  const [screen, setScreen]       = useState<Screen>('CINEMATIC')
  const [scenario, setScenario]   = useState<MissionScenario | null>(null)
  const [flashEvent, setFlashEvent] = useState<any>(null)
  const seenFlashIds = React.useRef<Set<string>>(new Set())

  const {
    showDecisionModal, showResultCard, showAAR, resetGame,
    pendingCommanderEvent, dismissCommanderEvent, actionCommanderEvent,
  } = useGameStore()
  const pendingDecisionEvent = useGameStore(s => (s as any).pendingDecisionEvent)
  const clearDecisionEvent   = useGameStore(s => (s as any).clearDecisionEvent)
  const sigmaLevel = useGameStore(s => s.metrics.sigmaLevel)
  const feedEvents = useGameStore(s => (s as any).appliedBattlefieldEvents || []) as any[]

  // Apply sigma-reactive theme globally
  React.useEffect(() => { applySigmaTheme(sigmaLevel) }, [sigmaLevel])

  // Watch for FLASH/IMMEDIATE events and surface them as full-screen modal
  React.useEffect(() => {
    feedEvents.forEach((ev: any) => {
      if (seenFlashIds.current.has(ev.id)) return
      if (ev.priority === 'FLASH' || ev.priority === 'IMMEDIATE') {
        seenFlashIds.current.add(ev.id)
        if (!flashEvent) setFlashEvent(ev)
      }
    })
  }, [feedEvents])

  const handleDeploy = () => {
    setScreen('DEPLOYING')
  }

  const handleQuoteComplete = () => {
    try {
      const selectedDiff = (useGameStore.getState() as any).difficulty
      resetGame(scenario?.id)
      if (selectedDiff && selectedDiff !== 'STANDARD') {
        const sd = useGameStore.getState() as any
        if (sd.setDifficulty) sd.setDifficulty(selectedDiff)
      }
    } catch(e) { console.error('resetGame error:', e) }
    setScreen('GAME')
  }

  const handleBackToSelect = () => {
    try { resetGame() } catch(e) {}
    setScreen('MISSION_SELECT')
  }

  if (screen === 'CINEMATIC')     return <CinematicIntro onComplete={() => setScreen('SPLASH')} />
  if (screen === 'SPLASH')        return <SplashScreen   onStart={() => setScreen('MISSION_SELECT')} />
  if (screen === 'MISSION_SELECT') {
    return <MissionSelect
      onSelect={s => { setScenario(s); setScreen('MISSION_BRIEF') }}
      onBack={() => setScreen('SPLASH')}
    />
  }
  if (screen === 'MISSION_BRIEF' && scenario) {
    return <MissionBrief
      scenario={scenario}
      onProceed={handleDeploy}
      onBack={() => setScreen('MISSION_SELECT')}
    />
  }
  if (screen === 'DEPLOYING') {
    return <QuoteScreen onComplete={handleQuoteComplete} duration={2500}/>
  }

  const isMobile = window.innerWidth < 768

  if (isMobile) {
    return (
      <GameErrorBoundary>
      <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column',
        background:'#030a0e', color:'#c8e6c9', overflow:'hidden' }}>
        <TopBar />
        {/* Map: fills top portion */}
        <div style={{ flex:'0 0 52vh', position:'relative', overflow:'hidden', minHeight:0 }}>
          <TheaterMap onBack={handleBackToSelect} />
        </div>
        {/* Bottom panel: fixed height, scrollable inside */}
        <div style={{ flex:'1 1 0', minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <MobileHUD />
        </div>
        {showDecisionModal && <DoctrineDecisionModal />}
        {showResultCard    && <ResultCard />}
        {showAAR           && <CampaignAAR />}
        {pendingDecisionEvent && !showDecisionModal && !showAAR && (
          <CommanderDecisionModal
            event={pendingDecisionEvent}
            onResolved={() => clearDecisionEvent && clearDecisionEvent()}
          />
        )}
        {pendingCommanderEvent && !showDecisionModal && !pendingDecisionEvent && (
          <CommanderPopup
            event={pendingCommanderEvent}
            onAction={actionCommanderEvent}
            onDismiss={() => dismissCommanderEvent()}
          />
        )}
        {flashEvent && (
          <FlashModal event={flashEvent} onDismiss={() => setFlashEvent(null)} />
        )}
      </div>
      </GameErrorBoundary>
    )
  }

  return (
    <GameErrorBoundary>
    <div style={{ display:'grid', gridTemplateRows:'52px 1fr', height:'100vh', overflow:'hidden', background:'#030a0e', color:'#c8e6c9' }}>
      <TopBar />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', overflow:'hidden', height:'100%' }}>
        <TheaterMap onBack={handleBackToSelect} />
        <Sidebar />
      </div>
      {showDecisionModal && <DoctrineDecisionModal />}
      {showResultCard    && <ResultCard />}
      {showAAR           && <CampaignAAR />}
      {pendingDecisionEvent && !showDecisionModal && !showAAR && (
        <CommanderDecisionModal
          event={pendingDecisionEvent}
          onResolved={() => clearDecisionEvent && clearDecisionEvent()}
        />
      )}
      {pendingCommanderEvent && !showDecisionModal && !pendingDecisionEvent && (
        <CommanderPopup
          event={pendingCommanderEvent}
          onAction={actionCommanderEvent}
          onDismiss={() => dismissCommanderEvent()}
        />
      )}
      {flashEvent && (
        <FlashModal event={flashEvent} onDismiss={() => setFlashEvent(null)} />
      )}
    </div>
    </GameErrorBoundary>
  )
}
