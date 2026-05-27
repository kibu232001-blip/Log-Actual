/**
 * LOG ACTUAL — Campaign Escalation Engine
 * KibuglogalVentures LLC
 *
 * Campaigns do not unlock linearly. They unlock based on how
 * badly — or well — the player performed. Poor performance
 * escalates pressure. Good performance escalates complexity.
 * Neither path is safe.
 *
 * Design principle: there is no "easy mode" unlock. There is
 * only the next thing the player needs to face based on what
 * they just showed the system they know or don't know.
 */

import { MissionScenario, ALL_SCENARIOS, CHARACTERS } from './scenarios'
import { PlayerSkillModel, MasteryLevel } from '../engine/learningEngine'

// ── PERFORMANCE VERDICT ───────────────────────────────────────────────────────

export type PerformanceVerdict =
  | 'CATASTROPHIC'   // Sigma < 1.0, SW > 25%
  | 'POOR'           // Sigma 1.0–1.5, SW 15-25%
  | 'MARGINAL'       // Sigma 1.5–2.0, SW 10-15%
  | 'ADEQUATE'       // Sigma 2.0–2.5, SW 5-10%
  | 'PROFICIENT'     // Sigma 2.5–3.0, SW 2-5%
  | 'EXCEPTIONAL'    // Sigma > 3.0, SW < 2%

export interface CampaignResult {
  scenarioId: string
  verdict: PerformanceVerdict
  finalSigma: number
  finalStonewallRate: number
  finalRCT: number
  doctrineAccuracy: number
  daysCompleted: number
  warCostStatement: string
  weakestDoctrineCategory: string
  strongestDoctrineCategory: string
}

export interface EscalationDecision {
  nextScenario: MissionScenario
  reason: string               // Why this scenario was chosen
  parameterAdjustments: ParameterAdjustments
  bridgingDialog: BridgingLine[]  // Commander dialog between campaigns
  escalationType: EscalationType
}

export type EscalationType =
  | 'REMEDIAL'      // Same theater, worse starting conditions — you failed
  | 'PRESSURE'      // Same theater, compressed timeline, more enemy
  | 'LATERAL'       // Different theater, similar difficulty — broaden competency
  | 'ADVANCE'       // Next theater, higher complexity
  | 'CULMINATION'   // Final test — worst-case scenario

export interface ParameterAdjustments {
  sigmaDelta: number           // Adjustment to starting sigma
  stonewallRateDelta: number   // Adjustment to starting stonewall rate
  rctDelta: number             // Adjustment to starting RCT
  enemyActivityDelta: number   // Adjustment to enemy activity
  durationDelta: number        // Adjustment to campaign duration
  note: string                 // What changed and why
}

export interface BridgingLine {
  character: keyof typeof CHARACTERS
  text: string
}

// ── VERDICT CALCULATION ──────────────────────────────────────────────────────

export function calculateVerdict(result: Omit<CampaignResult, 'verdict' | 'warCostStatement' | 'weakestDoctrineCategory' | 'strongestDoctrineCategory'>): PerformanceVerdict {
  const { finalSigma, finalStonewallRate } = result

  if (finalSigma < 1.0 || finalStonewallRate > 25)  return 'CATASTROPHIC'
  if (finalSigma < 1.5 || finalStonewallRate > 15)  return 'POOR'
  if (finalSigma < 2.0 || finalStonewallRate > 10)  return 'MARGINAL'
  if (finalSigma < 2.5 || finalStonewallRate > 5)   return 'ADEQUATE'
  if (finalSigma < 3.0 || finalStonewallRate > 2)   return 'PROFICIENT'
  return 'EXCEPTIONAL'
}

// ── SCENARIO PARAMETER ADJUSTMENT ────────────────────────────────────────────

/**
 * Creates a harder or adjusted version of a scenario based on performance.
 * The base scenario stays the same geographically — the starting conditions change.
 */
