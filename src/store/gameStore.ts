import { create } from 'zustand'
import { GameState, GameActions, UIState, TurnPhase, Unit, UnitStatus } from '../types/game'
import { CAMPAIGN_1_DECISIONS, getDecisionsForScenario } from '../data/decisions'
import { CAMPAIGN_1_NODES, CAMPAIGN_1_LOCS } from '../data/nodes'
import { CommanderEvent, selectCommanderEvent } from '../data/Commanders'
import {
  EnemyIntelligence, EnemyAttack, createInitialIntel,
  computeEnemyActions, recordConvoyDispatch, resolveAttackEffects,
} from '../engine/EnemyAI'
import { generateResponseOptions, ResponseOption } from '../engine/EventResponseGenerator'
import { calculateBurnRate, tempoFromDay, SCENARIO_ENVIRONMENT, BurnRateOutput } from '../data/MTOE'
import { getUnitRoster } from '../data/unitRosters'
import { getScenarioUnits } from '../data/scenarioUnits'
import { getScenarioMeta } from '../data/scenarioRoutes'

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getStatus(r:number, strength?:number, streak?:number):UnitStatus {
  if ((strength !== undefined && strength < 10) || (streak !== undefined && streak >= 4)) return 'DARK'
  if (r<=0) return 'STONEWALL'
  if (r<50) return 'RED'
  if (r<80) return 'AMBER'
  return 'GREEN'
}
function calcSigma(sw:number,rct:number):number {
  const d=Math.max(0.001,Math.min(0.999,((Math.max(0,(rct-48)/48))+(sw/100))/2))
  const dpm=d*1e6
  return dpm<=3.4?6:dpm<=233?5:dpm<=6210?4:dpm<=66807?3:dpm<=308538?2:dpm<=690000?1:0.5
}
function calcRCT(units:Record<string,Unit>):number {
  const vals=Object.values(units).map(u=>u.readiness)
  return Math.round(24+((100-vals.reduce((a,b)=>a+b,0)/vals.length)/100)*48)
}
function calcSW(units:Record<string,Unit>):number {
  const all=Object.values(units)
  return Math.round((all.filter(u=>u.status==='STONEWALL').length/all.length)*100)
}
function calcAvg(units:Record<string,Unit>):number {
  const vals=Object.values(units).map(u=>u.readiness)
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)
}
function classKey(c:number):keyof Unit['supplyLevels'] {
  return (['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX'] as const)[c] ?? 'CL_I'
}

// ── REAL CONVOY SYSTEM ────────────────────────────────────────────────────────
interface RealConvoy {
  id:string; fromNodeId:string; toUnitId:string; locId:string
  cargo:Array<{supplyClass:number;amount:number}>
  departedDay:number; travelDays:number; isAir:boolean
  status:'EN_ROUTE'|'DELIVERED'|'INTERDICTED'
  progress:number  // 0-1 for visual
}

// Route definitions for auto-dispatch
function findMostNeededClass(unit:Unit):number {
  const lvls = [
    unit.supplyLevels.CL_I, unit.supplyLevels.CL_II, unit.supplyLevels.CL_III,
    unit.supplyLevels.CL_IV, unit.supplyLevels.CL_V, unit.supplyLevels.CL_IX,
  ]
  let minVal=101, minIdx=2  // default Class III
  lvls.forEach((v,i)=>{ if(v<minVal){minVal=v;minIdx=i} })
  return minIdx
}

function buildInitialState(scenarioId='CAMPAIGN_1'): GameState & { realConvoys:RealConvoy[]; pendingCommanderEvent:CommanderEvent|null; firedCommanderEventIds:string[]; enemyAOs:Array<{id:string;lat:number;lng:number;radius:number;label:string;type:string;expiresDay:number}> } {
  const unitList  = getScenarioUnits(scenarioId)
  const units     = unitList.reduce((a,u)=>({...a,[u.id]:u}),{} as Record<string,Unit>)
  const nodes     = CAMPAIGN_1_NODES.reduce((a,n)=>({...a,[n.id]:n}),{})
  const locs      = CAMPAIGN_1_LOCS.reduce((a,l)=>({...a,[l.id]:l}),{})
  const meta      = getScenarioMeta(scenarioId)
  const sw=calcSW(units),rct=calcRCT(units),sigma=calcSigma(sw,rct),avg=calcAvg(units)

  // Seed Day 1 intel — feed should never be empty on game start
  const day1Events: any[] = [
    {
      id:'D1_SITREP', type:'INTEL',
      title:'INITIAL THEATER ASSESSMENT — D01',
      report:`Theater distribution network active. Starting sigma: ${sigma.toFixed(1)}σ. RCT baseline: ${rct}h. Enemy activity level: ${Math.round(meta.enemyActivityLevel*100)}%. Commander, the clock is running.`,
      priority:'ROUTINE', severity:'MINOR', effects:[], affectedAssets:[],
      acknowledged:false, mitigated:false, location:'THEATER', mitigationWindow:60,
    },
    {
      id:'D1_WEATHER', type:'WEATHER',
      title:'WEATHER BRIEF — D01',
      report:'Current conditions CLEAR theater-wide. All LOCs and air corridors OPEN. Pre-position window active. Monitor for deterioration.',
      priority:'ROUTINE', severity:'MINOR', effects:[], affectedAssets:[],
      acknowledged:false, mitigated:false, location:'THEATER', mitigationWindow:60,
    },
    {
      id:'D1_ENEMY', type:'INTEL',
      title:`OPFOR ASSESSMENT — ACTIVITY ${Math.round(meta.enemyActivityLevel*100)}%`,
      report: meta.enemyActivityLevel >= 0.5
        ? 'Enemy forces actively interdicting LOCs. Ground convoy movement HIGH RISK on primary routes. Air alternatives strongly recommended.'
        : meta.enemyActivityLevel >= 0.35
        ? 'OPFOR conducting probing operations. LOC threat MEDIUM. Convoy escorts advised on forward routes.'
        : 'Enemy threat LOW. Focus on process — every hour above the 48h USL is a readiness failure waiting to happen.',
      priority: meta.enemyActivityLevel >= 0.5 ? 'PRIORITY' : 'ROUTINE',
      severity:'MINOR', effects:[], affectedAssets:[],
      acknowledged:false, mitigated:false, location:'FRONT', mitigationWindow:60,
    },
  ]
  return {
    campaignId:scenarioId, campaignName:scenarioId,
    currentDay:1, totalDays:meta.totalDays, currentPhase:'INTELLIGENCE',
    units, nodes, locs, convoys:[], requestQueue:[],
    pendingDecision:null, completedDecisions:[],
    metrics:{ avgReadiness:avg, stonewallRate:sw, avgRequestCycleTime:rct, sigmaLevel:sigma, doctrineAccuracy:0, forceMultiplierTotal:0 },
    metricsHistory:[], weather:'CLEAR', isGameOver:false, isPaused:false, showAAR:false,
    realConvoys:[], mapFlyTarget:null as {lat:number;lng:number;zoom:number}|null, failureReason:null as string|null, pendingDecisionEvent:null as any, daysSinceLastAction:0, totalDecisionsMade:0, pendingCommanderEvent:null, firedCommanderEventIds:[], enemyAOs:[], enemyIntel:createInitialIntel(), lastEnemyAttacks:[], activeScenarioId:scenarioId, appliedBattlefieldEvents:day1Events as any[], locInterdictions:({} as Record<string,number>),
  }
}

const INITIAL_UI:UIState = { selectedNodeId:null, selectedUnitId:null, activePanel:'UNITS', showDecisionModal:false, showResultCard:false, lastDecisionResult:null, mapZoom:1, mapOffset:{x:0,y:0} }

const PHASES:TurnPhase[]=['INTELLIGENCE','PLANNING','EXECUTION']
const nextPhase=(p:TurnPhase)=>PHASES[(PHASES.indexOf(p)+1)%PHASES.length]

