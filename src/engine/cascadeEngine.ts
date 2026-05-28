/**
 * LOG ACTUAL — Cascade Failure Engine
 * KibuglogalVentures LLC
 *
 * The Hours of War: In real operations, a poor decision on Day 3 doesn't
 * announce itself. It manifests on Day 11 — when the unit you under-supplied
 * enters stonewall during a critical engagement, and you don't immediately
 * understand why.
 *
 * This engine models:
 *   1. Decision Debt — poor choices create hidden vulnerabilities
 *   2. Compound Degradation — stonewall cascades to adjacent units
 *   3. LOC Fragility — interdiction history makes routes weaker over time
 *   4. Supply Momentum — good supply posture is hard to lose; poor posture is hard to fix
 *   5. War Exhaustion — unit readiness has a ceiling that drops with campaign length
 *   6. No Recovery Immunity — once a unit stonewalls, it carries scar tissue
 *   7. Strategic Blindness — the player doesn't see all cascades coming
 */

import { Unit, TheaterNode, LOC, SupplyLevels, UnitStatus, ClassOfSupply } from '../types/game';
import { DifficultyParameters } from './learningEngine';

// ─── DECISION DEBT ────────────────────────────────────────────────────────────

export type DebtSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type DebtCategory =
  | 'SUPPLY_SHORTFALL'    // Unit went without supply — fragile now
  | 'LOC_STRESS'          // LOC was under threat and pushed anyway
  | 'READINESS_DEBT'      // Stonewall recovery left incomplete
  | 'RESERVE_DEPLETION'   // Operational reserve was consumed
  | 'OVEREXTENSION'       // Unit pushed beyond sustainable supply reach
  | 'LATERAL_ABUSE'       // Repeated lateral transfers exhausted donor unit
  | 'AIR_OVERUSE';        // Air assets pushed beyond sortie limits

export interface DecisionDebt {
  id: string;
  category: DebtCategory;
  severity: DebtSeverity;
  affectedUnitIds: string[];
  affectedNodeIds: string[];
  affectedLocIds: string[];
  createdDay: number;
  triggerDay: number;          // Day this debt will manifest (hidden from player)
  triggered: boolean;
  triggerEffect: CascadeEffect;
  isVisible: boolean;          // Whether the player can see this debt in the UI
  description: string;         // Shown AFTER trigger — "This resulted from..."
}

// ─── CASCADE EFFECTS ─────────────────────────────────────────────────────────

export type CascadeEffectType =
  | 'UNIT_READINESS_COLLAPSE'   // Unit readiness drops suddenly
  | 'LOC_INTERDICTION'          // LOC becomes interdicted from hidden fragility
  | 'SUPPLY_EVAPORATION'        // Supply levels mysteriously drop (spoilage, theft, error)
  | 'READINESS_CAP_DROP'        // Stonewall from adjacent unit affects this unit
  | 'CONVOY_LOSS'               // Convoy is interdicted due to pattern exploitation
  | 'DEPOT_FIRE'                // Depot takes damage from enemy artillery (exposed position)
  | 'STONEWALL_SPREAD'          // Maximum achievable readiness permanently lowered for session
  | 'DEMAND_SURGE'              // Unit suddenly needs more than expected (plans changed)
  | 'CLASS_V_MISCOUNT';         // Ammo count was wrong — unit has less than dashboard shows

export interface CascadeEffect {
  type: CascadeEffectType;
  magnitude: number;           // Scale: 0–1 (0 = trivial, 1 = catastrophic)
  affectedUnitIds: string[];
  affectedNodeIds: string[];
  affectedLocIds: string[];
  message: string;             // Displayed to player when triggered
  isDeniable: boolean;         // True: looks like bad luck. False: clearly player error.
}

// ─── SUPPLY MOMENTUM ─────────────────────────────────────────────────────────