function adjustScenarioParameters(
  base: MissionScenario,
  verdict: PerformanceVerdict,
  model: PlayerSkillModel,
): { scenario: MissionScenario; adjustments: ParameterAdjustments } {
  let sigmaDelta = 0
  let swDelta = 0
  let rctDelta = 0
  let enemyDelta = 0
  let durationDelta = 0
  let note = ''

  switch (verdict) {
    case 'CATASTROPHIC':
      // Punishing — worse starting conditions, compressed timeline
      sigmaDelta = -0.3
      swDelta = +5
      rctDelta = +8
      enemyDelta = +0.15
      durationDelta = -3
      note = 'Theater command has reviewed your performance. Starting conditions reflect the damage your decisions caused. You begin this campaign already behind.'
      break

    case 'POOR':
      sigmaDelta = -0.2
      swDelta = +3
      rctDelta = +5
      enemyDelta = +0.10
      durationDelta = -2
      note = 'Previous campaign revealed significant doctrine gaps. Enemy has adapted to your patterns. Starting position degraded.'
      break

    case 'MARGINAL':
      // Neutral-slight pressure
      sigmaDelta = 0
      swDelta = +1
      rctDelta = +2
      enemyDelta = +0.05
      durationDelta = 0
      note = 'Marginal performance. Theater conditions hold. Enemy is watching.'
      break

    case 'ADEQUATE':
      // Slight improvement in starting conditions
      sigmaDelta = +0.1
      swDelta = -1
      rctDelta = -2
      enemyDelta = 0
      durationDelta = 0
      note = 'Adequate performance recognized. Minor improvements to starting posture.'
      break

    case 'PROFICIENT':
      // Better start, but harder enemy
      sigmaDelta = +0.2
      swDelta = -2
      rctDelta = -4
      enemyDelta = +0.10  // Enemy adapts harder to a competent player
      durationDelta = +2
      note = 'Proficient performance. Theater conditions improve. Enemy has escalated activity in response.'
      break

    case 'EXCEPTIONAL':
      sigmaDelta = +0.3
      swDelta = -3
      rctDelta = -6
      enemyDelta = +0.20  // Enemy is most aggressive against best players
      durationDelta = +3
      note = 'Exceptional performance. The enemy has identified you as a threat. Activity level elevated significantly.'
      break
  }

  const adjustedScenario: MissionScenario = {
    ...base,
    startingSigma: Math.max(0.5, Math.min(3.5, base.startingSigma + sigmaDelta)),
    startingStonewallRate: Math.max(0, Math.min(40, base.startingStonewallRate + swDelta)),
    startingRCT: Math.max(12, Math.min(72, base.startingRCT + rctDelta)),
    enemyActivityLevel: Math.max(0.05, Math.min(0.95, base.enemyActivityLevel + enemyDelta)),
    duration: Math.max(10, Math.min(45, base.duration + durationDelta)),
  }

  return {
    scenario: adjustedScenario,
    adjustments: { sigmaDelta, stonewallRateDelta: swDelta, rctDelta, enemyActivityDelta: enemyDelta, durationDelta, note },
  }
}

// ── BRIDGING DIALOG GENERATION ────────────────────────────────────────────────

