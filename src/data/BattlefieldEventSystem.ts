/**
 * LOG ACTUAL — Battlefield Event System
 * KibuglogalVentures LLC
 *
 * Scenario-driven events that fire automatically during the campaign.
 * Each event has real mechanical effects on the logistics picture.
 * The player sees the effects before they understand the cause.
 * That is intentional.
 */

export type BattlefieldEventType =
  | 'FARP_ATTACK'           // Aviation FARP destroyed — sorties offline
  | 'CONVOY_AMBUSH'         // Convoy interdicted en route — supply lost
  | 'BRIDGE_DEMOLITION'     // LOC bridge destroyed — route closed
  | 'DEPOT_STRIKE'          // Enemy indirect fire on depot — supply levels drop
  | 'IED_STRIKE'            // IED on MSR — threat elevated, speed reduced
  | 'FUEL_FIRE'             // Class III depot fire — fuel critical
  | 'WEATHER_CLOSURE'       // Weather closes air corridor temporarily
  | 'MASS_CASUALTY'         // Unit takes casualties — readiness drop
  | 'SUPPLY_DUMP_ATTACK'    // Class V ammunition dump hit
  | 'LOC_PATTERN_EXPLOIT'   // Enemy exploits predictable convoy schedule
  | 'COMMS_BLACKOUT'        // C2 degraded — RCT increases
  | 'ENEMY_SURGE'           // Enemy activity spikes — all threats elevated

export type EventSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL'
export type EventPriority = 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH'

export interface MechanicalEffect {
  type: 'SUPPLY_DROP' | 'READINESS_DROP' | 'LOC_INTERDICT' | 'RCT_INCREASE'
      | 'SORTIE_OFFLINE' | 'THREAT_ELEVATE' | 'SIGMA_HIT'
  target: string        // unit ID, loc ID, or 'THEATER'
  supplyClass?: number  // 0-5 for SUPPLY_DROP
  magnitude: number     // percentage or hours depending on type
  durationDays?: number // how many days the effect lasts
}

export interface BattlefieldEvent {
  id: string
  type: BattlefieldEventType
  severity: EventSeverity
  priority: EventPriority
  day: number
  timeInDay: string        // simulated time e.g. "0347Z"
  title: string
  location: string
  affectedAssets: string[]
  report: string           // full intel report text
  doctrineImplication: string
  effects: MechanicalEffect[]
  mitigationWindow: number // seconds player has to mitigate before effect applies
  mitigated: boolean
  acknowledged: boolean
}

// ── EVENT TEMPLATES ───────────────────────────────────────────────────────────

const FARP_ATTACKS: Partial<BattlefieldEvent>[] = [
  {
    type:'FARP_ATTACK', severity:'SEVERE', priority:'FLASH',
    title:'FARP WHISKEY UNDER ATTACK',
    location:'FARP WHISKEY — GP 4821',
    affectedAssets:['AVN_BDE','AERIAL_PORT'],
    report:'Enemy rocket artillery struck FARP Whiskey at 0347Z. Two UH-60s destroyed on the pad. JP-8 stores ignited. FARP is non-operational. All air resupply missions suspended pending battle damage assessment and site security. Estimated recovery: 48-72 hours.',
    doctrineImplication:'Air resupply is now unavailable. Shift to ground distribution immediately. Any unit currently dependent on air-only sustainment must receive ground convoy within 24 hours or will enter stonewall.',
    effects:[
      { type:'SORTIE_OFFLINE', target:'AERIAL_PORT', magnitude:100, durationDays:3 },
      { type:'READINESS_DROP', target:'AVN_BDE', magnitude:25 },
      { type:'SIGMA_HIT', target:'THEATER', magnitude:0.3 },
    ],
    mitigationWindow: 60,
  },
  {
    type:'FARP_ATTACK', severity:'MODERATE', priority:'IMMEDIATE',
    title:'FARP DELTA MORTAR STRIKE',
    location:'FARP DELTA — GP 5102',
    affectedAssets:['AVN_BDE'],
    report:'Three mortar rounds impacted FARP Delta perimeter. No aircraft destroyed but refueling equipment is damaged. Aviation unit conducting emergency repairs. Sorties reduced to 1 per day until repairs complete. Estimated repair time: 24 hours.',
    doctrineImplication:'Reduced sortie capacity. Prioritize air resupply for FLASH-priority requests only. Ground routes must absorb the remaining sustainment load.',
    effects:[
      { type:'SORTIE_OFFLINE', target:'AERIAL_PORT', magnitude:50, durationDays:1 },
      { type:'READINESS_DROP', target:'AVN_BDE', magnitude:12 },
    ],
    mitigationWindow: 90,
  },
]