/**
 * Supply Momentum: units that have been well-supplied for multiple consecutive
 * days develop resilience. Units that have been under-supplied develop fragility.
 *
 * Momentum score: -100 to +100
 *   +100: Fully supplied for 5+ consecutive days
 *   0:    Neutral — mixed supply history
 *   -100: Under-supplied for 5+ consecutive days (stonewall scar tissue)
 */
export interface SupplyMomentum {
  unitId: string;
  momentum: number;         // -100 to +100
  consecutiveDaysWellSupplied: number;
  consecutiveDaysPoorlySupplied: number;
  stonewallCount: number;   // Total stonewall events — permanently affects max readiness
  maxReadinessCap: number;  // Starts at 100, degrades with each stonewall (minimum 55)
}

export function updateSupplyMomentum(
  momentum: SupplyMomentum,
  unit: Unit,
  wasSuppliedToday: boolean,
): SupplyMomentum {
  const wellSupplied = wasSuppliedToday && unit.readiness >= 70;
  const poorlySupplied = !wasSuppliedToday || unit.readiness < 40;

  const newConsecutiveWell = wellSupplied ? momentum.consecutiveDaysWellSupplied + 1 : 0;
  const newConsecutivePoor = poorlySupplied ? momentum.consecutiveDaysPoorlySupplied + 1 : 0;

  // Momentum delta: well supply builds, poor supply drains
  const momentumDelta = wellSupplied ? 12 : (poorlySupplied ? -18 : -3);
  const newMomentum = Math.max(-100, Math.min(100, momentum.momentum + momentumDelta));

  // Stonewall scar tissue: permanent readiness cap degradation
  const stonewallToday = unit.status === 'STONEWALL';
  const newStonewallCount = stonewallToday ? momentum.stonewallCount + 1 : momentum.stonewallCount;

  // Each stonewall event drops the cap by 3 points (minimum 55%)
  const newMaxReadinessCap = Math.max(55, 100 - (newStonewallCount * 3));

  return {
    ...momentum,
    momentum: newMomentum,
    consecutiveDaysWellSupplied: newConsecutiveWell,
    consecutiveDaysPoorlySupplied: newConsecutivePoor,
    stonewallCount: newStonewallCount,
    maxReadinessCap: newMaxReadinessCap,
  };
}

// ─── WAR EXHAUSTION ──────────────────────────────────────────────────────────

/**
 * As the campaign extends, units become harder to recover and supply.
 * Personnel are exhausted. Equipment is worn. Maintenance backlogs grow.
 * Morale — while not modeled explicitly — is captured through readiness caps.
 *
 * Exhaustion Index: 0–100
 *   Day 1: 0 (fresh)
 *   Day 15: 35 (operational wear beginning)
 *   Day 25: 65 (significant attrition)
 *   Day 30: 80 (culmination fatigue)
 */
export function computeWarExhaustion(campaignDay: number, totalDays: number): number {
  const progress = campaignDay / totalDays;
  // Non-linear: slow buildup then accelerates after midpoint
  return Math.round(Math.pow(progress, 1.5) * 100);
}

/**
 * Exhaustion applies a multiplier to all recovery actions.
 * High exhaustion = slower recovery, lower ceiling.
 */
export function exhaustionRecoveryMultiplier(exhaustion: number): number {
  return Math.max(0.35, 1 - (exhaustion / 100) * 0.65);
}

/**
 * Exhaustion readiness ceiling: the maximum readiness any unit can achieve.
 * Even if you supply them perfectly, exhausted units can't perform at 100%.
 */
export function exhaustionReadinessCeiling(exhaustion: number): number {
  return Math.max(72, 100 - (exhaustion * 0.28));
}

// ─── LOC FRAGILITY ───────────────────────────────────────────────────────────

/**
 * LOCs that have been stressed (used under threat, interdicted, patched back)
 * become progressively more fragile. This models infrastructure wear and
 * enemy pattern exploitation.
 *
 * Fragility: 0–100
 *   0: Fresh — no history
 *   30: Stressed — used under medium threat
 *   60: Degraded — previously interdicted once
 *   85: Critical — repeatedly stressed, partial infrastructure
 *   100: Collapse imminent
 */
