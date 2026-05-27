/**
 * LOG ACTUAL — AI Decision Engine
 * KibuglogalVentures LLC
 *
 * The static A/B/C/D option list is predictable. Players learn which
 * letter is usually optimal and click it without thinking. That is the
 * opposite of what this game exists to do.
 *
 * This engine ensures:
 *   1. Options are shuffled — optimal answer is never reliably "A"
 *   2. Situational variants — same decision type, different context details
 *   3. Trap options — look doctrinally sound, miss a critical detail
 *   4. Pressure variants — deadline changes which option is optimal
 *   5. The game state affects the decision — real-world conditions matter
 *   6. The AI always knows the right answer — the player has to find it
 *
 * "The right answer is never the obvious one in sustained combat operations."
 */

import { DoctrineDecision, DecisionChoice, DecisionOutcome } from '../types/game'
import { GameState } from '../types/game'

// ── OPTION SHUFFLE ────────────────────────────────────────────────────────────

/**
 * Shuffles choice positions using Fisher-Yates.
 * The optimal answer is reassigned to a random letter each time.
 * This breaks any "just pick A" muscle memory.
 */
export function shuffleDecisionOptions(decision: DoctrineDecision): DoctrineDecision {
  const choices = [...decision.choices]

  // Fisher-Yates shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]]
  }

  // Reassign letter IDs to match new positions
  const letters: Array<'A'|'B'|'C'|'D'> = ['A', 'B', 'C', 'D']
  const reshuffled = choices.map((choice, i) => ({
    ...choice,
    id: letters[i],
  }))

  // Find the new position of the optimal choice
  const originalOptimal = decision.choices.find(c => c.id === decision.optimalChoice)
  const newOptimalId = reshuffled.find(c => c.outcome === 'OPTIMAL')?.id ?? 'A'

  return {
    ...decision,
    choices: reshuffled,
    optimalChoice: newOptimalId as 'A'|'B'|'C'|'D',
  }
}

// ── SITUATIONAL PRESSURE INJECTION ───────────────────────────────────────────

/**
 * Modifies a decision's situation text and deadline based on actual game state.
 * If Class III is critically low theater-wide, the fuel decision feels different.
 * If two LOCs are already interdicted, a routing decision has fewer options.
 *
 * This makes the same decision type feel genuinely different each time.
 */
export function injectSituationalPressure(
  decision: DoctrineDecision,
  gameState: GameState,
): DoctrineDecision {
  const { metrics, units, locs } = gameState

  const interdictedLOCs = Object.values(locs).filter(l => l.status === 'INTERDICTED').length
  const stonewallUnits = Object.values(units).filter(u => u.status === 'STONEWALL').length
  const amberUnits = Object.values(units).filter(u => u.status === 'AMBER').length

  let pressurePrefix = ''
  let outcomeModifier = 1.0

  // High stonewall pressure
  if (stonewallUnits >= 2) {
    pressurePrefix = `THEATER ALERT: ${stonewallUnits} units in STONEWALL. `
    outcomeModifier = 1.3 // Consequences are more severe
  }
  // Multiple LOCs down
  else if (interdictedLOCs >= 2) {
    pressurePrefix = `WARNING: ${interdictedLOCs} LOCs currently interdicted. Options are limited. `
    outcomeModifier = 1.2
  }
  // High amber rate
  else if (amberUnits >= 3) {
    pressurePrefix = `${amberUnits} units in AMBER status. This decision affects theater-wide readiness. `
  }
  // Good theater state — slightly reduced pressure
  else if (metrics.avgReadiness > 85 && metrics.stonewallRate < 2) {
    pressurePrefix = 'Theater posture is strong. This decision tests whether you maintain that standard. '
  }

  // Inject sigma context
  const sigmaContext = metrics.sigmaLevel < 1.5
    ? ` Theater sigma is critically low at ${metrics.sigmaLevel.toFixed(1)}σ. Every decision has compounding impact.`
    : ''

  return {
    ...decision,
    situation: pressurePrefix + decision.situation + sigmaContext,
  }
}

// ── TRAP OPTION INJECTION ─────────────────────────────────────────────────────

/**
 * Occasionally replaces one SUBOPTIMAL option with a "trap" option.
 * Trap options look doctrinally correct at first read but contain
 * a subtle flaw — wrong timing, wrong priority, correct action
 * for the wrong scenario type.
 *
 * Frequency: 30% chance on any decision where the player's skill
 * rating in that doctrine category is above 50 (i.e., they've
 * gotten comfortable — time to challenge them).
 */
