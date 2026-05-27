/**
 * LOG ACTUAL — Event Response Generator
 * KibuglogalVentures LLC
 *
 * Generates 2-4 contextual response options for battlefield events.
 * The "right" answer depends on current game state — not a fixed doctrine answer.
 * Sometimes all options are bad. Sometimes the obvious choice costs you later.
 */

import { Unit } from '../types/game'

export interface ResponseOption {
  id: string
  label: string
  description: string
  consequence: string
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  cost: string
  effects: ResponseEffect[]
  isDoctrineCorrect?: boolean  // hidden from player — used for scoring
}

export interface ResponseEffect {
  type: 'SUPPLY_ADD' | 'SUPPLY_DROP' | 'READINESS_DELTA' | 'STRENGTH_DELTA'
       | 'LOC_RESTORE' | 'SORTIE_COST' | 'RCT_DELTA' | 'STRENGTH_COST'
  target: string
  supplyClass?: number
  magnitude: number
}

// ── CONTEXT READER ────────────────────────────────────────────────────────────

interface GameContext {
  units: Record<string, Unit>
  sortiesAvailable: number
  interdictedLOCs: string[]
  currentDay: number
  sigma: number
  stonewallRate: number
}

function getUnitByTargetId(units: Record<string,Unit>, targetId: string): Unit | null {
  return Object.values(units).find(u => u.id === targetId) ?? null
}

function unitSupplyLevel(u: Unit | null, cls: number): number {
  if (!u) return 50
  const keys = ['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX'] as const
  return u.supplyLevels[keys[cls]] ?? 50
}

function findDonorUnit(units: Record<string,Unit>, excludeId: string, supplyClass: number): Unit | null {
  const keys = ['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX'] as const
  return Object.values(units)
    .filter(u => u.id !== excludeId && u.status !== 'DARK')
    .sort((a,b) => (b.supplyLevels[keys[supplyClass]]??0) - (a.supplyLevels[keys[supplyClass]]??0))[0] ?? null
}

// ── RESPONSE GENERATORS BY EVENT TYPE ─────────────────────────────────────────