export interface LOCFragility {
  locId: string;
  fragility: number;
  interdictionCount: number;
  stressEvents: number;
  lastStressDay: number;
  estimatedCollapseDay: number | null; // Hidden from player
}

export function updateLOCFragility(
  fragility: LOCFragility,
  loc: LOC,
  wasUsedUnderThreat: boolean,
  wasInterdicted: boolean,
  currentDay: number,
  enemyActivityLevel: number,
): LOCFragility {
  let delta = 0;

  if (wasInterdicted) delta += 25;
  else if (wasUsedUnderThreat) delta += 8;
  else delta -= 2; // Natural repair over time when not stressed

  // Enemy activity amplifies fragility growth
  delta *= (1 + enemyActivityLevel * 0.5);

  const newFragility = Math.max(0, Math.min(100, fragility.fragility + delta));

  // Predict collapse day (hidden from player)
  // When fragility > 70, random collapse becomes possible
  let estimatedCollapseDay: number | null = null;
  if (newFragility > 70) {
    const daysToCollapse = Math.round((100 - newFragility) / 5 + Math.random() * 5);
    estimatedCollapseDay = currentDay + daysToCollapse;
  }

  return {
    ...fragility,
    fragility: newFragility,
    interdictionCount: fragility.interdictionCount + (wasInterdicted ? 1 : 0),
    stressEvents: fragility.stressEvents + (wasUsedUnderThreat ? 1 : 0),
    lastStressDay: (wasUsedUnderThreat || wasInterdicted) ? currentDay : fragility.lastStressDay,
    estimatedCollapseDay,
  };
}

// ─── DEBT CREATION ───────────────────────────────────────────────────────────

/**
 * Creates a decision debt entry when a poor decision is made.
 * The debt will trigger at a future day — the player won't know it's coming.
 *
 * Trigger timing is intentionally randomized within a window so the player
 * can't anticipate exactly when their past decisions will catch up to them.
 */
