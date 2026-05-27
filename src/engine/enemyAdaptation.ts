/**
 * LOG ACTUAL — Enemy Adaptation Engine
 * KibuglogalVentures LLC
 *
 * "The enemy has a vote."
 * — Every military planner, always
 *
 * The adversary in LOG ACTUAL is not scripted. It observes patterns in how
 * the player manages their theater and exploits them.
 *
 * Real insurgencies and near-peer adversaries target sustainment — not combat
 * power. They interdict LOCs. They target depots. They time ambushes to convoy
 * schedules. They know that a well-supplied army is near-unbeatable, so they
 * attack the supply chain.
 *
 * This engine models:
 *   1. Pattern Recognition — enemy learns player routing habits
 *   2. LOC Exploitation — frequently used routes become primary targets
 *   3. Temporal Exploitation — enemy learns WHEN convoys move
 *   4. Air Denial — if player relies on air, enemy prioritizes SHORAD
 *   5. Depot Targeting — high-value nodes become high-priority targets
 *   6. Adaptive Intensity — enemy increases tempo when player is weakened
 */

import { DifficultyParameters } from './learningEngine';

// ─── ENEMY INTELLIGENCE MODEL ────────────────────────────────────────────────

export interface RouteUsageRecord {
  locId: string;
  useCount: number;
  lastUsedDay: number;
  convoyCount: number;
  airConvoyCount: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PlayerPatternRecord {
  // Which LOCs the player uses most often
  locUsage: Record<string, RouteUsageRecord>;

  // Air vs ground preference (0 = ground-only, 1 = air-only)
  airPreference: number;

  // Average response time to crises (days) — fast responders get less warning
  avgCrisisResponseDays: number;

  // Preferred resupply priority (which unit gets priority in competing requests)
  priorityPattern: Record<string, number>; // unitId -> times given priority

  // Which days the player typically dispatches convoys
  convoyDayPattern: Record<number, number>; // dayOfWeek -> count

  // Lateral transfer reliance (how often player strips one unit for another)
  lateralTransferCount: number;

  // Reserve depletion tendency (does player burn reserves early?)
  earlyReserveDepletionCount: number;
}

// ─── ENEMY INTELLIGENCE STATE ─────────────────────────────────────────────────

export interface EnemyIntelligenceState {
  patterns: PlayerPatternRecord;

  // Current threat posture per LOC
  locThreatModifiers: Record<string, number>; // locId -> threat multiplier (1.0 = baseline)

  // Current threat posture per node
  nodeThreatModifiers: Record<string, number>; // nodeId -> threat multiplier

  // Enemy operation tempo
  currentTempo: 'LOW' | 'MEDIUM' | 'HIGH' | 'SURGE';

  // Days since last major interdiction (enemy rests between attacks)
  daysSinceLastMajorAction: number;

  // Enemy resource level (enemy has limited assets too)
  enemyCapacity: number; // 0–100: higher = more aggressive actions possible

