// LOG ACTUAL — Commander System
// KibuglogalVentures LLC

export type CommanderSide = 'FRIENDLY' | 'ENEMY'
export type CommanderRank = string

export interface Commander {
  id: string
  side: CommanderSide
  name: string
  rank: string
  role: string
  color: string         // UI accent color
  portraitStyle: 'CDR' | 'SGM' | 'S4' | 'ENEMY_GEN' | 'ENEMY_COL'
}

export interface CommanderEvent {
  id: string
  commanderId: string
  type: 'ATTACK' | 'PUSH' | 'REQUEST' | 'WARNING' | 'REPORT'
  title: string
  lines: string[]
  actionLabel?: string
  dismissLabel?: string
  // Real effects on game state
  effects: CommanderEffect[]
  // Map marker to place
  mapMarker?: {
    lat: number; lng: number
    radius: number           // meters
    label: string
    type: 'ENEMY_AO' | 'FRIENDLY_PUSH' | 'CONVOY_AMBUSH' | 'STRIKE'
  }
  priority: 'ROUTINE' | 'PRIORITY' | 'FLASH'
  autoTriggerDay?: number    // fires on specific day
  triggerCondition?: 'STONEWALL' | 'LOW_SIGMA' | 'RANDOM' | 'DAY_BASED'
}

export interface CommanderEffect {
  type: 'SUPPLY_DELTA' | 'READINESS_DELTA' | 'LOC_INTERDICT' | 'SURGE_CONSUMPTION' | 'SIGMA_DELTA'
  target: string
  supplyClass?: number
  magnitude: number
  durationDays?: number
}

// ── COMMANDER ROSTER ─────────────────────────────────────────────────────────

export const COMMANDERS: Commander[] = [
  // FRIENDLY
  {
    id:'LTG_HAYES', side:'FRIENDLY', name:'LTG HAYES',
    rank:'Lieutenant General', role:'Combatant Commander — USAREUR',
    color:'#00ff88', portraitStyle:'CDR',
  },
  {
    id:'MG_CHEN', side:'FRIENDLY', name:'MG CHEN',
    rank:'Major General', role:'III Corps Commander',
    color:'#00cc77', portraitStyle:'CDR',
  },
  {
    id:'BG_WALSH', side:'FRIENDLY', name:'BG WALSH',
    rank:'Brigadier General', role:'Aviation Brigade Commander',
    color:'#00aaff', portraitStyle:'S4',
  },
  {
    id:'COL_TORRES', side:'FRIENDLY', name:'COL TORRES',
    rank:'Colonel', role:'Forward Operating Base Commander',
    color:'#ffaa00', portraitStyle:'SGM',
  },
  {
    id:'COL_BANKS', side:'FRIENDLY', name:'COL BANKS',
    rank:'Colonel', role:'Forward Operating Base Commander',
    color:'#f39c12', portraitStyle:'SGM',
  },
  // ENEMY
  {
    id:'GEN_VOLKOV', side:'ENEMY', name:'GEN VOLKOV',
    rank:'General', role:'OPFOR Theater Commander',
    color:'#ff4444', portraitStyle:'ENEMY_GEN',
  },
  {
    id:'COL_PETROV', side:'ENEMY', name:'COL PETROV',
    rank:'Colonel', role:'OPFOR Interdiction Commander',
    color:'#ff6600', portraitStyle:'ENEMY_COL',
  },
  {
    id:'MAJ_SOKOV', side:'ENEMY', name:'MAJ SOKOV',
    rank:'Major', role:'OPFOR Special Operations',
    color:'#ff2200', portraitStyle:'ENEMY_COL',
  },
]

export const CDR_MAP: Record<string, Commander> = {}
COMMANDERS.forEach(c => { CDR_MAP[c.id] = c })

// ── COMMANDER EVENT TEMPLATES ─────────────────────────────────────────────────