export function createDecisionDebt(
  decisionOutcome: 'SUBOPTIMAL' | 'FAILURE',
  category: string,
  affectedUnitIds: string[],
  affectedLocIds: string[],
  currentDay: number,
  difficulty: DifficultyParameters,
): DecisionDebt | null {
  // Only create debt if cascade probability check passes
  const cascadeChance = decisionOutcome === 'FAILURE'
    ? difficulty.cascadeProbability * 1.5
    : difficulty.cascadeProbability * 0.7;

  if (Math.random() > cascadeChance) return null;

  // Map decision categories to debt categories
  const categoryDebtMap: Record<string, DebtCategory[]> = {
    PUSH_PULL:        ['SUPPLY_SHORTFALL', 'READINESS_DEBT'],
    PRIORITY:         ['SUPPLY_SHORTFALL', 'STONEWALL' as any],
    LOC_MANAGEMENT:   ['LOC_STRESS', 'SUPPLY_DEBT' as any],
    AIR_GROUND:       ['AIR_OVERUSE', 'LOC_STRESS'],
    TRIAGE:           ['READINESS_DEBT', 'STONEWALL' as any],
    ECONOMY_OF_FORCE: ['RESERVE_DEPLETION', 'OVEREXTENSION'],
    PRE_POSITION:     ['SUPPLY_SHORTFALL', 'SUPPLY_DEBT' as any],
  };

  const debtCategories = categoryDebtMap[category] || ['SUPPLY_SHORTFALL'];
  const debtCategory = debtCategories[Math.floor(Math.random() * debtCategories.length)];

  const severity: DebtSeverity = decisionOutcome === 'FAILURE' ? 'SEVERE' : 'MODERATE';

  // Trigger window: 3–12 days after the poor decision
  const triggerOffset = Math.round(3 + Math.random() * 9);
  const triggerDay = currentDay + triggerOffset;

  const effects: Record<DebtCategory, CascadeEffect> = {
    SUPPLY_SHORTFALL: {
      type: 'UNIT_READINESS_COLLAPSE',
      magnitude: decisionOutcome === 'FAILURE' ? 0.7 : 0.4,
      affectedUnitIds,
      affectedNodeIds: [],
      affectedLocIds: [],
      message: 'Unit reports unexpected supply shortfall. Investigation traces root cause to distribution failure earlier in the campaign.',
      isDeniable: true,
    },
    LOC_STRESS: {
      type: 'LOC_INTERDICTION',
      magnitude: 0.6,
      affectedUnitIds: [],
      affectedNodeIds: [],
      affectedLocIds,
      message: 'LOC assessment identifies critical infrastructure damage from repeated use under threat conditions. Route closed for emergency repair.',
      isDeniable: false,
    },
    READINESS_DEBT: {
      type: 'STONEWALL' as any,
      magnitude: 0.5,
      affectedUnitIds,
      affectedNodeIds: [],
      affectedLocIds: [],
      message: 'Medical assessment finds elevated non-combat casualty rates from sustainment failures. Unit readiness ceiling permanently reduced this campaign.',
      isDeniable: true,
    },
    RESERVE_DEPLETION: {
      type: 'SUPPLY_DEBT' as any,
      magnitude: 0.65,
      affectedUnitIds,
      affectedNodeIds: [],
      affectedLocIds: [],
      message: 'Operational reserve depleted earlier than projected. Units requesting emergency resupply simultaneously.',
      isDeniable: false,
    },
    OVEREXTENSION: {
      type: 'SUPPLY_DEBT' as any,
      magnitude: 0.55,
      affectedUnitIds: [],
      affectedNodeIds: [],
      affectedLocIds,
      message: 'Convoy operating beyond sustainable supply reach suffers complete interdiction. Cargo lost. Vehicles lost. Personnel status unknown.',
      isDeniable: false,
    },
    LATERAL_ABUSE: {
      type: 'STONEWALL' as any,
      magnitude: 0.75,
      affectedUnitIds,
      affectedNodeIds: [],
      affectedLocIds: [],
      message: 'Unit previously used as lateral transfer donor reports supply collapse. Repeated stripping has exhausted organic reserves.',
      isDeniable: true,
    },
    AIR_OVERUSE: {
      type: 'SUPPLY_EVAPORATION',
      magnitude: 0.5,
      affectedUnitIds,
      affectedNodeIds: [],
      affectedLocIds: [],
      message: 'Aerial sortie assets grounded for mandatory maintenance after exceeding planned sortie cycle. Air bridge temporarily unavailable.',
      isDeniable: false,
    },
  };

  return {
    id: `DEBT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    category: debtCategory,
    severity,
    affectedUnitIds,
    affectedNodeIds: [],
    affectedLocIds,
    createdDay: currentDay,
    triggerDay,
    triggered: false,
    triggerEffect: effects[debtCategory],
    isVisible: false, // Hidden until triggered
    description: `Decision failure on Day ${currentDay} created this vulnerability.`,
  };
}

// ─── CASCADE STATE ────────────────────────────────────────────────────────────

export interface CascadeState {
  debts: DecisionDebt[];
  locFragility: Record<string, LOCFragility>;
  supplyMomentum: Record<string, SupplyMomentum>;
  warExhaustion: number;
  activeEvents: CascadeEvent[];
  resolvedEvents: CascadeEvent[];
}

export interface CascadeEvent {
  id: string;
  day: number;
  effect: CascadeEffect;
  sourceDebtId: string | null;
  acknowledged: boolean;
}

// ─── DAILY CASCADE TICK ──────────────────────────────────────────────────────

/**
 * Run at the end of each EXECUTION phase.
 * Checks all pending debts for triggering.
 * Applies triggered effects to game state.
 * Updates war exhaustion.
 * Updates supply momentum for all units.
 */
export function runCascadeTick(
  cascadeState: CascadeState,
  units: Record<string, Unit>,
  locs: Record<string, LOC>,
  currentDay: number,
  difficulty: DifficultyParameters,
): {
  cascadeState: CascadeState;
  triggeredEvents: CascadeEvent[];
  unitUpdates: Record<string, Partial<Unit>>;
  locUpdates: Record<string, Partial<LOC>>;
} {
  const triggeredEvents: CascadeEvent[] = [];
  const unitUpdates: Record<string, Partial<Unit>> = {};
  const locUpdates: Record<string, Partial<LOC>> = {};

  // Check all debts for triggering
  const updatedDebts = cascadeState.debts.map(debt => {
    if (debt.triggered || debt.triggerDay > currentDay) return debt;

    // Debt triggers — apply effect
    const event: CascadeEvent = {
      id: `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      day: currentDay,
      effect: debt.triggerEffect,
      sourceDebtId: debt.id,
      acknowledged: false,
    };

    triggeredEvents.push(event);

    // Apply effect to units/locs
    applyEffectToState(
      debt.triggerEffect,
      difficulty,
      unitUpdates,
      locUpdates,
    );

    return { ...debt, triggered: true };
  });

  // Update war exhaustion
  const totalDays = 30; // TODO: pass from campaign
  const newExhaustion = computeWarExhaustion(currentDay, totalDays);

  // Update supply momentum for all units
  const updatedMomentum = { ...cascadeState.supplyMomentum };
  Object.values(units).forEach(unit => {
    const currentMomentum = updatedMomentum[unit.id] ?? {
      unitId: unit.id,
      momentum: 0,
      consecutiveDaysWellSupplied: 0,
      consecutiveDaysPoorlySupplied: 0,
      stonewallCount: 0,
      maxReadinessCap: 100,
    };
    const wasSupplied = Object.values(unit.supplyLevels).some(v => v > 40);
    updatedMomentum[unit.id] = updateSupplyMomentum(currentMomentum, unit, wasSupplied);

    // Apply readiness cap from momentum and exhaustion
    const exhaustionCeiling = exhaustionReadinessCeiling(newExhaustion);
    const momentumCap = currentMomentum.maxReadinessCap;
    const effectiveCap = Math.min(exhaustionCeiling, momentumCap);

    if (unit.readiness > effectiveCap) {
      unitUpdates[unit.id] = {
        ...unitUpdates[unit.id],
        readiness: effectiveCap,
      };
    }
  });

  return {
    cascadeState: {
      ...cascadeState,
      debts: updatedDebts,
      supplyMomentum: updatedMomentum,
      warExhaustion: newExhaustion,
      activeEvents: [
        ...cascadeState.activeEvents.filter(e => !e.acknowledged),
        ...triggeredEvents,
      ],
      resolvedEvents: [
        ...cascadeState.resolvedEvents,
        ...cascadeState.activeEvents.filter(e => e.acknowledged),
      ],
    },
    triggeredEvents,
    unitUpdates,
    locUpdates,
  };
}

