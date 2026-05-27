/**
 * LOG ACTUAL — Adaptive Learning Engine
 * KibuglogalVentures LLC
 *
 * Philosophy: War is not a game you win. It is a system you manage — imperfectly,
 * under duress, with incomplete information, against an adversary who does not
 * cooperate. This engine models that reality.
 *
 * The player never "masters" logistics. They get better at failing less badly.
 *
 * Architecture:
 *   1. Bayesian Skill Model — per-doctrine rating with uncertainty collapse
 *   2. Ebbinghaus Forgetting Curve — skills decay without practice
 *   3. TrueSkill-Adjacent Rating — accounts for decision difficulty
 *   4. Tilt Detection — recognizes cognitive overload spirals
 *   5. Mastery Gating — harder scenarios unlock only via demonstrated competence
 *   6. Transfer Learning — adjacent doctrine skills share partial credit
 *   7. Performance Memory — 90-day rolling window for long-term tracking
 */

import { DoctrineDecision, DecisionChoice, DecisionOutcome } from '../types/game';

// ─── DOCTRINE CATEGORIES ─────────────────────────────────────────────────────

export type DoctrineCategory =
  | 'PUSH_PULL'
  | 'PRIORITY'
  | 'LOC_MANAGEMENT'
  | 'AIR_GROUND'
  | 'TRIAGE'
  | 'ECONOMY_OF_FORCE'
  | 'PRE_POSITION';

// Transfer learning graph: mastering A partially credits B
// Values: 0–1.0 (1.0 = full transfer, 0 = no transfer)
export const DOCTRINE_TRANSFER_GRAPH: Record<DoctrineCategory, Partial<Record<DoctrineCategory, number>>> = {
  PUSH_PULL:        { PRE_POSITION: 0.4, PRIORITY: 0.2 },
  PRIORITY:         { TRIAGE: 0.5, ECONOMY_OF_FORCE: 0.3 },
  LOC_MANAGEMENT:   { AIR_GROUND: 0.35, PRE_POSITION: 0.2 },
  AIR_GROUND:       { LOC_MANAGEMENT: 0.35, PRIORITY: 0.15 },
  TRIAGE:           { PRIORITY: 0.4, ECONOMY_OF_FORCE: 0.4 },
  ECONOMY_OF_FORCE: { TRIAGE: 0.3, PRE_POSITION: 0.3 },
  PRE_POSITION:     { PUSH_PULL: 0.35, LOC_MANAGEMENT: 0.2 },
};

// ─── MASTERY LEVELS ──────────────────────────────────────────────────────────

export type MasteryLevel =
  | 'NOVICE'          // 0–24:  Basic scenarios. Some forgiveness. Learn the system.
  | 'FAMILIAR'        // 25–39: Standard complexity. Errors have real cost.
  | 'COMPETENT'       // 40–59: Multi-variable scenarios. No free lunch.
  | 'PROFICIENT'      // 60–74: Simultaneous crises. No good answers, only less bad.
  | 'EXPERT'          // 75–89: Historical failure replicas. Enemy adapts to you.
  | 'IRON_LOGISTICIAN'; // 90+: You've seen the real cost of war. Every win is partial.

export const MASTERY_THRESHOLDS: Record<MasteryLevel, number> = {
  NOVICE: 0,
  FAMILIAR: 25,
  COMPETENT: 40,
  PROFICIENT: 60,
  EXPERT: 75,
  IRON_LOGISTICIAN: 90,
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  NOVICE:           'Novice — Learning the system',
  FAMILIAR:         'Familiar — Errors have consequences',
  COMPETENT:        'Competent — No free lunch',
  PROFICIENT:       'Proficient — No good answers',
  EXPERT:           'Expert — The enemy knows your patterns',
  IRON_LOGISTICIAN: 'Iron Logistician — Every win costs something',
};

// ─── TILT STATE ──────────────────────────────────────────────────────────────

export type TiltSeverity = 'NONE' | 'WATCH' | 'TILT' | 'CRITICAL_TILT';

export interface TiltState {
  severity: TiltSeverity;
  consecutivePoorDecisions: number;    // Failure or Suboptimal in a row
  decisionVelocity: number;            // Decisions per session (high = rushing)
  lastTiltDay: number;
  tiltHistory: Array<{ day: number; severity: TiltSeverity; trigger: string }>;
}

// ─── SKILL SNAPSHOT ──────────────────────────────────────────────────────────

export interface SkillSnapshot {
  day: number;
  rating: number;
  uncertainty: number;
  decision: DecisionOutcome;
  decisionId: string;
}

// ─── DOCTRINE SKILL ──────────────────────────────────────────────────────────