export function generateFuelFireOptions(targetUnitId: string, ctx: GameContext): ResponseOption[] {
  const unit = getUnitByTargetId(ctx.units, targetUnitId)
  const currentCL3 = unitSupplyLevel(unit, 2)
  const donor = findDonorUnit(ctx.units, targetUnitId, 2)
  const donorLevel = donor ? unitSupplyLevel(donor, 2) : 0

  const options: ResponseOption[] = [
    {
      id:'A', label:'AIR RESUPPLY — IMMEDIATE',
      description: `Task available sortie for emergency Class III delivery to ${unit?.name ?? 'unit'}. Aircraft en route within 2 hours.`,
      consequence: ctx.sortiesAvailable > 0
        ? 'Class III restored +35%. Sortie expended — unavailable for next 24 hours.'
        : 'No sortie available. Order placed but delivery delayed 18+ hours. Unit may stonewall before arrival.',
      risk: ctx.sortiesAvailable > 0 ? 'LOW' : 'CRITICAL',
      cost: ctx.sortiesAvailable > 0 ? '1 air sortie' : 'No sorties available — HIGH RISK',
      isDoctrineCorrect: ctx.sortiesAvailable > 0,
      effects: ctx.sortiesAvailable > 0
        ? [{ type:'SUPPLY_ADD', target:targetUnitId, supplyClass:2, magnitude:35 },
           { type:'SORTIE_COST', target:'THEATER', magnitude:1 }]
        : [{ type:'SUPPLY_ADD', target:targetUnitId, supplyClass:2, magnitude:12 }],
    },
    {
      id:'B', label:'EMERGENCY GROUND CONVOY',
      description: `Dispatch ground convoy on alternate route. ETA 8-12 hours. Route assessed ${ctx.interdictedLOCs.length > 1 ? 'HIGH THREAT' : 'MEDIUM THREAT'}.`,
      consequence: `Class III +22% on arrival. ${ctx.interdictedLOCs.length > 1 ? 'High risk of interdiction — 45% chance convoy is hit.' : 'Moderate route risk. Unit will continue degrading for 8-12 hours.'}`,
      risk: ctx.interdictedLOCs.length > 1 ? 'HIGH' : 'MEDIUM',
      cost: 'Convoy assets + 8-12 hour delay',
      isDoctrineCorrect: ctx.sortiesAvailable === 0,
      effects: [{ type:'SUPPLY_ADD', target:targetUnitId, supplyClass:2, magnitude:22 }],
    },
    {
      id:'C', label:'LATERAL TRANSFER',
      description: donor
        ? `Transfer Class III from ${donor.name} (currently ${Math.round(donorLevel)}%). Takes 4-6 hours.`
        : 'No suitable donor unit identified with surplus Class III.',
      consequence: donor
        ? donorLevel < 50
          ? `RISK: Depleting ${donor.name} from ${Math.round(donorLevel)}% may push them below threshold. Both units could end up critical.`
          : `${unit?.name ?? 'Unit'} recovers +20%. ${donor.name} loses 20% Class III.`
        : 'No lateral transfer option available.',
      risk: donor ? (donorLevel < 50 ? 'HIGH' : 'MEDIUM') : 'CRITICAL',
      cost: donor ? `${donor.name} Class III -20%` : 'Not available',
      isDoctrineCorrect: !!(donor && donorLevel > 60),
      effects: donor
        ? [{ type:'SUPPLY_ADD', target:targetUnitId, supplyClass:2, magnitude:20 },
           { type:'SUPPLY_DROP', target:donor.id, supplyClass:2, magnitude:20 }]
        : [],
    },
    {
      id:'D', label:'ACCEPT DEGRADATION',
      description: `Hold current posture. Unit continues operations at reduced Class III. Monitor and add to next convoy cycle.`,
      consequence: `Unit readiness continues to degrade. Current Class III: ${Math.round(currentCL3)}%. At current consumption rate, stonewall in ${currentCL3 > 0 ? Math.floor(currentCL3 / 6) : 0} days.`,
      risk: currentCL3 < 25 ? 'CRITICAL' : currentCL3 < 40 ? 'HIGH' : 'MEDIUM',
      cost: 'Continued readiness degradation',
      isDoctrineCorrect: false,
      effects: [],
    },
  ]

  return options.filter(o => o.effects.length > 0 || o.id === 'D')
}

export function generateAmbushOptions(locId: string, targetUnitId: string, ctx: GameContext): ResponseOption[] {
  const unit = getUnitByTargetId(ctx.units, targetUnitId)
  const donor = findDonorUnit(ctx.units, targetUnitId, 4)  // Class V

  return [
    {
      id:'A', label:'REROUTE — ALTERNATE CORRIDOR',
      description: 'Redirect all convoys to Route Delta. Adds 6 hours transit time. Route assessed clear.',
      consequence: 'Convoys resume safely. RCT increases by 6 hours for this route. Enemy will likely identify alternate within 2-3 days.',
      risk: 'LOW',
      cost: '+6 hours per convoy cycle',
      isDoctrineCorrect: true,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:6 }],
    },
    {
      id:'B', label:'PUSH THROUGH WITH ESCORT',
      description: 'Dispatch convoy with combat escort on existing route. 35% ambush risk. Gets there in 2 hours if successful.',
      consequence: 'If successful: supply delivered in 2 hours. If ambushed: cargo AND escort assets lost. High risk.',
      risk: 'HIGH',
      cost: 'Combat escort assets + 35% loss probability',
      isDoctrineCorrect: false,
      effects: Math.random() > 0.35
        ? [{ type:'SUPPLY_ADD', target:targetUnitId, supplyClass:4, magnitude:20 }]
        : [{ type:'STRENGTH_DELTA', target:targetUnitId, magnitude:-15 }],
    },
    {
      id:'C', label:'AIR RESUPPLY',
      description: ctx.sortiesAvailable > 0
        ? 'Task sortie for Class V delivery. Bypasses ground threat entirely.'
        : 'Sortie required — NONE AVAILABLE. Air request queued but no aircraft.',
      consequence: ctx.sortiesAvailable > 0
        ? 'Unit receives Class V within 1 hour. Ground threat bypassed. Sortie expended.'
        : 'No sorties. Request logged but unit continues to degrade.',
      risk: ctx.sortiesAvailable > 0 ? 'LOW' : 'CRITICAL',
      cost: ctx.sortiesAvailable > 0 ? '1 sortie' : 'No asset available',
      isDoctrineCorrect: ctx.sortiesAvailable > 0,
      effects: ctx.sortiesAvailable > 0
        ? [{ type:'SUPPLY_ADD', target:targetUnitId, supplyClass:4, magnitude:25 },
           { type:'SORTIE_COST', target:'THEATER', magnitude:1 }]
        : [],
    },
    {
      id:'D', label:'HOLD AND ASSESS',
      description: 'Suspend all convoys on this route pending threat assessment. 12-24 hour delay.',
      consequence: 'Route secured before next movement. RCT +12 hours. Unit continues to consume existing supply. Risk of stonewall if unit is already low.',
      risk: unit && unit.readiness < 40 ? 'HIGH' : 'MEDIUM',
      cost: 'RCT +12 hours, continued degradation',
      isDoctrineCorrect: unit ? unit.readiness > 50 : true,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:12 }],
    },
  ]
}