// ─── EFFECT APPLICATION ───────────────────────────────────────────────────────

function applyEffectToState(
  effect: CascadeEffect,
  difficulty: DifficultyParameters,
  unitUpdates: Record<string, Partial<Unit>>,
  locUpdates: Record<string, Partial<LOC>>,
): void {
  // Apply noise to magnitude (real war is uncertain)
  const noisedMagnitude = effect.magnitude * (1 + (Math.random() - 0.5) * difficulty.effectNoiseAmplitude);
  const clampedMagnitude = Math.max(0.1, Math.min(1.0, noisedMagnitude));

  switch (effect.type) {
    case 'UNIT_READINESS_COLLAPSE':
      effect.affectedUnitIds.forEach(unitId => {
        unitUpdates[unitId] = {
          ...unitUpdates[unitId],
          readiness: Math.round(Math.max(0, (unitUpdates[unitId]?.readiness ?? 70) * (1 - clampedMagnitude * 0.6))),
        };
      });
      break;

    case 'LOC_INTERDICTION':
      effect.affectedLocIds.forEach(locId => {
        locUpdates[locId] = {
          ...locUpdates[locId],
          status: 'INTERDICTED',
          threatLevel: 'HIGH',
        };
      });
      break;

    case 'SUPPLY_EVAPORATION':
      effect.affectedUnitIds.forEach(unitId => {
        // Random supply class evaporates
        const classes: ClassOfSupply[] = ['CL_I', 'CL_III', 'CL_V', 'CL_IX'];
        const targetClass = classes[Math.floor(Math.random() * classes.length)];
        unitUpdates[unitId] = {
          ...unitUpdates[unitId],
          supplyLevels: ({
            CL_I: 80, CL_II: 70, CL_III: 60, CL_IV: 75, CL_V: 65, CL_VIII:0, CL_IX: 70,
            ...(unitUpdates[unitId]?.supplyLevels ?? {}),
            [targetClass]: Math.round(20 * (1 - clampedMagnitude * 0.5)),
          }) as any,
        };
      });
      break;

    case 'STONEWALL' as any:
      // Handled by momentum system — just note the event
      break;

    case 'SUPPLY_DEBT' as any:
      effect.affectedUnitIds.forEach(unitId => {
        // Daily consumption temporarily increases — modeled as supply level drop
        unitUpdates[unitId] = {
          ...unitUpdates[unitId],
          supplyLevels: {
            ...(unitUpdates[unitId]?.supplyLevels ?? {}),
            CL_V: Math.round(30 * (1 - clampedMagnitude * 0.4)),
            CL_III: Math.round(25 * (1 - clampedMagnitude * 0.4)),
          } as any,
        };
      });
      break;

    case 'SUPPLY_DEBT' as any:
      // Convoy is lost — supply that was en route never arrives
      // Handled by game engine removing convoy from active list
      break;

    case 'STONEWALL' as any:
      effect.affectedUnitIds.forEach(unitId => {
        unitUpdates[unitId] = {
          ...unitUpdates[unitId],
          readiness: Math.round(Math.max(0, (unitUpdates[unitId]?.readiness ?? 60) - 30 * clampedMagnitude)),
        };
      });
      break;

    case 'CLASS_V_MISCOUNT':
      effect.affectedUnitIds.forEach(unitId => {
        unitUpdates[unitId] = {
          ...unitUpdates[unitId],
          supplyLevels: {
            ...(unitUpdates[unitId]?.supplyLevels ?? {}),
          } as any,
        };
      });
      break;

    case 'DEPOT_FIRE':
      effect.affectedNodeIds.forEach(nodeId => {
        // Node supply levels drop significantly
        // Handled by game engine updating node data
      });
      break;
  }
}