function generateBridgingDialog(
  result: CampaignResult,
  escalationType: EscalationType,
  nextScenario: MissionScenario,
): BridgingLine[] {
  const dialogs: Record<PerformanceVerdict, BridgingLine[]> = {
    CATASTROPHIC: [
      { character:'SGM',  text:`Colonel. I am going to be direct. ${result.finalStonewallRate.toFixed(1)} percent stonewall rate. That is not a logistics problem. That is a command problem.` },
      { character:'S4',   text:`We lost ${Math.round((result.finalStonewallRate / 100) * 6)} units to stonewall at the critical moment. Every one of them was preventable. The doctrine was there. We did not apply it.` },
      { character:'CDR',  text:`I understand. What is the next theater.` },
      { character:'INTEL',text:`${nextScenario.operationName}. ${nextScenario.theater.replace('_',' ')}. The starting conditions reflect what we left behind. We do not get a clean slate.` },
      { character:'CDR',  text:`Then we fix it while operating. Walk me through what we are going into.` },
    ],
    POOR: [
      { character:'SPO',  text:`Sir, the AAR is complete. The pattern is clear. We were reactive when we should have pushed. Three of the five stonewall events were preventable with earlier distribution.` },
      { character:'SGM',  text:`The request cycle time tells the story. Forty-plus hours average means the supply sat in the queue while the unit was dying. That is a process failure.` },
      { character:'CDR',  text:`Next mission. Same lessons apply or we are going to keep having this conversation.` },
      { character:'S4',   text:`${nextScenario.operationName}. Starting sigma is down from last campaign. Enemy has had time to adapt. We are going in behind.` },
    ],
    MARGINAL: [
      { character:'SPO',  text:`Marginal result, sir. We held the theater. We did not hold it well. The sigma number tells you how close it was.` },
      { character:'CDR',  text:`Close is the wrong standard. Close means someone waited. What is next.` },
      { character:'INTEL',text:`${nextScenario.operationName}. ${nextScenario.theater.replace('_',' ')} theater. Enemy is watching. They have noted our patterns.` },
      { character:'SGM',  text:`Same weaknesses in a new environment, sir. We need to change how we distribute before the campaign opens, not after the first stonewall.` },
    ],
    ADEQUATE: [
      { character:'S4',   text:`Adequate result, Colonel. Sigma held above two. Stonewall rate was manageable. The doctrine decisions were mostly sound.` },
      { character:'CDR',  text:`Mostly sound is not the standard. What did we miss.` },
      { character:'SPO',  text:`Three suboptimal decisions that created cascade effects on Days 14 and 19. The enemy recognized the pattern before we corrected it.` },
      { character:'CDR',  text:`Next campaign. We fix those three categories or they will follow us into a harder environment.` },
      { character:'INTEL',text:`${nextScenario.operationName}. New theater. Starting position is slightly improved. Enemy has escalated to match.` },
    ],
    PROFICIENT: [
      { character:'SGM',  text:`Strong campaign, sir. Sigma above two-five. The push distribution discipline held through the crisis window. Units stayed green.` },
      { character:'S4',   text:`Doctrine accuracy was up. The stonewall events were recovered quickly. The enemy interdiction was managed.` },
      { character:'CDR',  text:`The enemy adapted faster in the second half. We need to stay ahead of that in the next campaign.` },
      { character:'SPO',  text:`${nextScenario.operationName}. New theater. They know you are competent now. Enemy activity is elevated. They are not going to make it easy.` },
      { character:'CDR',  text:`Good. Easy is how you get complacent. What are we walking into.` },
    ],
    EXCEPTIONAL: [
      { character:'S4',   text:`Exceptional campaign, sir. Sigma above three. The system operated at doctrine standard for the first time.` },
      { character:'SGM',  text:`I want to say something. That was professional work. The decisions under pressure were correct. The push discipline never broke.` },
      { character:'CDR',  text:`There were still costs. The AAR statement is honest. Note what it said about the stonewall events.` },
      { character:'INTEL',text:`Sir, that performance has been noted by higher. And by the enemy. ${nextScenario.operationName} will test whether it was repeatable. They are coming at you harder.` },
      { character:'CDR',  text:`That is the job. Brief me on the new theater.` },
    ],
  }

  return dialogs[result.verdict] || dialogs['ADEQUATE']
}

// ── SCENARIO PROGRESSION MAP ──────────────────────────────────────────────────

/**
 * Determines which scenario comes next based on:
 *   1. Current scenario
 *   2. Performance verdict
 *   3. Player skill model (weakest doctrine category)
 *   4. Campaign history
 */