const CONVOY_AMBUSHES: Partial<BattlefieldEvent>[] = [
  {
    type:'CONVOY_AMBUSH', severity:'SEVERE', priority:'FLASH',
    title:'CONVOY LOGPAC-14 AMBUSHED — TOTAL LOSS',
    location:'MSR IRON — GP 4523',
    affectedAssets:['FOB1','III_CORPS'],
    report:'LOGPAC-14 (Class III, 4 vehicles) was ambushed at grid 4523 by enemy dismounts with RPGs. All four vehicles destroyed. Cargo lost. Three personnel KIA, two WIA. Enemy used predictable route and departure time. Pattern analysis suggests enemy had prior knowledge of convoy schedule.',
    doctrineImplication:'Vary convoy routes and departure times immediately. Enemy has identified your distribution pattern. Class III for FOB Iron is now CRITICAL — air resupply or lateral transfer required within 12 hours.',
    effects:[
      { type:'SUPPLY_DROP', target:'FOB1', supplyClass:2, magnitude:35 },
      { type:'RCT_INCREASE', target:'THEATER', magnitude:16 },
      { type:'SIGMA_HIT', target:'THEATER', magnitude:0.4 },
    ],
    mitigationWindow: 45,
  },
  {
    type:'CONVOY_AMBUSH', severity:'MODERATE', priority:'IMMEDIATE',
    title:'CONVOY LOGPAC-09 CONTACT — PARTIAL LOSS',
    location:'ROUTE AMBER — GP 6234',
    affectedAssets:['FOB2','FOB3'],
    report:'LOGPAC-09 (mixed Class I and Class V) took small arms contact on Route Amber. Lead vehicle destroyed, remaining three broke contact and returned to depot. Approximately 25% of cargo was on the destroyed vehicle. Unit sustained minor casualties. Route Amber assessed MEDIUM THREAT for next 24 hours.',
    doctrineImplication:'Route Amber threat elevated. Consider alternate routing via Route Delta (+3 hours) or air resupply for urgent Class V requirements.',
    effects:[
      { type:'SUPPLY_DROP', target:'FOB2', supplyClass:4, magnitude:20 },
      { type:'THREAT_ELEVATE', target:'LOC_ASP_FOB2', magnitude:1 },
    ],
    mitigationWindow: 90,
  },
]

const BRIDGE_DEMOLITIONS: Partial<BattlefieldEvent>[] = [
  {
    type:'BRIDGE_DEMOLITION', severity:'CRITICAL', priority:'FLASH',
    title:'BRIDGE NOVEMBER DESTROYED — MSR BLUE CLOSED',
    location:'MSR BLUE — Bridge November',
    affectedAssets:['DEPOT_B','FOB1','FOB2'],
    report:'Enemy engineer team destroyed Bridge November on MSR Blue overnight using pre-placed demolitions. Bridge is a complete loss — repair estimated 72-96 hours. All eastbound ground LOC movement through this corridor is now cut. Units east of the bridge are accessible only via Route Delta (+6 hours) or air.',
    doctrineImplication:'LOC Blue is CLOSED. Activate alternate LOC Delta immediately. Air resupply sorties must be prioritized for units that cannot wait 6+ hours for ground convoy via Delta.',
    effects:[
      { type:'LOC_INTERDICT', target:'LOC_DEPOTB_FOB1', magnitude:100, durationDays:4 },
      { type:'LOC_INTERDICT', target:'LOC_DEPOTB_FOB2', magnitude:100, durationDays:4 },
      { type:'RCT_INCREASE', target:'THEATER', magnitude:20 },
    ],
    mitigationWindow: 30,
  },
]