// ─── STONEWALL CASCADE CHECK ─────────────────────────────────────────────────

/**
 * When a unit enters stonewall, check if adjacent units are at risk.
 * Stonewall cascades when:
 *   - Adjacent unit shares an LOC that now carries higher load
 *   - Adjacent unit was a lateral transfer donor (already weakened)
 *   - Multiple adjacent units simultaneously under-supplied
 *
 * Returns a list of units at elevated cascade risk.
 */
export function checkStonewallCascadeRisk(
  stonewallUnitId: string,
  allUnits: Record<string, Unit>,
  momentum: Record<string, SupplyMomentum>,
): Array<{ unitId: string; riskLevel: number; reason: string }> {
  const risks: Array<{ unitId: string; riskLevel: number; reason: string }> = [];

  Object.values(allUnits).forEach(unit => {
    if (unit.id === stonewallUnitId) return;

    let risk = 0;
    let reason = '';

    // Unit was a lateral transfer donor — already weakened
    const unitMomentum = momentum[unit.id];
    if (unitMomentum && unitMomentum.momentum < -30) {
      risk += 35;
      reason = 'Previously used as lateral transfer donor — momentum depleted';
    }

    // Unit already in amber — vulnerable
    if (unit.status === 'AMBER') {
      risk += 25;
      reason += (reason ? '; ' : '') + 'Already in AMBER status — marginal resilience';
    }

    // Unit has had multiple stonewall events this campaign
    if (unitMomentum && unitMomentum.stonewallCount >= 2) {
      risk += 30;
      reason += (reason ? '; ' : '') + 'Repeated stonewall history — scar tissue significant';
    }

    // Low CL III specifically is a cascade indicator
    if (unit.supplyLevels.CL_III < 30) {
      risk += 20;
      reason += (reason ? '; ' : '') + 'Class III critically low — movement compromised';
    }

    if (risk > 0) {
      risks.push({ unitId: unit.id, riskLevel: Math.min(100, risk), reason });
    }
  });

  return risks.sort((a, b) => b.riskLevel - a.riskLevel);
}