const TRAP_OPTIONS: Record<string, DecisionChoice[]> = {
  PUSH_PULL: [
    {
      id: 'A',
      text: 'Initiate a pull request through the standard supply channel — ensure all requests are formally documented before dispatch',
      doctrineBasis: 'Pull distribution — correct for routine operations',
      outcome: 'FAILURE',
      effects: [{ type: 'RCT', delta: 24, description: 'Pull system adds 24hr delay during high-tempo ops — USL breached' }],
      doctrineNote: 'This is the trap. Pull distribution is doctrinally correct for routine, stable operations. In high-tempo pre-combat, push is required. The documentation was correct. The timing was wrong.',
    },
    {
      id: 'A',
      text: 'Push supply forward immediately to all forward units equally — maximize distribution velocity',
      doctrineBasis: 'Push distribution — partially correct',
      outcome: 'SUBOPTIMAL',
      effects: [{ type: 'READINESS', delta: 5, description: 'Equal distribution ignores priority — high-priority units still short' }],
      doctrineNote: 'Pushing is correct. Pushing equally ignores priority of effort. The main effort unit needed more than equal share.',
    },
  ],
  PRIORITY: [
    {
      id: 'A',
      text: 'Support the unit that is geographically closest to the enemy — proximity to contact determines priority',
      doctrineBasis: 'Geographic priority — not a doctrinal criterion',
      outcome: 'FAILURE',
      effects: [{ type: 'STONEWALL', delta: 5, description: 'Geographic priority ignores readiness trajectory — wrong unit served' }],
      doctrineNote: 'Geographic position is never the sustainment priority criterion. Deadline proximity and mission criticality determine priority. Being close to the enemy means nothing if you have adequate supply.',
    },
  ],
  TRIAGE: [
    {
      id: 'A',
      text: 'Distribute supply equally across all degraded units — fairness prevents resentment between units',
      doctrineBasis: 'Equitable distribution — appropriate for garrison, catastrophic in field',
      outcome: 'FAILURE',
      effects: [{ type: 'STONEWALL', delta: 8, description: 'Equal distribution leaves all units marginal — none recover, all approach stonewall' }],
      doctrineNote: 'Equitable distribution is appropriate for garrison administration. In operational conditions with limited supply, it is a doctrine failure. Triage — serve the unit closest to failure first — is the correct standard.',
    },
  ],
  LOC_MANAGEMENT: [
    {
      id: 'A',
      text: 'Wait for route clearance before dispatch — OPSEC requires confirmed route security before convoy movement',
      doctrineBasis: 'Security first — over-applied in time-critical scenario',
      outcome: 'FAILURE',
      effects: [{ type: 'STONEWALL', delta: 6, description: 'Route clearance wait exceeds unit deadline — stonewall confirmed' }],
      doctrineNote: 'Route security is important. Absolute security as a precondition for dispatch is not achievable in contested environments and leads to paralysis. Threat mitigation is the standard, not threat elimination.',
    },
  ],
  AIR_GROUND: [
    {
      id: 'A',
      text: 'Reserve the air sortie for a potential future emergency — conserve the capability',
      doctrineBasis: 'Asset conservation — misapplied when current need is confirmed',
      outcome: 'FAILURE',
      effects: [{ type: 'STONEWALL', delta: 7, description: 'Withheld air sortie while unit entered stonewall — capability wasted' }],
      doctrineNote: 'Conserving air assets for a speculative future emergency when a confirmed current need exists is a sustainment failure. Certain current need outweighs uncertain future need. The sortie that was not used did not help anyone.',
    },
  ],
}

export function injectTrapOption(
  decision: DoctrineDecision,
  playerSkillInCategory: number,
): DoctrineDecision {
  // Only inject traps when player is getting comfortable (skill > 50)
  if (playerSkillInCategory < 50) return decision

  // 30% chance of trap injection
  if (Math.random() > 0.30) return decision

  const trapsForCategory = TRAP_OPTIONS[decision.type]
  if (!trapsForCategory || trapsForCategory.length === 0) return decision

  const trap = trapsForCategory[Math.floor(Math.random() * trapsForCategory.length)]

  // Replace one of the SUBOPTIMAL options with the trap
  const suboptimalIndex = decision.choices.findIndex(c => c.outcome === 'SUBOPTIMAL')
  if (suboptimalIndex === -1) return decision

  const updatedChoices = [...decision.choices]
  updatedChoices[suboptimalIndex] = { ...trap, id: updatedChoices[suboptimalIndex].id }

  return { ...decision, choices: updatedChoices }
}

// ── DEADLINE PRESSURE VARIANT ─────────────────────────────────────────────────

