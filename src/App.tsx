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
import { useGameStore } from './store/gameStore'

type Screen = 'CINEMATIC' | 'SPLASH' | 'MISSION_SELECT' | 'MISSION_BRIEF' | 'DEPLOYING' | 'GAME'

export default function App() {
  const [screen, setScreen]     = useState<Screen>('CINEMATIC')
  const [scenario, setScenario] = useState<MissionScenario | null>(null)
  const {
    showDecisionModal, showResultCard, showAAR, resetGame,
    pendingCommanderEvent, dismissCommanderEvent, actionCommanderEvent,
  } = useGameStore()
  const pendingDecisionEvent = useGameStore(s => (s as any).pendingDecisionEvent)
  const clearDecisionEvent   = useGameStore(s => (s as any).clearDecisionEvent)

  const handleDeploy = () => {
    setScreen('DEPLOYING') // Show quote screen for 2.5s
  }

  const handleQuoteComplete = () => {
    try { resetGame(scenario?.id) } catch(e) {}
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

  return (
    <div style={{ display:'grid', gridTemplateRows:'48px 1fr', height:'100vh', overflow:'hidden', background:'#030a0e', color:'#c8e6c9' }}>
      <TopBar />
      <div style={{
          display:'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 280px',
          gridTemplateRows: window.innerWidth < 768 ? '1fr auto' : '1fr',
          overflow:'hidden',
          height:'100%',
        }}>
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
    </div>
  )
}
