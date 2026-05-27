/**
 * LOG ACTUAL — Enemy AI Engine
 * KibuglogalVentures LLC
 *
 * The enemy is not random. The enemy has a campaign plan.
 * They study your distribution patterns, identify your most
 * critical supply lines, and attack in coordinated waves.
 *
 * Phase 1 (Days 1-6):   Reconnaissance. Single probe attacks. Watching.
 * Phase 2 (Days 7-14):  Pattern exploitation. Hit your most-used routes.
 * Phase 3 (Days 15-21): Coordinated attacks. 2-3 simultaneous LOC interdictions.
 * Phase 4 (Days 22-30): Theater-wide offensive. FARP + Depot + Convoy simultaneously.
 *
 * The enemy gets smarter the longer the campaign runs.
 */

import { Unit } from '../types/game'

// ── ENEMY INTELLIGENCE PICTURE ────────────────────────────────────────────────

export interface EnemyIntelligence {
  // Which LOCs has the player used most (tracked over campaign)
  locUsageCount: Record<string, number>
  // Which units are most critical (enemy targets these first)
  criticalUnits: string[]
  // Which LOCs feed critical units
  highValueLOCs: string[]
  // Has the enemy identified the air corridor
  airCorridorIdentified: boolean
  // Days since last attack on each LOC (avoid hitting same thing twice in a row)
  lastAttackDay: Record<string, number>
  // Enemy adaptation level (0-5, increases with campaign day)
  adaptationLevel: number
}

// ── ATTACK DEFINITIONS ────────────────────────────────────────────────────────

export type AttackType =
  | 'IED'              // Route threat elevated, convoy delayed
  | 'AMBUSH'           // Supply destroyed, RCT spiked
  | 'BRIDGE_DEMO'      // LOC closed for multiple days
  | 'DEPOT_STRIKE'     // Node stockage reduced
  | 'FARP_STRIKE'      // Air corridor degraded
  | 'COMMS_JAMMING'    // RCT increase, visibility reduced
  | 'FUEL_SABOTAGE'    // Class III specifically targeted
  | 'SUPPLY_INTERDICTION' // Multiple classes hit simultaneously

export interface EnemyAttack {
  id: string
  type: AttackType
  targetLOC?: string       // for LOC attacks
  targetUnit?: string      // for unit attacks
  targetNode?: string      // for node attacks
  supplyClassesHit: number[] // which classes are affected
  magnitude: number        // intensity 0-100
  durationDays: number     // how long effect lasts
  description: string
  gridRef: string          // simulated grid reference
  reportText: string       // what shows in battlefield feed
  mapMarker: {
    lat: number; lng: number; radius: number; label: string; type: string
  }
}

// ── LOC → GEO COORDS (for map markers) ───────────────────────────────────────

const LOC_MIDPOINTS: Record<string,{lat:number;lng:number;label:string}> = {
  loc1:  { lat:50.5,  lng:6.0,  label:'MSR ANTWERP-COLOGNE' },
  loc2:  { lat:49.7,  lng:8.2,  label:'MSR DEPOT-ALPHA CORRIDOR' },
  loc3:  { lat:50.6,  lng:11.5, label:'MSR CENTRAL' },
  loc4:  { lat:51.4,  lng:12.7, label:'AIR CORRIDOR WEST' },
  loc5:  { lat:51.45, lng:17.5, label:'MSR IRON — AMBUSH ZONE' },
  loc6:  { lat:51.1,  lng:16.0, label:'MSR SOUTHERN' },
  loc7:  { lat:52.75, lng:19.5, label:'MSR BRAVO NORTH' },
  loc8:  { lat:52.3,  lng:18.9, label:'MSR AIRFIELD ROUTE' },
  loc9:  { lat:53.0,  lng:20.7, label:'AIR CORRIDOR NORTH' },
  loc10: { lat:52.15, lng:20.75,label:'AIR CORRIDOR IRON' },
  loc11: { lat:52.25, lng:18.7, label:'MSR BRAVO-IRON' },
}

// ── CAMPAIGN PHASE ────────────────────────────────────────────────────────────