export interface DoctrineSkill {
  category: DoctrineCategory;

  // Bayesian skill rating: μ = mean estimate, σ² = uncertainty (variance)
  // Display rating = μ - 2σ (conservative estimate — penalizes inconsistency)
  mu: number;            // Mean estimate: 0–100
  sigma2: number;        // Variance: starts high (unknown), collapses with evidence

  // Ebbinghaus forgetting curve
  lastPracticedDay: number;
  decayRate: number;     // Per-player decay rate (calibrated over time)

  // Performance tracking
  decisionCount: number;
  optimalCount: number;
  acceptableCount: number;
  suboptimalCount: number;
  failureCount: number;

  // Streak tracking
  currentStreak: number;   // Positive = good streak, negative = bad
  bestStreak: number;
  worstStreak: number;

  // Historical record
  history: SkillSnapshot[];
}

// ─── PLAYER SKILL MODEL ──────────────────────────────────────────────────────

export interface PlayerSkillModel {
  playerId: string;
  skills: Record<DoctrineCategory, DoctrineSkill>;
  overallRating: number;          // Weighted composite of all skill ratings
  displayRating: number;          // Conservative estimate (μ - 2σ composite)
  masteryLevel: MasteryLevel;
  tilt: TiltState;

  // Session tracking
  sessionDecisionCount: number;
  sessionStartDay: number;

  // Long-term memory: rolling 90-day performance window
  performanceWindow: Array<{
    day: number;
    outcome: DecisionOutcome;
    category: DoctrineCategory;
    difficulty: number;
  }>;

  // Calibration: how well does the player know their own limits?
  // Measured by: did they pick the option they were most likely to know?
  calibrationScore: number;

  // War cost awareness: does the player understand that "winning" decisions
  // still have costs? Tracked by reviewing effect acknowledgements.
  warCostAwareness: number;   // 0–100: 0 = thinks all optimal choices are free, 100 = understands every choice has a price
}

// ─── DIFFICULTY PARAMETERS ───────────────────────────────────────────────────

export interface DifficultyParameters {
  // Scenario generation weights per category
  categoryWeights: Record<DoctrineCategory, number>;

  // Time pressure (how many turns until deadline on average)
  averageDeadlineHours: number;

  // Enemy activity level (affects interdiction probability)
  enemyActivityLevel: number;    // 0–1

  // Cascade probability (how likely are poor decisions to trigger compounding events)
  cascadeProbability: number;    // 0–1

  // Noise in effects (real war is uncertain — outcomes vary from expected)
  effectNoiseAmplitude: number;  // 0–1 (0 = deterministic, 1 = highly variable)

  // How many simultaneous crises can appear
  maxSimultaneousCrises: number;

  // Recovery speed (how fast does the system let a player dig out of a hole)
  recoveryMultiplier: number;    // < 1 = slow recovery (punishing), > 1 = faster
}

// ─── K-FACTOR SYSTEM (Elo-adjacent) ─────────────────────────────────────────

/**
 * K-factor determines how much a single decision moves the rating.
 * - Early decisions (high uncertainty): large K (fast learning)
 * - Later decisions (low uncertainty): small K (stable rating)
 * - Difficulty modifier: harder scenarios have larger K in both directions
 * - Mastery modifier: higher mastery = harder to improve, easier to fall
 */
function computeKFactor(skill: DoctrineSkill, decisionDifficulty: number, masteryLevel: MasteryLevel): number {
  // Base K collapses as certainty increases
  const baseK = Math.max(4, 32 * Math.sqrt(skill.sigma2 / 400));

  // Difficulty multiplier: hard decisions move the needle more
  const difficultyMult = 0.7 + (decisionDifficulty * 0.6);

  // Mastery modifier: experts are harder to move up, easier to fall
  const masteryMods: Record<MasteryLevel, number> = {
    NOVICE: 1.4,
    FAMILIAR: 1.2,
    COMPETENT: 1.0,
    PROFICIENT: 0.85,
    EXPERT: 0.70,
    IRON_LOGISTICIAN: 0.55,
  };

  return baseK * difficultyMult * masteryMods[masteryLevel];
}

// ─── EBBINGHAUS FORGETTING CURVE ─────────────────────────────────────────────

/**
 * R = e^(-t/S)
 * R = retention (0–1)
 * t = time since last practice (days)
 * S = stability coefficient (higher = slower decay)
 *
 * Stability S increases with each successful review:
 *   - First learned: S = 1 (fast decay)
 *   - After 3 correct reviews: S = 4
 *   - After 10 correct reviews: S = 12
 *   - Expert with many reviews: S = 30+ (very slow decay)
 */