const DEPOT_STRIKES: Partial<BattlefieldEvent>[] = [
  {
    type:'DEPOT_STRIKE', severity:'SEVERE', priority:'FLASH',
    title:'DEPOT ALPHA — INDIRECT FIRE ATTACK',
    location:'DEPOT ALPHA — Kaiserslautern Area',
    affectedAssets:['DEPOT_A','III_CORPS','FOB3'],
    report:'Enemy artillery impacted Depot Alpha at 1423Z. Three Class V storage areas and one Class III berm destroyed. Stockage levels reduced significantly. Two civilian contract workers KIA, four military personnel WIA. Depot operational but at reduced capacity. Enemy appears to have accurate positioning data on the depot.',
    doctrineImplication:'Depot Alpha is compromised. Push all remaining stocks forward immediately — do not hold supply in a targeted depot. Consider dispersing stock to Depot Bravo. Units dependent on Depot Alpha will face shortfalls within 48 hours if distribution is not accelerated.',
    effects:[
      { type:'SUPPLY_DROP', target:'DEPOT_A', supplyClass:4, magnitude:45 },
      { type:'SUPPLY_DROP', target:'DEPOT_A', supplyClass:2, magnitude:30 },
      { type:'SIGMA_HIT', target:'THEATER', magnitude:0.5 },
    ],
    mitigationWindow: 60,
  },
]

const IED_STRIKES: Partial<BattlefieldEvent>[] = [
  {
    type:'IED_STRIKE', severity:'MODERATE', priority:'PRIORITY',
    title:'IED DETONATION — MSR IRON CORRIDOR',
    location:'MSR IRON — GP 4891 to 5103',
    affectedAssets:['FOB1'],
    report:'Three IED detonations on MSR Iron between grids 4891 and 5103 overnight. No friendly casualties but route is assessed HIGH THREAT. EOD clearing teams en route, estimate 6-8 hours before route is clear. All convoy movement on MSR Iron suspended pending clearance.',
    doctrineImplication:'MSR Iron temporarily suspended. This is the primary route to FOB Iron. If FOB Iron cannot wait 8 hours, air resupply is the only option. If air assets are committed elsewhere, execute lateral transfer from FOB Eagle now.',
    effects:[
      { type:'THREAT_ELEVATE', target:'LOC_ASP_FOB1', magnitude:2 },
      { type:'RCT_INCREASE', target:'FOB1', magnitude:10 },
    ],
    mitigationWindow: 120,
  },
]

const FUEL_FIRES: Partial<BattlefieldEvent>[] = [
  {
    type:'FUEL_FIRE', severity:'SEVERE', priority:'IMMEDIATE',
    title:'CLASS III STORAGE FIRE — FOB VALOR AREA',
    location:'FOB Valor — Fuel Point Bravo',
    affectedAssets:['FOB2'],
    report:'Fire engulfed the Class III storage point at FOB Valor at 2241Z. Cause under investigation — possible enemy sabotage or electrical fault. Approximately 60% of FOB Valor Class III stocks destroyed. Unit is now at 19% Class III — below combat threshold. Aviation elements at FOB Valor are grounded.',
    doctrineImplication:'FOB Valor Class III is CRITICAL. This is a confirmed stonewall precursor. Push Class III via fastest available means within 6 hours. Air is preferred given the urgency. Do not wait for a formal request.',
    effects:[
      { type:'SUPPLY_DROP', target:'FOB2', supplyClass:2, magnitude:55 },
      { type:'READINESS_DROP', target:'FOB2', magnitude:20 },
    ],
    mitigationWindow: 45,
  },
]

const WEATHER_EVENTS: Partial<BattlefieldEvent>[] = [
  {
    type:'WEATHER_CLOSURE', severity:'MODERATE', priority:'PRIORITY',
    title:'WEATHER — AIR CORRIDOR CLOSED',
    location:'Frankfurt APS — All Eastern Routes',
    affectedAssets:['AERIAL_PORT','FOB1','FOB2'],
    report:'Low cloud ceiling and freezing rain have closed all air corridors east of Frankfurt. VFR and IFR minimums not met. All air resupply missions suspended until weather lifts. Forecast: 18-24 hours. Ground LOC operations continue but road conditions are degraded.',
    doctrineImplication:'Air is unavailable. All sustainment must move by ground. Units currently relying on air resupply must be covered by ground convoys within the weather window. Pre-position ground convoys now.',
    effects:[
      { type:'SORTIE_OFFLINE', target:'AERIAL_PORT', magnitude:100, durationDays:1 },
    ],
    mitigationWindow: 120,
  },
]