export function generateBridgeDemoOptions(locId: string, ctx: GameContext): ResponseOption[] {
  return [
    {
      id:'A', label:'ACTIVATE ALTERNATE ROUTE',
      description: 'Shift all traffic to Route Delta (+6 hrs) immediately. Brief all convoy commanders.',
      consequence: 'Distribution continues at reduced speed. RCT increases. Engineer repair on primary can begin.',
      risk: 'LOW',
      cost: '+6 hours per convoy cycle',
      isDoctrineCorrect: true,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:6 }],
    },
    {
      id:'B', label:'EMERGENCY BRIDGE REPAIR',
      description: 'Task combat engineer unit for emergency bridge repair. Estimated 48-72 hours.',
      consequence: 'LOC restored in 2-3 days. Engineers diverted from other tasks. Distribution gap until repair complete.',
      risk: 'MEDIUM',
      cost: 'Combat engineer resources, 48-72 hour LOC gap',
      isDoctrineCorrect: false,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:18 }],
    },
    {
      id:'C', label:'FULL AIR BRIDGE',
      description: 'Task all available sorties to cover the distribution gap. Maximum air effort.',
      consequence: ctx.sortiesAvailable >= 2
        ? 'All units covered by air. Expensive but effective. Sorties depleted rapidly.'
        : `Only ${ctx.sortiesAvailable} sortie available. Insufficient for full coverage. Priority units only.`,
      risk: ctx.sortiesAvailable >= 2 ? 'MEDIUM' : 'HIGH',
      cost: `${Math.min(ctx.sortiesAvailable, 3)} sorties per day until LOC restored`,
      isDoctrineCorrect: ctx.sortiesAvailable >= 2,
      effects: [{ type:'SORTIE_COST', target:'THEATER', magnitude:ctx.sortiesAvailable }],
    },
    {
      id:'D', label:'ACCEPT THE GAP',
      description: 'Acknowledge the LOC is closed. No immediate action. Pre-positioned supply will be consumed.',
      consequence: 'No immediate cost. Units degrade at normal consumption rate. Forward units stonewall when stocks run out.',
      risk: 'CRITICAL',
      cost: 'Forward units begin stonewall timeline immediately',
      isDoctrineCorrect: false,
      effects: [],
    },
  ]
}