function computeRetention(skill: DoctrineSkill, currentDay: number): number {
  const daysSince = Math.max(0, currentDay - skill.lastPracticedDay);

  // Stability grows with mastery of this specific doctrine
  const correctReviews = skill.optimalCount + (skill.acceptableCount * 0.5);
  const stability = Math.max(1, Math.min(30, 1 + (correctReviews * 0.8)));

  return Math.exp(-daysSince / stability);
}

/**
 * Apply forgetting curve decay to a skill rating.
 * Returns the decayed rating — the difference is the "forgotten" amount.
 */
export function applyForgettingCurve(skill: DoctrineSkill, currentDay: number): DoctrineSkill {
  const retention = computeRetention(skill, currentDay);

  // Forgetting pulls rating toward 40 (below average — war is hard)
  const forgettingFloor = 40;
  const decayedMu = forgettingFloor + (skill.mu - forgettingFloor) * retention;

  // Uncertainty grows as time passes without practice
  const daysSince = Math.max(0, currentDay - skill.lastPracticedDay);
  const uncertaintyGrowth = Math.min(100, skill.sigma2 + (daysSince * 0.8));

  return {
    ...skill,
    mu: Math.max(0, decayedMu),
    sigma2: Math.min(400, uncertaintyGrowth),
  };
}

// ─── OUTCOME → SCORE MAPPING ─────────────────────────────────────────────────

const OUTCOME_SCORE: Record<DecisionOutcome, number> = {
  OPTIMAL:    1.0,    // Full credit
  ACCEPTABLE: 0.5,    // Partial credit — acceptable isn't good
  SUBOPTIMAL: -0.3,   // Negative — this was a bad decision
  FAILURE:    -1.0,   // Full negative — catastrophic
};

// ─── EXPECTED PERFORMANCE ────────────────────────────────────────────────────

/**
 * Expected score based on current rating vs. decision difficulty.
 * Rating 50 vs. difficulty 50 = 0.5 (coin flip)
 * Rating 80 vs. difficulty 50 = ~0.8 (favored)
 * Rating 30 vs. difficulty 70 = ~0.2 (likely to fail)
 */
function computeExpectedScore(skillRating: number, decisionDifficulty: number): number {
  return 1 / (1 + Math.pow(10, (decisionDifficulty - skillRating) / 25));
}

// ─── CORE SKILL UPDATE ───────────────────────────────────────────────────────

/**
 * Update a skill rating after a decision.
 * Uses Bayesian updating with Elo-style K-factor.
 *
 * The actual score vs. expected score delta drives the update.
 * Surprise in both directions moves the rating more than expected outcomes.
 */
export function updateSkill(
  skill: DoctrineSkill,
  outcome: DecisionOutcome,
  decisionDifficulty: number,  // 0–100: how hard was this decision?
  masteryLevel: MasteryLevel,
  currentDay: number,
): DoctrineSkill {
  // First apply forgetting for time since last practice
  const decayedSkill = applyForgettingCurve(skill, currentDay);

  const actualScore = OUTCOME_SCORE[outcome];
  const expectedScore = computeExpectedScore(decayedSkill.mu, decisionDifficulty);
  const K = computeKFactor(decayedSkill, decisionDifficulty, masteryLevel);

  // Rating update
  const delta = K * (actualScore - expectedScore);
  const newMu = Math.max(0, Math.min(100, decayedSkill.mu + delta));

  // Uncertainty collapses with each decision (Bayesian update)
  // More uncertainty = larger sigma2. Practice reduces it.
  const uncertaintyReduction = actualScore > 0 ? 8 : 4; // Correct answers reduce uncertainty faster
  const newSigma2 = Math.max(4, decayedSkill.sigma2 - uncertaintyReduction);

  // Streak tracking
  const isGood = outcome === 'OPTIMAL' || outcome === 'ACCEPTABLE';
  const newStreak = isGood ? Math.max(0, decayedSkill.currentStreak) + 1 : Math.min(0, decayedSkill.currentStreak) - 1;

  // Performance counters
  const updated: DoctrineSkill = {
    ...decayedSkill,
    mu: newMu,
    sigma2: newSigma2,
    lastPracticedDay: currentDay,
    decisionCount: decayedSkill.decisionCount + 1,
    optimalCount: decayedSkill.optimalCount + (outcome === 'OPTIMAL' ? 1 : 0),
    acceptableCount: decayedSkill.acceptableCount + (outcome === 'ACCEPTABLE' ? 1 : 0),
    suboptimalCount: decayedSkill.suboptimalCount + (outcome === 'SUBOPTIMAL' ? 1 : 0),
    failureCount: decayedSkill.failureCount + (outcome === 'FAILURE' ? 1 : 0),
    currentStreak: newStreak,
    bestStreak: Math.max(decayedSkill.bestStreak, newStreak),
    worstStreak: Math.min(decayedSkill.worstStreak, newStreak),
    history: [...decayedSkill.history.slice(-49), { // Keep last 50 snapshots
      day: currentDay,
      rating: newMu,
      uncertainty: newSigma2,
      decision: outcome,
      decisionId: '',
    }],
  };

  return updated;
}