const MASS_CASUALTIES: Partial<BattlefieldEvent>[] = [
  {
    type:'MASS_CASUALTY', severity:'SEVERE', priority:'FLASH',
    title:'MASS CASUALTY EVENT — FOB IRON INDIRECT FIRE',
    location:'FOB Iron — Main Compound',
    affectedAssets:['FOB1','III_CORPS'],
    report:'Enemy indirect fire impacted FOB Iron main compound at 0612Z during morning assembly. 14 KIA, 32 WIA. MEDEVAC missions ongoing. Unit combat effectiveness reduced. Commander reports unit is below minimum combat threshold. Requests immediate medical and personnel resupply.',
    doctrineImplication:'Mass casualty events degrade readiness independent of supply levels. FOB Iron readiness floor has dropped. Even with full supply restoration, this unit will operate at reduced capacity for 48-72 hours. Factor into task organization decisions.',
    effects:[
      { type:'READINESS_DROP', target:'FOB1', magnitude:22 },
      { type:'SIGMA_HIT', target:'THEATER', magnitude:0.35 },
    ],
    mitigationWindow: 60,
  },
]

const LOC_PATTERN_EXPLOITS: Partial<BattlefieldEvent>[] = [
  {
    type:'LOC_PATTERN_EXPLOIT', severity:'MODERATE', priority:'IMMEDIATE',
    title:'ENEMY PATTERN ANALYSIS — CONVOY SCHEDULE COMPROMISED',
    location:'Theater-Wide — All Ground LOCs',
    affectedAssets:['III_CORPS','FOB1','FOB2','FOB3'],
    report:'S2 assessment: Enemy forces have identified the distribution cycle. Convoys have departed from Depot Alpha at consistent times on consistent routes for 5 consecutive days. Pattern analysis confirms enemy has positioned ambush elements along primary distribution routes. Immediate route and schedule variation is required.',
    doctrineImplication:'Your predictability is a vulnerability. Vary convoy departure times by +/- 2 hours and rotate between Route Iron, Route Amber, and Route Delta. Enemy interdiction probability is now 45% on primary routes.',
    effects:[
      { type:'THREAT_ELEVATE', target:'LOC_ASP_FOB1', magnitude:2 },
      { type:'THREAT_ELEVATE', target:'LOC_DEPOTA_ASP', magnitude:1 },
      { type:'RCT_INCREASE', target:'THEATER', magnitude:8 },
    ],
    mitigationWindow: 180,
  },
]

const ENEMY_SURGES: Partial<BattlefieldEvent>[] = [
  {
    type:'ENEMY_SURGE', severity:'CRITICAL', priority:'FLASH',
    title:'ENEMY OPERATIONAL SURGE — THEATER-WIDE THREAT ELEVATED',
    location:'All Sectors',
    affectedAssets:['III_CORPS','FOB1','FOB2','FOB3','AVN_BDE'],
    report:'Intelligence confirms enemy has initiated coordinated offensive operations. All sectors are reporting increased contact. Enemy has specifically tasked logistics interdiction elements — their objective is your supply chain. All distribution operations are now at elevated risk. This is a deliberate targeting of theater sustainment.',
    doctrineImplication:'Enemy is specifically targeting your logistics. They understand that disrupting your supply chain is more efficient than fighting your combat power. This is the correct enemy decision. Your response must be equally deliberate — accelerate distribution cycles and pre-position before the fight intensifies.',
    effects:[
      { type:'THREAT_ELEVATE', target:'LOC_ASP_FOB1', magnitude:2 },
      { type:'THREAT_ELEVATE', target:'LOC_ASP_FOB2', magnitude:1 },
      { type:'THREAT_ELEVATE', target:'LOC_DEPOTB_FOB1', magnitude:1 },
      { type:'SIGMA_HIT', target:'THEATER', magnitude:0.4 },
    ],
    mitigationWindow: 90,
  },
]

// ── EVENT POOL ─────────────────────────────────────────────────────────────────