export function getCampaignPhase(day: number): 1|2|3|4 {
  if (day <= 6)  return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

// ── ENEMY AI DECISION ENGINE ──────────────────────────────────────────────────

export function computeEnemyActions(
  day: number,
  units: Record<string, Unit>,
  intel: EnemyIntelligence,
  activeLOCs: string[],
  enemyActivityLevel = 0.35,
): EnemyAttack[] {
  const phase = getCampaignPhase(day)
  const attacks: EnemyAttack[] = []
  // Update adaptation level
  intel.adaptationLevel = Math.min(5, Math.floor(day / 6))

  // Identify critical units (enemy knows which units are weakest)
  const unitList = Object.values(units)
  intel.criticalUnits = unitList
    .sort((a,b) => a.readiness - b.readiness)
    .slice(0, 3)
    .map(u => u.id)

  // Identify high-value LOCs (routes to critical units)
  intel.highValueLOCs = activeLOCs.filter(locId => {
    const geo = LOC_MIDPOINTS[locId]
    return geo !== undefined
  })

  // Activity level scales attack frequency: 0.15 (low) → 0.60 (high)
  const actMult = 0.5 + (enemyActivityLevel * 1.2)  // 0.68 to 1.22 multiplier

  // ── PHASE 1: PROBE ────────────────────────────────────────────────────────
  if (phase === 1) {
    if (day >= 2) {
      const t1 = pickLOC(activeLOCs, intel, day)
      if (t1) attacks.push(buildIEDAttack(t1, day, 'LOW'))
    }
    if (day >= 4 && Math.random() < 0.55 * actMult) {
      const t2 = pickLOC(activeLOCs.filter(l => l !== attacks[0]?.targetLOC), intel, day)
      if (t2) attacks.push(buildIEDAttack(t2, day, 'MEDIUM'))
    }
    return attacks
  }

  // ── PHASE 2: PATTERN EXPLOITATION ────────────────────────────────────────
  if (phase === 2) {
    const primaryLOC = getMostUsedLOC(intel) || pickLOC(activeLOCs, intel, day)
    if (primaryLOC) attacks.push(buildAmbushAttack(primaryLOC, day, 'MEDIUM'))

    // Always hit an alternate simultaneously
    const altLOC = pickLOC(activeLOCs.filter(l => l !== primaryLOC), intel, day)
    if (altLOC) attacks.push(buildIEDAttack(altLOC, day, 'MEDIUM'))

    // Third attack on some days
    if (day >= 11 && Math.random() < 0.6) {
      const thirdLOC = pickLOC(activeLOCs.filter(l => l !== primaryLOC && l !== altLOC), intel, day)
      if (thirdLOC) attacks.push(buildIEDAttack(thirdLOC, day, 'HIGH'))
    }

    // FARP identification
    const airUsage = Object.entries(intel.locUsageCount).filter(([k]) => ['l04','l17','l18','l19','l20','l21'].includes(k)).reduce((s,[,v])=>s+v,0)
    if (airUsage > 3) intel.airCorridorIdentified = true

    return attacks
  }

  // ── PHASE 3: COORDINATED MULTI-VECTOR ────────────────────────────────────
  if (phase === 3) {
    // Phase 3: always 3+ attacks — coordinated multi-vector
    const primary = getMostUsedLOC(intel) || pickLOC(activeLOCs, intel, day)
    if (primary) attacks.push(buildAmbushAttack(primary, day, 'HIGH'))

    // Always bridge demo on alternate
    const alt = pickLOC(activeLOCs.filter(l => l !== primary), intel, day)
    if (alt) attacks.push(buildBridgeDemoAttack(alt, day))

    // Third LOC IED — no clean routes
    const third = pickLOC(activeLOCs.filter(l => l !== primary && l !== alt), intel, day)
    if (third) attacks.push(buildIEDAttack(third, day, 'HIGH'))

    // FARP strike — guaranteed if identified
    if (intel.airCorridorIdentified) attacks.push(buildFARPStrike(day))
    else if (Math.random() < 0.55) attacks.push(buildFARPStrike(day))

    // Depot strike Day 17-19
    if (day >= 17 && day <= 19) attacks.push(buildDepotStrike(day))

    return attacks
  }

  // ── PHASE 4: THEATER-WIDE OFFENSIVE ──────────────────────────────────────
  if (phase === 4) {
    // Hit 3-4 things simultaneously

    // 1. Primary LOC ambush
    const primaryLOC = getMostUsedLOC(intel) || activeLOCs[0]
    if (primaryLOC) attacks.push(buildAmbushAttack(primaryLOC, day, 'SEVERE'))

    // 2. Bridge demolition on secondary LOC
    const secondLOC = activeLOCs.find(l => l !== primaryLOC)
    if (secondLOC) attacks.push(buildBridgeDemoAttack(secondLOC, day))

    // 3. FARP strike (always in Phase 4)
    attacks.push(buildFARPStrike(day))

    // 4. Fuel sabotage on depot
    if (day >= 25 || Math.random() < 0.6) {
      attacks.push(buildFuelSabotage(day))
    }

    // 5. Comms jamming — degrades overall visibility
    if (Math.random() < 0.4) {
      attacks.push(buildCommsJamming(day))
    }
    return attacks
  }

  return attacks
}

// ── TRACK PLAYER LOC USAGE ────────────────────────────────────────────────────

export function recordConvoyDispatch(intel: EnemyIntelligence, locId: string) {
  intel.locUsageCount[locId] = (intel.locUsageCount[locId] || 0) + 1
}

function getMostUsedLOC(intel: EnemyIntelligence): string | null {
  const entries = Object.entries(intel.locUsageCount)
  if (entries.length === 0) return null
  return entries.sort((a,b) => b[1]-a[1])[0][0]
}

function pickLOC(locs: string[], intel: EnemyIntelligence, day: number): string | null {
  if (locs.length === 0) return null
  // Prefer LOCs not recently attacked
  const fresh = locs.filter(l => (day - (intel.lastAttackDay[l]||0)) > 2)
  const pool = fresh.length > 0 ? fresh : locs
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── ATTACK BUILDERS ───────────────────────────────────────────────────────────

function buildIEDAttack(locId: string, day: number, severity: string): EnemyAttack {
  const geo = LOC_MIDPOINTS[locId] || { lat:51.5, lng:14.0, label:'MSR' }
  const gridRef = `GP ${Math.floor(4000+Math.random()*2000)} ${Math.floor(4000+Math.random()*2000)}`
  const mag = severity==='HIGH'?35:severity==='MEDIUM'?22:15
  return {
    id:`IED_${locId}_${day}`,
    type:'IED',
    targetLOC:locId,
    supplyClassesHit:[],  // IED delays but doesn't destroy
    magnitude:mag,
    durationDays:1,
    description:`IED detonation on ${geo.label}`,
    gridRef,
    reportText:`SIGACT: IED detonation confirmed ${geo.label} at grid ${gridRef}. Route assessed CLOSED pending EOD clearance. ETA 6-8 hours. All convoy movement suspended on this LOC.`,
    mapMarker:{ lat:geo.lat, lng:geo.lng, radius:12000, label:`IED STRIKE — ${geo.label}`, type:'STRIKE' },
  }
}

function buildAmbushAttack(locId: string, day: number, severity: string): EnemyAttack {
  const geo = LOC_MIDPOINTS[locId] || { lat:51.5, lng:14.0, label:'MSR' }
  const gridRef = `GP ${Math.floor(4000+Math.random()*2000)} ${Math.floor(4000+Math.random()*2000)}`
  const mag = severity==='SEVERE'?55:severity==='HIGH'?42:severity==='MEDIUM'?30:18
  return {
    id:`AMBUSH_${locId}_${day}`,
    type:'AMBUSH',
    targetLOC:locId,
    supplyClassesHit:[Math.floor(Math.random()*6), 2],  // random class + always Class III
    magnitude:mag,
    durationDays:2,
    description:`Convoy ambush — ${geo.label}`,
    gridRef,
    reportText:`FLASH: LOGPAC ambushed grid ${gridRef} on ${geo.label}. Enemy dismounts with RPGs. Multiple vehicles destroyed. Cargo lost. ${severity === 'SEVERE' ? 'TOTAL LOSS — all vehicles destroyed.' : severity === 'HIGH' ? '75% cargo loss.' : '40% cargo loss.'} Route CLOSED. Pattern analysis indicates enemy had advance knowledge of departure time.`,
    mapMarker:{ lat:geo.lat, lng:geo.lng, radius:22000, label:`CONVOY AMBUSH — ${geo.label}`, type:'CONVOY_AMBUSH' },
  }
}

function buildBridgeDemoAttack(locId: string, day: number): EnemyAttack {
  const geo = LOC_MIDPOINTS[locId] || { lat:52.0, lng:16.0, label:'MSR' }
  const gridRef = `GP ${Math.floor(5000+Math.random()*1000)} ${Math.floor(5000+Math.random()*1000)}`
  return {
    id:`BRIDGE_${locId}_${day}`,
    type:'BRIDGE_DEMO',
    targetLOC:locId,
    supplyClassesHit:[0,1,2,3,4,5],  // all classes blocked
    magnitude:100,
    durationDays:4,
    description:`Bridge demolished — ${geo.label} CLOSED`,
    gridRef,
    reportText:`CRITICAL: Enemy engineers demolished bridge on ${geo.label} at grid ${gridRef}. Structure is a complete loss. Engineer repair estimate 72-96 hours. ALL ground LOC movement through this corridor is CUT. Units beyond the bridge are accessible only via alternate routes adding 4-6 hours or by air.`,
    mapMarker:{ lat:geo.lat, lng:geo.lng, radius:15000, label:`BRIDGE DESTROYED — ${geo.label}`, type:'STRIKE' },
  }
}

function buildFARPStrike(day: number): EnemyAttack {
  return {
    id:`FARP_${day}`,
    type:'FARP_STRIKE',
    targetNode:'AVN_BDE',
    targetUnit:'AVN_BDE',
    supplyClassesHit:[2],  // Class III (fuel)
    magnitude:65,
    durationDays:3,
    description:'FARP Whiskey destroyed — air bridge offline',
    gridRef:`GP ${Math.floor(6000+Math.random()*1000)} ${Math.floor(6000+Math.random()*1000)}`,
    reportText:`FLASH: FARP Whiskey struck by enemy rocket artillery. Two aircraft destroyed on the pad. JP-8 stores ignited. FARP is non-operational. All air resupply sorties suspended for 72 hours minimum. Enemy has been tracking air activity patterns for several days — this was a deliberate targeting decision.`,
    mapMarker:{ lat:53.7, lng:20.4, radius:20000, label:'FARP WHISKEY — DESTROYED', type:'STRIKE' },
  }
}

function buildDepotStrike(day: number): EnemyAttack {
  return {
    id:`DEPOT_${day}`,
    type:'DEPOT_STRIKE',
    targetNode:'DEP_A',
    supplyClassesHit:[4, 2, 0],  // CL V, CL III, CL I
    magnitude:45,
    durationDays:2,
    description:'Depot Alpha — indirect fire attack',
    gridRef:`GP ${Math.floor(4400+Math.random()*200)} ${Math.floor(7700+Math.random()*200)}`,
    reportText:`FLASH: Enemy artillery impacted theater depot. Three Class V storage areas and one Class III berm destroyed. Stockage levels critically reduced. Enemy has accurate depot position data — this is not a lucky hit. Recommend immediate dispersal of remaining stocks to alternate depot.`,
    mapMarker:{ lat:49.44, lng:7.77, radius:25000, label:'DEPOT ALPHA — UNDER ATTACK', type:'ENEMY_AO' },
  }
}

function buildFuelSabotage(day: number): EnemyAttack {
  return {
    id:`FUEL_SAB_${day}`,
    type:'FUEL_SABOTAGE',
    targetUnit:'FOB2',
    supplyClassesHit:[2],  // Class III only
    magnitude:50,
    durationDays:2,
    description:`Class III sabotage — forward fuel point`,
    gridRef:`GP ${Math.floor(7900+Math.random()*200)} ${Math.floor(2100+Math.random()*200)}`,
    reportText:`IMMEDIATE: Forward unit fuel point sabotaged. Investigation indicates insider access or infiltration. Class III at FOB Valor destroyed. Unit aviation elements grounded. Enemy special operations element believed responsible. Security posture elevated.`,
    mapMarker:{ lat:53.1, lng:22.0, radius:10000, label:'FUEL SABOTAGE — FORWARD UNIT', type:'ENEMY_AO' },
  }
}

function buildCommsJamming(day: number): EnemyAttack {
  return {
    id:`COMMS_${day}`,
    type:'COMMS_JAMMING',
    supplyClassesHit:[],
    magnitude:30,
    durationDays:1,
    description:'Theater-wide comms jamming — RCT degraded',
    gridRef:'THEATER-WIDE',
    reportText:`WARNING: Enemy electronic warfare assets are jamming distribution coordination frequencies. Request cycle time is degraded. Manual coordination required for all convoys. All requests are experiencing 12-18 hour delays due to comms disruption. Enemy EW appears to be targeting the distribution management network specifically.`,
    mapMarker:{ lat:51.8, lng:14.5, radius:80000, label:'EW JAMMING — THEATER-WIDE', type:'ENEMY_AO' },
  }
}

// ── APPLY ATTACK EFFECTS TO GAME STATE ────────────────────────────────────────

export interface AttackEffect {
  unitId?: string
  nodeId?: string
  locId?: string
  type: 'SUPPLY_DROP' | 'READINESS_DROP' | 'LOC_INTERDICT' | 'RCT_INCREASE' | 'SIGMA_HIT'
  supplyClass?: number
  magnitude: number
  durationDays?: number
}

export function resolveAttackEffects(attack: EnemyAttack): AttackEffect[] {
  const effects: AttackEffect[] = []

  switch (attack.type) {
    case 'IED':
      // Delays convoy, elevates threat, small RCT hit
      effects.push({ locId:attack.targetLOC, type:'RCT_INCREASE', magnitude:10 })
      effects.push({ type:'SIGMA_HIT', magnitude:0.1 })
      break

    case 'AMBUSH':
      // Destroys cargo on transit LOC, hits destination supply
      attack.supplyClassesHit.forEach(cls => {
        const unitId = getUnitForLOC(attack.targetLOC!)
        if (unitId) {
          effects.push({ unitId, type:'SUPPLY_DROP', supplyClass:cls, magnitude:attack.magnitude })
        }
      })
      effects.push({ locId:attack.targetLOC, type:'LOC_INTERDICT', magnitude:100, durationDays:attack.durationDays })
      effects.push({ type:'RCT_INCREASE', magnitude:18 })
      effects.push({ type:'SIGMA_HIT', magnitude:0.25 })
      break

    case 'BRIDGE_DEMO':
      effects.push({ locId:attack.targetLOC, type:'LOC_INTERDICT', magnitude:100, durationDays:attack.durationDays })
      effects.push({ type:'RCT_INCREASE', magnitude:22 })
      effects.push({ type:'SIGMA_HIT', magnitude:0.35 })
      break

    case 'FARP_STRIKE':
      effects.push({ unitId:'AVN_BDE', type:'SUPPLY_DROP', supplyClass:2, magnitude:attack.magnitude })
      effects.push({ unitId:'AVN_BDE', type:'READINESS_DROP', magnitude:30 })
      effects.push({ type:'SIGMA_HIT', magnitude:0.3 })
      break

    case 'DEPOT_STRIKE':
      attack.supplyClassesHit.forEach(cls => {
        effects.push({ type:'SUPPLY_DROP', supplyClass:cls, magnitude:attack.magnitude })
      })
      effects.push({ type:'SIGMA_HIT', magnitude:0.4 })
      break

    case 'FUEL_SABOTAGE':
      effects.push({ unitId:attack.targetUnit, type:'SUPPLY_DROP', supplyClass:2, magnitude:attack.magnitude })
      effects.push({ unitId:attack.targetUnit, type:'READINESS_DROP', magnitude:18 })
      break

    case 'COMMS_JAMMING':
      effects.push({ type:'RCT_INCREASE', magnitude:15 })
      effects.push({ type:'SIGMA_HIT', magnitude:0.15 })
      break

    case 'SUPPLY_INTERDICTION':
      attack.supplyClassesHit.forEach(cls => {
        effects.push({ type:'SUPPLY_DROP', supplyClass:cls, magnitude:attack.magnitude })
      })
      effects.push({ type:'RCT_INCREASE', magnitude:12 })
      effects.push({ type:'SIGMA_HIT', magnitude:0.2 })
      break
  }

  return effects
}

// LOC-to-unit routing (which unit does each LOC primarily serve)
function getUnitForLOC(locId: string): string | null {
  const routing: Record<string,string> = {
    loc5:'FOB1', loc6:'FOB3', loc7:'FOB2',
    loc9:'AVN_BDE', loc10:'FOB1', loc11:'FOB1',
  }
  return routing[locId] || null
}

// ── INITIAL INTEL STATE ───────────────────────────────────────────────────────

export function createInitialIntel(): EnemyIntelligence {
  return {
    locUsageCount:{},
    criticalUnits:[],
    highValueLOCs:[],
    airCorridorIdentified:false,
    lastAttackDay:{},
    adaptationLevel:0,
  }
}