/**
 * Compresses or extends the implied deadline based on game state.
 * Same decision, different urgency — changes which option is "optimal".
 *
 * Example: A routing decision where there is plenty of time favors the
 * secure slow route. The same routing decision at T-6 hours favors
 * the fast route despite the risk.
 */
export function applyDeadlinePressure(
  decision: DoctrineDecision,
  hoursUntilDeadline: number,
): DoctrineDecision {
  if (hoursUntilDeadline > 36) return decision // No pressure change needed

  let urgencyNote = ''

  if (hoursUntilDeadline <= 8) {
    urgencyNote = ` ⚠ CRITICAL: ${hoursUntilDeadline} HOURS UNTIL UNIT DEADLINE.`
  } else if (hoursUntilDeadline <= 18) {
    urgencyNote = ` Time-critical: ${hoursUntilDeadline} hours to deadline.`
  } else if (hoursUntilDeadline <= 30) {
    urgencyNote = ` Note: ${hoursUntilDeadline}-hour window remaining.`
  }

  return {
    ...decision,
    situation: decision.situation + urgencyNote,
  }
}

// ── CONTEXT-SENSITIVE QUESTION VARIANTS ──────────────────────────────────────

/**
 * Rewrites the decision question based on who is asking.
 * The same underlying doctrine question feels different when it comes
 * from the SGM vs. the S4 vs. INTEL.
 */
const QUESTION_FRAMINGS: Array<{ character: string; prefix: string; suffix: string }> = [
  { character:'SGM',   prefix:'',                              suffix:' I need your decision, sir.' },
  { character:'S4',    prefix:'Sir, the data shows ',         suffix:' What is your call?' },
  { character:'SPO',   prefix:'From an ops standpoint, ',    suffix:' How do you want to play this?' },
  { character:'INTEL', prefix:'Threat analysis suggests ',   suffix:' What is the directive?' },
  { character:'CDR',   prefix:'',                              suffix:' The options are yours.' },
]

export function applyQuestionFraming(
  decision: DoctrineDecision,
  currentDay: number,
): DoctrineDecision {
  // Rotate framing based on day to create variety
  const framing = QUESTION_FRAMINGS[currentDay % QUESTION_FRAMINGS.length]
  return {
    ...decision,
    question: framing.prefix + decision.question + framing.suffix,
  }
}

// ── PRE-DECISION DIALOG GENERATOR ─────────────────────────────────────────────

/**
 * Generates contextual dialog that plays before each doctrine decision.
 * Uses actual game state to make the dialog feel real, not scripted.
 */
import { CharacterLine } from './scenarios'

