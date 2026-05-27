// LOG ACTUAL — Mission Scenarios
// KibuglogalVentures LLC
//
// 6 scenarios across 3 real-world theaters.
// Map coordinates are actual geographic positions.
// Dialog lines play before each doctrine decision.

export type TheaterRegion = 'EUROPE' | 'MIDDLE_EAST' | 'PACIFIC'

export interface CharacterLine {
  character: 'CDR' | 'SGM' | 'S4' | 'SPO' | 'INTEL'
  text: string
}

export interface ScenarioNode {
  id: string
  name: string
  shortName: string
  type: 'PORT' | 'AERIAL_PORT' | 'DEPOT' | 'ASP' | 'FOB' | 'AIRFIELD'
  lat: number
  lng: number
  status: 'ACTIVE' | 'INTERDICTED' | 'DEGRADED'
}

export interface ScenarioLOC {
  id: string
  fromNodeId: string
  toNodeId: string
  type: 'GROUND' | 'AIR' | 'RAIL'
  status: 'ACTIVE' | 'INTERDICTED'
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface MissionScenario {
  id: string
  campaignNumber: number
  theater: TheaterRegion
  operationName: string
  subtitle: string
  classification: string
  duration: number
  mapCenter: [number, number]
  mapZoom: number
  difficulty: 'STANDARD' | 'ELEVATED' | 'SEVERE'
  difficultyLabel: string

  // OPORD fields
  situation: string
  mission: string
  commandersIntent: string
  enemyForces: string
  friendlyForces: string
  serviceSupportNote: string

  // Starting conditions
  startingSigma: number
  startingStonewallRate: number
  startingRCT: number
  enemyActivityLevel: number

  // Geographic nodes
  nodes: ScenarioNode[]
  locs: ScenarioLOC[]

  // Opening briefing dialog (plays before campaign starts)
  openingDialog: CharacterLine[]

  // Thumbnail description for mission select
  thumbnailDesc: string
}

// ── CHARACTERS ────────────────────────────────────────────────────────────────

export const CHARACTERS = {
  CDR:   { name: 'COL DRAKE',    rank: 'Theater Sustainment Commander',    color: '#2ecc71' },
  SGM:   { name: 'SGM HARRIS',   rank: 'Senior Logistics NCO',             color: '#f39c12' },
  S4:    { name: 'CPT OKAFOR',   rank: 'S4 — Logistics Officer',           color: '#3498db' },
  SPO:   { name: 'MAJ REYES',    rank: 'Support Operations Officer',       color: '#9b59b6' },
  INTEL: { name: 'LT PARK',      rank: 'Intelligence Officer',             color: '#e74c3c' },
}

// ── SCENARIO 1: EUROPEAN THEATER ─────────────────────────────────────────────

export const SCENARIO_1: MissionScenario = {
  id: 'CAMPAIGN_1',
  campaignNumber: 1,
  theater: 'EUROPE',
  operationName: 'OPERATION IRON SUSTAIN',
  subtitle: 'European Theater — Kaiserslautern to Warsaw Corridor',
  classification: 'UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY',
  duration: 30,
  mapCenter: [51.5, 12.0],
  mapZoom: 6,
  difficulty: 'STANDARD',
  difficultyLabel: 'Standard — Doctrine fundamentals tested',

  situation: 'III Corps is conducting offensive operations in Eastern Europe. Your theater sustainment architecture runs from the Port of Antwerp through forward depots in Germany to FOBs in Poland. Enemy forces are conducting LOC interdiction along MSR IRON. Three Class V shortfalls have been identified in the forward area.',
  mission: 'As Theater Sustainment Commander, sustain III Corps and supporting elements across a 30-day operational campaign. Reduce request cycle time from 38% USL violation to below 10%. Achieve sigma level 3.0 or above.',
  commandersIntent: 'Push supply forward proactively. Do not wait for requests — anticipate. The forward units must never go to stonewall. Every hour above the 48-hour USL costs us operational reach.',
  enemyForces: 'OPFOR conducting LOC interdiction along MSR IRON and MSR AMBER. IED activity HIGH between ASP and FOB IRON. Enemy air defense assets limiting aerial port sorties on Days 16-20.',
  friendlyForces: 'III Corps (maneuver), 4ID (support), Aviation Brigade (theater asset), three FOBs (IRON, VALOR, EAGLE). Port of Antwerp at full capacity. Frankfurt Aerial Port: 2 sorties/day.',
  serviceSupportNote: 'Starting sigma: 1.8σ. Baseline stonewall rate: 12.7%. Your primary constraint is request cycle time — the system waits when it should push.',

  startingSigma: 1.8,
  startingStonewallRate: 12.7,
  startingRCT: 38,
  enemyActivityLevel: 0.35,

  nodes: [
    { id:'PORT',        name:'Port of Antwerp',     shortName:'POE',   type:'PORT',        lat:51.2194, lng:4.4025,  status:'ACTIVE' },
    { id:'AERIAL_PORT', name:'Frankfurt Air Base',   shortName:'APS',   type:'AERIAL_PORT', lat:50.0333, lng:8.5706,  status:'ACTIVE' },
    { id:'DEPOT_A',     name:'Depot Alpha (K-Town)', shortName:'DEP-A', type:'DEPOT',       lat:49.4444, lng:7.7689,  status:'ACTIVE' },
    { id:'ASP',         name:'Ammo Supply Point',    shortName:'ASP',   type:'ASP',         lat:50.8000, lng:14.5000, status:'ACTIVE' },
    { id:'DEPOT_B',     name:'Depot Bravo (Poznan)', shortName:'DEP-B', type:'DEPOT',       lat:52.4064, lng:16.9252, status:'ACTIVE' },
    { id:'AIRFIELD',    name:'Forward Airfield',     shortName:'AFD',   type:'AIRFIELD',    lat:52.2297, lng:21.0122, status:'ACTIVE' },
    { id:'FOB1',        name:'FOB Iron',             shortName:'FOB-I', type:'FOB',         lat:52.1000, lng:20.5000, status:'ACTIVE' },
    { id:'FOB2',        name:'FOB Valor',            shortName:'FOB-V', type:'FOB',         lat:53.1000, lng:22.0000, status:'ACTIVE' },
    { id:'FOB3',        name:'FOB Eagle',            shortName:'FOB-E', type:'FOB',         lat:51.4000, lng:17.5000, status:'ACTIVE' },
  ],

  locs: [
    { id:'LOC_PORT_DEPOTA',  fromNodeId:'PORT',        toNodeId:'DEPOT_A',     type:'GROUND', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_DEPOTA_ASP',   fromNodeId:'DEPOT_A',     toNodeId:'ASP',         type:'GROUND', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_ASP_FOB1',     fromNodeId:'ASP',         toNodeId:'FOB1',        type:'GROUND', status:'INTERDICTED', threatLevel:'HIGH'   },
    { id:'LOC_ASP_FOB2',     fromNodeId:'ASP',         toNodeId:'FOB2',        type:'GROUND', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_DEPOTB_FOB1',  fromNodeId:'DEPOT_B',     toNodeId:'FOB1',        type:'GROUND', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_AIR_APS_FOB1', fromNodeId:'AERIAL_PORT', toNodeId:'FOB1',        type:'AIR',    status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_DEPOTA_FOB3',  fromNodeId:'DEPOT_A',     toNodeId:'FOB3',        type:'GROUND', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_AFD_FOB2',     fromNodeId:'AIRFIELD',    toNodeId:'FOB2',        type:'AIR',    status:'ACTIVE',      threatLevel:'LOW'    },
  ],

  openingDialog: [
    { character:'INTEL', text:'Sir, latest assessment. FOB IRON is sitting at 18% Class III. Ground LOC is interdicted — IED activity confirmed on MSR IRON since 0300.' },
    { character:'SGM',   text:'I have seen this before, Colonel. They waited for the request to come through channels. By the time paperwork cleared, the unit was dry.' },
    { character:'S4',    text:'Our air corridor is open. Frankfurt can push two sorties. Weather window closes in 24 hours. After that we are ground-only for 72.' },
    { character:'SPO',   text:'Sir, I need a decision. If we wait for FOB IRON to submit formal resupply we are looking at stonewall before the convoy clears the wire.' },
    { character:'CDR',   text:'Then we do not wait. That is exactly the doctrine failure we are here to fix. Get me the options.' },
  ],

  thumbnailDesc: 'Sustain III Corps through 30 days of high-tempo operations. LOC interdiction from Day 1. Master push distribution before the forward units run dry.',
}

// ── SCENARIO 2: EUROPEAN THEATER ─────────────────────────────────────────────

export const SCENARIO_2: MissionScenario = {
  id: 'CAMPAIGN_2',
  campaignNumber: 2,
  theater: 'EUROPE',
  operationName: 'OPERATION BALTIC SHIELD',
  subtitle: 'Baltic States — Riga to Tallinn Defense Corridor',
  classification: 'UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY',
  duration: 21,
  mapCenter: [57.0, 24.0],
  mapZoom: 7,
  difficulty: 'ELEVATED',
  difficultyLabel: 'Elevated — Triage and stonewall recovery under pressure',

  situation: 'NATO forces are conducting defensive operations across the Baltic states. Enemy interdiction has already severed two primary LOCs. Three units are simultaneously approaching amber status. Your sustainment architecture is compressed — no deep depots, everything forward.',
  mission: 'Sustain defensive operations across Estonia, Latvia, and Lithuania for 21 days. Prevent simultaneous stonewall across multiple units. Enemy will push hardest on Days 10-15.',
  commandersIntent: 'Triage correctly. You cannot save everyone at once. Prioritize by deadline and combat criticality. Accept degradation in the economy of force units to preserve main effort readiness.',
  enemyForces: 'OPFOR has interdicted MSR AMBER and MSR NORTH. Drone surveillance on all ground LOC movement. Air corridor at Riga limited to night operations.',
  friendlyForces: 'Four NATO brigade-level elements. Single aerial port at Riga. No deep depot — all supply staged at forward collection points.',
  serviceSupportNote: 'Starting sigma: 1.5σ. You begin already in the hole. Two units are in amber on Day 1. This tests triage doctrine from the opening move.',

  startingSigma: 1.5,
  startingStonewallRate: 18.0,
  startingRCT: 44,
  enemyActivityLevel: 0.55,

  nodes: [
    { id:'PORT',        name:'Port of Riga',         shortName:'POE',   type:'PORT',        lat:56.9496, lng:24.1052, status:'ACTIVE'    },
    { id:'AERIAL_PORT', name:'Riga Air Base',         shortName:'RIX',   type:'AERIAL_PORT', lat:56.9236, lng:23.9711, status:'DEGRADED'  },
    { id:'DEPOT_A',     name:'Depot Vilnius',         shortName:'DEP-V', type:'DEPOT',       lat:54.6872, lng:25.2797, status:'ACTIVE'    },
    { id:'FOB1',        name:'FOB Tallinn',           shortName:'TLN',   type:'FOB',         lat:59.4370, lng:24.7536, status:'ACTIVE'    },
    { id:'FOB2',        name:'FOB Tartu',             shortName:'TAR',   type:'FOB',         lat:58.3776, lng:26.7290, status:'ACTIVE'    },
    { id:'FOB3',        name:'FOB Kaunas',            shortName:'KUN',   type:'FOB',         lat:54.8985, lng:23.9036, status:'ACTIVE'    },
    { id:'FOB4',        name:'FOB Siauliai',          shortName:'SIA',   type:'FOB',         lat:55.9349, lng:23.3137, status:'ACTIVE'    },
  ],

  locs: [
    { id:'LOC_PORT_DEPOTA',  fromNodeId:'PORT',  toNodeId:'DEPOT_A', type:'GROUND', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_DEPOTA_FOB3',  fromNodeId:'DEPOT_A', toNodeId:'FOB3',  type:'GROUND', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_DEPOTA_FOB4',  fromNodeId:'DEPOT_A', toNodeId:'FOB4',  type:'GROUND', status:'INTERDICTED', threatLevel:'HIGH'   },
    { id:'LOC_PORT_FOB1',    fromNodeId:'PORT',  toNodeId:'FOB1',    type:'GROUND', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_AIR_RIX_FOB2', fromNodeId:'AERIAL_PORT', toNodeId:'FOB2', type:'AIR', status:'ACTIVE',     threatLevel:'MEDIUM' },
  ],

  openingDialog: [
    { character:'INTEL', text:'Colonel, OPFOR has cut MSR AMBER and MSR NORTH overnight. We have four units, three of them in amber. I do not see a path to sustaining all of them today.' },
    { character:'SGM',   text:'Sir, Kaunas and Siauliai are sharing the same road network. If one goes to stonewall it takes the other one with it. I have seen that happen.' },
    { character:'S4',    text:'We have enough for one full resupply or two partial. Partial leaves everyone marginal. Full resupply means someone waits twenty-four hours.' },
    { character:'SPO',   text:'Triage. One gets everything. We recover them, then we move to the next. That is the doctrine answer and you know it, sir.' },
    { character:'CDR',   text:'Walk me through who gets priority and why. I want the doctrine basis before I commit.' },
  ],

  thumbnailDesc: 'Baltic defensive operations. Two LOCs already cut on Day 1. Three units in amber. Triage doctrine is the only way through this.',
}

// ── SCENARIO 3: MIDDLE EAST THEATER ──────────────────────────────────────────

export const SCENARIO_3: MissionScenario = {
  id: 'CAMPAIGN_3',
  campaignNumber: 3,
  theater: 'MIDDLE_EAST',
  operationName: 'OPERATION DESERT LINES',
  subtitle: 'Jordan to Iraq/Syria Border — Extreme Environment Operations',
  classification: 'UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY',
  duration: 25,
  mapCenter: [33.5, 40.0],
  mapZoom: 6,
  difficulty: 'ELEVATED',
  difficultyLabel: 'Elevated — Heat degradation, long LOC distances, air dependency',

  situation: 'Coalition forces are sustaining operations along the Jordan-Iraq corridor. Extreme heat (120°F+) accelerates Class I and Class III consumption by 40%. LOC distances are extreme — 600km between primary depot and forward FOBs. Air assets are the only viable option for emergency resupply.',
  mission: 'Sustain coalition operations for 25 days across extreme terrain. Manage elevated consumption rates. Pre-position aggressively before the Day 12 operational surge.',
  commandersIntent: 'This environment does not forgive reactive logistics. The heat will kill this operation faster than the enemy if we do not push supply ahead of the demand. Every decision must anticipate the next 72 hours.',
  enemyForces: 'Irregular forces targeting ground convoys on Routes BLUE and GOLD. IED activity extreme on southern routes. Threat to aerial port at Al Muthanna: MEDIUM.',
  friendlyForces: 'Two brigade combat teams, one aviation battalion. Port of Aqaba as entry point. Long ground LOC — air resupply is not a backup, it is a primary method.',
  serviceSupportNote: 'Starting sigma: 1.6σ. Heat multiplier active: Class I consumption +40%, Class III +35%. Pre-positioning is not optional in this environment.',

  startingSigma: 1.6,
  startingStonewallRate: 15.0,
  startingRCT: 42,
  enemyActivityLevel: 0.50,

  nodes: [
    { id:'PORT',        name:'Port of Aqaba',         shortName:'AQJ',   type:'PORT',        lat:29.5321, lng:34.9996, status:'ACTIVE' },
    { id:'AERIAL_PORT', name:'Al Muthanna Air Base',   shortName:'ALP',   type:'AERIAL_PORT', lat:30.9770, lng:46.0880, status:'ACTIVE' },
    { id:'DEPOT_A',     name:'Depot Amman',            shortName:'AMM',   type:'DEPOT',       lat:31.9566, lng:35.9457, status:'ACTIVE' },
    { id:'DEPOT_B',     name:'Depot Baghdad',          shortName:'BGW',   type:'DEPOT',       lat:33.3152, lng:44.3661, status:'ACTIVE' },
    { id:'FOB1',        name:'FOB Rutbah',             shortName:'RTB',   type:'FOB',         lat:33.0444, lng:40.2833, status:'ACTIVE' },
    { id:'FOB2',        name:'FOB Ramadi',             shortName:'RMD',   type:'FOB',         lat:33.4258, lng:43.2999, status:'ACTIVE' },
    { id:'ASP',         name:'Forward ASP Tikrit',    shortName:'TKR',   type:'ASP',         lat:34.5974, lng:43.6939, status:'ACTIVE' },
  ],

  locs: [
    { id:'LOC_AQJ_AMM',   fromNodeId:'PORT',     toNodeId:'DEPOT_A',     type:'GROUND', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_AMM_FOB1',  fromNodeId:'DEPOT_A',  toNodeId:'FOB1',        type:'GROUND', status:'ACTIVE',      threatLevel:'HIGH'   },
    { id:'LOC_AMM_BGW',   fromNodeId:'DEPOT_A',  toNodeId:'DEPOT_B',     type:'GROUND', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_BGW_FOB2',  fromNodeId:'DEPOT_B',  toNodeId:'FOB2',        type:'GROUND', status:'ACTIVE',      threatLevel:'HIGH'   },
    { id:'LOC_AIR_ALP_1', fromNodeId:'AERIAL_PORT', toNodeId:'FOB1',     type:'AIR',    status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_AIR_ALP_2', fromNodeId:'AERIAL_PORT', toNodeId:'FOB2',     type:'AIR',    status:'ACTIVE',      threatLevel:'LOW'    },
  ],

  openingDialog: [
    { character:'S4',    text:'Sir, I need to flag the consumption rates. 120 degrees on the ground. Class I is burning 40% faster than our planning figures. Class III is worse.' },
    { character:'INTEL', text:'Both southern routes have confirmed IED activity. Route GOLD had a hit this morning. Ground LOC to FOB Rutbah is a seven-hour run minimum.' },
    { character:'SGM',   text:'Colonel, I have been here before. Desert operations will break you if you wait for the request to tell you there is a problem. You need to push.' },
    { character:'SPO',   text:'The air corridor is our lifeline here. If we lose that we lose the forward FOBs. Everything we do needs to protect that sortie capacity.' },
    { character:'CDR',   text:'Understood. We push Class I and III forward before they ask. What is our pre-position window before the Day 12 surge?' },
  ],

  thumbnailDesc: '600km LOCs, 120°F heat, elevated consumption rates. Air resupply is not a backup plan — it is the plan. Pre-position or fail.',
}

// ── SCENARIO 4: MIDDLE EAST THEATER ──────────────────────────────────────────

export const SCENARIO_4: MissionScenario = {
  id: 'CAMPAIGN_4',
  campaignNumber: 4,
  theater: 'MIDDLE_EAST',
  operationName: 'OPERATION SAND BRIDGE',
  subtitle: 'UAE to Kuwait — Maritime Pre-positioning and RCT Sprint',
  classification: 'UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY',
  duration: 20,
  mapCenter: [25.5, 51.0],
  mapZoom: 7,
  difficulty: 'STANDARD',
  difficultyLabel: 'Standard — RCT focus, maritime supply lines, competing priorities',

  situation: 'Pre-positioning operations from UAE to Kuwait in support of a potential contingency. Two brigade combat teams are forward-staging. Request cycle time violations are the primary threat — the supply exists, the system is slow.',
  mission: 'Reduce theater request cycle time from 52 hours to below 30 hours over 20 days. Sustain forward staging without stonewall events. Enemy threat is LOW — this is a logistics process problem.',
  commandersIntent: 'The enemy is the clock. Every request that sits in the queue past 48 hours is a failure. This operation tests whether we have fixed the distribution process.',
  enemyForces: 'Threat level LOW. Minor maritime harassment. No significant LOC interdiction expected.',
  friendlyForces: 'Two BCTs, maritime pre-positioned stocks at Jebel Ali, aerial port at Kuwait IAP.',
  serviceSupportNote: 'Starting sigma: 1.3σ — worst starting position in the campaign set. RCT averaging 52 hours. You are fixing a broken process under operational conditions.',

  startingSigma: 1.3,
  startingStonewallRate: 8.0,
  startingRCT: 52,
  enemyActivityLevel: 0.15,

  nodes: [
    { id:'PORT',        name:'Jebel Ali Port',        shortName:'JBL',   type:'PORT',        lat:25.0028, lng:55.0693, status:'ACTIVE' },
    { id:'AERIAL_PORT', name:'Kuwait IAP',             shortName:'KWI',   type:'AERIAL_PORT', lat:29.2267, lng:47.9689, status:'ACTIVE' },
    { id:'DEPOT_A',     name:'Depot Abu Dhabi',        shortName:'AUH',   type:'DEPOT',       lat:24.4675, lng:54.3667, status:'ACTIVE' },
    { id:'DEPOT_B',     name:'Depot Kuwait City',      shortName:'KWT',   type:'DEPOT',       lat:29.3759, lng:47.9774, status:'ACTIVE' },
    { id:'FOB1',        name:'Camp Buehring',          shortName:'CBH',   type:'FOB',         lat:29.5000, lng:47.5000, status:'ACTIVE' },
    { id:'FOB2',        name:'Camp Arifjan',           shortName:'CAR',   type:'FOB',         lat:29.0667, lng:48.1167, status:'ACTIVE' },
  ],

  locs: [
    { id:'LOC_JBL_AUH',  fromNodeId:'PORT',     toNodeId:'DEPOT_A', type:'GROUND', status:'ACTIVE', threatLevel:'LOW' },
    { id:'LOC_AUH_KWT',  fromNodeId:'DEPOT_A',  toNodeId:'DEPOT_B', type:'GROUND', status:'ACTIVE', threatLevel:'LOW' },
    { id:'LOC_KWT_FOB1', fromNodeId:'DEPOT_B',  toNodeId:'FOB1',    type:'GROUND', status:'ACTIVE', threatLevel:'LOW' },
    { id:'LOC_KWT_FOB2', fromNodeId:'DEPOT_B',  toNodeId:'FOB2',    type:'GROUND', status:'ACTIVE', threatLevel:'LOW' },
    { id:'LOC_AIR_KWI',  fromNodeId:'AERIAL_PORT', toNodeId:'FOB1', type:'AIR',    status:'ACTIVE', threatLevel:'LOW' },
  ],

  openingDialog: [
    { character:'S4',    text:'Sir, our RCT is fifty-two hours. That is four hours above the USL and trending worse. The supply exists — it is sitting in the queue.' },
    { character:'SPO',   text:'The problem is the pull system. Units submit a request, it goes through channels, somebody approves it, it gets tasked, then the convoy moves. That is a two-day process for something that should take eight hours.' },
    { character:'SGM',   text:'Push distribution. I know it sounds simple but it is not being done. We know what these units consume. We should be moving it before they ask.' },
    { character:'CDR',   text:'Then we fix the process while operating. What is our first move to break the fifty-two-hour average?' },
    { character:'S4',    text:'Same-day dispatch on any request under priority. No approvals above company grade. Get the convoys rolling before the paperwork catches up.' },
  ],

  thumbnailDesc: 'Low enemy threat — the enemy is the clock. RCT at 52 hours. Fix the distribution process while sustaining forward staging operations.',
}

// ── SCENARIO 5: PACIFIC THEATER ───────────────────────────────────────────────

export const SCENARIO_5: MissionScenario = {
  id: 'CAMPAIGN_5',
  campaignNumber: 5,
  theater: 'PACIFIC',
  operationName: 'OPERATION PACIFIC PUSH',
  subtitle: 'Japan to Korean Peninsula — Pre-positioning Under Time Pressure',
  classification: 'UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY',
  duration: 28,
  mapCenter: [36.0, 128.0],
  mapZoom: 6,
  difficulty: 'ELEVATED',
  difficultyLabel: 'Elevated — Compressed timeline, pre-positioning is decisive',

  situation: 'US and allied forces are pre-positioning for contingency operations on the Korean Peninsula. 28-day window before operational tempo escalates. Pre-positioned stocks at Camp Humphreys are insufficient. Strategic lift from Japan must be executed in the first ten days or the campaign cannot be sustained.',
  mission: 'Pre-position sufficient stocks at forward bases to sustain 30 days of high-intensity operations. The first ten days are logistics — everything must be in place before the fight starts.',
  commandersIntent: 'If we are not pre-positioned by Day 10, we have already lost. Push everything forward in the first ten days. Accept risk in the rear to enable the forward.',
  enemyForces: 'Ballistic missile threat to port facilities at Busan. Air defense systems limiting aerial approaches from Days 15-28. Ground interdiction: LOW.',
  friendlyForces: 'Two heavy BCTs at Camp Humphreys, one aviation brigade at Osan. Ports at Busan and Incheon. Strategic airlift from Yokota Air Base.',
  serviceSupportNote: 'Starting sigma: 1.9σ. Pre-positioning window: Days 1-10. After Day 10 the enemy threat makes large-scale movement dangerous. Every ton moved in the first ten days is a ton you do not have to fight for later.',

  startingSigma: 1.9,
  startingStonewallRate: 10.0,
  startingRCT: 36,
  enemyActivityLevel: 0.40,

  nodes: [
    { id:'PORT',        name:'Port of Busan',          shortName:'PUS',   type:'PORT',        lat:35.1028, lng:129.0403, status:'ACTIVE' },
    { id:'PORT2',       name:'Port of Incheon',        shortName:'ICN',   type:'PORT',        lat:37.4563, lng:126.7052, status:'ACTIVE' },
    { id:'AERIAL_PORT', name:'Yokota Air Base',         shortName:'YOK',   type:'AERIAL_PORT', lat:35.7485, lng:139.3483, status:'ACTIVE' },
    { id:'DEPOT_A',     name:'Camp Carroll',           shortName:'CRL',   type:'DEPOT',       lat:35.9900, lng:128.4200, status:'ACTIVE' },
    { id:'FOB1',        name:'Camp Humphreys',         shortName:'HUM',   type:'FOB',         lat:36.9746, lng:127.0289, status:'ACTIVE' },
    { id:'FOB2',        name:'Camp Casey',             shortName:'CSY',   type:'FOB',         lat:37.9011, lng:127.0594, status:'ACTIVE' },
    { id:'AIRFIELD',    name:'Osan Air Base',          shortName:'OSN',   type:'AIRFIELD',    lat:37.0903, lng:127.0297, status:'ACTIVE' },
  ],

  locs: [
    { id:'LOC_PUS_CRL',  fromNodeId:'PORT',        toNodeId:'DEPOT_A', type:'GROUND', status:'ACTIVE', threatLevel:'LOW'    },
    { id:'LOC_CRL_HUM',  fromNodeId:'DEPOT_A',     toNodeId:'FOB1',    type:'GROUND', status:'ACTIVE', threatLevel:'LOW'    },
    { id:'LOC_ICN_CSY',  fromNodeId:'PORT2',       toNodeId:'FOB2',    type:'GROUND', status:'ACTIVE', threatLevel:'MEDIUM' },
    { id:'LOC_AIR_YOK',  fromNodeId:'AERIAL_PORT', toNodeId:'FOB1',    type:'AIR',    status:'ACTIVE', threatLevel:'LOW'    },
    { id:'LOC_OSN_CSY',  fromNodeId:'AIRFIELD',    toNodeId:'FOB2',    type:'AIR',    status:'ACTIVE', threatLevel:'MEDIUM' },
  ],

  openingDialog: [
    { character:'INTEL', text:'Sir, we have a ten-day window before ballistic missile threat makes port operations untenable. After Day 10, Busan becomes high risk for mass cargo movement.' },
    { character:'S4',    text:'The math is not good. We need 90 days of Class V and Class III pre-positioned. We can move maybe 60 days of stock in ten days at current throughput.' },
    { character:'SPO',   text:'Push everything. Max convoy cycles. Max air sorties out of Yokota. Accept the rear area risk. The forward must be set before the window closes.' },
    { character:'SGM',   text:'Colonel, I want to flag something. If we strip the rear to fill the forward and the operation extends, we will have nothing to reconstitute with. That is a real risk.' },
    { character:'CDR',   text:'Noted, Sergeant Major. But an unprepared forward is a dead operation. Pre-position first. We deal with reconstitution risk if we get that far.' },
  ],

  thumbnailDesc: 'Ten-day pre-positioning window before the threat closes. Push everything forward now or sustain nothing later. Time is the enemy.',
}

// ── SCENARIO 6: PACIFIC THEATER ───────────────────────────────────────────────

export const SCENARIO_6: MissionScenario = {
  id: 'CAMPAIGN_6',
  campaignNumber: 6,
  theater: 'PACIFIC',
  operationName: 'OPERATION ISLAND HOP',
  subtitle: 'Pacific Island Chain — Air-Heavy Sustainment Across Maritime Distances',
  classification: 'UNCLASSIFIED // EXERCISE // FOR TRAINING ONLY',
  duration: 35,
  mapCenter: [20.0, 140.0],
  mapZoom: 5,
  difficulty: 'SEVERE',
  difficultyLabel: 'Severe — No ground LOCs. Air is the only distribution method.',

  situation: 'Joint forces are conducting island-hopping operations across the western Pacific. Ground LOCs do not exist. Every resupply is by air or maritime vessel. Sortie management is the entire game. Economy of force is mandatory — you cannot be everywhere.',
  mission: 'Sustain joint forces across six island positions for 35 days using air and maritime distribution exclusively. Sortie capacity is the binding constraint. Every sortie must count.',
  commandersIntent: 'There are no ground routes here. Air is not a supplement — it is the supply chain. Economy of force is not a choice, it is math. Some positions will be underserved. Pick the right ones.',
  enemyForces: 'Air defense systems on multiple islands limiting sortie routes. Maritime interdiction by enemy fast attack craft on secondary sea lanes.',
  friendlyForces: 'One Marine regiment, two Army battalions, Joint Maritime Pre-positioned Force. Air assets limited to two heavy-lift and four tactical aircraft sorties per day.',
  serviceSupportNote: 'Starting sigma: 2.1σ — highest starting point, but hardest operational environment. No ground routes means every LOC decision is an air or maritime decision.',

  startingSigma: 2.1,
  startingStonewallRate: 9.0,
  startingRCT: 32,
  enemyActivityLevel: 0.60,

  nodes: [
    { id:'PORT',        name:'Guam — Apra Harbor',    shortName:'GUM',   type:'PORT',        lat:13.4443, lng:144.6553, status:'ACTIVE' },
    { id:'AERIAL_PORT', name:'Andersen AFB',           shortName:'UAM',   type:'AERIAL_PORT', lat:13.5840, lng:144.9299, status:'ACTIVE' },
    { id:'FOB1',        name:'Tinian Position',       shortName:'TIN',   type:'FOB',         lat:15.0000, lng:145.6167, status:'ACTIVE' },
    { id:'FOB2',        name:'Palau Position',        shortName:'PLU',   type:'FOB',         lat:7.5149,  lng:134.5825, status:'ACTIVE' },
    { id:'FOB3',        name:'Yap Position',          shortName:'YAP',   type:'FOB',         lat:9.5167,  lng:138.1333, status:'ACTIVE' },
    { id:'FOB4',        name:'Chuuk Position',        shortName:'CHK',   type:'FOB',         lat:7.4167,  lng:151.7833, status:'ACTIVE' },
    { id:'DEPOT_A',     name:'Saipan Depot',          shortName:'SPN',   type:'DEPOT',       lat:15.1772, lng:145.7232, status:'ACTIVE' },
  ],

  locs: [
    { id:'LOC_AIR_GUM_TIN',  fromNodeId:'AERIAL_PORT', toNodeId:'FOB1',    type:'AIR', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_AIR_GUM_PLU',  fromNodeId:'AERIAL_PORT', toNodeId:'FOB2',    type:'AIR', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_AIR_GUM_YAP',  fromNodeId:'AERIAL_PORT', toNodeId:'FOB3',    type:'AIR', status:'ACTIVE',      threatLevel:'HIGH'   },
    { id:'LOC_AIR_GUM_CHK',  fromNodeId:'AERIAL_PORT', toNodeId:'FOB4',    type:'AIR', status:'ACTIVE',      threatLevel:'MEDIUM' },
    { id:'LOC_SEA_GUM_SPN',  fromNodeId:'PORT',        toNodeId:'DEPOT_A', type:'AIR', status:'ACTIVE',      threatLevel:'LOW'    },
    { id:'LOC_AIR_SPN_FOB1', fromNodeId:'DEPOT_A',     toNodeId:'FOB1',    type:'AIR', status:'INTERDICTED', threatLevel:'HIGH'   },
  ],

  openingDialog: [
    { character:'S4',    text:'Sir, I want to be direct about what we are working with. Two heavy-lift and four tactical sorties per day. Six island positions. The math does not support full supply to all six.' },
    { character:'INTEL', text:'Enemy has air defense on three of the six island approaches. Routes to Yap and Chuuk are contested. Flying direct is possible but we will lose aircraft.' },
    { character:'SGM',   text:'Economy of force, Colonel. Some of these positions are going to be on reduced supply. They know that going in. The question is which ones and for how long.' },
    { character:'SPO',   text:'Marines at Tinian are main effort. Everything else is supporting. Two sorties a day to Tinian, one each to Palau and Saipan depot. Yap and Chuuk get resupply every three days.' },
    { character:'CDR',   text:'That will put Yap and Chuuk in amber by Day 5. Can they hold at amber for three days?' },
    { character:'SGM',   text:'If we brief them right and they know resupply is coming. The unit that stonewalls is the one nobody told the plan to.' },
  ],

  thumbnailDesc: 'No ground routes. Six island positions. Four sorties per day. This is pure economy of force — pick who gets supplied and accept the consequences for everyone else.',
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────

export const ALL_SCENARIOS: MissionScenario[] = [
  SCENARIO_1, SCENARIO_2, SCENARIO_3,
  SCENARIO_4, SCENARIO_5, SCENARIO_6,
]

export const SCENARIOS_BY_THEATER: Record<TheaterRegion, MissionScenario[]> = {
  EUROPE:      [SCENARIO_1, SCENARIO_2],
  MIDDLE_EAST: [SCENARIO_3, SCENARIO_4],
  PACIFIC:     [SCENARIO_5, SCENARIO_6],
}