// ─── TRANSFER LEARNING ───────────────────────────────────────────────────────

/**
 * After updating the primary skill, apply partial credit to adjacent skills.
 * If you master PUSH_PULL, you get 40% of that improvement in PRE_POSITION.
 * This models the real cognitive transfer in doctrine learning.
 */
export function applyTransferLearning(
  skills: Record<DoctrineCategory, DoctrineSkill>,
  updatedCategory: DoctrineCategory,
  rawDelta: number,
  currentDay: number,
): Record<DoctrineCategory, DoctrineSkill> {
  const transfers = DOCTRINE_TRANSFER_GRAPH[updatedCategory];
  if (!transfers || rawDelta <= 0) return skills; // Only transfer positive improvements

  const updatedSkills = { ...skills };

  Object.entries(transfers).forEach(([targetCategory, transferRate]) => {
    const target = updatedSkills[targetCategory as DoctrineCategory];
    if (!target) return;

    const transferDelta = rawDelta * (transferRate as number) * 0.5; // Halved for transfer
    const decayed = applyForgettingCurve(target, currentDay);
    updatedSkills[targetCategory as DoctrineCategory] = {
      ...decayed,
      mu: Math.min(100, decayed.mu + transferDelta),
    };
  });

  return updatedSkills;
}

// ─── TILT DETECTION ──────────────────────────────────────────────────────────

/**
 * Tilt: cognitive state where mounting failures cause degraded decision-making.
 * Named after poker — a player on tilt makes irrational decisions.
 *
 * In war, tilt kills. A logistics officer who panics under compounding failures
 * makes decisions that cascade into theater-wide collapse.
 *
 * Detection criteria:
 *   - WATCH: 2 consecutive poor decisions, or decision velocity > 3/session
 *   - TILT: 3+ consecutive poor decisions, or 2+ failures in 5 decisions
 *   - CRITICAL: 4+ consecutive, or 3+ failures in 5, or FAILURE after TILT
 *
 * Response:
 *   - WATCH: No change. Player unaware.
 *   - TILT: Subtle pressure reduction (1 fewer simultaneous crisis)
 *   - CRITICAL: Brief breathing room. System "absorbs" one random event.
 *
 * Note: Tilt is NEVER announced to the player. It operates invisibly.
 * Announcing it would break immersion and the psychological realism.
 */
export function detectTilt(
  currentTilt: TiltState,
  recentOutcomes: DecisionOutcome[],
  sessionDecisionCount: number,
  currentDay: number,
): TiltState {
  const recent5 = recentOutcomes.slice(-5);
  const recent3 = recentOutcomes.slice(-3);

  const failuresIn5 = recent5.filter(o => o === 'FAILURE').length;
  const poorIn3 = recent3.filter(o => o === 'FAILURE' || o === 'SUBOPTIMAL').length;

  // Consecutive poor decisions
  let consecutivePoor = 0;
  for (let i = recentOutcomes.length - 1; i >= 0; i--) {
    if (recentOutcomes[i] === 'FAILURE' || recentOutcomes[i] === 'SUBOPTIMAL') {
      consecutivePoor++;
    } else break;
  }

  // Decision velocity (rushing = poor decisions)
  const velocity = sessionDecisionCount;

  let severity: TiltSeverity = 'NONE';

  if (consecutivePoor >= 4 || failuresIn5 >= 3) {
    severity = 'CRITICAL_TILT';
  } else if (consecutivePoor >= 3 || (failuresIn5 >= 2 && currentTilt.severity !== 'NONE')) {
    severity = 'TILT';
  } else if (consecutivePoor >= 2 || (velocity > 6 && poorIn3 >= 2)) {
    severity = 'WATCH';
  }

  const tiltEntry = severity !== 'NONE' && severity !== currentTilt.severity
    ? [{ day: currentDay, severity, trigger: `${consecutivePoor} consecutive poor decisions` }]
    : [];

  return {
    severity,
    consecutivePoorDecisions: consecutivePoor,
    decisionVelocity: velocity,
    lastTiltDay: severity !== 'NONE' ? currentDay : currentTilt.lastTiltDay,
    tiltHistory: [...currentTilt.tiltHistory.slice(-19), ...tiltEntry],
  };
}