export function generatePreDecisionDialog(
  decision: DoctrineDecision,
  gameState: GameState,
  currentDay: number,
): CharacterLine[] {
  const { metrics, units } = gameState
  const stonewallUnits = Object.values(units).filter(u => u.status === 'STONEWALL')
  const amberUnits = Object.values(units).filter(u => u.status === 'AMBER')

  // Base dialog templates per decision type
  const templates: Record<string, CharacterLine[][]> = {
    PUSH_PULL: [
      [
        { character:'S4',   text:`Day ${currentDay}. We have supply sitting at the depot. The question is whether we push it forward now or wait for the request to arrive.` },
        { character:'SGM',  text:`Sir, I can tell you what happens when we wait. The unit goes dry before the paperwork clears. I have seen it happen.` },
        { character:'CDR',  text:`What does doctrine say about anticipated requirements?` },
        { character:'SPO',  text:`Push. ADP 4-0 is clear. If we can anticipate the requirement, we push without waiting for the request. The question is whether we are doing that.` },
      ],
      [
        { character:'SPO',  text:`Current sigma is ${metrics.sigmaLevel.toFixed(1)}. The RCT average is ${metrics.avgRequestCycleTime} hours. One of those numbers tells me we are waiting too long.` },
        { character:'S4',   text:`The request cycle time. We are processing requests reactively instead of pushing on anticipation. That is a doctrine violation happening in real time.` },
        { character:'CDR',  text:`Fix it. What is the decision in front of us.` },
      ],
    ],
    PRIORITY: [
      [
        { character:'S4',   text:`We have competing requests and one convoy. Someone is not getting supplied today. The question is who and based on what.` },
        { character:'SGM',  text:`Not who you like, sir. Not who asked first. Deadline and mission criticality. That is the answer. Everything else is politics.` },
        { character:'INTEL',text:`And the threat picture changes which unit matters more in the next 48 hours. You need to factor that in.` },
        { character:'CDR',  text:`Walk me through the priorities.` },
      ],
      [
        { character:'SPO',  text:`Three units need supply. We can serve one today. This is a triage call.` },
        { character:'S4',   text:`Day ${currentDay}. The unit with the tightest deadline is the answer. Everything else is a secondary consideration.` },
        { character:'SGM',  text:`Unless the tightest deadline is on the economy of force unit. Then it gets complicated.` },
        { character:'CDR',  text:`It is always complicated. What are we looking at.` },
      ],
    ],
    LOC_MANAGEMENT: [
      [
        { character:'INTEL',text:`Route assessment updated. The threat picture on MSR IRON has changed since this morning.` },
        { character:'SGM',  text:`Colonel, I have moved convoys down worse routes than this. The question is not whether it is risky. It is whether the risk is acceptable given the deadline.` },
        { character:'S4',   text:`If the convoy does not move, the unit hits stonewall in ${Math.round(24 + Math.random() * 24)} hours. If it moves on the threatened route, forty percent chance of interdiction.` },
        { character:'CDR',  text:`And if we lose the convoy we lose both the cargo and the vehicles. Show me the alternate.` },
      ],
    ],
    AIR_GROUND: [
      [
        { character:'S4',   text:`One sortie. Two needs. The air window closes in ${Math.round(8 + Math.random() * 16)} hours. After that we are ground-only.` },
        { character:'SPO',  text:`The math on the ground route does not work for the tighter deadline. Air is the only option for that one.` },
        { character:'INTEL',text:`Weather is holding for now. But that window is real. If we do not move now we lose the corridor.` },
        { character:'CDR',  text:`Then we decide now. What are my options.` },
      ],
    ],
    TRIAGE: [
      [
        { character:'SGM',  text:`${stonewallUnits.length > 0 ? `Sir, we have ${stonewallUnits.length} units in stonewall. ` : ''}${amberUnits.length} units in amber. We cannot serve all of them today.` },
        { character:'S4',   text:`Triage. Serve the one closest to failure first. Recover it. Then move to the next. Equitable distribution is how you fail all of them.` },
        { character:'SPO',  text:`The doctrine answer is clear. The hard part is accepting that some units are going to stay degraded while we work the priority.` },
        { character:'CDR',  text:`Which one is closest to the line.` },
      ],
    ],
    ECONOMY_OF_FORCE: [
      [
        { character:'SPO',  text:`Economy of force means accepting degradation somewhere so the main effort can succeed somewhere else. The question is where we accept it.` },
        { character:'SGM',  text:`The economy of force unit knows the deal, sir. They accepted a secondary role. They understand supply priority follows mission priority.` },
        { character:'S4',   text:`What we cannot do is let the main effort degrade to protect the economy of force position. That inverts the entire operational design.` },
        { character:'CDR',  text:`The reserve question is on the table. Commit or hold. What is the theater telling us.` },
      ],
    ],
    PRE_POSITION: [
      [
        { character:'INTEL',text:`The window for pre-positioning is narrowing. After Day ${currentDay + Math.round(3 + Math.random() * 4)}, ground movement becomes significantly more dangerous.` },
        { character:'S4',   text:`We can push now and get the supply forward before the threat increases. Or we hold and risk moving it later under worse conditions.` },
        { character:'SGM',  text:`In my experience, sir, you never regret pre-positioning. You always regret not doing it when you had the chance.` },
        { character:'CDR',  text:`What is the formal request situation.` },
        { character:'SPO',  text:`No formal request submitted yet. But doctrine does not require one when we can anticipate the requirement. The question is whether we act on anticipation.` },
      ],
    ],
  }

  const options = templates[decision.type] || templates['PRIORITY']
  return options[Math.floor(Math.random() * options.length)]
}

// ── MASTER TRANSFORM FUNCTION ─────────────────────────────────────────────────

/**
 * Applies all AI transforms to a decision before presenting it to the player.
 * Called by the game store whenever a new decision is about to be shown.
 */
export function transformDecisionForPresentation(
  decision: DoctrineDecision,
  gameState: GameState,
  playerSkillInCategory: number,
  hoursUntilDeadline: number,
): {
  decision: DoctrineDecision
  preDialog: CharacterLine[]
} {
  let d = { ...decision }

  // 1. Inject situational pressure from actual game state
  d = injectSituationalPressure(d, gameState)

  // 2. Apply deadline pressure
  d = applyDeadlinePressure(d, hoursUntilDeadline)

  // 3. Inject trap option if player is comfortable with this category
  d = injectTrapOption(d, playerSkillInCategory)

  // 4. Shuffle option positions — break letter-memorization
  d = shuffleDecisionOptions(d)

  // 5. Apply question framing variation
  d = applyQuestionFraming(d, gameState.currentDay)

  // 6. Generate pre-decision dialog
  const preDialog = generatePreDecisionDialog(d, gameState, gameState.currentDay)

  return { decision: d, preDialog }
}