export function generateMassCasualtyOptions(targetUnitId: string, ctx: GameContext): ResponseOption[] {
  const unit = getUnitByTargetId(ctx.units, targetUnitId)
  const cl8 = unitSupplyLevel(unit, 5)  // Class VIII

  return [
    {
      id:'A', label:'MEDEVAC + CL VIII PUSH',
      description: `Task aviation MEDEVAC and push Class VIII to ${unit?.name ?? 'unit'} immediately. Address casualties and medical supply simultaneously.`,
      consequence: 'Strength degradation slowed. Class VIII +25%. Aviation assets committed for 4 hours. Costly but effective.',
      risk: 'LOW',
      cost: '1 MEDEVAC sortie + Class VIII stocks',
      isDoctrineCorrect: true,
      effects: [
        { type:'STRENGTH_DELTA', target:targetUnitId, magnitude:12 },
        { type:'SUPPLY_ADD', target:targetUnitId, supplyClass:5, magnitude:25 },
        { type:'SORTIE_COST', target:'THEATER', magnitude:1 },
      ],
    },
    {
      id:'B', label:'GROUND MEDICAL CONVOY',
      description: `Dispatch ground convoy with medical personnel and Class VIII. ETA 6-8 hours. Unit continues degrading until arrival.`,
      consequence: 'Class VIII +18% on arrival. Slower than MEDEVAC but preserves sortie. 6-8 hour treatment delay means additional casualties.',
      risk: 'MEDIUM',
      cost: '6-8 hour treatment delay',
      isDoctrineCorrect: cl8 < 30,  // if CL VIII is already critical, ground is too slow
      effects: [
        { type:'SUPPLY_ADD', target:targetUnitId, supplyClass:5, magnitude:18 },
        { type:'STRENGTH_DELTA', target:targetUnitId, magnitude:5 },
      ],
    },
    {
      id:'C', label:'CONSOLIDATE WITH ADJACENT UNIT',
      description: 'Move casualties and survivors to adjacent FOB for combined treatment and reconstitution.',
      consequence: `${unit?.name ?? 'Unit'} combat strength reduced but surviving soldiers are treated. Unit loses tactical position. May affect operational plan.`,
      risk: 'HIGH',
      cost: 'Tactical position, unit cohesion',
      isDoctrineCorrect: unit ? unit.personnelStrength < 30 : false,
      effects: [
        { type:'STRENGTH_DELTA', target:targetUnitId, magnitude:8 },
        { type:'READINESS_DELTA', target:targetUnitId, magnitude:-10 },
      ],
    },
    {
      id:'D', label:'TREAT IN PLACE — CONTINUE MISSION',
      description: 'Unit medics treat casualties with available Class VIII. No external support. Unit continues mission.',
      consequence: cl8 < 30
        ? `CRITICAL: Class VIII at ${Math.round(cl8)}%. Insufficient for mass casualty treatment. High mortality risk. Strength will continue to fall.`
        : 'Unit handles internally. Slower recovery but preserves theater assets. Acceptable if Class VIII adequate.',
      risk: cl8 < 30 ? 'CRITICAL' : 'MEDIUM',
      cost: cl8 < 30 ? 'High casualty risk' : 'Reduced effectiveness for 24-48 hours',
      isDoctrineCorrect: cl8 >= 50,
      effects: cl8 >= 40
        ? [{ type:'STRENGTH_DELTA', target:targetUnitId, magnitude:3 }]
        : [{ type:'STRENGTH_DELTA', target:targetUnitId, magnitude:-8 }],
    },
  ]
}

export function generateFARPOptions(ctx: GameContext): ResponseOption[] {
  return [
    {
      id:'A', label:'ESTABLISH ALTERNATE FARP',
      description: 'Identify and establish alternate FARP location. 18-24 hours offline during transition.',
      consequence: 'Air operations resume after 18-24 hour gap. New FARP location less optimal but operational. Fuel consumption increases 15%.',
      risk: 'MEDIUM',
      cost: '18-24 hour air gap + 15% fuel penalty',
      isDoctrineCorrect: true,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:8 }],
    },
    {
      id:'B', label:'HARDEN AND REPAIR FARP WHISKEY',
      description: 'Repair FARP Whiskey in place with additional security. 48-72 hours. Higher security risk during repair.',
      consequence: 'FARP restored to original location. Longer recovery but better position. Enemy may attack again during repair.',
      risk: 'HIGH',
      cost: '48-72 hour air gap + repair resources',
      isDoctrineCorrect: false,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:16 }],
    },
    {
      id:'C', label:'FUEL BY GROUND CONVOY',
      description: 'Aviation refuels from ground assets only. Slower turnaround, less flexibility.',
      consequence: 'Aviation remains operational at 50% sortie rate. Ground convoys needed for fuel. Not sustainable long-term.',
      risk: 'MEDIUM',
      cost: 'Ground assets + 50% sortie rate reduction',
      isDoctrineCorrect: false,
      effects: [
        { type:'SUPPLY_DROP', target:'AVN_BDE', supplyClass:2, magnitude:15 },
      ],
    },
    {
      id:'D', label:'SUSPEND ALL AIR OPERATIONS',
      description: 'Halt all air operations until FARP restored. Protect aircraft from further risk.',
      consequence: 'Aviation assets preserved but unavailable. All air-dependent sustainment halted. Units relying on air resupply will stonewall.',
      risk: 'CRITICAL',
      cost: 'All air capability offline',
      isDoctrineCorrect: false,
      effects: [],
    },
  ]
}