  // Known player weaknesses (enemy has incomplete intel)
  exploitableWeaknesses: EnemyWeakness[];
}

export interface EnemyWeakness {
  type: 'LOC_DEPENDENCY' | 'AIR_RELIANCE' | 'SINGLE_DEPOT' | 'UNIT_VULNERABILITY' | 'TIMING_PATTERN';
  targetId: string;      // LOC, node, or unit ID
  confidence: number;    // 0–1: how certain is the enemy about this weakness?
  exploitAttempts: number;
  exploitSuccesses: number;
}

// ─── PATTERN OBSERVATION ─────────────────────────────────────────────────────

/**
 * Called after each player action (convoy dispatch, decision, allocation).
 * Updates the enemy's intelligence picture.
 */
export function observePlayerAction(
  state: EnemyIntelligenceState,
  actionType: 'CONVOY_DISPATCH' | 'AIR_DISPATCH' | 'LATERAL_TRANSFER' | 'RESERVE_USE' | 'DECISION',
  metadata: {
    locId?: string;
    unitId?: string;
    nodeId?: string;
    day?: number;
    isAir?: boolean;
  },
): EnemyIntelligenceState {
  const updatedPatterns = { ...state.patterns };

  switch (actionType) {
    case 'CONVOY_DISPATCH':
    case 'AIR_DISPATCH':
      if (metadata.locId) {
        const existing = updatedPatterns.locUsage[metadata.locId] ?? {
          locId: metadata.locId,
          useCount: 0,
          lastUsedDay: 0,
          convoyCount: 0,
          airConvoyCount: 0,
          threatLevel: 'LOW',
        };
        updatedPatterns.locUsage[metadata.locId] = {
          ...existing,
          useCount: existing.useCount + 1,
          lastUsedDay: metadata.day ?? 0,
          convoyCount: existing.convoyCount + (actionType === 'CONVOY_DISPATCH' ? 1 : 0),
          airConvoyCount: existing.airConvoyCount + (actionType === 'AIR_DISPATCH' ? 1 : 0),
        };
      }

      // Update air preference
      const totalConvoys = Object.values(updatedPatterns.locUsage).reduce((s, r) => s + r.convoyCount, 0) + 1;
      const totalAir = Object.values(updatedPatterns.locUsage).reduce((s, r) => s + r.airConvoyCount, 0) +
        (actionType === 'AIR_DISPATCH' ? 1 : 0);
      updatedPatterns.airPreference = totalConvoys > 0 ? totalAir / totalConvoys : 0;
      break;

    case 'LATERAL_TRANSFER':
      updatedPatterns.lateralTransferCount += 1;
      break;

    case 'RESERVE_USE':
      updatedPatterns.earlyReserveDepletionCount += 1;
      break;

    case 'DECISION':
      if (metadata.unitId) {
        updatedPatterns.priorityPattern[metadata.unitId] =
          (updatedPatterns.priorityPattern[metadata.unitId] ?? 0) + 1;
      }
      break;
  }

  // Update exploitable weaknesses based on observed patterns
  const updatedWeaknesses = identifyWeaknesses(updatedPatterns, state.exploitableWeaknesses);

  return {
    ...state,
    patterns: updatedPatterns,
    exploitableWeaknesses: updatedWeaknesses,
  };
}

// ─── WEAKNESS IDENTIFICATION ──────────────────────────────────────────────────

function identifyWeaknesses(
  patterns: PlayerPatternRecord,
  existing: EnemyWeakness[],
): EnemyWeakness[] {
  const weaknesses: EnemyWeakness[] = [...existing];

  // LOC dependency: any LOC used 4+ times is a dependency
  Object.entries(patterns.locUsage).forEach(([locId, usage]) => {
    if (usage.useCount >= 4) {
      const existingIdx = weaknesses.findIndex(w => w.type === 'LOC_DEPENDENCY' && w.targetId === locId);
      const confidence = Math.min(0.95, 0.3 + (usage.useCount - 4) * 0.1);

      if (existingIdx >= 0) {
        weaknesses[existingIdx] = { ...weaknesses[existingIdx], confidence };
      } else {
        weaknesses.push({
          type: 'LOC_DEPENDENCY',
          targetId: locId,
          confidence,
          exploitAttempts: 0,
          exploitSuccesses: 0,
        });
      }
    }
  });

  // Air reliance: if player uses air for >40% of deliveries
  if (patterns.airPreference > 0.4) {
    const existingIdx = weaknesses.findIndex(w => w.type === 'AIR_RELIANCE');
    const confidence = Math.min(0.9, patterns.airPreference);

    if (existingIdx >= 0) {
      weaknesses[existingIdx] = { ...weaknesses[existingIdx], confidence };
    } else {
      weaknesses.push({
        type: 'AIR_RELIANCE',
        targetId: 'AERIAL_PORT',
        confidence,
        exploitAttempts: 0,
        exploitSuccesses: 0,
      });
    }
  }

  // Timing pattern: if player consistently dispatches convoys on same days
  const convoyDays = Object.entries(patterns.convoyDayPattern);
  if (convoyDays.length > 0) {
    const maxDayCount = Math.max(...convoyDays.map(([, c]) => c));
    if (maxDayCount >= 3) {
      const patternDay = convoyDays.find(([, c]) => c === maxDayCount)?.[0] ?? '0';
      const existingIdx = weaknesses.findIndex(w => w.type === 'TIMING_PATTERN');
      const confidence = Math.min(0.85, 0.3 + maxDayCount * 0.1);

      if (existingIdx >= 0) {
        weaknesses[existingIdx] = { ...weaknesses[existingIdx], confidence };
      } else {
        weaknesses.push({
          type: 'TIMING_PATTERN',
          targetId: patternDay,
          confidence,
          exploitAttempts: 0,
          exploitSuccesses: 0,
        });
      }
    }
  }

  return weaknesses;
}

// ─── THREAT MODIFIER UPDATE ──────────────────────────────────────────────────

/**
 * Update threat modifiers based on identified weaknesses.
 * High-confidence weaknesses get high threat multipliers on their targets.
 * This translates to increased interdiction probability when the player
 * uses those routes or assets.
 */
export function updateThreatModifiers(state: EnemyIntelligenceState): EnemyIntelligenceState {
  const locThreat = { ...state.locThreatModifiers };
  const nodeThreat = { ...state.nodeThreatModifiers };

  state.exploitableWeaknesses.forEach(weakness => {
    const threatIncrease = weakness.confidence * 1.8; // Max 1.8x multiplier from exploitation

    switch (weakness.type) {
      case 'LOC_DEPENDENCY':
        locThreat[weakness.targetId] = Math.min(3.0, (locThreat[weakness.targetId] ?? 1.0) + threatIncrease * 0.3);
        break;
      case 'AIR_RELIANCE':
        // Enemy brings up SHORAD to threaten air routes
        nodeThreat['AERIAL_PORT'] = Math.min(2.5, (nodeThreat['AERIAL_PORT'] ?? 1.0) + threatIncrease * 0.2);
        nodeThreat['AIRFIELD'] = Math.min(2.5, (nodeThreat['AIRFIELD'] ?? 1.0) + threatIncrease * 0.15);
        break;
      case 'TIMING_PATTERN':
        // All LOCs get slightly higher threat on pattern days — handled in event generation
        break;
    }
  });

  return { ...state, locThreatModifiers: locThreat, nodeThreatModifiers: nodeThreat };
}

// ─── ENEMY TEMPO MANAGEMENT ──────────────────────────────────────────────────

/**
 * The enemy doesn't attack continuously. They rest, reconstitute, and surge.
 * This models operational pauses — which real adversaries use to let players
 * feel safe before striking again.
 */
export function updateEnemyTempo(
  state: EnemyIntelligenceState,
  playerReadiness: number,      // Theater avg readiness 0–100
  campaignDay: number,
  difficulty: DifficultyParameters,
): EnemyIntelligenceState {
  // Enemy recovers capacity over time
  const capacityRecovery = 3; // Per day when not active
  const newCapacity = Math.min(100, state.enemyCapacity + capacityRecovery);

  // Determine tempo
  let newTempo: EnemyIntelligenceState['currentTempo'] = state.currentTempo;

  // Enemy surges when player is weakened AND enemy has capacity
  if (playerReadiness < 50 && newCapacity > 60) {
    newTempo = 'SURGE';
  } else if (playerReadiness < 70 && newCapacity > 40 && difficulty.enemyActivityLevel > 0.5) {
    newTempo = 'HIGH';
  } else if (state.daysSinceLastMajorAction > 4 && newCapacity > 30) {
    // Enemy hasn't acted in a while — medium tempo resumption
    newTempo = 'MEDIUM';
  } else if (newCapacity < 25 || state.daysSinceLastMajorAction < 2) {
    // Enemy resting / reconstituting
    newTempo = 'LOW';
  }

  return {
    ...state,
    currentTempo: newTempo,
    enemyCapacity: newCapacity,
    daysSinceLastMajorAction: state.daysSinceLastMajorAction + 1,
  };
}

// ─── EVENT GENERATION ────────────────────────────────────────────────────────

export interface EnemyEvent {
  id: string;
  type: 'INTERDICTION' | 'DEPOT_ATTACK' | 'AIR_DENIAL' | 'CONVOY_AMBUSH' | 'INTEL_BLACKOUT';
  targetId: string;
  probability: number;    // 0–1: chance this event actually triggers
  severity: number;       // 0–1: how bad if it triggers
  day: number;
  description: string;
  isExploitingWeakness: boolean;
}

/**
 * Generate enemy events for the upcoming turn.
 * Events are proposed — probability determines if they trigger during execution.
 */
export function generateEnemyEvents(
  state: EnemyIntelligenceState,
  currentDay: number,
  difficulty: DifficultyParameters,
): EnemyEvent[] {
  const events: EnemyEvent[] = [];

  if (state.currentTempo === 'LOW') return events; // Enemy resting

  const tempoMultiplier: Record<EnemyIntelligenceState['currentTempo'], number> = {
    LOW: 0,
    MEDIUM: 0.5,
    HIGH: 0.8,
    SURGE: 1.2,
  };
  const mult = tempoMultiplier[state.currentTempo];

  // Target the highest-confidence weakness
  const primaryWeakness = state.exploitableWeaknesses
    .filter(w => w.confidence > 0.4)
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (primaryWeakness && state.enemyCapacity > 40) {
    switch (primaryWeakness.type) {
      case 'LOC_DEPENDENCY':
        events.push({
          id: `ENY_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'INTERDICTION',
          targetId: primaryWeakness.targetId,
          probability: Math.min(0.85, difficulty.enemyActivityLevel * mult * primaryWeakness.confidence * 1.2),
          severity: 0.7 + (primaryWeakness.exploitSuccesses * 0.05),
          day: currentDay,
          description: `Enemy forces identified convoy patterns on ${primaryWeakness.targetId}. IED/ambush suspected.`,
          isExploitingWeakness: true,
        });
        break;

      case 'AIR_RELIANCE':
        events.push({
          id: `ENY_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'AIR_DENIAL',
          targetId: 'AERIAL_PORT',
          probability: Math.min(0.70, difficulty.enemyActivityLevel * mult * primaryWeakness.confidence),
          severity: 0.65,
          day: currentDay,
          description: 'Intelligence reports enemy SHORAD assets moving toward aerial port approach corridor.',
          isExploitingWeakness: true,
        });
        break;

      case 'TIMING_PATTERN':
        events.push({
          id: `ENY_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'CONVOY_AMBUSH',
          targetId: 'PATTERN_DAY',
          probability: Math.min(0.75, difficulty.enemyActivityLevel * mult * primaryWeakness.confidence * 1.1),
          severity: 0.6,
          day: currentDay,
          description: 'Enemy forces appear to anticipate convoy movement on this day. Multiple ambush positions identified.',
          isExploitingWeakness: true,
        });
        break;
    }
  }

  // Random events based on activity level (not pattern-based)
  if (Math.random() < difficulty.enemyActivityLevel * mult * 0.4) {
    const randomTargets = Object.keys(state.locThreatModifiers);
    if (randomTargets.length > 0) {
      const target = randomTargets[Math.floor(Math.random() * randomTargets.length)];
      events.push({
        id: `ENY_RAND_${Date.now()}`,
        type: 'INTERDICTION',
        targetId: target,
        probability: difficulty.enemyActivityLevel * mult * 0.5,
        severity: 0.4 + Math.random() * 0.3,
        day: currentDay,
        description: 'Unattributed activity on LOC network. Enemy probing.',
        isExploitingWeakness: false,
      });
    }
  }

  return events;
}

// ─── POST-EVENT UPDATE ────────────────────────────────────────────────────────

/**
 * After events resolve, update enemy intelligence with results.
 * Successful exploits increase enemy confidence. Failed exploits reveal
 * that the player has adapted.
 */
export function processEventOutcome(
  state: EnemyIntelligenceState,
  event: EnemyEvent,
  didTrigger: boolean,
  playerResponse: 'REROUTED' | 'ABSORBED' | 'DEFENDED' | 'FAILED_TO_RESPOND',
): EnemyIntelligenceState {
  // Reduce enemy capacity when they act
  const capacityCost = event.severity * 20;
  const newCapacity = Math.max(0, state.enemyCapacity - capacityCost);

  // Update weakness confidence based on outcome
  const updatedWeaknesses = state.exploitableWeaknesses.map(weakness => {
    if (!event.isExploitingWeakness) return weakness;

    const newAttempts = weakness.exploitAttempts + (didTrigger ? 1 : 0);
    const newSuccesses = weakness.exploitSuccesses + (didTrigger && playerResponse === 'FAILED_TO_RESPOND' ? 1 : 0);

    // Player rerouting reduces confidence — they've adapted
    const confidenceDelta = playerResponse === 'REROUTED' ? -0.15
      : playerResponse === 'DEFENDED' ? -0.1
      : playerResponse === 'FAILED_TO_RESPOND' ? 0.15
      : 0;

    return {
      ...weakness,
      exploitAttempts: newAttempts,
      exploitSuccesses: newSuccesses,
      confidence: Math.max(0, Math.min(1, weakness.confidence + confidenceDelta)),
    };
  });

  const newDaysSince = didTrigger ? 0 : state.daysSinceLastMajorAction;

  return updateThreatModifiers({
    ...state,
    exploitableWeaknesses: updatedWeaknesses,
    enemyCapacity: newCapacity,
    daysSinceLastMajorAction: newDaysSince,
  });
}

// ─── INITIAL ENEMY STATE ─────────────────────────────────────────────────────

export function createInitialEnemyState(): EnemyIntelligenceState {
  return {
    patterns: {
      locUsage: {},
      airPreference: 0,
      avgCrisisResponseDays: 2,
      priorityPattern: {},
      convoyDayPattern: {},
      lateralTransferCount: 0,
      earlyReserveDepletionCount: 0,
    },
    locThreatModifiers: {},
    nodeThreatModifiers: {},
    currentTempo: 'LOW',
    daysSinceLastMajorAction: 0,
    enemyCapacity: 40, // Starts at 40 — not full strength on Day 1
    exploitableWeaknesses: [],
  };
}

// ─── ENEMY SUMMARY (for AAR) ─────────────────────────────────────────────────

export interface EnemySummary {
  totalEventsGenerated: number;
  exploitedWeaknessTypes: string[];
  mostTargetedLOC: string | null;
  airDenialAttempts: number;
  playerAdaptationScore: number;  // 0–100: how well did player break their patterns?
}

export function generateEnemySummary(state: EnemyIntelligenceState): EnemySummary {
  const mostUsedLOC = Object.entries(state.patterns.locUsage)
    .sort(([, a], [, b]) => b.useCount - a.useCount)[0]?.[0] ?? null;

  const exploitedTypes = state.exploitableWeaknesses
    .filter(w => w.exploitAttempts > 0)
    .map(w => w.type);

  const airDenial = state.exploitableWeaknesses
    .filter(w => w.type === 'AIR_RELIANCE')
    .reduce((sum, w) => sum + w.exploitAttempts, 0);

  // Adaptation score: how many weaknesses did the player eliminate?
  const eliminatedWeaknesses = state.exploitableWeaknesses.filter(w => w.confidence < 0.3).length;
  const adaptationScore = state.exploitableWeaknesses.length > 0
    ? Math.round((eliminatedWeaknesses / state.exploitableWeaknesses.length) * 100)
    : 100;

  return {
    totalEventsGenerated: state.exploitableWeaknesses.reduce((sum, w) => sum + w.exploitAttempts, 0),
    exploitedWeaknessTypes: [...new Set(exploitedTypes)],
    mostTargetedLOC: mostUsedLOC,
    airDenialAttempts: airDenial,
    playerAdaptationScore: adaptationScore,
  };
}
