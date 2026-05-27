/**
 * LOG ACTUAL — War Cost Model
 * KibuglogalVentures LLC
 *
 * "The object of war is not to die for your country but to make
 *  the other bastard die for his." — Patton
 *
 * In logistics: "The object is not to win. It is to ensure your
 *  soldiers don't die from preventable causes while trying."
 *
 * War cost tracking exists to make the player feel the weight
 * of every stonewall, every failed decision, every unit that
 * went without supply for a day longer than it should have.
 *
 * There is no win screen in LOG ACTUAL. There is an AAR.
 * The AAR tells you what the campaign cost.
 */

import { Unit, UnitStatus } from '../types/game';
import { CascadeState } from './cascadeEngine';
import { PlayerSkillModel } from './learningEngine';

// ─── WAR COST CATEGORIES ─────────────────────────────────────────────────────

export interface WarCost {
  // Readiness costs — measured in unit-days below threshold
  totalUnitDaysInAmber: number;        // Each unit-day in AMBER = 1 point
  totalUnitDaysInRed: number;          // Each unit-day in RED = 3 points
  totalUnitDaysInStonewall: number;    // Each unit-day in STONEWALL = 10 points

  // Request cycle time violations
  rctViolations: number;               // Requests that exceeded 48hr USL
  totalExcessHours: number;            // Aggregate hours above USL

  // Stonewall events
  stonewallEvents: number;             // Total distinct stonewall events
  stonewallRecoveries: number;         // How many were recovered from
  longestStonewallStretch: number;     // Days — most consecutive STONEWALL for any unit

  // Supply failures
  classICriticalDays: number;          // Days where any unit had CL I < 20%
  classIIICriticalDays: number;        // Days where any unit had CL III < 20%
  classVCriticalDays: number;          // Days where any unit had CL V < 20%

  // Decision costs
  doctrineFails: number;               // FAILURE outcomes
  doctrineSuboptimal: number;          // SUBOPTIMAL outcomes — these have costs too
  cascadeDebtsTriggered: number;       // Poor decisions that caught up later

  // Enemy exploitation
  convoyLosses: number;                // Convoys interdicted
  locCollapses: number;                // LOCs that became permanently interdicted

  // Theater-level outcomes
  finalSigmaLevel: number;
  finalAvgReadiness: number;
  finalStonewallRate: number;
  finalRCT: number;

  // The cost that doesn't have a number
  warCostStatement: string;
}

// ─── DAILY COST RECORDER ─────────────────────────────────────────────────────

export function recordDailyCost(
  existing: WarCost,
  units: Record<string, Unit>,
  currentDay: number,
): WarCost {
  let amberDays = existing.totalUnitDaysInAmber;
  let redDays = existing.totalUnitDaysInRed;
  let stonewallDays = existing.totalUnitDaysInStonewall;
  let clICritical = existing.classICriticalDays;
  let clIIICritical = existing.classIIICriticalDays;
  let clVCritical = existing.classVCriticalDays;

  let anyStonewall = false;
  let anyCLICritical = false;
  let anyCLIIICritical = false;
  let anyCLVCritical = false;

  Object.values(units).forEach(unit => {
    switch (unit.status) {
      case 'AMBER': amberDays++; break;
      case 'RED': redDays++; break;
      case 'STONEWALL':
        stonewallDays++;
        anyStonewall = true;
        break;
    }

    if (unit.supplyLevels.CL_I < 20) anyCLICritical = true;
    if (unit.supplyLevels.CL_III < 20) anyCLIIICritical = true;
    if (unit.supplyLevels.CL_V < 20) anyCLVCritical = true;
  });

  return {
    ...existing,
    totalUnitDaysInAmber: amberDays,
    totalUnitDaysInRed: redDays,
    totalUnitDaysInStonewall: stonewallDays,
    classICriticalDays: clICritical + (anyCLICritical ? 1 : 0),
    classIIICriticalDays: clIIICritical + (anyCLIIICritical ? 1 : 0),
    classVCriticalDays: clVCritical + (anyCLVCritical ? 1 : 0),
  };
}

// ─── FINAL COST COMPUTATION ───────────────────────────────────────────────────

export function computeFinalWarCost(
  warCost: WarCost,
  model: PlayerSkillModel,
  cascadeState: CascadeState,
): WarCost {
  const triggeredDebts = cascadeState.debts.filter(d => d.triggered).length;

  const finalCost = {
    ...warCost,
    cascadeDebtsTriggered: triggeredDebts,
    warCostStatement: generateWarCostStatement(warCost, model),
  };

  return finalCost;
}

// ─── THE WAR COST STATEMENT ──────────────────────────────────────────────────

/**
 * The War Cost Statement replaces the win screen.
 *
 * It never uses the word "won." It measures what was prevented,
 * what was failed, and what the campaign cost in real terms.
 *
 * It is deliberately uncomfortable to read.
 */