export const COMMANDER_EVENTS: CommanderEvent[] = [
  // Day 1 events — fire immediately from the start
  {
    id:'CEV_VOLKOV_DAY1',
    commanderId:'GEN_VOLKOV',
    type:'WARNING',
    title:'OPFOR THEATER ASSESSMENT',
    lines:[
      'Commander. We have been watching your logistics pipeline since before you arrived.',
      'Your distribution network is already compromised. We know your routes.',
      'The only question is when we choose to cut them.',
    ],
    effects:[],
    priority:'IMMEDIATE',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:1,
  },
  {
    id:'CEV_PETROV_REACT',
    commanderId:'COL_PETROV',
    type:'ATTACK',
    title:'OPFOR INTERCEPTS RESUPPLY',
    lines:[
      'Your convoy movement has been identified.',
      'We have ambush elements pre-positioned on that route.',
      'Every vehicle you send is a vehicle we destroy.',
    ],
    effects:[
      { type:'RCT_INCREASE', target:'THEATER', magnitude:12 },
    ],
    mapMarker:{ lat:52.1, lng:20.2, radius:18000, label:'AMBUSH ZONE — RESUPPLY ROUTE', type:'CONVOY_AMBUSH' },
    priority:'FLASH',
    triggerCondition:'RANDOM',
  },
  {
    id:'CEV_HAYES_DAY2',
    commanderId:'LTG_HAYES',
    type:'WARNING',
    title:'THEATER COMMANDER — OPENING GUIDANCE',
    lines:[
      'You have inherited a theater under stress.',
      'FOB Iron is already critical. Everything else is trending the wrong direction.',
      'I need distribution stabilized before the enemy makes their first real push.',
      'You have days, not weeks. Get to work.',
    ],
    effects:[],
    priority:'IMMEDIATE',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:2,
  },


  // ── ENEMY ATTACKS ──────────────────────────────────────────────────────────

  {
    id:'CEV_VOLKOV_SURGE',
    commanderId:'GEN_VOLKOV',
    type:'ATTACK',
    title:'ENEMY OPERATIONAL SURGE',
    lines:[
      'Your supply lines are exposed, Commander.',
      'We have identified your primary distribution routes.',
      'Our forces will cut every line of communication to your forward units.',
      'They will starve. Then they will stop fighting.',
    ],
    actionLabel:'ACKNOWLEDGE THREAT',
    dismissLabel:'DISMISS',
    effects:[
      { type:'LOC_INTERDICT', target:'LOC_ASP_FOB2', magnitude:100, durationDays:2 },
      { type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.3 },
    ],
    mapMarker:{
      lat:51.9, lng:16.8, radius:45000,
      label:'OPFOR SURGE ZONE', type:'ENEMY_AO',
    },
    priority:'FLASH',
    triggerCondition:'RANDOM',
  },

  {
    id:'CEV_PETROV_AMBUSH',
    commanderId:'COL_PETROV',
    type:'ATTACK',
    title:'CONVOY AMBUSH — MSR IRON',
    lines:[
      'Ambush elements are in position on MSR Iron.',
      'Your convoy schedule is predictable. We have been watching for six days.',
      'The next ground movement on this route will be destroyed.',
    ],
    actionLabel:'REROUTE CONVOYS',
    dismissLabel:'MAINTAIN ROUTE',
    effects:[
      { type:'SUPPLY_DELTA', target:'FOB1', supplyClass:2, magnitude:-30 },
      { type:'READINESS_DELTA', target:'FOB1', magnitude:-15 },
    ],
    mapMarker:{
      lat:51.5, lng:17.8, radius:18000,
      label:'AMBUSH — CONVOY ROUTE', type:'CONVOY_AMBUSH',
    },
    priority:'FLASH',
    triggerCondition:'RANDOM',
  },

  {
    id:'CEV_PETROV_BRIDGE',
    commanderId:'COL_PETROV',
    type:'ATTACK',
    title:'BRIDGE DEMOLITION — MSR BLUE',
    lines:[
      'Engineers are in place at Bridge November.',
      'In three hours, your eastern LOC will be closed.',
      'Route your supply through air — if you have the sorties.',
    ],
    actionLabel:'PRE-POSITION AIR ASSETS',
    dismissLabel:'ACCEPT RISK',
    effects:[
      { type:'LOC_INTERDICT', target:'LOC_DEPOTB_FOB1', magnitude:100, durationDays:3 },
      { type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.25 },
    ],
    mapMarker:{
      lat:52.0, lng:19.2, radius:12000,
      label:'BRIDGE DEMO — MSR BLUE', type:'STRIKE',
    },
    priority:'FLASH',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:3,
  },

  {
    id:'CEV_SOKOV_FARP',
    commanderId:'MAJ_SOKOV',
    type:'ATTACK',
    title:'FARP STRIKE — COVERT OPERATION',
    lines:[
      'FARP Whiskey has been compromised.',
      'Our reconnaissance has your aviation fuel point targeted.',
      'Strike teams are within range. Your air bridge ends tonight.',
    ],
    actionLabel:'HARDEN FARP SECURITY',
    dismissLabel:'ACCEPT RISK',
    effects:[
      { type:'READINESS_DELTA', target:'AVN_BDE', magnitude:-28 },
      { type:'SUPPLY_DELTA', target:'AVN_BDE', supplyClass:2, magnitude:-40 },
    ],
    mapMarker:{
      lat:53.6, lng:20.2, radius:15000,
      label:'FARP STRIKE ZONE', type:'STRIKE',
    },
    priority:'FLASH',
    triggerCondition:'RANDOM',
  },

  {
    id:'CEV_PETROV_DEPOT',
    commanderId:'COL_PETROV',
    type:'ATTACK',
    title:'DEPOT STRIKE — INDIRECT FIRE',
    lines:[
      'Depot Alpha coordinates have been confirmed by our fire support assets.',
      'Artillery is being tasked now.',
      'Your stockpile will be reduced. Significantly.',
    ],
    actionLabel:'DISPERSE STOCKS IMMEDIATELY',
    dismissLabel:'DEFEND IN PLACE',
    effects:[
      { type:'SUPPLY_DELTA', target:'DEP_A', supplyClass:4, magnitude:-45 },
      { type:'SUPPLY_DELTA', target:'DEP_A', supplyClass:2, magnitude:-30 },
      { type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.4 },
    ],
    mapMarker:{
      lat:49.44, lng:7.77, radius:20000,
      label:'DEPOT STRIKE ZONE', type:'ENEMY_AO',
    },
    priority:'FLASH',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:6,
  },

  {
    id:'CEV_VOLKOV_PUSH',
    commanderId:'GEN_VOLKOV',
    type:'PUSH',
    title:'ENEMY OFFENSIVE PUSH',
    lines:[
      'Our main effort begins in six hours.',
      'Your forward units will face three times their normal contact.',
      'Can your supply chain sustain a sustained fight? We have calculated it cannot.',
      'We will see.',
    ],
    actionLabel:'SURGE DISTRIBUTION NOW',
    dismissLabel:'HOLD CURRENT POSTURE',
    effects:[
      { type:'SURGE_CONSUMPTION', target:'FOB1', magnitude:200, durationDays:3 },
      { type:'SURGE_CONSUMPTION', target:'FOB2', magnitude:150, durationDays:3 },
    ],
    mapMarker:{
      lat:52.5, lng:21.5, radius:60000,
      label:'ENEMY MAIN EFFORT AO', type:'ENEMY_AO',
    },
    priority:'FLASH',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:9,
  },

  // ── FRIENDLY REQUESTS ──────────────────────────────────────────────────────

  {
    id:'CEV_HAYES_DIRECTIVE',
    commanderId:'LTG_HAYES',
    type:'WARNING',
    title:'THEATER COMMANDER DIRECTIVE',
    lines:[
      'Your sigma level is unacceptable.',
      'I need this theater operating above two-point-five by end of week.',
      'Fix your distribution posture. Push supply forward. Stop waiting for requests.',
      'That is not a suggestion.',
    ],
    actionLabel:'ACKNOWLEDGED',
    effects:[],
    priority:'PRIORITY',
    triggerCondition:'LOW_SIGMA',
  },

  {
    id:'CEV_CHEN_REQUEST',
    commanderId:'MG_CHEN',
    type:'REQUEST',
    title:'III CORPS — EMERGENCY RESUPPLY',
    lines:[
      'Commander, my Class V is at thirty-one percent.',
      'We are forty-eight hours from stonewall.',
      'I need a convoy on Route Iron or an air sortie — your call.',
      'But I need it today.',
    ],
    actionLabel:'DISPATCH RESUPPLY',
    dismissLabel:'HOLD — AWAIT QUEUE',
    effects:[
      { type:'SURGE_CONSUMPTION', target:'III_CORPS', magnitude:120, durationDays:2 },
    ],
    priority:'IMMEDIATE',
    triggerCondition:'STONEWALL',
  },

  {
    id:'CEV_WALSH_SORTIE',
    commanderId:'BG_WALSH',
    type:'REQUEST',
    title:'AVIATION — SORTIE REQUEST',
    lines:[
      'Sir, I have one sortie available and two units in critical status.',
      'The forward element reports Class III at nineteen percent. Second unit Class V at twenty-two.',
      'I cannot serve both. I need a priority designation from you.',
      'Who gets the sortie?',
    ],
    actionLabel:'FOB IRON PRIORITY',
    dismissLabel:'FOB VALOR PRIORITY',
    effects:[],
    priority:'IMMEDIATE',
    triggerCondition:'RANDOM',
  },

  {
    id:'CEV_TORRES_STONEWALL',
    commanderId:'COL_TORRES',
    type:'REQUEST',
    title:'FOB IRON — STONEWALL IMMINENT',
    lines:[
      'Commander, we are eight hours from stonewall.',
      'Class III at twelve percent. The route is interdicted.',
      'My soldiers are sitting in vehicles with no fuel.',
      'I need air. Now.',
    ],
    actionLabel:'TASK AIR SORTIE',
    dismissLabel:'GROUND CONVOY ONLY',
    effects:[
      { type:'READINESS_DELTA', target:'FOB1', magnitude:-10 },
    ],
    mapMarker:{
      lat:52.1, lng:20.5, radius:8000,
      label:'FOB IRON — CRITICAL', type:'FRIENDLY_PUSH',
    },
    priority:'FLASH',
    triggerCondition:'STONEWALL',
  },

  {
    id:'CEV_CHEN_OFFENSIVE',
    commanderId:'MG_CHEN',
    type:'PUSH',
    title:'III CORPS — OFFENSIVE PUSH TASKED',
    lines:[
      'Commander, I have orders to push on the eastern axis at 0600.',
      'This will triple my Class V consumption for seventy-two hours.',
      'I need the supply pre-positioned before we step off.',
      'You have six hours.',
    ],
    actionLabel:'PRE-POSITION NOW',
    dismissLabel:'PUSH SUPPLY EN ROUTE',
    effects:[
      { type:'SURGE_CONSUMPTION', target:'III_CORPS', magnitude:300, durationDays:3 },
    ],
    mapMarker:{
      lat:52.8, lng:22.5, radius:35000,
      label:'III CORPS AXIS OF ADVANCE', type:'FRIENDLY_PUSH',
    },
    priority:'IMMEDIATE',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:12,
  },

  {
    id:'CEV_HAYES_ENDEX',
    commanderId:'LTG_HAYES',
    type:'REPORT',
    title:'THEATER COMMANDER — ASSESSMENT',
    lines:[
      'You have kept this theater running under sustained pressure.',
      'Every stonewall event, every RCT violation — those are the costs.',
      'We do not count those as failures. We count them as the price of the fight.',
      'The question now is whether you can hold through the culmination.',
    ],
    actionLabel:'CONTINUE OPERATIONS',
    effects:[],
    priority:'ROUTINE',
    triggerCondition:'DAY_BASED',
    autoTriggerDay:18,
  },
]