const ALL_EVENT_TEMPLATES: Partial<BattlefieldEvent>[][] = [
  FARP_ATTACKS,
  CONVOY_AMBUSHES,
  BRIDGE_DEMOLITIONS,
  DEPOT_STRIKES,
  IED_STRIKES,
  FUEL_FIRES,
  WEATHER_EVENTS,
  MASS_CASUALTIES,
  LOC_PATTERN_EXPLOITS,
  ENEMY_SURGES,
]

// ── EVENT GENERATOR ──────────────────────────────────────────────────────────

let eventCounter = 0

export function generateBattlefieldEvent(
  campaignDay: number,
  enemyActivityLevel: number,
  recentEventTypes: BattlefieldEventType[],
): BattlefieldEvent | null {
  // Probability of an event occurring: scales with activity and day
  const baseProbability = 0.25 + (enemyActivityLevel * 0.4) + (campaignDay / 30 * 0.2)
  if (Math.random() > Math.min(0.85, baseProbability)) return null

  // Avoid repeating same type twice in a row
  const lastType = recentEventTypes[recentEventTypes.length - 1]

  // Pick a pool weighted by day (early = IEDs and ambushes, late = surges and depot strikes)
  const weights = [
    campaignDay < 10 ? 0.15 : 0.12,  // FARP attacks
    campaignDay < 15 ? 0.22 : 0.18,  // convoy ambushes
    campaignDay < 8  ? 0.05 : 0.14,  // bridge demolitions
    campaignDay < 12 ? 0.08 : 0.14,  // depot strikes
    0.20,                              // IED strikes (constant)
    campaignDay < 10 ? 0.06 : 0.10,  // fuel fires
    0.08,                              // weather (constant)
    campaignDay > 15 ? 0.10 : 0.05,  // mass casualties
    campaignDay > 8  ? 0.10 : 0.05,  // pattern exploit
    campaignDay > 20 ? 0.12 : 0.03,  // enemy surge
  ]

  // Weighted selection
  const totalWeight = weights.reduce((a,b)=>a+b,0)
  let rand = Math.random() * totalWeight
  let poolIndex = 0
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i]
    if (rand <= 0) { poolIndex = i; break }
  }

  const pool = ALL_EVENT_TEMPLATES[poolIndex]
  const template = pool[Math.floor(Math.random() * pool.length)]
  if (!template) return null

  // Don't repeat same type twice in a row
  if (template.type === lastType) return null

  const hour = String(Math.floor(Math.random() * 24)).padStart(2,'0')
  const min  = String(Math.floor(Math.random() * 60)).padStart(2,'0')

  eventCounter++
  return {
    ...template,
    id: `BFE-${campaignDay}-${String(eventCounter).padStart(4,'0')}`,
    day: campaignDay,
    timeInDay: `${hour}${min}Z`,
    mitigated: false,
    acknowledged: false,
  } as BattlefieldEvent
}

// ── EVENT SEVERITY → VISUAL ──────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<EventSeverity,string> = {
  MINOR:    '#00ff88',
  MODERATE: '#ffaa00',
  SEVERE:   '#ff6600',
  CRITICAL: '#ff2200',
}

export const PRIORITY_COLORS: Record<EventPriority,string> = {
  ROUTINE:   '#1a5a3a',
  PRIORITY:  '#ffaa00',
  IMMEDIATE: '#ff6600',
  FLASH:     '#ff2200',
}

export const EVENT_TYPE_LABELS: Record<BattlefieldEventType,string> = {
  FARP_ATTACK:         'FARP ATTACK',
  CONVOY_AMBUSH:       'CONVOY AMBUSH',
  BRIDGE_DEMOLITION:   'BRIDGE DEMO',
  DEPOT_STRIKE:        'DEPOT STRIKE',
  IED_STRIKE:          'IED STRIKE',
  FUEL_FIRE:           'FUEL FIRE',
  WEATHER_CLOSURE:     'WEATHER',
  MASS_CASUALTY:       'MASS CAS',
  SUPPLY_DUMP_ATTACK:  'SUPPLY ATTACK',
  LOC_PATTERN_EXPLOIT: 'PATTERN EXPLOIT',
  COMMS_BLACKOUT:      'COMMS OUT',
  ENEMY_SURGE:         'ENEMY SURGE',
}