function generateWarCostStatement(cost: WarCost, model: PlayerSkillModel): string {
  const stonewallWeight = cost.totalUnitDaysInStonewall * 10;
  const redWeight = cost.totalUnitDaysInRed * 3;
  const amberWeight = cost.totalUnitDaysInAmber * 1;
  const totalWeight = stonewallWeight + redWeight + amberWeight;

  const doctrineFailRate = model.displayRating < 50 ? 'HIGH' : model.displayRating < 70 ? 'MODERATE' : 'LOW';

  if (totalWeight === 0) {
    return `NEAR-PERFECT SUSTAINMENT. Theater operated at or above threshold for all 30 days. This outcome is historically unprecedented. It does not happen in real operations. The simulation has been completed at its highest functional level. The cost was still not zero — it never is. Every optimal decision still had a price in the effects panel. You saw those prices. This is the closest you can get.`;
  }

  if (cost.stonewallEvents >= 5) {
    return `SUSTAINMENT FAILURE — SIGNIFICANT THEATER IMPACT. ${cost.stonewallEvents} stonewall events occurred across ${cost.totalUnitDaysInStonewall} unit-days. In each stonewall day, a unit had zero combat effectiveness. They existed. They consumed positions on the line. They could not fight. The doctrine failure rate was ${doctrineFailRate}. The enemy exploited ${cost.locCollapses} LOC collapses. ${cost.cascadeDebtsTriggered} poor decisions from earlier in the campaign manifested as compounding events you may not have connected to their source. They were connected.`;
  }

  if (cost.stonewallEvents >= 2) {
    return `THEATER SUSTAINED WITH SIGNIFICANT GAPS. ${cost.stonewallEvents} stonewall events. ${cost.rctViolations} request cycle time violations — these are not statistics. Each violation is a unit that waited past its limit. ${cost.totalUnitDaysInAmber} unit-days in AMBER means degraded operations sustained. Some of those days were in decisive engagements. The gaps in your supply chain had operational consequences. The enemy ${cost.locCollapses > 0 ? `successfully collapsed ${cost.locCollapses} LOC${cost.locCollapses > 1 ? 's' : ''} by exploiting your patterns` : 'tested your LOC network and found resistance'}. Doctrine failure rate: ${doctrineFailRate}.`;
  }

  if (cost.rctViolations >= 10) {
    return `THEATER FUNCTIONED. SUSTAINMENT WAS SLOW. ${cost.rctViolations} requests exceeded the 48-hour threshold. No unit held at stonewall for more than a day. The supply did arrive. It arrived late. In real operations, "it arrived late" has consequences that are not visible in a dashboard. The sigma level of ${cost.finalSigmaLevel.toFixed(1)} reflects a system that works but works poorly. Doctrine mastery at this level means the system will improve — but it requires deliberate practice of the areas where decisions were suboptimal. You know which areas those are.`;
  }

  return `CAMPAIGN SUSTAINED. ${cost.totalUnitDaysInStonewall > 0 ? `${cost.totalUnitDaysInStonewall} stonewall unit-days recorded. ` : ''}${cost.totalUnitDaysInAmber} unit-days in degraded AMBER status. ${cost.doctrineFails} doctrine failures and ${cost.doctrineSuboptimal} suboptimal decisions — these had costs even when they felt manageable. The sigma level of ${cost.finalSigmaLevel.toFixed(1)}σ represents the gap between what was delivered and what doctrine requires. The theater held. It cost something to hold it. That cost is the permanent record of this campaign.`;
}

// ─── SIGMA SCORE CALCULATION ──────────────────────────────────────────────────

/**
 * Final sigma score for leaderboard.
 * Not a grade. A measurement.
 * 6σ is theoretical perfect. Real operations run at 1.5–2.5σ.
 * Getting to 3.0σ+ requires exceptional doctrine mastery.
 */
export function computeFinalSigmaScore(
  warCost: WarCost,
  campaignDays: number,
  unitCount: number,
): number {
  // Defect opportunities = unit-days * classes of supply
  const defectOpportunities = campaignDays * unitCount * 6; // 6 classes

  // Defects = violations of USL (readiness below threshold or RCT exceeded)
  const defects = warCost.rctViolations +
    (warCost.totalUnitDaysInRed * 2) +
    (warCost.totalUnitDaysInStonewall * 6);

  const dpm = defectOpportunities > 0
    ? (defects / defectOpportunities) * 1_000_000
    : 0;

  // Convert DPMO to sigma level
  if (dpm <= 3.4)    return 6.0;
  if (dpm <= 233)    return 5.0;
  if (dpm <= 6210)   return 4.0;
  if (dpm <= 66807)  return 3.0;
  if (dpm <= 308538) return 2.0;
  if (dpm <= 690000) return 1.0;
  return 0.5;
}

// ─── INITIAL WAR COST ────────────────────────────────────────────────────────

export function createInitialWarCost(): WarCost {
  return {
    totalUnitDaysInAmber: 0,
    totalUnitDaysInRed: 0,
    totalUnitDaysInStonewall: 0,
    rctViolations: 0,
    totalExcessHours: 0,
    stonewallEvents: 0,
    stonewallRecoveries: 0,
    longestStonewallStretch: 0,
    classICriticalDays: 0,
    classIIICriticalDays: 0,
    classVCriticalDays: 0,
    doctrineFails: 0,
    doctrineSuboptimal: 0,
    cascadeDebtsTriggered: 0,
    convoyLosses: 0,
    locCollapses: 0,
    finalSigmaLevel: 0,
    finalAvgReadiness: 0,
    finalStonewallRate: 0,
    finalRCT: 0,
    warCostStatement: '',
  };
}