// ── EXTENDED EVENT LIBRARY ──────────────────────────────────────────────────────
// More events added for richer campaign narrative

const EXTENDED_EVENTS: CommanderEvent[] = [
  { id:'CEV_PETROV_CONVOY_WATCH', commanderId:'COL_PETROV', type:'WARNING',
    title:'OPFOR MONITORS YOUR MOVEMENTS',
    lines:['We have aerial observation on three of your supply routes.','Every convoy you send is logged. Time, direction, load, escort.','We are building a pattern. When we have enough data, we act.','You have perhaps three more uncontested deliveries. Use them wisely.'],
    effects:[], priority:'IMMEDIATE', triggerCondition:'RANDOM' },
  { id:'CEV_SOKOV_INFILTRATION', commanderId:'MAJ_SOKOV', type:'ATTACK',
    title:'OPFOR SPECIAL OPS — INSIDER THREAT',
    lines:['Your fuel storage at the forward area has been accessed.','Not destroyed. Accessed. We needed to know the contents.','We now know exactly how many days you have before your aviation elements ground.','We have planned around that number.'],
    effects:[{ type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.3 }],
    priority:'FLASH', triggerCondition:'RANDOM' },
  { id:'CEV_VOLKOV_MATH', commanderId:'GEN_VOLKOV', type:'WARNING',
    title:'OPFOR OPERATIONAL ASSESSMENT',
    lines:['Commander. Let me give you the mathematics.','At current consumption rates your forward units have between four and seven days.','At current resupply rates — assuming we do not interdict — you extend that to ten.','We will interdict. The numbers do not work in your favor.'],
    effects:[], priority:'IMMEDIATE', triggerCondition:'RANDOM' },
  { id:'CEV_TORRES_MORALE', commanderId:'COL_TORRES', type:'REQUEST',
    title:'FORWARD COMMANDER — MORALE CRITICAL',
    lines:['Commander. My soldiers have been eating cold rations for four days.','Class I is at thirty-eight percent. We are rationing.','They will fight. But they need to know someone is thinking about them.','A convoy — even a small one — would matter more than you know.'],
    effects:[{ type:'STRENGTH_DELTA', target:'FOB1', magnitude:-5 }],
    priority:'PRIORITY', triggerCondition:'RANDOM' },
  { id:'CEV_WALSH_GROUND', commanderId:'BG_WALSH', type:'REQUEST',
    title:'AVIATION GROUNDED — FUEL EXHAUSTED',
    lines:['Commander, we are down.','Last sortie landed twenty minutes ago. FARP Whiskey is dry.','Until you get me fuel, I cannot move a single aircraft.','Every unit depending on air resupply is now waiting on you.'],
    effects:[{ type:'READINESS_DELTA', target:'AVN_BDE', magnitude:-15 }],
    priority:'FLASH', triggerCondition:'STONEWALL' },
  { id:'CEV_CHEN_DESPERATE', commanderId:'MG_CHEN', type:'REQUEST',
    title:'III CORPS — COMBAT POWER COLLAPSING',
    lines:['I have been writing reports all week. Nobody is reading them.','Class III at eleven percent. Class V at eight.','My brigade commanders are calling me every hour asking when resupply arrives.','I have nothing to tell them. Tell me something I can give them.'],
    effects:[{ type:'SURGE_CONSUMPTION', target:'III_CORPS', magnitude:100, durationDays:1 }],
    priority:'FLASH', triggerCondition:'STONEWALL' },
  { id:'CEV_PETROV_BRIDGE2', commanderId:'COL_PETROV', type:'ATTACK',
    title:'BRIDGE NETWORK — SYSTEMATIC DEMOLITION',
    lines:['Your engineers have been busy rebuilding.','We have been busier tearing down.','Two more bridges are targeted tonight.','Plan for ground routes that do not use crossing points. There will be none left.'],
    effects:[{ type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.4 }, { type:'RCT_INCREASE', target:'THEATER', magnitude:18 }],
    mapMarker:{ lat:52.3, lng:21.5, radius:20000, label:'BRIDGE DEMOLITION ZONE', type:'STRIKE' },
    priority:'FLASH', triggerCondition:'DAY_BASED', autoTriggerDay:11 },
  { id:'CEV_SOKOV_DEPOT2', commanderId:'MAJ_SOKOV', type:'ATTACK',
    title:'DEPOT — SABOTAGE OPERATION',
    lines:['Your depot dispersal was well executed.','We found the alternate storage point anyway.','A small charge. Placed precisely. Your Class V reserve is gone.','You will not find the team that placed it.'],
    effects:[{ type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.35 }],
    priority:'FLASH', triggerCondition:'DAY_BASED', autoTriggerDay:13 },
  { id:'CEV_VOLKOV_RESPECT', commanderId:'GEN_VOLKOV', type:'WARNING',
    title:'OPFOR COMMANDER — GRUDGING ASSESSMENT',
    lines:['You are still here.','I expected the theater to collapse by now.','You have some capability. It does not change the outcome.','But I wanted you to know — we noticed.'],
    effects:[], priority:'ROUTINE', triggerCondition:'DAY_BASED', autoTriggerDay:15 },
  { id:'CEV_HAYES_THREAT2', commanderId:'LTG_HAYES', type:'WARNING',
    title:'THEATER COMMANDER — ULTIMATUM',
    lines:['I am going to be direct with you.','The theater sustainment picture is catastrophic.','You have twenty-four hours to show measurable improvement in sigma.','If I do not see it, I will relieve you and find someone who can do this job.'],
    effects:[], priority:'FLASH', triggerCondition:'LOW_SIGMA' },
  { id:'CEV_TORRES_FINAL2', commanderId:'COL_TORRES', type:'REQUEST',
    title:'FORWARD UNIT — FINAL STATUS REPORT',
    lines:['Commander. This is my final status report before we go dark.','Class III zero. Class V zero. Class VIII twelve percent.','We cannot move. We cannot fight. We are holding position and waiting.','If supply does not arrive in the next twelve hours, we are combat ineffective.'],
    effects:[], priority:'FLASH', triggerCondition:'STONEWALL' },
  { id:'CEV_VOLKOV_CONTEMPT', commanderId:'GEN_VOLKOV', type:'WARNING',
    title:'OPFOR COMMANDER — CONTEMPT',
    lines:['We have been watching you not make decisions.','Your units are starving and you are not moving supply.','Either you do not understand what is happening, or you have given up.','Neither is acceptable for the commander of a theater.'],
    effects:[{ type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.25 }],
    priority:'IMMEDIATE', triggerCondition:'RANDOM' },
  { id:'CEV_PETROV_PATTERN', commanderId:'COL_PETROV', type:'ATTACK',
    title:'OPFOR — EXPLOITING YOUR PATTERN',
    lines:['You use the same route at the same time every day.','We have been letting the first convoy through to lull you.','Tonight we take the second one.','Change your pattern. Or do not. The result serves us either way.'],
    effects:[{ type:'RCT_INCREASE', target:'THEATER', magnitude:10 }],
    priority:'IMMEDIATE', triggerCondition:'RANDOM' },
  { id:'CEV_CHEN_WIN', commanderId:'MG_CHEN', type:'REPORT',
    title:'III CORPS — OPERATIONAL SUCCESS',
    lines:['Commander. We executed the push.','Your resupply made it possible. The right flank is now ours.','I need sustained support to hold what we have taken.','The logistics made this happen. That was your decision. Good call.'],
    effects:[{ type:'SIGMA_DELTA', target:'THEATER', magnitude:0.3 }],
    priority:'PRIORITY', triggerCondition:'RANDOM' },
  { id:'CEV_WALSH_SORTIE2', commanderId:'BG_WALSH', type:'REPORT',
    title:'AVIATION — SORTIE COMPLETE',
    lines:['Commander, sortie completed. Class III and Class V delivered forward.','Unit acknowledged receipt. Readiness recovering.','Birds are back at FARP. Request two more sorties tomorrow.','We can hold this together if you keep the FARP supplied.'],
    effects:[], priority:'ROUTINE', triggerCondition:'RANDOM' },
  { id:'CEV_PETROV_ENDGAME2', commanderId:'COL_PETROV', type:'ATTACK',
    title:'OPFOR — FINAL INTERDICTION PHASE',
    lines:['We are entering the final phase.','Every LOC you have is now targeted simultaneously.','Your air corridor is closed. Your ground routes are ambushed.','You have no clean path to any forward unit. How do you sustain a fight with no supply?'],
    effects:[{ type:'SIGMA_DELTA', target:'THEATER', magnitude:-0.6 }, { type:'RCT_INCREASE', target:'THEATER', magnitude:24 }],
    mapMarker:{ lat:52.0, lng:22.0, radius:80000, label:'OPFOR FINAL PHASE', type:'ENEMY_AO' },
    priority:'FLASH', triggerCondition:'DAY_BASED', autoTriggerDay:18 },
]