// ─── ADAPTIVE DIFFICULTY ENGINE ──────────────────────────────────────────────

/**
 * Computes difficulty parameters based on player skill model.
 *
 * Core principle: the game is NOT designed to be beatable at high difficulty.
 * It is designed to be survivable — the question is how long you survive
 * and at what cost. Real logistics is attrition management, not victory.
 *
 * Difficulty scaling:
 *   - Category weights: weak areas appear more often (exploit weaknesses)
 *   - Cascade probability scales with overall poor performance
 *   - Enemy activity increases when player finds a comfortable pattern
 *   - Recovery becomes slower as campaign extends (war is exhausting)
 *   - Noise increases at expert levels (reality is uncertain)
 */
export function computeDifficultyParameters(
  model: PlayerSkillModel,
  campaignDay: number,
  totalDays: number,
): DifficultyParameters {
  const campaignProgress = campaignDay / totalDays;

  // Category weights: inversely proportional to skill rating
  // Weak areas (low skill) are targeted more frequently
  // Explorationfactor: still see mastered areas sometimes (20% floor)
  const categoryWeights = {} as Record<DoctrineCategory, number>;
  const categories: DoctrineCategory[] = [
    'PUSH_PULL', 'PRIORITY', 'LOC_MANAGEMENT', 'AIR_GROUND',
    'TRIAGE', 'ECONOMY_OF_FORCE', 'PRE_POSITION',
  ];

  const skillValues = categories.map(cat => ({
    cat,
    rating: model.skills[cat].mu,
    displayRating: Math.max(0, model.skills[cat].mu - 2 * Math.sqrt(model.skills[cat].sigma2)),
  }));

  const totalInverseRating = skillValues.reduce((sum, s) => sum + (100 - s.displayRating), 0);

  categories.forEach(cat => {
    const inverseRating = 100 - (skillValues.find(s => s.cat === cat)?.displayRating ?? 50);
    // 80% exploitative (target weakness), 20% exploratory (random)
    categoryWeights[cat] = Math.max(0.1, (inverseRating / totalInverseRating) * 0.8 + (1 / 7) * 0.2);
  });

  // Average skill for scaling
  const avgSkill = skillValues.reduce((sum, s) => sum + s.displayRating, 0) / skillValues.length;

  // Deadline pressure increases with campaign progress and skill
  const basePressureHours = 72 - (avgSkill * 0.4) - (campaignProgress * 20);
  const averageDeadlineHours = Math.max(12, basePressureHours);

  // Enemy activity: starts low, ramps with campaign AND with player pattern exploitation
  const baseEnemyActivity = 0.2 + (campaignProgress * 0.5);
  const patternExploitation = model.overallRating > 60 ? 0.15 : 0; // Enemy adapts when player gets good
  const tiltModifier = model.tilt.severity === 'CRITICAL_TILT' ? -0.15 : 0; // Relief when tilting
  const enemyActivityLevel = Math.min(0.95, Math.max(0.05, baseEnemyActivity + patternExploitation + tiltModifier));

  // Cascade probability: poor players get more cascades (realistic — errors compound)
  const baseCascade = 0.15 + ((100 - avgSkill) / 100) * 0.35;
  const cascadeProbability = Math.min(0.85, Math.max(0.05, baseCascade));

  // Effect noise: reality is uncertain. Expert players deal with more noise.
  const baseNoise = 0.1 + (avgSkill / 100) * 0.25;
  const effectNoiseAmplitude = Math.min(0.5, Math.max(0.05, baseNoise));

  // Simultaneous crises: scales with mastery
  const masteryLevelIndex: Record<MasteryLevel, number> = {
    NOVICE: 0, FAMILIAR: 1, COMPETENT: 2, PROFICIENT: 3, EXPERT: 4, IRON_LOGISTICIAN: 5,
  };
  const masteryIndex = masteryLevelIndex[model.masteryLevel];
  const maxSimultaneousCrises = Math.min(4, 1 + Math.floor(masteryIndex * 0.8));

  // Recovery speed: slower as campaign extends and as player gets better
  // (war is exhausting — you can't always bounce back quickly)
  const baseRecovery = 1.2 - (campaignProgress * 0.4) - (avgSkill / 100 * 0.3);
  const recoveryMultiplier = Math.max(0.4, Math.min(1.5, baseRecovery));

  return {
    categoryWeights,
    averageDeadlineHours,
    enemyActivityLevel,
    cascadeProbability,
    effectNoiseAmplitude,
    maxSimultaneousCrises,
    recoveryMultiplier,
  };
}

// ─── SCENARIO SELECTION ──────────────────────────────────────────────────────