// ─── INITIAL CASCADE STATE ────────────────────────────────────────────────────

export function createInitialCascadeState(
  unitIds: string[],
  locIds: string[],
): CascadeState {
  const supplyMomentum: Record<string, SupplyMomentum> = {};
  unitIds.forEach(id => {
    supplyMomentum[id] = {
      unitId: id,
      momentum: 0,
      consecutiveDaysWellSupplied: 0,
      consecutiveDaysPoorlySupplied: 0,
      stonewallCount: 0,
      maxReadinessCap: 100,
    };
  });

  const locFragility: Record<string, LOCFragility> = {};
  locIds.forEach(id => {
    locFragility[id] = {
      locId: id,
      fragility: 0,
      interdictionCount: 0,
      stressEvents: 0,
      lastStressDay: 0,
      estimatedCollapseDay: null,
    };
  });

  return {
    debts: [],
    locFragility,
    supplyMomentum,
    warExhaustion: 0,
    activeEvents: [],
    resolvedEvents: [],
  };
}

// ─── DEBT SUMMARY (for AAR) ───────────────────────────────────────────────────

export interface DebtSummary {
  totalDebtsCreated: number;
  totalDebtsTriggered: number;
  averageDebtDelay: number;
  worstCascade: CascadeEvent | null;
  mostVulnerableUnit: string | null;
  debtsByCategory: Record<DebtCategory, number>;
  totalWarExhaustionAccrued: number;
}

export function generateDebtSummary(cascadeState: CascadeState): DebtSummary {
  const triggered = cascadeState.debts.filter(d => d.triggered);
  const delays = triggered.map(d => d.triggerDay - d.createdDay);
  const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

  const debtsByCategory = {} as Record<DebtCategory, number>;
  cascadeState.debts.forEach(d => {
    debtsByCategory[d.category] = (debtsByCategory[d.category] ?? 0) + 1;
  });

  const momentumValues = Object.values(cascadeState.supplyMomentum);
  const mostVulnerable = momentumValues.length > 0
    ? momentumValues.sort((a, b) => a.momentum - b.momentum)[0]?.unitId ?? null
    : null;

  const allEvents = [...cascadeState.activeEvents, ...cascadeState.resolvedEvents];
  const worstCascade = allEvents.length > 0
    ? allEvents.sort((a, b) => b.effect.magnitude - a.effect.magnitude)[0]
    : null;

  return {
    totalDebtsCreated: cascadeState.debts.length,
    totalDebtsTriggered: triggered.length,
    averageDebtDelay: Math.round(avgDelay),
    worstCascade,
    mostVulnerableUnit: mostVulnerable,
    debtsByCategory,
    totalWarExhaustionAccrued: cascadeState.warExhaustion,
  };
}