export function generateIEDOptions(locId: string, ctx: GameContext): ResponseOption[] {
  return [
    {
      id:'A', label:'EOD CLEARANCE — AWAIT RESULT',
      description: 'Halt traffic, task EOD. Route cleared in 6-8 hours. Safest approach.',
      consequence: 'Route reopens in 6-8 hours. RCT delay limited. No supply risk beyond the wait time.',
      risk: 'LOW',
      cost: '6-8 hour route closure',
      isDoctrineCorrect: true,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:7 }],
    },
    {
      id:'B', label:'ROUTE CLEARANCE PATROL',
      description: 'Task route clearance patrol to check and clear road immediately. Faster but requires assets.',
      consequence: 'Route cleared in 3-4 hours. Uses route clearance assets that may be needed elsewhere.',
      risk: 'MEDIUM',
      cost: 'Route clearance assets (4 hours)',
      isDoctrineCorrect: false,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:4 }],
    },
    {
      id:'C', label:'USE ALTERNATE ROUTE NOW',
      description: 'Bypass IED location entirely. Add 4 hours but keep supply moving.',
      consequence: 'No supply interruption beyond 4-hour delay. Primary route stays closed until EOD completes.',
      risk: 'LOW',
      cost: '+4 hours per convoy',
      isDoctrineCorrect: false,
      effects: [{ type:'RCT_DELTA', target:'THEATER', magnitude:4 }],
    },
    {
      id:'D', label:'PUSH CONVOY THROUGH',
      description: 'Accept IED risk. Convoy moves on existing route. 30% detonation probability.',
      consequence: '30% chance: convoy hit, supply lost, personnel casualties. 70%: quick transit. High risk for time savings.',
      risk: 'CRITICAL',
      cost: '30% chance of total convoy loss + casualties',
      isDoctrineCorrect: false,
      effects: Math.random() < 0.30
        ? [{ type:'STRENGTH_DELTA', target:'THEATER', magnitude:-10 }]
        : [],
    },
  ]
}

// ── MAIN FACTORY ──────────────────────────────────────────────────────────────

export function generateResponseOptions(
  eventType: string,
  targetUnitId: string,
  targetLOCId: string,
  ctx: GameContext,
): ResponseOption[] {
  switch(eventType) {
    case 'FUEL_FIRE':
    case 'FARP_STRIKE': return eventType === 'FARP_STRIKE'
      ? generateFARPOptions(ctx)
      : generateFuelFireOptions(targetUnitId, ctx)
    case 'CONVOY_AMBUSH':   return generateAmbushOptions(targetLOCId, targetUnitId, ctx)
    case 'BRIDGE_DEMO':     return generateBridgeDemoOptions(targetLOCId, ctx)
    case 'MASS_CASUALTY':   return generateMassCasualtyOptions(targetUnitId, ctx)
    case 'IED':             return generateIEDOptions(targetLOCId, ctx)
    default:
      return [
        { id:'A', label:'MITIGATE', description:'Take immediate corrective action.', consequence:'Effect partially reduced.', risk:'LOW', cost:'Theater resources', isDoctrineCorrect:true, effects:[{ type:'RCT_DELTA', target:'THEATER', magnitude:-4 }] },
        { id:'B', label:'MONITOR', description:'Track situation, take no immediate action.', consequence:'Situation may worsen. No immediate cost.', risk:'MEDIUM', cost:'Continued degradation', effects:[] },
        { id:'C', label:'ACCEPT', description:'Accept the degradation as cost of operations.', consequence:'Full effect applied. Resources preserved.', risk:'HIGH', cost:'Full degradation applied', effects:[] },
      ]
  }
}