/**
 * Select which doctrine category the next scenario should target.
 * Uses weighted random selection based on difficulty parameters.
 *
 * Never serves the same category twice in a row (no consecutive drilling).
 * Minimum 1 gap between categories to prevent monotony.
 */
export function selectNextDoctrineCategory(
  difficulty: DifficultyParameters,
  recentCategories: DoctrineCategory[],
  availableDecisions: DoctrineDecision[],
): DoctrineCategory {
  const lastCategory = recentCategories[recentCategories.length - 1];

  // Get available categories from remaining decisions
  const availableCategories = new Set(
    availableDecisions.map(d => d.type as DoctrineCategory)
  );

  // Filter out the immediately previous category (no consecutive repeats)
  const eligibleCategories = Object.entries(difficulty.categoryWeights)
    .filter(([cat]) => cat !== lastCategory && availableCategories.has(cat as DoctrineCategory))
    .map(([cat, weight]) => ({ cat: cat as DoctrineCategory, weight: weight as number }));

  if (eligibleCategories.length === 0) return lastCategory; // Fallback

  // Weighted random selection
  const totalWeight = eligibleCategories.reduce((sum, c) => sum + c.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const { cat, weight } of eligibleCategories) {
    rand -= weight;
    if (rand <= 0) return cat;
  }

  return eligibleCategories[eligibleCategories.length - 1].cat;
}

// ─── DECISION DIFFICULTY CALCULATOR ─────────────────────────────────────────

/**
 * Computes the difficulty of a specific decision (0–100).
 * Difficulty is determined by:
 *   - Number of acceptable/optimal choices (fewer = harder)
 *   - Time pressure (deadline hours)
 *   - Simultaneous events in the game state
 *   - Campaign day (later = harder)
 *   - Force multiplier bonus (higher bonus = harder decision)
 */
export function computeDecisionDifficulty(
  decision: DoctrineDecision,
  deadlineHours: number,
  simultaneousCrises: number,
  campaignDay: number,
): number {
  // Choice distribution difficulty
  const optimalCount = decision.choices.filter(c => c.outcome === 'OPTIMAL').length;
  const goodChoiceRatio = optimalCount / decision.choices.length;
  const choiceDifficulty = (1 - goodChoiceRatio) * 40; // 0–40 points

  // Time pressure
  const timePressure = Math.max(0, Math.min(25, (48 - deadlineHours) / 48 * 25)); // 0–25 points

  // Simultaneous crises
  const crisisPressure = Math.min(15, simultaneousCrises * 5); // 0–15 points

  // Campaign day pressure
  const dayPressure = Math.min(10, (campaignDay / 30) * 10); // 0–10 points

  // Force multiplier as difficulty signal
  const bonusDifficulty = Math.min(10, (decision.forceMultiplierBonus / 20) * 10); // 0–10 points

  return Math.min(100, choiceDifficulty + timePressure + crisisPressure + dayPressure + bonusDifficulty);
}

// ─── OVERALL RATING ──────────────────────────────────────────────────────────

/**
 * Compute overall player rating from individual doctrine skills.
 * Weighted by:
 *   - Category importance (PRIORITY and TRIAGE are highest weight)
 *   - Decision count (more-practiced skills carry more weight)
 *   - Conservative estimate (mu - 2√σ²)
 */
const CATEGORY_IMPORTANCE: Record<DoctrineCategory, number> = {
  PUSH_PULL:        0.18,
  PRIORITY:         0.22,
  LOC_MANAGEMENT:   0.15,
  AIR_GROUND:       0.12,
  TRIAGE:           0.20,
  ECONOMY_OF_FORCE: 0.08,
  PRE_POSITION:     0.05,
};

export function computeOverallRating(skills: Record<DoctrineCategory, DoctrineSkill>): {
  overallRating: number;
  displayRating: number;
  masteryLevel: MasteryLevel;
} {
  const categories = Object.keys(skills) as DoctrineCategory[];

  let weightedSum = 0;
  let displayWeightedSum = 0;
  let totalWeight = 0;

  categories.forEach(cat => {
    const skill = skills[cat];
    const importance = CATEGORY_IMPORTANCE[cat] ?? 0.1;
    const experienceWeight = Math.min(2, 1 + skill.decisionCount * 0.1);
    const weight = importance * experienceWeight;

    const displayRating = Math.max(0, skill.mu - 2 * Math.sqrt(skill.sigma2));

    weightedSum += skill.mu * weight;
    displayWeightedSum += displayRating * weight;
    totalWeight += weight;
  });

  const overallRating = totalWeight > 0 ? weightedSum / totalWeight : 40;
  const displayRating = totalWeight > 0 ? displayWeightedSum / totalWeight : 30;

  // Determine mastery level from display rating
  let masteryLevel: MasteryLevel = 'NOVICE';
  const sortedThresholds = Object.entries(MASTERY_THRESHOLDS)
    .sort(([, a], [, b]) => b - a);

  for (const [level, threshold] of sortedThresholds) {
    if (displayRating >= threshold) {
      masteryLevel = level as MasteryLevel;
      break;
    }
  }

  return { overallRating, displayRating, masteryLevel };
}

