/**
 * LOG ACTUAL — Engine Layer
 * Unified export and orchestration
 *
 * The engine layer integrates:
 *   - Learning Engine (adaptive skill model)
 *   - Cascade Engine (compounding failures)
 *   - Enemy Adaptation (adversary pattern exploitation)
 *   - War Cost Model (no win screen — just the cost)
 *
 * Called by the game store after each significant event.
 */

export * from './learningEngine';
export * from './cascadeEngine';
export * from './enemyAdaptation';
export * from './warCostModel';

import { processDecision, PlayerSkillModel, computeDifficultyParameters } from './learningEngine';
import { runCascadeTick, createDecisionDebt, CascadeState } from './cascadeEngine';
import { observePlayerAction, generateEnemyEvents, processEventOutcome, EnemyIntelligenceState } from './enemyAdaptation';
import { recordDailyCost, WarCost } from './warCostModel';
import { DoctrineDecision, DecisionChoice, DecisionOutcome, Unit, LOC } from '../types/game';

// ─── ORCHESTRATED DECISION PROCESSING ────────────────────────────────────────

/**
 * Master function called after each doctrine decision.
 * Integrates learning, cascades, and enemy response.
 */
export function orchestrateDecisionOutcome(params: {
  model: PlayerSkillModel;
  decision: DoctrineDecision;
  outcome: DecisionOutcome;
  choice: DecisionChoice;
  cascadeState: CascadeState;
  enemyState: EnemyIntelligenceState;
  currentDay: number;
  affectedUnitIds: string[];
  affectedLocIds: string[];
}): {
  updatedModel: PlayerSkillModel;
  updatedCascadeState: CascadeState;
  updatedEnemyState: EnemyIntelligenceState;
} {
  const { model, decision, outcome, choice, cascadeState, enemyState, currentDay, affectedUnitIds, affectedLocIds } = params;

  const difficulty = computeDifficultyParameters(model, currentDay, 30);

  // Update learning model
  const updatedModel = processDecision(model, decision, outcome, choice, currentDay, difficulty);

  // Create decision debt if outcome was poor
  let updatedCascadeState = cascadeState;
  if (outcome === 'SUBOPTIMAL' || outcome === 'FAILURE') {
    const debt = createDecisionDebt(
      outcome,
      decision.type,
      affectedUnitIds,
      affectedLocIds,
      currentDay,
      difficulty,
    );
    if (debt) {
      updatedCascadeState = {
        ...cascadeState,
        debts: [...cascadeState.debts, debt],
      };
    }
  }

  // Observe player decision for enemy pattern tracking
  const updatedEnemyState = observePlayerAction(enemyState, 'DECISION', {
    unitId: affectedUnitIds[0],
    day: currentDay,
  });

  return { updatedModel, updatedCascadeState, updatedEnemyState };
}

// ─── ORCHESTRATED DAILY TICK ──────────────────────────────────────────────────

/**
 * Master function called at end of each EXECUTION phase.
 */
export function orchestrateDailyTick(params: {
  model: PlayerSkillModel;
  cascadeState: CascadeState;
  enemyState: EnemyIntelligenceState;
  warCost: WarCost;
  units: Record<string, Unit>;
  locs: Record<string, LOC>;
  currentDay: number;
  avgReadiness: number;
}): {
  updatedCascadeState: CascadeState;
  updatedEnemyState: EnemyIntelligenceState;
  updatedWarCost: WarCost;
  triggeredCascades: string[];
  enemyEvents: ReturnType<typeof generateEnemyEvents>;
  unitUpdates: Record<string, Partial<Unit>>;
  locUpdates: Record<string, Partial<LOC>>;
} {
  const { model, cascadeState, enemyState, warCost, units, locs, currentDay, avgReadiness } = params;
  const difficulty = computeDifficultyParameters(model, currentDay, 30);

  // Run cascade tick
  const { cascadeState: newCascadeState, triggeredEvents, unitUpdates, locUpdates } =
    runCascadeTick(cascadeState, units, locs, currentDay, difficulty);

  // Update enemy
  const updatedEnemy = processEventOutcome(
    observePlayerAction(enemyState, 'DECISION', { day: currentDay }),
    { id: '', type: 'INTERDICTION', targetId: '', probability: 0, severity: 0, day: currentDay, description: '', isExploitingWeakness: false },
    false,
    'ABSORBED',
  );

  // Generate enemy events for next turn
  const enemyEvents = generateEnemyEvents(updatedEnemy, currentDay, difficulty);

  // Record war cost
  const updatedWarCost = recordDailyCost(warCost, units, currentDay);

  const triggeredCascades = triggeredEvents.map(e => e.effect.message);

  return {
    updatedCascadeState: newCascadeState,
    updatedEnemyState: updatedEnemy,
    updatedWarCost,
    triggeredCascades,
    enemyEvents,
    unitUpdates,
    locUpdates,
  };
}