type Store = GameState & { realConvoys:RealConvoy[]; enemyIntel:EnemyIntelligence; lastEnemyAttacks:EnemyAttack[]; pendingCommanderEvent:CommanderEvent|null; firedCommanderEventIds:string[]; enemyAOs:any[];
  mapFlyTarget:{lat:number;lng:number;zoom:number}|null; failureReason:string|null;
  pendingDecisionEvent:any; daysSinceLastAction:number; totalDecisionsMade:number;
  activeScenarioId:string; appliedBattlefieldEvents:any[];
  weather:string; realtimeFeedEvents:any[];
} & GameActions & UIState & {
  autoAdvanceEnabled:boolean; secondsToNextDay:number
  startAutoAdvance:()=>void; stopAutoAdvance:()=>void; _timerInterval:any
  dismissCommanderEvent:()=>void; actionCommanderEvent:(e:CommanderEvent)=>void
  setActivePanel:(p:UIState['activePanel'])=>void
  setSelectedNode:(id:string|null)=>void; setSelectedUnit:(id:string|null)=>void
  dismissResult:()=>void
}

export const useGameStore = create<Store>((set,get)=>({
  ...buildInitialState(), ...INITIAL_UI,
  autoAdvanceEnabled:false, secondsToNextDay:120, _timerInterval:null, _tacticalInterval:null, realtimeFeedEvents:[] as any[],

  startTacticalFeed:()=>{
    const existing = get()._tacticalInterval
    if (existing) clearInterval(existing)
    const iv = setInterval(()=>{
      const s = get()
      if (s.isPaused || s.isGameOver) return
      const day = s.currentDay
      const sigma = s.metrics.sigmaLevel
      const sw = s.metrics.stonewallRate

      // Sub-day reports fire every 45-90 seconds
      // Pull actual unit names from current game state — NO hardcoded FOB names
      const unitList = Object.values(s.units as any) as any[]
      const fwdUnits = unitList.filter((u:any)=>!u.isDark).sort((a:any,b:any)=>a.readiness-b.readiness)
      const critUnit = fwdUnits[0] || unitList[0]
      const bestUnit = fwdUnits[fwdUnits.length-1] || unitList[0]
      const rndUnit  = unitList[Math.floor(Math.random()*unitList.length)]
      const depotLabel = s.activeScenarioId === 'CAMPAIGN_3' ? 'Depot Amman'
                       : s.activeScenarioId === 'CAMPAIGN_4' ? 'Depot Kuwait'
                       : s.activeScenarioId === 'CAMPAIGN_5' ? 'Camp Carroll'
                       : s.activeScenarioId === 'CAMPAIGN_6' ? 'Depot Guam'
                       : s.activeScenarioId === 'CAMPAIGN_2' ? 'Depot Riga'
                       : 'Depot Bydgoszcz'

      const templates = [
        { type:'PATROL', title:`PATROL RPT — D${day} ${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
          body:`Patrol element reports route conditions: ${['Primary MSR assessed clear of IED activity — convoy movement authorized','Route conditions AMBER — civilian traffic elevated, no direct threat indicators','Debris on route, passable with caution — reduced speed recommended','Rain and reduced visibility on eastern corridor — convoy speed reduced 30%'][Math.floor(Math.random()*4)]}`, priority:'ROUTINE' },
        { type:'MAINT', title:'MAINTENANCE REPORT — DAILY',
          body: (() => {
            const cl9 = critUnit?.supplyLevels?.CL_IX ?? 0
            const err = critUnit?.maintenance?.equipmentReadinessRate ?? 80
            const dl  = critUnit?.maintenance?.vehiclesDeadlined ?? 0
            const avnCl9 = (s.units as any)['AVN_BDE']?.supplyLevels?.CL_IX ?? 0
            if (cl9 < 25) return `${critUnit?.name||'Forward unit'} Class IX CRITICAL at ${Math.round(cl9)}%. ERR ${Math.round(err)}%. ${dl} vehicles deadlined. Parts shortage confirmed. Operational capability severely degraded.`
            if (cl9 < 50) return `${critUnit?.name||'Forward unit'} Class IX at ${Math.round(cl9)}%. ${dl} vehicles deadlined. ERR ${Math.round(err)}%. Parts request submitted — awaiting delivery.`
            return `Maintenance: ${bestUnit?.name||'Theater'} ERR ${Math.round(bestUnit?.maintenance?.equipmentReadinessRate??85)}%. ${critUnit?.name||'Units'} Class IX at ${Math.round(cl9)}%. ${dl > 5 ? `${dl} vehicles deadlined — monitor.` : 'All vehicles FMC.'}`
          })(), priority: critUnit?.supplyLevels?.CL_IX < 30 ? 'PRIORITY' : 'ROUTINE' },
        { type:'MEDICAL', title:'MEDICAL STATUS REPORT',
          body: (() => {
            const cl8 = critUnit?.supplyLevels?.CL_VIII ?? 0
            const cl8Status = cl8 < 20 ? 'CRITICAL' : cl8 < 40 ? 'AMBER' : cl8 < 70 ? 'MODERATE' : 'GREEN'
            const cl8Pct = Math.round(cl8)
            if (cl8 < 20) return `CRITICAL: ${critUnit?.name||'Forward unit'} Class VIII at ${cl8Pct}%. Insufficient for sustained casualty treatment. Medical battalion requesting emergency resupply immediately.`
            if (cl8 < 40) return `${critUnit?.name||'Forward unit'} Class VIII at ${cl8Pct}% — AMBER. Monitoring closely. ${Math.floor(1+Math.random()*4)} WIA from recent contact consuming existing stocks.`
            return `Medical status: ${critUnit?.name||'Theater'} Class VIII ${cl8Pct}% (${cl8Status}). ${bestUnit?.name||'Lead unit'} at ${Math.round(bestUnit?.supplyLevels?.CL_VIII??80)}%. Sick call rate within normal parameters.`
          })(), priority: critUnit?.supplyLevels?.CL_VIII < 30 ? 'PRIORITY' : 'ROUTINE' },
        { type:'RECON', title:'RECONNAISSANCE UPDATE',
          body: (() => {
            const opts = [
              `S2 reports OPFOR interdiction elements repositioning toward ${critUnit?.name||'forward positions'} (Rdns: ${Math.round(critUnit?.readiness||0)}%). Enemy has identified your supply pattern to this unit.`,
              `Aerial recon confirms enemy engineering activity on main supply route. Possible demolition preparation. Route alternate recommended before next convoy.`,
              `HUMINT: enemy briefing teams on convoy schedules and timing. Vary your departure windows. ${critUnit?.name||'Forward unit'} route especially compromised.`,
              `Enemy air defense repositioned east of ${rndUnit?.name||'forward area'}. Air corridor threat elevated to MEDIUM. Ground alternate viable.`,
            ]
            return opts[Math.floor(Math.random()*opts.length)]
          })(), priority:Math.random()<.3?'PRIORITY':'ROUTINE' },
        { type:'CONVOY', title:'CONVOY STATUS UPDATE',
          body:`LOGPAC-${Math.floor(10+Math.random()*90)} ${[`departed ${depotLabel}. ETA ${critUnit?.name||'forward unit'} ${Math.floor(4+Math.random()*8)} hours.`,`arrived ${bestUnit?.name||'destination'}. Class III delivered. Unit readiness improving.`,'delayed at checkpoint. Route assessment ongoing. ETA revised +3 hours.',`completed delivery to ${rndUnit?.name||'unit'}. Class V restored to ${Math.floor(60+Math.random()*25)}%. Unit ${['AMBER','GREEN'][Math.floor(Math.random()*2)]}.`][Math.floor(Math.random()*4)]}`, priority:'ROUTINE' },
        { type:'WEATHER', title:'WEATHER UPDATE',
          body:`${['Visibility 8km. Ceiling 3000ft. All air corridors OPEN. Road conditions good.','Scattered showers northeast sector. Air corridor reduced to IFR minimums. Ground routes unaffected.','Clear conditions theater-wide. All routes and corridors OPEN.','Weather deteriorating eastern sector. Pre-position supply before 2200Z or face 12hr ground delay.'][Math.floor(Math.random()*4)]}`, priority:'ROUTINE' },
      ]

      // Personnel depletion messages — fire when unit strength drops below threshold
      const AUTHORIZED: Record<string,number> = { III_CORPS:2200, FOB1:4500, FOB2:4500, FOB3:4500, '4ID':17000, AVN_BDE:3200 }
      const strEvents: any[] = []
      unitList.forEach((u:any) => {
        const str = u.personnelStrength ?? 100
        const auth = AUTHORIZED[u.id] || 4500
        const actual = Math.round(auth * str/100)
        const deficit = auth - actual
        // If significantly below strength, generate replacement message
        if (str < 70 && str > 10 && Math.random() < 0.25) {
          const replacements = Math.round(deficit * 0.15)  // 15% replacement per cycle
          strEvents.push({
            id:`PERS_${u.id}_${Date.now()}`,
            type:'PERSONNEL', title:`PERSONNEL REPORT — ${u.shortName||u.name}`,
            body:`${u.name} current strength: ${actual.toLocaleString()} / ${auth.toLocaleString()} (${Math.round(str)}%). Deficit: ${deficit.toLocaleString()} personnel. ${str < 40 ? `CRITICAL: Replacement draft of ${replacements} personnel requested. ETA 3-4 days. Unit combat effectiveness severely degraded.` : `Replacement request submitted. ${replacements} personnel en route. ETA 2-3 days.`}`,
            priority: str < 40 ? 'IMMEDIATE' : 'ROUTINE',
            day, timeInDay:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
            report:'', location:'THEATER', affectedAssets:[u.id], severity:'MODERATE',
            effects:[], mitigationWindow:0, mitigated:true, acknowledged:false,
          })
        }
        // Inbound personnel arrival message
        if (str >= 70 && str < 80 && Math.random() < 0.15) {
          strEvents.push({
            id:`PERS_ARR_${u.id}_${Date.now()}`,
            type:'PERSONNEL', title:`PERSONNEL ARRIVAL — ${u.shortName||u.name}`,
            body:`Replacement personnel arrived at ${u.name}. Strength now ${Math.round(str)}% (${actual.toLocaleString()} of ${auth.toLocaleString()}). Unit integration underway. Combat effectiveness restoring.`,
            priority:'ROUTINE',
            day, timeInDay:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
            report:'', location:'THEATER', affectedAssets:[u.id], severity:'MINOR',
            effects:[], mitigationWindow:0, mitigated:true, acknowledged:false,
          })
        }
      })
      if (strEvents.length > 0) {
        set(st=>({ daysSinceLastAction: 0, totalDecisionsMade: ((st as any).totalDecisionsMade||0)+1, realtimeFeedEvents:[...strEvents,...(st.realtimeFeedEvents||[])].slice(0,60) }))
      }

      // Pick 1-2 events based on sigma and stonewall
      const count = sw > 10 ? 2 : sigma < 2 ? 2 : 1
      const shuffled = templates.sort(()=>Math.random()-.5).slice(0,count)
      const events = shuffled.map((t,i)=>({
        id:`RT_${Date.now()}_${i}`,
        ...t,
        day,
        timeInDay:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
        acknowledged:false,
        mitigated:false,
        report:t.body,
        location:'THEATER',
        affectedAssets:[],
        severity:'MINOR',
        effects:[],
        doctrineImplication:'',
        mitigationWindow:60,
      }))

      set(s => ({ realtimeFeedEvents: [...events, ...(s.realtimeFeedEvents||[])].slice(0,60) }))
    }, 55000) // every 55 seconds
    set({ _tacticalInterval: iv })
  },

  startAutoAdvance:()=>{
    const ex=get()._timerInterval; if(ex) clearInterval(ex)
    const iv=setInterval(()=>{
      // Use updater form — always reads fresh state, never stale closure
      set(s => {
        if(s.isPaused || s.isGameOver) return {}
        const next = s.secondsToNextDay - 1
        if(next <= 0){
          // Call advanceTurn outside set() via setTimeout to avoid nested state mutations
          setTimeout(()=>{
            try {
              get().advanceTurn()
            } catch(e){
              console.error('[advanceTurn ERROR]', e)
              // Emergency fallback: at minimum increment the day so game doesn't freeze
              set(st => ({
                currentDay: Math.min(st.currentDay + 1, st.totalDays),
                secondsToNextDay: 120,
              }))
            }
          }, 0)
          return { secondsToNextDay: 120 }
        }
        return { secondsToNextDay: next }
      })
    }, 1000)
    set({_timerInterval:iv, autoAdvanceEnabled:true, secondsToNextDay:120})
  },

  stopAutoAdvance:()=>{ const iv=get()._timerInterval; if(iv) clearInterval(iv); const tiv=get()._tacticalInterval; if(tiv) clearInterval(tiv); set({_timerInterval:null, _tacticalInterval:null, autoAdvanceEnabled:false}) },

  advanceTurn:()=>{
    const s=get()
    if(s.isPaused||s.isGameOver) return
    const nextDay=s.currentDay+1
    const over=nextDay>s.totalDays

    let updatedUnits={...s.units}
    let newConvoys=[...(s.realConvoys||[])]
    let updatedAOs=(s.enemyAOs||[]).filter((ao:any)=>ao.expiresDay>nextDay)

    // ── LOC STATUS — track interdictions with expiry ──────────────────────────
    // Each LOC can be OPEN or INTERDICTED (with expiresDay)
    const locInterdictions = { ...(s as any).locInterdictions || {} } as Record<string,number>
    // Clear expired interdictions — LOCs reopen naturally
    Object.keys(locInterdictions).forEach(locId => {
      if (locInterdictions[locId] <= nextDay) delete locInterdictions[locId]
    })
    // Build updated locs with current interdiction status
    let updatedLocs = { ...s.locs }
    Object.keys(updatedLocs).forEach(locId => {
      const loc = (updatedLocs as any)[locId]
      if (loc) {
        const isInterdicted = locInterdictions[locId] !== undefined
        ;(updatedLocs as any)[locId] = { ...loc, status: isInterdicted ? 'INTERDICTED' : 'OPEN' }
      }
    })

    // ── LOAD SCENARIO META ──────────────────────────────────────────────────
    let meta: any = { totalDays:30, enemyActivityLevel:0.35 }
    try { meta = getScenarioMeta(s.activeScenarioId || 'CAMPAIGN_1') } catch(e) {}

    // ── CONSUME SUPPLY (with scenario modifiers) ──
      updatedUnits=Object.fromEntries(
        Object.entries(s.units).map(([id,unit])=>{
          const nl={...unit.supplyLevels}
          ;(Object.keys(unit.dailyConsumption) as Array<keyof typeof unit.dailyConsumption>)
            .forEach(cls=>{
              let amount = unit.dailyConsumption[cls]
              // C3 DESERT LINES: heat multiplier — already baked into dailyConsumption
              // but apply additional phase escalation in later days
              if (meta.heatMultiplier && nextDay > 12) {
                if (cls === 'CL_I')   amount = amount * 1.1  // extra heat surge day 12+
                if (cls === 'CL_III') amount = amount * 1.1
              }
              // C5 PACIFIC PUSH: after Day 10 threat escalation increases consumption
              if (meta.dayGatedThreat && nextDay > meta.dayGatedThreat) {
                if (cls === 'CL_V' || cls === 'CL_III') amount = amount * 1.25
              }
              // C6 ISLAND HOP: sortie attrition increases consumption variance
              if (meta.airOnlyLogistics && Math.random() < 0.15) {
                amount = amount * 1.3  // 15% chance of elevated demand any day
              }
              nl[cls]=Math.max(0,nl[cls]-amount)
            })
          const crit=[nl.CL_I,nl.CL_III,nl.CL_V],minLvl=Math.min(...crit)

          // ── READINESS ENGINE ─────────────────────────────────────────────
          // Base operational fatigue: every unit degrades daily regardless of supply
          // (equipment wear, personnel strain, accumulated operations tempo)
          const baseFatigue = 1.5

          // Supply-linked penalty: critical shortages accelerate collapse
          const supplyPenalty = minLvl < 10 ? 18    // Catastrophic — imminent stonewall
                              : minLvl < 20 ? 12    // Critical — severe degradation
                              : minLvl < 35 ? 5     // Low — moderate drain
                              : minLvl < 50 ? 2     // Adequate — slight drag
                              : 0                   // Sufficient — no penalty

          // Recovery bonus: good supply allows units to catch up on maintenance
          const recoveryBonus = minLvl > 70 && unit.readiness < 85 ? 1.5
                              : minLvl > 60 && unit.readiness < 75 ? 0.5
                              : 0

          // Enemy adaptation adds extra pressure as campaign advances
          const enemyPressure = meta.enemyActivityLevel > 0.5 && nextDay > 10 ? 0.5 : 0

          const netChange = -(baseFatigue + supplyPenalty + enemyPressure) + recoveryBonus
          const newR = Math.max(0, Math.min(100, unit.readiness + netChange))
          const newStatus = getStatus(newR, unit.personnelStrength, unit.stonewallStreak)
          const newStreak = newStatus==='STONEWALL' ? (unit.stonewallStreak||0)+1 : 0
          return [id,{...unit,supplyLevels:nl,readiness:newR,status:newStatus,stonewallStreak:newStreak}]
        })
      )

      // ── PROCESS CONVOY ARRIVALS — real supply delivery ──
      const arrived:string[]=[]
      newConvoys=newConvoys.map(c=>{
        if(c.status!=='EN_ROUTE') return c
        const prog=Math.min(1,(nextDay-c.departedDay)/c.travelDays)
        if(prog>=1){
          const u=updatedUnits[c.toUnitId]
          if(u){
            const newLvls={...u.supplyLevels}
            // Deliver ALL cargo classes in this convoy
          c.cargo.forEach((cargo:{supplyClass:number;amount:number})=>{
              const key=classKey(cargo.supplyClass)
              newLvls[key]=Math.min(100,(newLvls[key]??0)+cargo.amount)
            })
            // Convoy delivery: supply restoration gives direct readiness boost
            const crit=[newLvls.CL_I,newLvls.CL_III,newLvls.CL_V]
            const avgNewSupply = (newLvls.CL_I+newLvls.CL_III+newLvls.CL_V) / 3
            // Larger supply deliveries give bigger readiness kick
            const totalDelivered = c.cargo.reduce((sum: number, cargo: any) => sum + cargo.amount, 0)
            const deliveryBoost = Math.min(15, totalDelivered * 0.15)  // up to +15% readiness per convoy
            const newR = Math.min(100, u.readiness + deliveryBoost)
            updatedUnits[c.toUnitId]={...u,supplyLevels:newLvls,readiness:Math.round(newR),status:getStatus(Math.round(newR))}
          }
          arrived.push(c.id)
          return {...c,status:'DELIVERED' as const,progress:1}
        }
        return {...c,progress:prog}
      }).filter(c=>c.status==='EN_ROUTE')

      // No auto-dispatch — commander must manually dispatch all convoys

      // ── ENEMY AI MULTI-VECTOR ATTACKS ──────────────────────────────────────
      const intel = s.enemyIntel || createInitialIntel()

      // Record convoy dispatches so enemy learns player patterns
      newConvoys.forEach((c:RealConvoy) => {
        if (c.departedDay === nextDay) recordConvoyDispatch(intel, c.locId)
      })

      // Compute enemy attacks for this day
      const activeLOCIds = Object.keys(s.locs || {})
      const enemyAttacks = computeEnemyActions(nextDay, updatedUnits, intel, activeLOCIds, meta.enemyActivityLevel)

      // Apply all attack effects
      enemyAttacks.forEach(attack => {
        const effects = resolveAttackEffects(attack)
        intel.lastAttackDay[attack.targetLOC || attack.id] = nextDay

        effects.forEach(eff => {
          if (eff.type === 'SUPPLY_DROP' && eff.unitId && eff.supplyClass !== undefined) {
            const u = updatedUnits[eff.unitId]
            if (u) {
              const key = (['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_IX'] as const)[eff.supplyClass]
              const newLvls = { ...u.supplyLevels, [key]: Math.max(0, u.supplyLevels[key as keyof typeof u.supplyLevels] - eff.magnitude) }
              const crit = [newLvls.CL_I, newLvls.CL_III, newLvls.CL_V]
              const newR = Math.max(0, Math.min(100, Math.min(...crit)))
              updatedUnits[eff.unitId] = { ...u, supplyLevels:newLvls, readiness:newR, status:getStatus(newR) }
            }
          }
          if (eff.type === 'READINESS_DROP' && eff.unitId) {
            const u = updatedUnits[eff.unitId]
            if (u) {
              const newR = Math.max(0, u.readiness - eff.magnitude)
              updatedUnits[eff.unitId] = { ...u, readiness:newR, status:getStatus(newR) }
            }
          }
          // RCT and SIGMA effects accumulate — captured in metrics recalc
          if (eff.type === 'LOC_INTERDICT' && eff.locId) {
            const duration = (attack.durationDays || 2)
            locInterdictions[eff.locId] = nextDay + duration
            if ((updatedLocs as any)[eff.locId]) {
              ;(updatedLocs as any)[eff.locId] = {
                ...(updatedLocs as any)[eff.locId],
                status: 'INTERDICTED'
              }
            }
            // Signal the map — shake + audio — via CustomEvent (TheaterMap listens)
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('TRIGGER_SCREEN_SHAKE', { detail: { intensity: 10 } }))
            }, 200)
          }

        })  // ← close effects.forEach

        // Add enemy AO for this attack
        if (attack.mapMarker) {
          updatedAOs = [...updatedAOs, {
            id: `AO_${attack.id}`,
            lat: attack.mapMarker.lat, lng: attack.mapMarker.lng,
            radius: attack.mapMarker.radius, label: attack.mapMarker.label,
            type: attack.mapMarker.type, expiresDay: nextDay + (attack.durationDays || 2),
          }]
        }
      })

      // ── CHECK COMMANDER EVENTS ──
      // Fire commander events from Day 1 — enemy reacts immediately
      const cmdProbability = nextDay <= 2 ? 0.85 : nextDay <= 5 ? 0.75 : 0.65
      if(!s.pendingCommanderEvent && Math.random() < cmdProbability){
        const sw2=calcSW(updatedUnits)
        const ev=selectCommanderEvent(nextDay,calcSigma(sw2,calcRCT(updatedUnits)),sw2,s.firedCommanderEventIds||[])
        if(ev){
          // Apply enemy AO if event has map marker
          if(ev.mapMarker){
            updatedAOs=[...updatedAOs,{
              id:`AO_${ev.id}`,lat:ev.mapMarker.lat,lng:ev.mapMarker.lng,
              radius:ev.mapMarker.radius,label:ev.mapMarker.label,
              type:ev.mapMarker.type,expiresDay:nextDay+4
            }]
          }
          set({pendingCommanderEvent:ev})
        }
      }

    // ── END GAME CONDITIONS ──────────────────────────────────────────────────
      const darkUnits   = Object.values(updatedUnits).filter(u=>u.isDark||u.status==='DARK').length
      const swUnits     = Object.values(updatedUnits).filter(u=>u.status==='STONEWALL').length
      const totalUnits  = Object.values(updatedUnits).length
      const sw2b        = calcSW(updatedUnits)
      const sigma2b     = calcSigma(sw2b, calcRCT(updatedUnits))

      // Failure conditions
      const catastrophicCollapse = swUnits / totalUnits >= 0.30           // 30% stonewall (2 of 6)
      const sigmaCollapse        = sigma2b < 1.0                          // sigma floor
      const massiveDark          = darkUnits >= 2                         // 2+ units dark
      const extendedStonewall    = Object.values(updatedUnits).some((u:any)=>u.stonewallStreak >= 3)  // 3 days stonewall = combat ineffective
      const singleUnitCollapse   = Object.values(updatedUnits).some((u:any)=>(u.readiness??100) <= 1 && (u.stonewallStreak??0) >= 2) // any unit near-zero for 2+ days

      const campaignFailed = catastrophicCollapse || sigmaCollapse || massiveDark || extendedStonewall || singleUnitCollapse
      const failureReason  = catastrophicCollapse ? 'THEATER COLLAPSE — 40%+ UNITS IN STONEWALL'
                           : sigmaCollapse        ? 'SIGMA COLLAPSE — DISTRIBUTION SYSTEM FAILED'
                           : massiveDark          ? 'FORCE ATTRITION — 3+ UNITS OFFLINE'
                           : singleUnitCollapse   ? (() => {
                               const collapsed = Object.values(updatedUnits).find((u:any)=>(u.readiness??100)<=1&&(u.stonewallStreak??0)>=2) as any
                               return `UNIT COLLAPSE — ${collapsed?.name||'FORWARD UNIT'} SUSTAINED ZERO SUPPLY FOR ${collapsed?.stonewallStreak||2}+ DAYS`
                             })()
                           : extendedStonewall    ? 'EXTENDED STONEWALL — UNIT COMBAT INEFFECTIVE 3+ DAYS'
                           : null

    // Pending doctrine decision
    const pending=advancing?(getDecisionsForScenario(s.activeScenarioId||'CAMPAIGN_1', nextDay)??null):null
    const sw2=calcSW(updatedUnits),rct=calcRCT(updatedUnits),sigma=calcSigma(sw2,rct),avg=calcAvg(updatedUnits)

    // ── MISSING VARS THAT WERE CRASHING ADVANCE ──────────────────────────────
    // Weather: cycles based on day + scenario activity
    const weatherRoll = Math.random()
    const activityLevel = getScenarioMeta(s.activeScenarioId||'CAMPAIGN_1').enemyActivityLevel
    const currentWeather = weatherRoll < 0.06 ? 'STORM'
                         : weatherRoll < 0.15 ? 'FOG'
                         : weatherRoll < 0.28 ? 'RAIN'
                         : 'CLEAR'

    // Days since last player action (convoy dispatch etc)
    const daysSinceAction = (s.daysSinceLastAction ?? 0) + 1

    // Build feed events from this day's activity
    const existingEvents = (s.appliedBattlefieldEvents || []) as any[]
    const dayEvents: any[] = []

    // Add weather event if notable
    if (currentWeather !== 'CLEAR') {
      dayEvents.push({
        id:`WX_${nextDay}_${Date.now()}`, type:'WEATHER',
        title:`WEATHER UPDATE — D${nextDay} ${currentWeather}`,
        report: currentWeather==='STORM' ? 'Storm conditions grounding air operations. Ground convoys restricted. All air corridors CLOSED.'
               : currentWeather==='FOG'  ? 'Dense fog reducing visibility. Convoy speeds reduced 40%. Air operations at IFR minimums.'
               : 'Rain affecting routes. Ground conditions AMBER. Air corridors open.',
        priority: currentWeather==='STORM' ? 'PRIORITY' : 'ROUTINE',
        severity: currentWeather==='STORM' ? 'MAJOR' : 'MINOR',
        effects:[], affectedAssets:[], acknowledged:false, mitigated:false,
        location:'THEATER', mitigationWindow:60,
      })
    }

    // Add enemy attack events
    enemyAttacks.forEach((atk:any) => {
      if (atk.type) {
        dayEvents.push({
          id:`ATK_${atk.id||nextDay}_${Date.now()}`, type:'ATTACK',
          title:`OPFOR CONTACT — ${atk.type} REPORTED D${nextDay}`,
          report: atk.description || `Enemy activity on ${atk.targetLOC||'LOC'}. Convoy movement affected.`,
          priority: atk.severity === 'HIGH' ? 'FLASH' : atk.severity === 'MEDIUM' ? 'PRIORITY' : 'ROUTINE',
          severity: atk.severity||'MINOR',
          effects: atk.effects||[], affectedAssets:[atk.targetLOC||''].filter(Boolean),
          acknowledged:false, mitigated:false, location:'FRONT', mitigationWindow:60,
          responseOptions: atk.responseOptions||[],
        })
      }
    })

    // Add critical supply alerts — FLASH when unit near stonewall
    Object.values(updatedUnits).forEach((u: any) => {
      const critLvls = [u.supplyLevels.CL_I, u.supplyLevels.CL_III, u.supplyLevels.CL_V]
      const minCrit = Math.min(...critLvls)
      const critIdx = critLvls.indexOf(minCrit)
      const critClass = ['CL I','CL III','CL V'][critIdx]
      const critKey   = ['CL_I','CL_III','CL_V'][critIdx]
      const daysLeft  = Math.floor(minCrit / (u.dailyConsumption?.[critKey as any] || 6))

      if (u.status === 'STONEWALL') {
        dayEvents.push({
          id:`STONEWALL_${u.id}_D${nextDay}`, type:'LOGREP',
          title:`◉ STONEWALL — ${u.shortName || u.name} COMBAT INEFFECTIVE`,
          report:`${u.name} has reached zero supply on ${critClass}. Unit is combat ineffective. Immediate emergency resupply required or the unit will be lost.`,
          priority:'FLASH', severity:'CRITICAL',
          effects:[], affectedAssets:[u.id],
          acknowledged:false, mitigated:false, location:'FRONT', mitigationWindow:60,
          responseOptions: [
            {
              id:'A', label:`EMERGENCY AIR SORTIE → ${u.shortName}`,
              risk:'MEDIUM', isDoctrineCorrect:true,
              description:`Task an immediate air sortie to ${u.name}. Delivers critical supply within hours. High cost but saves the unit.`,
              consequence:`${u.name} receives emergency resupply. Unit begins recovery. Readiness +25%. Air assets expended.`,
              cost:'HIGH — 1 air sortie expended',
              effects:[
                { type:'SUPPLY_ADD', target:u.id, supplyClass:critIdx, magnitude:45 },
                { type:'SUPPLY_ADD', target:u.id, supplyClass:0, magnitude:20 },
                { type:'SUPPLY_ADD', target:u.id, supplyClass:4, magnitude:20 },
                { type:'READINESS_DELTA', target:u.id, magnitude:25 },
                { type:'RCT_DELTA', magnitude:-3 },
              ],
            },
            {
              id:'B', label:`PRIORITY GROUND CONVOY → ${u.shortName}`,
              risk:'LOW', isDoctrineCorrect:true,
              description:`Dispatch priority ground convoy now. Larger load than air, arrives next day.`,
              consequence:`${u.name} resupplied tomorrow. Full class restoration. Readiness +15% on arrival.`,
              cost:'MEDIUM — 1 ground convoy',
              effects:[
                { type:'SUPPLY_ADD', target:u.id, supplyClass:critIdx, magnitude:60 },
                { type:'SUPPLY_ADD', target:u.id, supplyClass:0, magnitude:30 },
                { type:'SUPPLY_ADD', target:u.id, supplyClass:4, magnitude:30 },
                { type:'READINESS_DELTA', target:u.id, magnitude:15 },
              ],
            },
            {
              id:'C', label:'ACCEPT DEGRADATION — TRIAGE TO OTHER UNITS',
              risk:'CRITICAL', isDoctrineCorrect:false,
              description:`Acknowledge ${u.name} as economy of force. Redirect assets to other units.`,
              consequence:`${u.name} remains in STONEWALL. Stonewall streak continues toward unit loss. High strategic risk.`,
              cost:'CRITICAL — unit may be permanently lost',
              effects:[
                { type:'READINESS_DELTA', target:u.id, magnitude:-15 },
                { type:'RCT_DELTA', magnitude:8 },
              ],
            },
          ],
        })
      } else if (u.status === 'RED' && daysLeft <= 2) {
        dayEvents.push({
          id:`CRIT_${u.id}_D${nextDay}`, type:'LOGREP',
          title:`⚠ ${u.shortName || u.name} — ${daysLeft <= 1 ? 'STONEWALL IMMINENT' : 'CRITICAL SUPPLY'}`,
          report:`${u.name}: ${critClass} at ${Math.round(minCrit)}%. ${daysLeft <= 1 ? 'STONEWALL IN <24 HOURS without resupply.' : `Approximately ${daysLeft} days of ${critClass} remaining.`} Commander action required.`,
          priority:'PRIORITY', severity:'MAJOR',
          effects:[], affectedAssets:[u.id],
          acknowledged:false, mitigated:false, location:'FRONT', mitigationWindow:60,
          responseOptions: [
            {
              id:'A', label:`PUSH CONVOY NOW → ${u.shortName}`,
              risk:'LOW', isDoctrineCorrect:true,
              description:`Dispatch resupply convoy immediately. Addresses the shortage before stonewall.`,
              consequence:`${u.name} resupplied. ${critClass} restored +50%. Stonewall prevented. Readiness stabilized.`,
              cost:'LOW — standard convoy tasking',
              effects:[
                { type:'SUPPLY_ADD', target:u.id, supplyClass:critIdx, magnitude:50 },
                { type:'SUPPLY_ADD', target:u.id, supplyClass:0, magnitude:15 },
                { type:'SUPPLY_ADD', target:u.id, supplyClass:4, magnitude:15 },
                { type:'READINESS_DELTA', target:u.id, magnitude:10 },
                { type:'RCT_DELTA', magnitude:-2 },
              ],
            },
            {
              id:'B', label:'LATERAL TRANSFER FROM MOST SUPPLIED UNIT',
              risk:'MEDIUM', isDoctrineCorrect:true,
              description:`Transfer supply from the highest-readiness unit to cover the shortage.`,
              consequence:`Shortage covered from lateral transfer. Both units stabilized at AMBER. No convoy needed.`,
              cost:'MEDIUM — donor unit loses 15% supply',
              effects:[
                { type:'SUPPLY_ADD', target:u.id, supplyClass:critIdx, magnitude:30 },
                { type:'READINESS_DELTA', target:u.id, magnitude:8 },
                { type:'RCT_DELTA', magnitude:2 },
              ],
            },
            {
              id:'C', label:'HOLD — MONITOR AND REASSESS TOMORROW',
              risk:'HIGH', isDoctrineCorrect:false,
              description:`Delay action and reassess on next day advance. Accepts stonewall risk.`,
              consequence:`${u.name} continues to drain. High probability of stonewall within 24-48 hours.`,
              cost:'HIGH — unit may enter stonewall',
              effects:[
                { type:'READINESS_DELTA', target:u.id, magnitude:-8 },
                { type:'RCT_DELTA', magnitude:5 },
              ],
            },
          ],
        })
      }
    })

    const newFeedEvents = [...dayEvents, ...existingEvents].slice(0, 60)

    // ── VICTORY GRADING ──────────────────────────────────────────────────────
    const victorySigma    = sigma >= 3.0 ? 'DISTINGUISHED' : sigma >= 2.0 ? 'COMMENDABLE' : sigma >= 1.5 ? 'MARGINAL' : 'FAILED'
    const victoryReadiness= avg >= 70 ? 'EXCELLENT' : avg >= 50 ? 'ADEQUATE' : 'DEGRADED'
    const victoryRCT      = rct <= 32 ? 'OPTIMAL' : rct <= 48 ? 'ACCEPTABLE' : 'EXCEEDS_USL'
    const campaignVictory = over && !campaignFailed
    const campaignGrade   = campaignVictory
      ? (sigma >= 3.0 && rct <= 32 ? 'A' : sigma >= 2.5 ? 'B' : sigma >= 2.0 ? 'C' : 'D')
      : 'F'

    set({
      currentDay:over?s.totalDays:nextDay,
      currentPhase: over ? 'COMPLETE' : 'EXECUTION',
      units:updatedUnits,
      pendingDecision:pending,
      metrics:{...s.metrics,avgReadiness:avg,stonewallRate:sw2,avgRequestCycleTime:rct,sigmaLevel:sigma},
      showDecisionModal:pending!==null && !over && !campaignFailed,
      isGameOver:over || campaignFailed,
      showAAR:over || campaignFailed,
      failureReason:(campaignFailed ? failureReason : null) as any,
      campaignVictory, campaignGrade,
      victorySigma, victoryReadiness, victoryRCT,
      realConvoys:newConvoys,
      enemyAOs:updatedAOs,
      locs: updatedLocs,
      locInterdictions,
      enemyIntel:intel,
      lastEnemyAttacks:enemyAttacks,
      weather:currentWeather as any,
      daysSinceLastAction: daysSinceAction,
      appliedBattlefieldEvents:newFeedEvents,
      // Auto-queue highest priority event as forced commander decision
      pendingDecisionEvent: (() => {
        if (s.pendingDecisionEvent) return s.pendingDecisionEvent  // don't overwrite existing
        const flashEvent = newFeedEvents.find((e:any) => e.priority === 'FLASH' && e.responseOptions?.length > 0)
        const immediateEvent = newFeedEvents.find((e:any) => e.priority === 'IMMEDIATE' && e.responseOptions?.length > 0)
        return flashEvent || immediateEvent || s.pendingDecisionEvent || null
      })(),
    })
  },

  // ── COMMANDER ACTIONS ──────────────────────────────────────────────────────
  dismissCommanderEvent:()=>{
    const ev=get().pendingCommanderEvent
    if(!ev) return
    set(s=>({ pendingCommanderEvent:null, firedCommanderEventIds:[...(s.firedCommanderEventIds||[]),ev.id] }))
  },

  actionCommanderEvent:(ev:CommanderEvent)=>{
    const s=get()
    let updatedUnits={...s.units}

    // Apply action consequences — mitigating enemy attacks reduces effect by 50%
    ev.effects.forEach(eff=>{
      if(eff.type==='READINESS_DELTA'){
        const u=updatedUnits[eff.target]
        if(u){
          const newR=Math.max(0,Math.min(100,u.readiness+eff.magnitude*0.5))
          updatedUnits[eff.target]={...u,readiness:newR,status:getStatus(newR)}
        }
      }
      if(eff.type==='SUPPLY_DELTA' && eff.supplyClass!==undefined){
        const CLS=['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX'] as const
        const u=updatedUnits[eff.target]
        if(u){
          const key=CLS[eff.supplyClass]
          const newLvl=Math.max(0,Math.min(100,(u.supplyLevels[key]??0)+eff.magnitude*0.5))
          const newLvls={...u.supplyLevels,[key]:newLvl}
          const crit=[newLvls.CL_I,newLvls.CL_III,newLvls.CL_V]
          const newR=Math.max(0,Math.min(100,Math.min(...crit)))
          updatedUnits[eff.target]={...u,supplyLevels:newLvls,readiness:newR,status:getStatus(newR)}
        }
      }
    })

    // Generate accurate feed event showing what actually changed
    const sw2=calcSW(updatedUnits),rct2=calcRCT(updatedUnits),sigma2=calcSigma(sw2,rct2)
    const cmdFeedEvent={
      id:`CMD_${ev.id}_${Date.now()}`,
      type:'LOGREP',
      priority: ev.priority,
      severity:'MODERATE',
      day:s.currentDay,
      timeInDay:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
      title:`COMMANDER ACTION: ${ev.title}`,
      location:'THEATER',
      affectedAssets:[],
      report:`Commander response executed. ${ev.lines[ev.lines.length-1]} Theater status post-action: σ${sigma2.toFixed(1)}, RCT ${rct2}h, SW ${sw2}%. ${ev.effects.some((e:any)=>e.type==='READINESS_DELTA')?'Unit readiness adjusted based on mitigation actions.':''}`,
      doctrineImplication:'',
      effects:[],
      mitigationWindow:0,
      mitigated:true,
      acknowledged:true,
    }

    set(s=>({
      units:updatedUnits,
      pendingCommanderEvent:null,
      firedCommanderEventIds:[...(s.firedCommanderEventIds||[]),ev.id],
      appliedBattlefieldEvents:[cmdFeedEvent,...(s.appliedBattlefieldEvents||[])].slice(0,60),
    }))
  },

  // ── DECISION ──────────────────────────────────────────────────────────────
  resolveDecision:(decisionId,choiceId)=>{
    const s=get(); const d=s.pendingDecision; if(!d||d.id!==decisionId) return
    const choice=d.choices.find(c=>c.id===choiceId); if(!choice) return
    let updatedUnits={...s.units}; let metaDelta={sigma:0,rct:0}
    choice.effects.forEach(eff=>{
      if(eff.type==='READINESS'&&eff.unitId){
        const u=updatedUnits[eff.unitId]; if(u){const nr=Math.max(0,Math.min(100,u.readiness+eff.delta));updatedUnits[eff.unitId]={...u,readiness:nr,status:getStatus(nr)}}
      }else if(eff.type==='READINESS'&&!eff.unitId){
        updatedUnits=Object.fromEntries(Object.entries(updatedUnits).map(([id,u])=>{const nr=Math.max(0,Math.min(100,u.readiness+eff.delta));return[id,{...u,readiness:nr,status:getStatus(nr)}]}))
      }else if(eff.type==='SIGMA') metaDelta.sigma+=eff.delta
      else if(eff.type==='RCT') metaDelta.rct+=eff.delta
    })
    const isOpt=choiceId===d.optimalChoice
    const newAcc=Math.round(((s.metrics.doctrineAccuracy*s.completedDecisions.length)+(isOpt?100:0))/(s.completedDecisions.length+1))
    const sw=calcSW(updatedUnits),rct=Math.max(12,s.metrics.avgRequestCycleTime+metaDelta.rct)
    const sigma=Math.max(0.5,Math.min(6,calcSigma(sw,rct)+metaDelta.sigma)),avg=calcAvg(updatedUnits)
    set({units:updatedUnits,pendingDecision:null,showDecisionModal:false,showResultCard:true,lastDecisionResult:choice,
      completedDecisions:[...s.completedDecisions,{decisionId,choiceId,outcome:choice.outcome,day:s.currentDay}],
      metrics:{...s.metrics,avgReadiness:avg,stonewallRate:sw,avgRequestCycleTime:Math.round(rct),sigmaLevel:parseFloat(sigma.toFixed(1)),doctrineAccuracy:newAcc,forceMultiplierTotal:s.metrics.forceMultiplierTotal+(isOpt?d.forceMultiplierBonus:0)}})
  },

  allocateSupply:(requestId,_)=>set(s=>({requestQueue:s.requestQueue.map(r=>r.id===requestId?{...r,status:'ALLOCATED'}:r)})),
  denyRequest:(requestId)=>set(s=>({requestQueue:s.requestQueue.map(r=>r.id===requestId?{...r,status:'DENIED'}:r)})),
  dispatchConvoy:(fromNodeId:string, toUnitId:string, cargo:Array<{supplyClass:number;amount:number}>, assetType:'GROUND'|'AIR'|'HELO'|'SEA')=>{
    const s=get()
    const travelDays = assetType==='AIR'?1:assetType==='HELO'?1:assetType==='SEA'?3:2
    const isAir = assetType==='AIR'||assetType==='HELO'

    // ── PERMANENT LOC INTERDICTION CHECK ──────────────────────────────────────
    // Find the LOC connecting from→to and block if interdicted (except air assets)
    if (!isAir) {
      const locs = (s.locs || {}) as Record<string, any>
      const matchedLOC = Object.values(locs).find((loc:any) =>
        (loc.from === fromNodeId || loc.to === fromNodeId) &&
        (loc.from === toUnitId   || loc.to === toUnitId   || loc.to === fromNodeId)
      ) as any
      if (matchedLOC && matchedLOC.status === 'INTERDICTED') {
        // Block dispatch — add feed event telling player why
        const blockEvent = {
          id:`BLOCK_${Date.now()}`, type:'LOGREP',
          title:`CONVOY BLOCKED — LOC INTERDICTED`,
          report:`Ground convoy to ${toUnitId} cannot proceed. LOC is under active interdiction. Use AIR RESUPPLY or clear the route first.`,
          priority:'PRIORITY', severity:'MAJOR',
          effects:[], affectedAssets:[toUnitId],
          acknowledged:false, mitigated:false, location:'FRONT', mitigationWindow:0,
        }
        set(st=>({ appliedBattlefieldEvents:[blockEvent,...((st as any).appliedBattlefieldEvents||[])].slice(0,60) }))
        return  // Abort dispatch
      }
    }

    // Find LOC connecting from→to
    const locId = `direct_${fromNodeId}_${toUnitId}`
    const newConvoy = {
      id:`CMD_CONVOY_${Date.now()}`,
      fromNodeId, toUnitId, locId,
      cargo, departedDay:s.currentDay,
      travelDays, isAir, assetType,
      status:'EN_ROUTE' as const, progress:0,
    }
    // Teach enemy AI about this route — they will react
    const intel = (get() as any).enemyIntel || createInitialIntel()
    const routeKey = `${fromNodeId}_${toUnitId}`
    intel.locUsageCount[routeKey] = (intel.locUsageCount[routeKey] || 0) + 4  // heavy signal
    if (assetType === 'AIR' || assetType === 'HELO') {
      intel.airCorridorIdentified = true  // enemy notes air usage immediately
    }

    // Reactive enemy commander popup — enemy notices and responds within 1-2 days
    const reactiveEvent = {
      id:`REACT_${Date.now()}`,
      type:'ATTACK', title:'OPFOR INTERCEPTS RESUPPLY MOVEMENT',
      lines:[
        'Your resupply movement has been identified.',
        `We have assets positioned to intercept. The route to ${toUnitId} is now compromised.`,
        'This convoy will not arrive intact.',
      ],
      effects:[],
      priority:'FLASH' as const,
      triggerCondition:'RANDOM' as const,
    }

    set(st=>({
      realConvoys:[...((st as any).realConvoys||[]),newConvoy],
      enemyIntel: intel,
      // Queue reactive enemy response if no pending event
      pendingCommanderEvent: (st as any).pendingCommanderEvent ? (st as any).pendingCommanderEvent : 
        Math.random() < 0.45 ? { ...reactiveEvent, commanderId:'COL_PETROV' } : (st as any).pendingCommanderEvent,
    }))
    // Feed event
    const CLS=['CL I','CL II','CL III','CL IV','CL V','CL VIII','CL IX']
    const cargoDesc = cargo.map(c=>`${CLS[c.supplyClass]} (${c.amount}%)`).join(', ')
    const unitName = (s.units[toUnitId] as any)?.name || toUnitId
    const feedEvent = {
      id:`DISPATCH_${Date.now()}`, type:'LOGREP', priority:'ROUTINE', severity:'MINOR',
      day:s.currentDay,
      timeInDay:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
      title:`CONVOY DISPATCHED → ${unitName}`,
      location:fromNodeId, affectedAssets:[toUnitId],
      report:`Commander-directed ${assetType} convoy dispatched to ${unitName}. Cargo: ${cargoDesc}. ETA D+${travelDays}. Asset moving along designated route.`,
      doctrineImplication:'', effects:[], mitigationWindow:0, mitigated:true, acknowledged:false,
    }
    set(st=>({appliedBattlefieldEvents:[feedEvent,...((st as any).appliedBattlefieldEvents||[])].slice(0,60)}))
  },
  selectNode:(id)=>set({selectedNodeId:id}),selectUnit:(id)=>set({selectedUnitId:id}),
  setActivePanel:(p)=>set({activePanel:p}),setSelectedNode:(id)=>set({selectedNodeId:id}),setSelectedUnit:(id)=>set({selectedUnitId:id}),
  flyToLocation:(lat:number,lng:number,zoom:number)=>set({mapFlyTarget:{lat,lng,zoom}}),

  // Apply selected response option effects to game state
  applyEventResponse:(eventId:string, option:any)=>{
    const s=get()
    let updatedUnits={...s.units}
    const CLS=['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX'] as const
    let rctDelta=0

    if (option.effects && Array.isArray(option.effects)) {
      option.effects.forEach((eff:any)=>{
        if (eff.type==='SUPPLY_ADD' && eff.target && eff.supplyClass!==undefined) {
          const u=updatedUnits[eff.target]
          if(u){ const key=CLS[eff.supplyClass]; const newLvl=Math.min(100,(u.supplyLevels[key]??0)+eff.magnitude); updatedUnits[eff.target]={...u,supplyLevels:{...u.supplyLevels,[key]:newLvl}} }
        }
        if (eff.type==='SUPPLY_DROP' && eff.target && eff.supplyClass!==undefined) {
          const u=updatedUnits[eff.target]
          if(u){ const key=CLS[eff.supplyClass]; const newLvl=Math.max(0,(u.supplyLevels[key]??0)-eff.magnitude); updatedUnits[eff.target]={...u,supplyLevels:{...u.supplyLevels,[key]:newLvl}} }
        }
        if (eff.type==='READINESS_DELTA' && eff.target) {
          const u=updatedUnits[eff.target]
          if(u){ const newR=Math.max(0,Math.min(100,u.readiness+eff.magnitude)); updatedUnits[eff.target]={...u,readiness:newR,status:getStatus(newR)} }
        }
        if (eff.type==='STRENGTH_DELTA' && eff.target) {
          const u=updatedUnits[eff.target]
          if(u){ updatedUnits[eff.target]={...u,personnelStrength:Math.max(0,Math.min(100,(u.personnelStrength??80)+eff.magnitude))} }
        }
        if (eff.type==='RCT_DELTA') rctDelta+=eff.magnitude
      })
    }

    // Recalculate readiness from new supply levels — no guardrails
    updatedUnits=Object.fromEntries(Object.entries(updatedUnits).map(([id,unit])=>{
      const crit=[unit.supplyLevels.CL_I,unit.supplyLevels.CL_III,unit.supplyLevels.CL_V]
      const target=Math.min(100,Math.max(0,Math.min(...crit)))
      const newR=Math.min(target, Math.max(0, unit.readiness+(target-unit.readiness)*0.35))
      return [id,{...unit,readiness:Math.round(newR),status:getStatus(Math.round(newR),unit.personnelStrength,unit.stonewallStreak)}]
    }))

    const sw=calcSW(updatedUnits),rct=Math.max(12,calcRCT(updatedUnits)+rctDelta)
    const sigma=calcSigma(sw,rct),avg=calcAvg(updatedUnits)

    // Generate feed event showing what response achieved
    const responseEvent={
      id:`RESP_${eventId}_${Date.now()}`,
      type:'LOGREP',
      priority:'PRIORITY',
      severity:'MODERATE',
      day:s.currentDay,
      timeInDay:`${String(Math.floor(Math.random()*24)).padStart(2,'0')}${String(Math.floor(Math.random()*60)).padStart(2,'0')}Z`,
      title:`RESPONSE EXECUTED: ${option.label}`,
      location:'THEATER',
      affectedAssets:[],
      report:`Commander action executed. ${option.consequence} Theater status: σ${sigma.toFixed(1)}, RCT ${Math.round(rct)}h, SW ${sw}%.`,
      doctrineImplication:option.isDoctrineCorrect?'Doctrine-correct response. Optimal action for conditions.':'Non-standard response. Monitor for secondary effects.',
      effects:[],mitigationWindow:0,mitigated:true,acknowledged:true,
    }

    set({
      units:updatedUnits,
      daysSinceLastAction: 0,
      totalDecisionsMade: (s as any).totalDecisionsMade + 1,
      metrics:{...s.metrics,avgReadiness:avg,stonewallRate:sw,avgRequestCycleTime:Math.round(rct),sigmaLevel:parseFloat(sigma.toFixed(1))},
      appliedBattlefieldEvents:[responseEvent,...(s.appliedBattlefieldEvents||[])].slice(0,60),
    })
  },
  clearFlyTarget:()=>set({mapFlyTarget:null}),
  clearDecisionEvent:()=>set({pendingDecisionEvent:null}),
  setWeather:(w:string)=>set({weather:w as any}),
  dismissResult:()=>set({showResultCard:false,lastDecisionResult:null}),

  // ── EMERGENCY COMMANDER ACTIONS ─────────────────────────────────────────────
  // Immediate effect (bypasses convoy travel time) — high cost, instant result
  executeCommanderAction:(params:{
    unitId:string; actionType:'AIR_EMERGENCY'|'LATERAL_EMERGENCY'|'PRIORITY_PUSH'
    sourceUnitId?:string
  })=>set(s=>{
    const { unitId, actionType, sourceUnitId } = params
    const unit = (s.units as any)[unitId]
    if (!unit) return {}

    let updatedUnits = { ...s.units }
    let feedMsg = ''

    if (actionType === 'AIR_EMERGENCY') {
      // Emergency air sortie: +40% CL III, +25% CL V, +20% CL I, -5% from other FOBs (cost)
      const critSupply = {
        ...unit.supplyLevels,
        CL_I:   Math.min(100, (unit.supplyLevels.CL_I   || 0) + 20),
        CL_III: Math.min(100, (unit.supplyLevels.CL_III || 0) + 40),
        CL_V:   Math.min(100, (unit.supplyLevels.CL_V   || 0) + 25),
        CL_IX:  Math.min(100, (unit.supplyLevels.CL_IX  || 0) + 15),
      }
      const newR = Math.min(100, unit.readiness + 18)
      ;(updatedUnits as any)[unitId] = {
        ...unit, supplyLevels:critSupply,
        readiness:newR, status:(newR>80?'GREEN':newR>50?'AMBER':newR>25?'RED':'STONEWALL'),
        stonewallStreak: 0,
      }
      feedMsg = `⚡ EMERGENCY AIR SORTIE → ${unit.name || unitId} | CL III +40% CL V +25% | READINESS RECOVERING`

    } else if (actionType === 'LATERAL_EMERGENCY') {
      // Take from best-supplied unit, give to crisis unit
      const donor = sourceUnitId
        ? (s.units as any)[sourceUnitId]
        : Object.values(s.units).reduce((best:any, u:any) =>
            (u.readiness > (best?.readiness||0) && u.id !== unitId ? u : best), null)
      if (!donor) return {}
      const transferred = {
        ...unit.supplyLevels,
        CL_I:   Math.min(100, (unit.supplyLevels.CL_I||0) + 20),
        CL_III: Math.min(100, (unit.supplyLevels.CL_III||0) + 25),
        CL_V:   Math.min(100, (unit.supplyLevels.CL_V||0) + 15),
      }
      const donorDepleted = {
        ...donor.supplyLevels,
        CL_I:   Math.max(0, (donor.supplyLevels.CL_I||0) - 20),
        CL_III: Math.max(0, (donor.supplyLevels.CL_III||0) - 25),
        CL_V:   Math.max(0, (donor.supplyLevels.CL_V||0) - 15),
      }
      const newR = Math.min(100, unit.readiness + 12)
      ;(updatedUnits as any)[unitId] = { ...unit, supplyLevels:transferred, readiness:newR }
      ;(updatedUnits as any)[donor.id] = { ...donor, supplyLevels:donorDepleted }
      feedMsg = `↔ LATERAL TRANSFER → ${unit.name} from ${donor.name || donor.id} | SUPPLY BALANCED`

    } else if (actionType === 'PRIORITY_PUSH') {
      // Designate as priority — 24h RCT benefit and small immediate readiness bump
      const newR = Math.min(100, unit.readiness + 8)
      ;(updatedUnits as any)[unitId] = { ...unit, readiness:newR, isPriority:true }
      feedMsg = `⚡ PRIORITY DESIGNATED → ${unit.name} | ALL REQUESTS ELEVATED | RCT -12h`
    }

    const feedEvent = {
      id:`CMD_ACT_${Date.now()}`, type:'LOGREP', priority:'PRIORITY',
      title:feedMsg, report:feedMsg,
      effects:[], affectedAssets:[unitId],
      acknowledged:true, mitigated:true,
    }

    // Metrics recalc
    const sw = Object.values(updatedUnits).filter((u:any)=>u.status==='STONEWALL').length / Object.values(updatedUnits).length * 100
    const rct = 24+((100-Object.values(updatedUnits).reduce((a:number,u:any)=>a+u.readiness,0)/Object.values(updatedUnits).length)/100)*48

    return {
      units: updatedUnits,
      daysSinceLastAction: 0,
      metrics: { ...(s as any).metrics, stonewallRate:Math.round(sw), avgRequestCycleTime:Math.round(rct) },
      appliedBattlefieldEvents:[feedEvent,...((s as any).appliedBattlefieldEvents||[])].slice(0,60),
    }
  }),
  pauseGame:()=>set({isPaused:true}),resumeGame:()=>set({isPaused:false}),
  resetGame:(scenarioId?:string)=>{const sid=scenarioId||'CAMPAIGN_1';get().stopAutoAdvance();set({...buildInitialState(sid),...INITIAL_UI,autoAdvanceEnabled:false,secondsToNextDay:120,_timerInterval:null,enemyIntel:createInitialIntel(),lastEnemyAttacks:[],activeScenarioId:sid,appliedBattlefieldEvents:[]})},
}))