// ─── INITIAL SKILL MODEL ─────────────────────────────────────────────────────

/**
 * Create a new player skill model.
 * All skills start at mu=40, sigma2=400 (high uncertainty, below-average prior).
 * Prior is pessimistic: we assume a new player doesn't know doctrine.
 * The game teaches it.
 */
export function createPlayerSkillModel(playerId: string): PlayerSkillModel {
  const categories: DoctrineCategory[] = [
    'PUSH_PULL', 'PRIORITY', 'LOC_MANAGEMENT', 'AIR_GROUND',
    'TRIAGE', 'ECONOMY_OF_FORCE', 'PRE_POSITION',
  ];

  const skills = {} as Record<DoctrineCategory, DoctrineSkill>;

  categories.forEach(cat => {
    skills[cat] = {
      category: cat,
      mu: 40,        // Below-average prior — we assume no knowledge
      sigma2: 400,   // High uncertainty — maximum openness to learning
      lastPracticedDay: 0,
      decayRate: 0.85,
      decisionCount: 0,
      optimalCount: 0,
      acceptableCount: 0,
      suboptimalCount: 0,
      failureCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      worstStreak: 0,
      history: [],
    };
  });

  const { overallRating, displayRating, masteryLevel } = computeOverallRating(skills);

  return {
    playerId,
    skills,
    overallRating,
    displayRating,
    masteryLevel,
    tilt: {
      severity: 'NONE',
      consecutivePoorDecisions: 0,
      decisionVelocity: 0,
      lastTiltDay: -1,
      tiltHistory: [],
    },
    sessionDecisionCount: 0,
    sessionStartDay: 0,
    performanceWindow: [],
    calibrationScore: 50,
    warCostAwareness: 0,
  };
}

// ─── MASTER UPDATE FUNCTION ──────────────────────────────────────────────────

/**
 * Process a completed decision and update all model components.
 * This is the main entry point called by the game engine after each decision.
 *
 * Returns the fully updated PlayerSkillModel.
 */
export function processDecision(
  model: PlayerSkillModel,
  decision: DoctrineDecision,
  outcome: DecisionOutcome,
  chosenChoice: DecisionChoice,
  currentDay: number,
  currentDifficulty: DifficultyParameters,
): PlayerSkillModel {
  const category = decision.type as DoctrineCategory;

  // Compute decision difficulty
  const decisionDifficulty = computeDecisionDifficulty(
    decision,
    currentDifficulty.averageDeadlineHours,
    currentDifficulty.maxSimultaneousCrises,
    currentDay,
  );

  // Update primary skill
  const prevMu = model.skills[category].mu;
  const updatedPrimarySkill = updateSkill(
    model.skills[category],
    outcome,
    decisionDifficulty,
    model.masteryLevel,
    currentDay,
  );
  const rawDelta = updatedPrimarySkill.mu - prevMu;

  // Apply transfer learning to adjacent skills
  let updatedSkills = {
    ...model.skills,
    [category]: updatedPrimarySkill,
  };
  updatedSkills = applyTransferLearning(updatedSkills, category, rawDelta, currentDay);

  // Recompute overall rating
  const { overallRating, displayRating, masteryLevel } = computeOverallRating(updatedSkills);

  // Build recent outcome history for tilt detection
  const recentOutcomes = [
    ...model.performanceWindow.slice(-9).map(p => p.outcome),
    outcome,
  ];

  // Update tilt state
  const newTilt = detectTilt(
    model.tilt,
    recentOutcomes,
    model.sessionDecisionCount + 1,
    currentDay,
  );

  // Update war cost awareness
  // Players who understand costs acknowledge effects — modeled by reviewing optimal choices
  // that still have negative effects
  const optimalWithCost = outcome === 'OPTIMAL' && chosenChoice.effects.some(e => e.delta < 0);
  const newWarCostAwareness = optimalWithCost
    ? Math.min(100, model.warCostAwareness + 5)
    : model.warCostAwareness;

  // Update performance window (rolling 90 entries)
  const newWindow = [
    ...model.performanceWindow.slice(-89),
    { day: currentDay, outcome, category, difficulty: decisionDifficulty },
  ];

  return {
    ...model,
    skills: updatedSkills,
    overallRating,
    displayRating,
    masteryLevel,
    tilt: newTilt,
    sessionDecisionCount: model.sessionDecisionCount + 1,
    performanceWindow: newWindow,
    warCostAwareness: newWarCostAwareness,
  };
}