export function determineNextCampaign(
  completedResult: CampaignResult,
  model: PlayerSkillModel,
  campaignHistory: CampaignResult[],
): EscalationDecision {
  const completedIndex = ALL_SCENARIOS.findIndex(s => s.id === completedResult.scenarioId)
  const verdict = completedResult.verdict

  let targetScenario: MissionScenario
  let escalationType: EscalationType

  // Catastrophic or Poor: return to same scenario with worse conditions
  if (verdict === 'CATASTROPHIC' || verdict === 'POOR') {
    targetScenario = ALL_SCENARIOS[completedIndex]
    escalationType = 'REMEDIAL'
  }
  // Marginal: same theater, next scenario (or repeat with pressure)
  else if (verdict === 'MARGINAL') {
    const sameTheater = ALL_SCENARIOS.filter(s =>
      s.theater === ALL_SCENARIOS[completedIndex].theater && s.id !== completedResult.scenarioId
    )
    targetScenario = sameTheater[0] ?? ALL_SCENARIOS[Math.min(completedIndex + 1, ALL_SCENARIOS.length - 1)]
    escalationType = 'PRESSURE'
  }
  // Adequate: lateral move to different theater at similar difficulty
  else if (verdict === 'ADEQUATE') {
    const differentTheater = ALL_SCENARIOS.filter(s =>
      s.theater !== ALL_SCENARIOS[completedIndex].theater &&
      s.difficulty === ALL_SCENARIOS[completedIndex].difficulty
    )
    targetScenario = differentTheater[0] ?? ALL_SCENARIOS[Math.min(completedIndex + 1, ALL_SCENARIOS.length - 1)]
    escalationType = 'LATERAL'
  }
  // Proficient or Exceptional: advance to harder scenario
  else {
    // Target weakness: find scenario that tests player's worst doctrine category
    const weakCategory = completedResult.weakestDoctrineCategory
    const harderScenarios = ALL_SCENARIOS.filter(s =>
      s.id !== completedResult.scenarioId &&
      (s.difficulty === 'ELEVATED' || s.difficulty === 'SEVERE')
    )

    // If all 6 scenarios completed with proficient+: CULMINATION
    const distinctCompleted = new Set(campaignHistory.map(r => r.scenarioId))
    if (distinctCompleted.size >= 5) {
      targetScenario = ALL_SCENARIOS[5] // ISLAND HOP — hardest
      escalationType = 'CULMINATION'
    } else {
      targetScenario = harderScenarios[Math.floor(Math.random() * harderScenarios.length)] ?? ALL_SCENARIOS[5]
      escalationType = 'ADVANCE'
    }
  }

  // Apply parameter adjustments
  const { scenario: adjustedScenario, adjustments } = adjustScenarioParameters(
    targetScenario, verdict, model
  )

  // Generate bridging dialog
  const bridgingDialog = generateBridgingDialog(completedResult, escalationType, targetScenario)

  const escalationReasons: Record<EscalationType, string> = {
    REMEDIAL:    `${verdict} performance. Same theater. Starting conditions degraded by prior decisions.`,
    PRESSURE:    `Marginal performance. Same theater. Compressed timeline. Enemy more active.`,
    LATERAL:     `Adequate performance. New theater. Same complexity. Building doctrine breadth.`,
    ADVANCE:     `Strong performance. Harder scenario. Enemy has noted your capability.`,
    CULMINATION: `All theaters tested. Final evaluation. No margin for error.`,
  }

  return {
    nextScenario: adjustedScenario,
    reason: escalationReasons[escalationType],
    parameterAdjustments: adjustments,
    bridgingDialog,
    escalationType,
  }
}

// ── FIRST CAMPAIGN SELECTION ──────────────────────────────────────────────────

/**
 * For a brand-new player, always start with Scenario 1 (European Theater)
 * but at full default conditions. No adjustments.
 */
export function getFirstCampaign(): MissionScenario {
  return ALL_SCENARIOS[0]
}

// ── PERFORMANCE VERDICT LABELS ────────────────────────────────────────────────

export const VERDICT_DATA: Record<PerformanceVerdict, { color: string; label: string; consequence: string }> = {
  CATASTROPHIC: { color:'#e74c3c', label:'CATASTROPHIC FAILURE',  consequence:'Remedial — same theater, degraded starting conditions' },
  POOR:         { color:'#c0392b', label:'POOR PERFORMANCE',       consequence:'Pressure — same theater, compressed timeline' },
  MARGINAL:     { color:'#e67e22', label:'MARGINAL PERFORMANCE',   consequence:'Lateral — same difficulty, new theater' },
  ADEQUATE:     { color:'#f39c12', label:'ADEQUATE PERFORMANCE',   consequence:'Advance — new theater, equal complexity' },
  PROFICIENT:   { color:'#27ae60', label:'PROFICIENT PERFORMANCE', consequence:'Advance — harder scenario, elevated enemy' },
  EXCEPTIONAL:  { color:'#2ecc71', label:'EXCEPTIONAL PERFORMANCE',consequence:'Culmination track — enemy has adapted' },
}