// Merge with base events
COMMANDER_EVENTS.push(...EXTENDED_EVENTS)

// ── RANDOM EVENT SELECTOR ─────────────────────────────────────────────────────

export function selectCommanderEvent(
  currentDay: number,
  sigma: number,
  stonewallRate: number,
  firedIds: string[],
): CommanderEvent | null {

  // Day-based events — fire on or after their trigger day (not just exact day)
  const dayBased = COMMANDER_EVENTS.find(e =>
    e.triggerCondition === 'DAY_BASED' &&
    e.autoTriggerDay !== undefined &&
    currentDay >= e.autoTriggerDay &&
    currentDay <= e.autoTriggerDay + 2 &&  // window of 2 days
    !firedIds.includes(e.id)
  )
  if (dayBased) return dayBased

  // Stonewall events fire aggressively
  if (stonewallRate > 0) {  // ANY stonewall triggers friendly requests
    const stonewallEv = COMMANDER_EVENTS.find(e =>
      e.triggerCondition === 'STONEWALL' && !firedIds.includes(e.id)
    )
    if (stonewallEv && Math.random() < (stonewallRate > 10 ? 0.9 : 0.65)) return stonewallEv
  }

  if (sigma < 2.5) {  // Lower threshold — LTG Hayes fires earlier
    const sigmaEv = COMMANDER_EVENTS.find(e =>
      e.triggerCondition === 'LOW_SIGMA' && !firedIds.includes(e.id)
    )
    if (sigmaEv && Math.random() < 0.65) return sigmaEv
  }

  // Enemy random events — fire from Day 1, scale up
  const enemyRandom = COMMANDER_EVENTS.filter(e =>
    e.triggerCondition === 'RANDOM' &&
    !firedIds.includes(e.id) &&
    e.commanderId.includes('VOLKOV') || e.commanderId.includes('PETROV') || e.commanderId.includes('SOKOV')
  )
  if (enemyRandom.length > 0 && Math.random() < 0.4 + currentDay * 0.02) {
    return enemyRandom[Math.floor(Math.random() * enemyRandom.length)]
  }

  // Friendly random events
  const friendlyRandom = COMMANDER_EVENTS.filter(e =>
    e.triggerCondition === 'RANDOM' && !firedIds.includes(e.id)
  )
  if (friendlyRandom.length > 0 && Math.random() < 0.3 + currentDay * 0.015) {
    return friendlyRandom[Math.floor(Math.random() * friendlyRandom.length)]
  }

  return null
}