// ─── PERFORMANCE REPORT ──────────────────────────────────────────────────────

export interface PerformanceReport {
  overallRating: number;
  displayRating: number;
  masteryLevel: MasteryLevel;
  masteryLabel: string;
  strongestCategory: DoctrineCategory;
  weakestCategory: DoctrineCategory;
  doctrineAccuracy: number;
  totalDecisions: number;
  optimalRate: number;
  failureRate: number;
  worstStreak: number;
  bestStreak: number;
  tiltEvents: number;
  warCostAwareness: number;
  categoryBreakdown: Array<{
    category: DoctrineCategory;
    rating: number;
    decisions: number;
    optimalRate: number;
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'UNTESTED';
  }>;
  theaterVerdict: string;
}

export function generatePerformanceReport(model: PlayerSkillModel): PerformanceReport {
  const categories = Object.keys(model.skills) as DoctrineCategory[];

  let totalDecisions = 0;
  let totalOptimal = 0;
  let totalFailures = 0;
  let strongest = categories[0];
  let weakest = categories[0];

  const categoryBreakdown = categories.map(cat => {
    const skill = model.skills[cat];
    totalDecisions += skill.decisionCount;
    totalOptimal += skill.optimalCount;
    totalFailures += skill.failureCount;

    if (skill.mu > model.skills[strongest].mu) strongest = cat;
    if (skill.mu < model.skills[weakest].mu) weakest = cat;

    // Trend: compare last 3 history entries
    const hist = skill.history;
    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'UNTESTED' = 'UNTESTED';
    if (hist.length >= 3) {
      const recent = hist.slice(-3).map(h => h.rating);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      if (avg > skill.mu + 3) trend = 'IMPROVING';
      else if (avg < skill.mu - 3) trend = 'DECLINING';
      else trend = 'STABLE';
    } else if (hist.length > 0) {
      trend = 'STABLE';
    }

    return {
      category: cat,
      rating: Math.round(Math.max(0, skill.mu - 2 * Math.sqrt(skill.sigma2))),
      decisions: skill.decisionCount,
      optimalRate: skill.decisionCount > 0 ? Math.round((skill.optimalCount / skill.decisionCount) * 100) : 0,
      trend,
    };
  });

  const optimalRate = totalDecisions > 0 ? Math.round((totalOptimal / totalDecisions) * 100) : 0;
  const failureRate = totalDecisions > 0 ? Math.round((totalFailures / totalDecisions) * 100) : 0;

  // Theater verdict: this is not a win/loss. It is an assessment of the cost paid.
  const verdicts: Record<MasteryLevel, string> = {
    NOVICE:           'The theater held — barely. Supply lines collapsed in three sectors. Casualties from sustainment failures will be tallied for months.',
    FAMILIAR:         'Operations sustained. Not elegantly. The gaps in your distribution plan cost lives and time. Some units never recovered from stonewall.',
    COMPETENT:        'You kept the fight going. The costs were high. Several decisions that seemed acceptable in the moment left lasting damage. War charges interest.',
    PROFICIENT:       'The campaign succeeded under your sustainment. The doctrine you applied was mostly sound. The failures were real — every stonewall represents people who waited.',
    EXPERT:           'You demonstrated theater-level competence. The system functioned. It was never clean, never efficient, and never free. That is the nature of what you chose to do.',
    IRON_LOGISTICIAN: 'You have seen the machine at its limits and kept it running. You know that every logistics officer\'s job is to ensure the killing never stops from preventable causes. That knowledge has a weight that does not leave.',
  };

  return {
    overallRating: Math.round(model.overallRating),
    displayRating: Math.round(model.displayRating),
    masteryLevel: model.masteryLevel,
    masteryLabel: MASTERY_LABELS[model.masteryLevel],
    strongestCategory: strongest,
    weakestCategory: weakest,
    doctrineAccuracy: optimalRate,
    totalDecisions,
    optimalRate,
    failureRate,
    worstStreak: Math.min(...categories.map(c => model.skills[c].worstStreak)),
    bestStreak: Math.max(...categories.map(c => model.skills[c].bestStreak)),
    tiltEvents: model.tilt.tiltHistory.length,
    warCostAwareness: model.warCostAwareness,
    categoryBreakdown,
    theaterVerdict: verdicts[model.masteryLevel],
  };
}
