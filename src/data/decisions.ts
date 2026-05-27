import { DoctrineDecision } from '../types/game';

export const CAMPAIGN_1_DECISIONS: DoctrineDecision[] = [
  {
    id: 'D1_C1_D2',
    day: 2,
    title: 'PUSH OR WAIT — INITIAL STOCK POSITIONING',
    type: 'PUSH_PULL',
    situation: 'III Corps has not yet submitted formal supply requests. Intelligence indicates the operational tempo increases on Day 5. Your depots are at 90% capacity. Forward FOBs are at 40%. Doctrine question: do you push now or wait for pull requests?',
    question: 'How do you posture your initial supply distribution?',
    relatedUnits: ['III_CORPS', 'FOB1', 'FOB2'],
    relatedNodes: ['DEPOT_A', 'FOB1', 'FOB2'],
    forceMultiplierBonus: 12,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Push Class III and Class V forward to FOBs now — preemptively, before requests come in', doctrineBasis: 'ADP 4-0: Push distribution for anticipated requirements', outcome: 'OPTIMAL', doctrineNote: 'Push distribution is doctrinally correct when requirements are predictable. Getting supply forward before the fight starts prevents request cycle time violations.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 12, description: 'FOB1 readiness improves from proactive supply' }, { type: 'RCT', delta: -8, description: 'Request cycle time reduced — units receive before asking' }, { type: 'SIGMA', delta: 0.3, description: 'Sigma improves from proactive sustainment posture' }] },
      { id: 'B', text: 'Split: push Class III forward, hold Class V at depot until requests come', doctrineBasis: 'Hybrid push/pull — partial doctrine application', outcome: 'ACCEPTABLE', doctrineNote: 'Reasonable compromise but Class V shortfall likely on Day 5–6 when tempo increases. Pull system introduces delay.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 6, description: 'Partial improvement from Class III push' }, { type: 'RCT', delta: -3, description: 'Minor RCT improvement' }, { type: 'SIGMA', delta: 0.1, description: 'Marginal sigma improvement' }] },
      { id: 'C', text: 'Wait for III Corps to submit requests — follow the pull system as written', doctrineBasis: 'Pull distribution — misapplied in high-tempo scenario', outcome: 'SUBOPTIMAL', doctrineNote: 'Pull distribution is appropriate for stable operations. Pre-combat buildup requires push. Waiting creates a 24–48hr delay when tempo increases.', effects: [{ type: 'RCT', delta: 14, description: 'RCT increases as requests pile up simultaneously on Day 5' }, { type: 'STONEWALL', delta: 4, description: 'Stonewall risk increases — units unprepared for Day 5 push' }] },
      { id: 'D', text: 'Hold all supply at depot — maximum economy of force until the situation clarifies', doctrineBasis: 'Economy of force misapplied — appropriate for economy phase, not buildup', outcome: 'FAILURE', doctrineNote: 'Economy of force applies after objectives are seized, not during buildup. Holding supply at depot during pre-combat phase guarantees readiness collapse on Day 5.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: -15, description: 'III Corps readiness degrades without supply' }, { type: 'SIGMA', delta: -0.4, description: 'Theater sigma degrades significantly' }, { type: 'STONEWALL', delta: 8, description: 'High stonewall risk across multiple units' }] }
    ]
  },
  {
    id: 'D2_C1_D4',
    day: 4,
    title: 'THROUGHPUT VS SUPPLY POINT DISTRIBUTION',
    type: 'PUSH_PULL',
    situation: 'You have 4 convoys available. Two FOBs need Class III. Option A: Throughput — convoys drive directly to units (faster, less control). Option B: Supply point — units come to the depot to pick up (more control, slower). Road network is clear. No enemy threat.',
    question: 'How do you move Class III to forward units today?',
    relatedUnits: ['FOB1', 'FOB2', 'FOB3'],
    relatedNodes: ['DEPOT_A', 'FOB1', 'FOB2'],
    forceMultiplierBonus: 10,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Throughput distribution — push convoys directly to FOB locations, units remain in position', doctrineBasis: 'ATP 4-0: Throughput maximizes supply chain velocity when LOCs are clear', outcome: 'OPTIMAL', doctrineNote: 'With clear LOCs and no threat, throughput distribution eliminates the supply point delay. Units stay in their positions, convoys come to them.', effects: [{ type: 'RCT', delta: -12, description: 'Throughput eliminates pick-up delay — fastest cycle time' }, { type: 'READINESS', delta: 10, description: 'All FOBs receive supply without movement delay' }] },
      { id: 'B', text: 'Supply point distribution — units send vehicles to Depot Alpha to draw supply', doctrineBasis: 'Supply point distribution — valid but slower in clear-LOC conditions', outcome: 'ACCEPTABLE', doctrineNote: 'Supply point gives you better accounting and control, but costs the units 12–18 hours of movement time. Appropriate when LOCs are threatened.', effects: [{ type: 'RCT', delta: 8, description: 'Unit vehicle movement adds 12–18hr to cycle time' }, { type: 'READINESS', delta: 5, description: 'Supply received but delayed' }] },
      { id: 'C', text: 'Split: throughput to FOB1 (higher priority), supply point to FOB2', doctrineBasis: 'Priority-based hybrid — acceptable but inconsistent', outcome: 'ACCEPTABLE', doctrineNote: 'Prioritizing FOB1 for throughput is correct. FOB2 supply point delay is manageable. Not optimal but tactically sound.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 10, description: 'FOB1 fully supplied via throughput' }, { type: 'READINESS', unitId: 'FOB2', delta: 4, description: 'FOB2 partially delayed via supply point' }] },
      { id: 'D', text: 'Wait — hold all Class III at depot until III Corps formally requests it by priority message', doctrineBasis: 'Reactive pull — incorrectly applied when supply levels are known', outcome: 'FAILURE', doctrineNote: 'Waiting for a formal priority message when supply levels are already known violates proactive sustainment. Request cycle time will exceed 48 hours.', effects: [{ type: 'RCT', delta: 22, description: 'Waiting for formal request adds 22hr to cycle time — USL breach' }, { type: 'STONEWALL', delta: 6, description: 'FOB stonewall risk increases' }] }
    ]
  },
  {
    id: 'D3_C1_D5',
    day: 5,
    title: 'COMPETING UNIT PRIORITIES — CLASS V SHORTAGE',
    type: 'PRIORITY',
    situation: 'You have one Class V convoy available. III Corps (maneuver) and Aviation Brigade (support) both need Class V. III Corps is at 45% ammo — enough for 1 day of heavy contact. Aviation is at 38% — aircraft are grounded without more. You cannot serve both today.',
    question: 'Which unit gets the Class V convoy?',
    relatedUnits: ['III_CORPS', 'AVN_BDE'],
    relatedNodes: ['ASP', 'FOB1'],
    forceMultiplierBonus: 14,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'III Corps gets priority — maneuver force readiness takes precedence over support', doctrineBasis: 'ATP 4-0: Priority of sustainment follows priority of effort — maneuver first', outcome: 'OPTIMAL', doctrineNote: 'Maneuver force gets priority of supply. Aviation supports the maneuver, not the other way around. III Corps must remain combat capable for the Day 5 push.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 20, description: 'III Corps ammo restored — combat capable for D+5 push' }, { type: 'READINESS', unitId: 'AVN_BDE', delta: -8, description: 'Aviation degrades — aircraft partially grounded for 24hrs' }] },
      { id: 'B', text: 'Aviation gets priority — grounded aircraft hurt the whole theater, not just one corps', doctrineBasis: 'Theater-level thinking — valid argument but misapplied priority', outcome: 'SUBOPTIMAL', doctrineNote: 'Aviation as a theater asset has a valid claim, but the maneuver force priority rule applies here. III Corps goes into contact without adequate ammo — significant risk.', effects: [{ type: 'READINESS', unitId: 'AVN_BDE', delta: 15, description: 'Aviation restored — aircraft available' }, { type: 'READINESS', unitId: 'III_CORPS', delta: -12, description: 'III Corps enters contact under-supplied — readiness risk' }] },
      { id: 'C', text: 'Split the load — give half to each unit today, request emergency resupply for tomorrow', doctrineBasis: 'Split load — tactically creative but leaves both units sub-optimal', outcome: 'ACCEPTABLE', doctrineNote: 'Both units receive partial supply. Neither is fully mission capable. Emergency resupply request tomorrow is the right next step.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 8, description: 'III Corps partially restored — marginal capability' }, { type: 'READINESS', unitId: 'AVN_BDE', delta: 7, description: 'Aviation partially restored' }, { type: 'RCT', delta: 6, description: 'Emergency request creates additional queue pressure tomorrow' }] },
      { id: 'D', text: 'Request guidance from higher — escalate the priority decision up the chain', doctrineBasis: 'Escalation — never appropriate for time-sensitive supply decisions', outcome: 'FAILURE', doctrineNote: 'Theater Commander does not wait for higher to resolve tactical supply priorities. This is your call. Delay means neither unit is ready for Day 5.', effects: [{ type: 'RCT', delta: 24, description: '24hr escalation delay — both units enter Day 5 under-supplied' }, { type: 'SIGMA', delta: -0.5, description: 'Theater sigma degrades from command hesitation' }] }
    ]
  },
  {
    id: 'D4_C1_D7',
    day: 7,
    title: 'WEATHER EVENT — FLOODED GROUND LOC',
    type: 'LOC',
    situation: 'Overnight flooding has made MSR AMBER impassable for 48 hours. This is the primary ground LOC to FOB2. FOB2 has 36 hours of Class I remaining. An alternate ground route adds 18 hours to travel time. The aerial port is available — 1 sortie capacity. No enemy activity.',
    question: 'How do you sustain FOB2 through the weather event?',
    relatedUnits: ['FOB2'],
    relatedNodes: ['AERIAL_PORT', 'FOB2', 'DEPOT_A'],
    forceMultiplierBonus: 11,
    optimalChoice: 'B',
    choices: [
      { id: 'A', text: 'Use the aerial sortie to air-deliver Class I to FOB2 immediately', doctrineBasis: 'Air resupply — correct when Class of Supply is critical and time is short', outcome: 'OPTIMAL', doctrineNote: 'With 36hrs of Class I remaining and a 48hr ground LOC closure, air is the only option to prevent a Class I failure. This is exactly the doctrinal use case for emergency air resupply.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 15, description: 'FOB2 Class I restored via air — readiness maintained' }, { type: 'RCT', delta: -6, description: 'Air sortie resolves crisis within hours, not days' }] },
      { id: 'B', text: 'Push convoy via alternate route immediately — accept the 18hr additional travel time', doctrineBasis: 'Alternate LOC activation — valid if time permits', outcome: 'ACCEPTABLE', doctrineNote: 'Alternate route gets there in 54hrs total — FOB2 has 36hrs of Class I. This is tight but workable if the convoy departs immediately. Air sortie preserved for higher priority use.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 6, description: 'FOB2 receives supply but cuts it close — minor readiness degradation' }, { type: 'RCT', delta: 18, description: 'Alternate route adds 18hr to cycle time' }] },
      { id: 'C', text: 'Wait for MSR AMBER to reopen in 48 hours — conserve air assets', doctrineBasis: 'Economy of force on air assets — misapplied when unit will fail', outcome: 'FAILURE', doctrineNote: 'FOB2 has 36hrs of Class I. MSR reopens in 48hrs. Math does not work — FOB2 enters Class I failure before ground LOC reopens. Stonewall inevitable.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: -25, description: 'FOB2 enters Class I failure — STONEWALL' }, { type: 'STONEWALL', delta: 5, description: 'Confirmed stonewall — theater sigma impact' }] },
      { id: 'D', text: 'Lateral transfer — strip Class I from FOB3 and vehicle-convoy it to FOB2', doctrineBasis: 'Lateral transfer — valid option but creates secondary problem', outcome: 'ACCEPTABLE', doctrineNote: 'Lateral transfer works if FOB3 has surplus. Verify before stripping. This creates a convoy requirement and degrades FOB3, but prevents FOB2 stonewall.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 10, description: 'FOB2 receives Class I from lateral transfer' }, { type: 'READINESS', unitId: 'FOB3', delta: -8, description: 'FOB3 Class I degraded — amber risk' }] }
    ]
  },
  {
    id: 'D5_C1_D9',
    day: 9,
    title: 'PROACTIVE CLASS III PUSH — ANTICIPATED REQUIREMENT',
    type: 'PRE_POSITION',
    situation: 'Intelligence indicates a 72-hour operational window beginning Day 12. III Corps will consume Class III at 3x normal rate during this period. Current depot levels can support the surge but only if pre-positioned by Day 11. No formal request has been submitted yet.',
    question: 'Do you push Class III forward now without a formal request?',
    relatedUnits: ['III_CORPS', 'FOB1'],
    relatedNodes: ['DEPOT_A', 'DEPOT_B', 'FOB1'],
    forceMultiplierBonus: 15,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Push Class III to forward depots now — get it in place before Day 11 without waiting for requests', doctrineBasis: 'ADP 4-0: Anticipate requirements. Push distribution for predictable high-tempo operations', outcome: 'OPTIMAL', doctrineNote: 'This is the textbook application of push distribution. Intelligence confirms the requirement. Waiting for a formal request means supply arrives late into the surge — too late to prevent readiness degradation.', effects: [{ type: 'READINESS', delta: 18, description: 'Theater readiness pre-positioned for Day 12 surge' }, { type: 'RCT', delta: -14, description: 'Pre-positioning eliminates surge request cycle time' }, { type: 'SIGMA', delta: 0.4, description: 'Theater sigma improves from proactive sustainment' }, { type: 'MULTIPLIER', delta: 15, description: 'Force Multiplier: +15% for Day 12–14 operations' }] },
      { id: 'B', text: 'Pre-position half — push 50% now, wait for formal request for the rest', doctrineBasis: 'Partial push — hedges the bet, but risks shortage during surge', outcome: 'ACCEPTABLE', doctrineNote: 'Better than waiting entirely. The remaining 50% on pull creates a 24hr gap during the surge. Manageable but not optimal.', effects: [{ type: 'READINESS', delta: 9, description: 'Partial pre-positioning provides moderate protection' }, { type: 'RCT', delta: -5, description: 'Partial cycle time improvement' }] },
      { id: 'C', text: 'Wait for III Corps G4 to submit a formal request — maintain proper supply channels', doctrineBasis: 'Pull system misapplied — formal requests appropriate for routine ops, not surge prep', outcome: 'SUBOPTIMAL', doctrineNote: 'By the time the formal request arrives, is processed, and supply moves forward, the Day 12 surge has already begun. Class III shortage confirmed on Day 12–13.', effects: [{ type: 'RCT', delta: 20, description: 'Request cycle time spikes during surge' }, { type: 'READINESS', delta: -10, description: 'III Corps under-supplied during operational surge' }, { type: 'STONEWALL', delta: 4, description: 'Stonewall risk elevated during surge period' }] },
      { id: 'D', text: 'Request Corps to self-sustain from their organic vehicles — push the problem down', doctrineBasis: 'Economy of force — inappropriate when theater level assets can and should act', outcome: 'FAILURE', doctrineNote: 'Corps organic vehicles cannot bridge a 3x consumption surge. This is a theater-level sustainment problem requiring theater-level assets. Pushing it down fails.', effects: [{ type: 'READINESS', delta: -20, description: 'Corps self-sustainment fails — significant readiness collapse' }, { type: 'SIGMA', delta: -0.6, description: 'Theater sigma degrades sharply' }, { type: 'STONEWALL', delta: 10, description: 'High stonewall probability across Corps units' }] }
    ]
  },
  {
    id: 'D6_C1_D11',
    day: 11,
    title: 'SIMULTANEOUS REQUESTS — ONE CONVOY AVAILABLE',
    type: 'PRIORITY',
    situation: 'Three units submitted requests simultaneously: FOB1 needs Class V (36 hrs deadline, 55% remaining), FOB2 needs Class III (48 hrs deadline, 61% remaining), AVN BDE needs Class IX repair parts (72 hrs deadline, 40% remaining). You have one convoy.',
    question: 'Which request gets the convoy?',
    relatedUnits: ['FOB1', 'FOB2', 'AVN_BDE'],
    relatedNodes: ['ASP', 'DEPOT_A'],
    forceMultiplierBonus: 13,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'FOB1 Class V — tightest deadline (36 hrs) and combat-critical supply class', doctrineBasis: 'ATP 4-0: Priority by deadline AND criticality — Class V to maneuver force first', outcome: 'OPTIMAL', doctrineNote: 'Deadline drives the decision. 36hrs is inside the 48hr USL threshold. Class V (ammunition) to a maneuver FOB is the highest priority combination. FOB2 and AVN BDE have buffer time.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 18, description: 'FOB1 Class V restored — combat capable' }, { type: 'RCT', delta: -4, description: 'Tightest deadline served — RCT maintained' }] },
      { id: 'B', text: 'FOB2 Class III — fuel is the enabler for everything else in the theater', doctrineBasis: 'Class III priority — valid argument but deadline not tightest', outcome: 'ACCEPTABLE', doctrineNote: 'Class III is critical, but FOB2 has 48hrs — 12hrs more than FOB1. FOB1 will breach the USL before FOB2. Acceptable if FOB1 gets next available convoy.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 14, description: 'FOB2 fuel restored' }, { type: 'READINESS', unitId: 'FOB1', delta: -6, description: 'FOB1 Class V continues to degrade — USL breach risk' }] },
      { id: 'C', text: 'AVN BDE Class IX — grounded aircraft hurt the entire theater', doctrineBasis: 'Theater-level thinking misapplied — AVN BDE has 72hr buffer, others do not', outcome: 'SUBOPTIMAL', doctrineNote: 'Aviation has the most time (72hrs). Serving them first while FOB1 hits its deadline is a priority error. FOB1 enters stonewall before the next convoy cycle.', effects: [{ type: 'READINESS', unitId: 'AVN_BDE', delta: 12, description: 'Aviation parts restored' }, { type: 'STONEWALL', delta: 6, description: 'FOB1 enters stonewall — deadline breached' }] },
      { id: 'D', text: 'Split the convoy load equally across all three — partial supply to each', doctrineBasis: 'Equitable split — fails to recognize priority hierarchy', outcome: 'FAILURE', doctrineNote: 'Splitting one convoy three ways gives each unit 33% of what it needs. No unit is adequately sustained. All three enter degraded status. Equitable is not the same as prioritized.', effects: [{ type: 'READINESS', delta: -8, description: 'All units partially supplied — none at adequate levels' }, { type: 'SIGMA', delta: -0.3, description: 'Theater sigma degrades from across-the-board degradation' }, { type: 'STONEWALL', delta: 4, description: 'Multiple units at stonewall risk' }] }
    ]
  },
  {
    id: 'D7_C1_D12',
    day: 12,
    title: 'LOC SECURITY VS THROUGHPUT SPEED',
    type: 'LOC',
    situation: 'The fastest route to FOB1 (4 hrs) has a ThreatLevel HIGH — enemy IED activity confirmed yesterday. The secured route (Military Police escorted) takes 11 hours but is assessed ThreatLevel LOW. FOB1 Class III deadline is 18 hours. Enemy activity is increasing.',
    question: 'Which route do you use for the Class III convoy?',
    relatedUnits: ['FOB1'],
    relatedNodes: ['DEPOT_A', 'FOB1'],
    forceMultiplierBonus: 10,
    optimalChoice: 'B',
    choices: [
      { id: 'A', text: 'Fast route — accept the threat, speed is critical with an 18hr deadline', doctrineBasis: 'Speed over security — acceptable in extremis, high risk', outcome: 'ACCEPTABLE', doctrineNote: 'Fast route arrives with 14hrs to spare, but HIGH threat means 40% convoy interdiction probability. If interdicted, FOB1 enters stonewall and convoy is lost. Roll the dice.', effects: [{ type: 'RCT', delta: -7, description: 'Fast route delivers 7hrs ahead of secured route' }, { type: 'STONEWALL', delta: 3, description: 'Interdiction risk — 40% probability of convoy loss' }] },
      { id: 'B', text: 'Secured route with MP escort — 11 hours, arrives with 7 hours to spare before deadline', doctrineBasis: 'ATP 4-0: LOC security is a sustainment commander responsibility — mitigate known threats', outcome: 'OPTIMAL', doctrineNote: 'Secured route arrives within the deadline with 7hr margin. Convoy protection is not optional when threat is HIGH and the cargo is mission-critical. The 7hrs of margin is acceptable.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 14, description: 'FOB1 Class III delivered safely — full readiness restored' }, { type: 'RCT', delta: 7, description: 'Secured route adds 7hrs — within USL threshold' }] },
      { id: 'C', text: 'Request air resupply — avoid the road threat entirely', doctrineBasis: 'Air resupply — correct if air assets available; check availability first', outcome: 'ACCEPTABLE', doctrineNote: 'Air would work IF a sortie is available. Check aerial port status before committing. If no sortie available, this decision delays action and FOB1 misses the deadline.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 14, description: 'Air delivery resolves crisis — IF sortie is available' }, { type: 'RCT', delta: -10, description: 'Air is fastest if available' }] },
      { id: 'D', text: 'Hold the convoy — wait for threat to clear before moving', doctrineBasis: 'Risk aversion — unsustainable when units have deadline requirements', outcome: 'FAILURE', doctrineNote: 'Waiting for the threat to "clear" is not a sustainment strategy. Threats are managed, not waited out. FOB1 deadline passes — stonewall confirmed.', effects: [{ type: 'STONEWALL', delta: 8, description: 'FOB1 stonewall confirmed — deadline missed' }, { type: 'SIGMA', delta: -0.4, description: 'Theater sigma degrades' }] }
    ]
  },
  {
    id: 'D8_C1_D14',
    day: 14,
    title: 'LATERAL TRANSFER — ROB PETER TO PAY PAUL',
    type: 'PRIORITY',
    situation: 'FOB1 is in AMBER status (Class V at 28%). Depot Alpha cannot resupply for 24hrs — convoy assets committed elsewhere. FOB3 is GREEN at 91% readiness with surplus Class V. Lateral transfer from FOB3 to FOB1 would take FOB3 from 91% to 58%. Your next depot convoy arrives in 36hrs.',
    question: 'Do you execute the lateral transfer?',
    relatedUnits: ['FOB1', 'FOB3'],
    relatedNodes: ['FOB1', 'FOB3'],
    forceMultiplierBonus: 9,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Execute the lateral transfer — bring FOB3 to 58%, bring FOB1 to 72%', doctrineBasis: 'ATP 4-0: Lateral transfer is authorized to prevent mission failure when depot resupply is delayed', outcome: 'OPTIMAL', doctrineNote: 'FOB3 at 58% remains GREEN (above 50% threshold). FOB1 recovers from AMBER to GREEN. Depot convoy arrives in 36hrs to restore FOB3. Tactically sound.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 22, description: 'FOB1 recovers from AMBER to GREEN via lateral transfer' }, { type: 'READINESS', unitId: 'FOB3', delta: -15, description: 'FOB3 degrades from 91% to 58% — still GREEN' }] },
      { id: 'B', text: 'Partial transfer — take enough from FOB3 to bring FOB1 to 50%, minimize FOB3 impact', doctrineBasis: 'Conservative lateral transfer — reduces risk but may not fully resolve FOB1 status', outcome: 'ACCEPTABLE', doctrineNote: 'FOB1 barely reaches GREEN threshold. If any additional demand hits before the depot convoy arrives, FOB1 re-enters AMBER. Acceptable but leaves thin margins.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 12, description: 'FOB1 marginally restored — barely GREEN' }, { type: 'READINESS', unitId: 'FOB3', delta: -8, description: 'FOB3 minimally impacted' }] },
      { id: 'C', text: 'Do not transfer — protect FOB3 readiness and wait 24hrs for Depot Alpha', doctrineBasis: 'Protect surplus unit — valid concern but FOB1 mission may be compromised', outcome: 'SUBOPTIMAL', doctrineNote: 'FOB1 remains in AMBER for 24hrs. If tasked for operations during that window, it performs at degraded capacity. FOB3 protection is rational but FOB1 cost is real.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: -5, description: 'FOB1 continues to degrade during 24hr wait' }, { type: 'STONEWALL', delta: 3, description: 'Stonewall risk if additional demand hits FOB1' }] },
      { id: 'D', text: 'Strip FOB3 completely — maximize FOB1 recovery, rebuild FOB3 from depot', doctrineBasis: 'Maximum lateral transfer — creates unnecessary risk to FOB3', outcome: 'SUBOPTIMAL', doctrineNote: 'Stripping FOB3 to CRITICAL to maximize FOB1 is excessive. FOB3 drops to RED status. You now have two problem units instead of one.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 28, description: 'FOB1 fully restored' }, { type: 'READINESS', unitId: 'FOB3', delta: -35, description: 'FOB3 drops to RED — new problem created' }, { type: 'STONEWALL', delta: 3, description: 'FOB3 stonewall risk introduced' }] }
    ]
  },
  {
    id: 'D9_C1_D15',
    day: 15,
    title: 'OPERATIONAL RESERVE — USE IT OR PROTECT IT',
    type: 'PRE_POSITION',
    situation: 'You have a 3-day operational reserve of Class V at Depot Bravo. Day 20 intelligence indicates a major enemy push — the culminating operation of the campaign. FOB1 is requesting Class V now (Day 15) to support a minor engagement. Using the reserve now will leave you with 1.5 days for the Day 20 operation.',
    question: 'Do you release operational reserve to cover Day 15 requirements?',
    relatedUnits: ['FOB1', 'III_CORPS'],
    relatedNodes: ['DEPOT_B', 'FOB1'],
    forceMultiplierBonus: 12,
    optimalChoice: 'B',
    choices: [
      { id: 'A', text: 'Release the full reserve — FOB1 needs it now, Day 20 is 5 days away', doctrineBasis: 'Consume reserve for current need — compromises future operation', outcome: 'SUBOPTIMAL', doctrineNote: 'Using the full 3-day reserve now leaves only 1.5 days for the Day 20 culminating operation. That is insufficient. Day 20 operation will be compromised.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 15, description: 'FOB1 fully supplied for Day 15 engagement' }, { type: 'READINESS', delta: -20, description: 'Day 20 operation undersupported — significant theater impact' }] },
      { id: 'B', text: 'Release half the reserve — enough for FOB1 today, protect the other half for Day 20', doctrineBasis: 'ATP 4-0: Operational reserves are protected for decisive operations — partial release is acceptable', outcome: 'OPTIMAL', doctrineNote: 'Half reserve supports FOB1 adequately for a minor engagement. The remaining 1.5 days, combined with routine replenishment over 5 days, gives adequate Day 20 stocks.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 8, description: 'FOB1 adequately supported for Day 15 engagement' }, { type: 'MULTIPLIER', delta: 12, description: 'Day 20 operation protected — Force Multiplier preserved' }] },
      { id: 'C', text: 'Deny the request — operational reserve is protected until Day 20', doctrineBasis: 'Reserve protection — appropriate in principle but FOB1 may degrade to stonewall', outcome: 'ACCEPTABLE', doctrineNote: 'Reserve protection is correct, but FOB1 needs assessment. If FOB1 has enough organic supply for 5 days, denying the reserve is correct. If not, this creates a stonewall before Day 20.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: -4, description: 'FOB1 continues minor degradation — stonewall risk if demand continues' }, { type: 'MULTIPLIER', delta: 15, description: 'Full reserve preserved for Day 20 culminating operation' }] },
      { id: 'D', text: 'Move the reserve forward to FOB1 location — protect it there instead of Depot Bravo', doctrineBasis: 'Forward positioning of reserve — creates distribution efficiency but exposes reserve to threat', outcome: 'ACCEPTABLE', doctrineNote: 'Moving reserve forward reduces convoy time when needed. However, it exposes the reserve to LOC interdiction risk. Acceptable if LOC is assessed secure.', effects: [{ type: 'RCT', delta: -8, description: 'Forward positioning reduces response time when reserve is needed' }, { type: 'STONEWALL', delta: 2, description: 'Reserve exposure to LOC threat introduces minor risk' }] }
    ]
  },
  {
    id: 'D10_C1_D16',
    day: 16,
    title: 'LOC INTERDICTION — FOB IRON CRISIS',
    type: 'LOC',
    situation: 'FOB IRON (FOB1) reports Class III at CRITICAL (19%). Ground LOC is interdicted by enemy activity. Unit readiness is at 18% and falling. Air corridor is open — weather closes in 24 hours. III Corps fuel convoy via alternate ground route: ETA 72 hours.',
    question: 'Commander, your decision:',
    relatedUnits: ['FOB1', 'III_CORPS'],
    relatedNodes: ['AERIAL_PORT', 'FOB1'],
    forceMultiplierBonus: 15,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Immediately air-deliver emergency Class III — use the open corridor tonight', doctrineBasis: 'ATP 4-0: Air resupply when ground LOC interdicted and time critical — textbook application', outcome: 'OPTIMAL', doctrineNote: 'Air delivery via open corridor is the doctrinally correct response. When ground LOC is interdicted and air corridor is available, air resupply takes priority. FOB IRON receives emergency Class III within 6 hours.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 56, description: 'FOB IRON recovers from 18% to 74% — STONEWALL cleared' }, { type: 'SIGMA', delta: 0.3, description: 'Theater sigma improves from decisive action' }, { type: 'RCT', delta: -7, description: 'Air delivery resolves crisis in hours not days' }, { type: 'MULTIPLIER', delta: 15, description: 'Force Multiplier: FOB IRON combat capable' }] },
      { id: 'B', text: 'Push ground convoy via alternate route — accept 72hr delay, start now', doctrineBasis: 'Alternate LOC — valid but math fails: 72hr delay vs 18hr of readiness remaining', outcome: 'SUBOPTIMAL', doctrineNote: 'Ground convoy via alternate route arrives in 72hrs. FOB IRON has ~18hrs of readiness. Unit enters stonewall before convoy arrives. Air corridor missed.', effects: [{ type: 'STONEWALL', delta: 6, description: 'FOB IRON confirmed stonewall on Day 17' }, { type: 'SIGMA', delta: -0.2, description: 'Theater sigma degrades from stonewall event' }] },
      { id: 'C', text: 'Wait for FOB1 to submit a formal resupply request through channels', doctrineBasis: 'Pull distribution — catastrophically misapplied in crisis', outcome: 'FAILURE', doctrineNote: 'Waiting for a formal request violates push distribution doctrine. FOB IRON is already in crisis — no time for formal channels. Full stonewall confirmed.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: -18, description: 'FOB IRON: FULL STONEWALL' }, { type: 'SIGMA', delta: -0.5, description: 'Theater sigma collapses' }, { type: 'STONEWALL', delta: 10, description: 'Stonewall rate spikes — theater mission risk HIGH' }] },
      { id: 'D', text: 'Lateral transfer — pull Class III from FOB3 and push to FOB1', doctrineBasis: 'Lateral transfer — valid but FOB3-to-FOB1 route also interdicted', outcome: 'ACCEPTABLE', doctrineNote: 'Lateral transfer from FOB3 resolves the crisis IF FOB3-FOB1 route is clear. Check LOC status first. Creates secondary degradation at FOB3 but prevents stonewall.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 43, description: 'FOB IRON recovers to 61% via lateral transfer' }, { type: 'READINESS', unitId: 'FOB3', delta: -15, description: 'FOB3 degrades from 91% to 58%' }, { type: 'SIGMA', delta: 0.1, description: 'Theater sigma marginally improves — net neutral' }] }
    ]
  },
  {
    id: 'D11_C1_D17',
    day: 17,
    title: 'AIR ASSET PRIORITIZATION — ONE SORTIE, TWO NEEDS',
    type: 'AIR_GROUND',
    situation: 'You have one aerial sortie available today. FOB2 needs emergency Class III (readiness 32%, 12hr deadline). A destroyed bridge on MSR BLUE has cut off Depot Bravo — Class IX repair parts cannot reach 4ID maintenance. 4ID has 20 vehicles deadlined. Both cannot be served with one sortie.',
    question: 'Where does the aerial sortie go?',
    relatedUnits: ['FOB2', '4ID'],
    relatedNodes: ['AERIAL_PORT', 'FOB2', 'DEPOT_B'],
    forceMultiplierBonus: 13,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'FOB2 Class III — 12hr deadline, 32% readiness — imminent stonewall prevention', doctrineBasis: 'Tightest deadline takes priority — FOB2 stonewall is imminent', outcome: 'OPTIMAL', doctrineNote: 'FOB2 has 12hrs — below the USL. Stonewall is imminent. 4ID maintenance is degraded but vehicles can be recovered over time. A stonewall takes 24–48hrs to recover. Act on the tightest deadline.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 30, description: 'FOB2 stonewall averted — readiness restored to 62%' }, { type: 'READINESS', unitId: '4ID', delta: -5, description: '4ID maintenance backlog continues — 20 vehicles remain deadlined' }] },
      { id: 'B', text: '4ID Class IX — 20 deadlined vehicles means 20% of division combat power offline', doctrineBasis: 'Combat power argument — valid concern, but deadline math overrides', outcome: 'ACCEPTABLE', doctrineNote: 'Deadlined vehicles hurt, but FOB2 enters stonewall in 12hrs. A stonewall requires 24–48hrs to recover. The math favors FOB2. 4ID can partially function with remaining vehicles.', effects: [{ type: 'READINESS', unitId: '4ID', delta: 12, description: '4ID maintenance restored — 20 vehicles back online' }, { type: 'STONEWALL', delta: 5, description: 'FOB2 stonewall confirmed — deadline missed' }] },
      { id: 'C', text: 'Request an emergency sortie from Theater — both needs are critical', doctrineBasis: 'Escalation to theater assets — valid if time permits', outcome: 'ACCEPTABLE', doctrineNote: 'If a theater sortie can be confirmed within 4hrs, this buys time. If approval takes 6+ hours, FOB2 deadline passes. Pursue theater sortie AND commit your organic sortie to FOB2 simultaneously.', effects: [{ type: 'RCT', delta: 4, description: 'Escalation adds hours — risk to FOB2 deadline' }] },
      { id: 'D', text: 'Split the sortie — half load to each', doctrineBasis: 'Split load — neither unit adequately served', outcome: 'FAILURE', doctrineNote: 'Half a sortie of Class III does not prevent FOB2 stonewall. Half of Class IX does not restore 20 deadlined vehicles. Both units remain degraded. Splitting fails both requirements.', effects: [{ type: 'STONEWALL', delta: 4, description: 'FOB2 stonewall risk remains — half load insufficient' }, { type: 'READINESS', delta: -8, description: 'Both units inadequately served' }] }
    ]
  },
  {
    id: 'D12_C1_D18',
    day: 18,
    title: 'THREE-UNIT AMBER TRIAGE — CHOOSE ONE',
    type: 'TRIAGE',
    situation: 'III Corps (76% readiness, Class V at 41%), FOB2 (68% readiness, Class III at 35%), and Aviation Brigade (61% readiness, Class IX at 30%) are all in AMBER. You have resources to fully restore one. The others get nothing today — depot replenishment in 48hrs.',
    question: 'Which unit do you fully restore?',
    relatedUnits: ['III_CORPS', 'FOB2', 'AVN_BDE'],
    relatedNodes: ['DEPOT_A', 'ASP'],
    forceMultiplierBonus: 11,
    optimalChoice: 'B',
    choices: [
      { id: 'A', text: 'III Corps — maneuver force must remain combat capable above all else', doctrineBasis: 'Maneuver priority — correct doctrine, but III Corps has most buffer time', outcome: 'ACCEPTABLE', doctrineNote: 'III Corps at 76% with 41% Class V has more buffer than Aviation (61%, 30% Class IX). Aviation is closer to stonewall. Correct instinct, wrong triage calculation.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 16, description: 'III Corps fully restored' }, { type: 'READINESS', unitId: 'AVN_BDE', delta: -8, description: 'Aviation continues to degrade — stonewall risk in 24hrs' }] },
      { id: 'B', text: 'Aviation Brigade — lowest readiness (61%), most critical degradation rate, closest to stonewall', doctrineBasis: 'Triage by stonewall proximity — serve the unit closest to failure first', outcome: 'OPTIMAL', doctrineNote: 'Triage doctrine: when you cannot serve all, serve the unit closest to failure. Aviation at 61% with 30% Class IX will hit stonewall before III Corps or FOB2. Restore Aviation — depot handles the others in 48hrs.', effects: [{ type: 'READINESS', unitId: 'AVN_BDE', delta: 25, description: 'Aviation restored to GREEN — stonewall averted' }, { type: 'SIGMA', delta: 0.2, description: 'Theater sigma improves from correct triage' }, { type: 'MULTIPLIER', delta: 11, description: 'Force Multiplier: Aviation available to support Day 20 operation' }] },
      { id: 'C', text: 'FOB2 — it is the forward-most unit and supplies the most critical node', doctrineBasis: 'Geographic priority — not a doctrinal triage criterion', outcome: 'SUBOPTIMAL', doctrineNote: 'FOB2 at 68% is not the most critical. Aviation is closer to stonewall. FOB2 has more buffer. Geographic position is not the triage criterion — readiness trajectory is.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 20, description: 'FOB2 restored' }, { type: 'STONEWALL', delta: 4, description: 'Aviation stonewall probable — not addressed' }] },
      { id: 'D', text: 'Distribute evenly — bring all three up slightly rather than fully restoring one', doctrineBasis: 'Equitable distribution — prevents triage, leaves all units marginal', outcome: 'FAILURE', doctrineNote: 'Even distribution brings all three to slightly better AMBER. None escape the degradation cycle. Aviation still hits stonewall before 48hr depot replenishment. Triage is the right doctrine here.', effects: [{ type: 'READINESS', delta: -5, description: 'All three units remain in AMBER — no meaningful improvement' }, { type: 'STONEWALL', delta: 5, description: 'Aviation stonewall confirmed before depot replenishment arrives' }] }
    ]
  },
  {
    id: 'D13_C1_D19',
    day: 19,
    title: 'ALTERNATE LOC ACTIVATION — COST VS BENEFIT',
    type: 'LOC',
    situation: 'MSR BLUE is interdicted. Opening Alternate Route DELTA costs 2 convoys and 48hrs of engineer effort to repair a bridge section. Route DELTA adds 6hrs per trip but avoids the threat. MSR GREEN is also available but goes through a known enemy zone — ThreatLevel HIGH. FOB1 deadline is 36hrs.',
    question: 'How do you open resupply to FOB1?',
    relatedUnits: ['FOB1'],
    relatedNodes: ['FOB1', 'DEPOT_A'],
    forceMultiplierBonus: 10,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Invest 48hrs to open Route DELTA — secure alternate LOC for the long-term', doctrineBasis: 'ATP 4-0: LOC development is a sustainment commander priority — invest now for sustained access', outcome: 'OPTIMAL', doctrineNote: 'FOB1 can be temporarily sustained via air resupply during the 48hr DELTA opening. Route DELTA then provides a secure LOC for the rest of the campaign. The investment pays dividends through Day 30.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 10, description: 'FOB1 bridged by air during 48hr window, then DELTA opened' }, { type: 'MULTIPLIER', delta: 10, description: 'Force Multiplier: secure LOC available for remainder of campaign' }] },
      { id: 'B', text: 'Use MSR GREEN despite HIGH threat — speed matters more than risk right now', doctrineBasis: 'Speed over security — acceptable in extremis, HIGH threat is real', outcome: 'ACCEPTABLE', doctrineNote: 'MSR GREEN gets to FOB1 in time, but HIGH threat means 35% interdiction probability. If interdicted, convoy is lost and FOB1 still fails. Roll the dice.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 12, description: 'FOB1 receives supply — IF convoy not interdicted' }, { type: 'STONEWALL', delta: 3, description: 'Interdiction probability 35% — FOB1 stonewall risk if convoy lost' }] },
      { id: 'C', text: 'Air resupply only — avoid all ground risk, use aerial port exclusively for FOB1', doctrineBasis: 'Air-only sustainment — not sustainable for extended operations', outcome: 'SUBOPTIMAL', doctrineNote: 'Air-only sustains FOB1 for now but air assets are finite. You cannot air-sustain a FOB indefinitely. No LOC development means this problem recurs every day.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 8, description: 'FOB1 temporarily sustained by air' }, { type: 'RCT', delta: 12, description: 'Air-only creates bottleneck — sortie competition spikes' }] },
      { id: 'D', text: 'Withdraw FOB1 to a location served by an open LOC', doctrineBasis: 'Retrograde — drastic, compromises tactical position', outcome: 'FAILURE', doctrineNote: 'Withdrawing FOB1 surrenders its tactical position and may compromise the operational plan. Sustainment challenges are solved through LOC development, not unit retrograde.', effects: [{ type: 'READINESS', delta: -15, description: 'FOB1 tactical position lost — operational plan compromised' }, { type: 'SIGMA', delta: -0.5, description: 'Theater sigma drops from retrograde decision' }] }
    ]
  },
  {
    id: 'D14_C1_D20',
    day: 20,
    title: 'CLASS V BALANCE — OFFENSE VS DEFENSE',
    type: 'PRIORITY',
    situation: 'The major enemy push begins today. You have enough Class V for either: full offensive support for III Corps (main effort, attacking) OR full defensive support for 4ID (defending the LOC network). You cannot fully support both. Half-measures leave both units at 60% ammo.',
    question: 'How do you allocate Class V?',
    relatedUnits: ['III_CORPS', '4ID'],
    relatedNodes: ['ASP', 'FOB1'],
    forceMultiplierBonus: 16,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Full Class V to III Corps — support the main effort, 4ID defends with what they have', doctrineBasis: 'Priority of support follows priority of effort — main effort gets full support', outcome: 'OPTIMAL', doctrineNote: 'The main effort gets priority. III Corps needs full ammo to achieve the decisive operation. 4ID in a defensive role can sustain with lower ammo levels than an attacking force.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 20, description: 'III Corps fully supplied for decisive operation' }, { type: 'READINESS', unitId: '4ID', delta: -5, description: '4ID defends at reduced ammo — manageable in defensive posture' }, { type: 'MULTIPLIER', delta: 16, description: 'Force Multiplier: decisive operation at full sustainment' }] },
      { id: 'B', text: 'Full Class V to 4ID — if the LOC network falls, III Corps is cut off', doctrineBasis: 'LOC protection priority — valid concern but reverses priority of effort', outcome: 'SUBOPTIMAL', doctrineNote: 'LOC protection is important but cannot override the main effort. III Corps attacking with half ammo has a high probability of stalling — creating a worse outcome than a temporarily degraded LOC.', effects: [{ type: 'READINESS', unitId: '4ID', delta: 18, description: '4ID LOC defense fully supported' }, { type: 'READINESS', unitId: 'III_CORPS', delta: -15, description: 'III Corps attacks with half ammo — operation stalls' }] },
      { id: 'C', text: 'Split 60/40 — favor III Corps but give 4ID enough to hold', doctrineBasis: 'Weighted split — pragmatic compromise that supports both without fully enabling either', outcome: 'ACCEPTABLE', doctrineNote: 'III Corps at 60% ammo can attack but risk increases. 4ID at 40% can defend but is thin. Both can accomplish their missions — neither at peak effectiveness.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 10, description: 'III Corps partially supported — attack possible but degraded' }, { type: 'READINESS', unitId: '4ID', delta: 6, description: '4ID partially supported — defense possible but thin' }] },
      { id: 'D', text: 'Hold Class V in reserve — wait to see who needs it more once contact is made', doctrineBasis: 'Reactive allocation — in high-intensity combat, reactive is too slow', outcome: 'FAILURE', doctrineNote: 'Waiting for contact before allocating ammo means both units enter the fight under-supplied. Combat ammo consumption outpaces reactive distribution. Both units degrade under fire.', effects: [{ type: 'READINESS', delta: -18, description: 'Both units enter contact without adequate ammo — theater-wide degradation' }, { type: 'SIGMA', delta: -0.6, description: 'Theater sigma collapses during major engagement' }] }
    ]
  },
  {
    id: 'D15_C1_D22',
    day: 22,
    title: 'MULTIPLE STONEWALL — TRIAGE UNDER FIRE',
    type: 'TRIAGE',
    situation: 'Three units simultaneously enter STONEWALL: FOB1 (combat maneuver FOB), FOB2 (Class III critical), Aviation BDE (all aircraft grounded). You can recover one unit per day. The operation has 8 days remaining. Recovery order determines the campaign outcome.',
    question: 'Which unit do you recover first?',
    relatedUnits: ['FOB1', 'FOB2', 'AVN_BDE'],
    relatedNodes: ['AERIAL_PORT', 'ASP'],
    forceMultiplierBonus: 18,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'FOB1 first — combat maneuver unit in stonewall is the most dangerous gap in the line', doctrineBasis: 'Combat power priority — maneuver stonewall creates a tactical hole in the defense', outcome: 'OPTIMAL', doctrineNote: 'A maneuver FOB in stonewall has no offensive or defensive capability — it is a gap in the line. FOB2 (supply node) and AVN BDE (aviation) can be partially covered by alternates. The tactical gap cannot.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 50, description: 'FOB1 recovered on Day 22 — combat capability restored' }, { type: 'READINESS', unitId: 'FOB2', delta: -5, description: 'FOB2 continues in stonewall Day 22' }, { type: 'MULTIPLIER', delta: 18, description: 'Force Multiplier: combat line restored' }] },
      { id: 'B', text: 'Aviation first — no air support means no ISR, no MEDEVAC, no CAS', doctrineBasis: 'Aviation effect — compelling but air can be requested from theater assets temporarily', outcome: 'ACCEPTABLE', doctrineNote: 'Theater aviation can provide temporary coverage for 24–48hrs. That buys time to recover FOB1 first. Aviation recovery on Day 23 is still within the operational window.', effects: [{ type: 'READINESS', unitId: 'AVN_BDE', delta: 45, description: 'Aviation restored — aircraft available' }, { type: 'READINESS', unitId: 'FOB1', delta: -8, description: 'FOB1 stonewall continues — tactical gap persists Day 22' }] },
      { id: 'C', text: 'FOB2 first — Class III stonewall means nothing moves without fuel', doctrineBasis: 'Fuel priority — valid but FOB2 has partially workarounds (alternate fuel points)', outcome: 'ACCEPTABLE', doctrineNote: 'Alternate fuel points can partially cover FOB2 gap for 24hrs. FOB1 tactical gap is harder to cover. FOB2 on Day 23 is workable.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 40, description: 'FOB2 Class III restored' }, { type: 'READINESS', unitId: 'FOB1', delta: -8, description: 'FOB1 stonewall continues — tactical gap Day 22' }] },
      { id: 'D', text: 'Partial recovery for all three — spread resources to bring each to 30%', doctrineBasis: 'Equitable recovery — leaves all three in stonewall or near-stonewall', outcome: 'FAILURE', doctrineNote: '30% recovery is still below operational threshold. All three remain effectively in stonewall. Three half-recovered units are worse than one fully recovered unit covering for two still-stonewall units.', effects: [{ type: 'STONEWALL', delta: 12, description: 'All three units remain in operational stonewall — theater impact critical' }, { type: 'SIGMA', delta: -0.8, description: 'Theater sigma collapses — worst outcome' }] }
    ]
  },
  {
    id: 'D16_C1_D23',
    day: 23,
    title: 'LAST AERIAL SORTIE — CLASS III OR CLASS V',
    type: 'AIR_GROUND',
    situation: 'One aerial sortie remains. Weather closes all air corridors tomorrow. FOB2 needs Class III (fuel — 22% remaining, 6hr deadline). FOB1 needs Class V (ammo — 18% remaining, 8hr deadline). Ground routes are both currently clear but will take 10hrs. Only one aerial sortie.',
    question: 'Where does the last sortie go?',
    relatedUnits: ['FOB1', 'FOB2'],
    relatedNodes: ['AERIAL_PORT', 'FOB1', 'FOB2'],
    forceMultiplierBonus: 14,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Aerial sortie to FOB2 Class III (6hr deadline) — simultaneously push ground convoy to FOB1', doctrineBasis: 'Deadline-driven multi-modal: serve tightest deadline by air, use ground for next-tightest', outcome: 'OPTIMAL', doctrineNote: 'FOB2 has 6hrs — air is the only way. FOB1 has 8hrs — ground takes 10hrs but close enough to manage with a partial aerial supplement. Split the approach: air to FOB2, ground to FOB1, both served.', effects: [{ type: 'READINESS', unitId: 'FOB2', delta: 35, description: 'FOB2 Class III restored via air — 6hr deadline met' }, { type: 'READINESS', unitId: 'FOB1', delta: 25, description: 'FOB1 Class V partially served via ground — 8hr deadline tight but met' }] },
      { id: 'B', text: 'Aerial sortie to FOB1 Class V — ammunition is more critical than fuel', doctrineBasis: 'Class V priority — misapplied when FOB2 has tighter deadline', outcome: 'SUBOPTIMAL', doctrineNote: 'FOB2 6hr deadline cannot be met by ground (10hr trip). FOB2 enters stonewall. FOB1 8hr deadline could potentially be met by ground convoy if departed immediately. Deadline math favors FOB2 for the sortie.', effects: [{ type: 'READINESS', unitId: 'FOB1', delta: 30, description: 'FOB1 Class V restored via air' }, { type: 'STONEWALL', delta: 6, description: 'FOB2 stonewall confirmed — 6hr deadline cannot be met by ground' }] },
      { id: 'C', text: 'Split the sortie 50/50 — both units need supply', doctrineBasis: 'Split load — neither unit gets enough from half a sortie', outcome: 'FAILURE', doctrineNote: 'Half a sortie of Class III does not prevent FOB2 stonewall. Half a sortie of Class V does not adequately restore FOB1. Both units remain critically low. The last sortie must go somewhere fully.', effects: [{ type: 'STONEWALL', delta: 5, description: 'FOB2 stonewall risk — half load insufficient for 6hr deadline' }, { type: 'READINESS', delta: -10, description: 'Both units remain critically low' }] },
      { id: 'D', text: 'Save the sortie — hold it for a Day 24 emergency if needed', doctrineBasis: 'Reserve sortie — not appropriate when current need is certain', outcome: 'FAILURE', doctrineNote: 'Weather closes tomorrow. An unused sortie today is a wasted sortie. Certain current need outweighs speculative future need. Both FOBs hit stonewall.', effects: [{ type: 'STONEWALL', delta: 10, description: 'Both FOBs enter stonewall — sortie wasted' }, { type: 'SIGMA', delta: -0.7, description: 'Theater sigma collapses' }] }
    ]
  },
  {
    id: 'D17_C1_D24',
    day: 24,
    title: 'CULMINATING OPERATION — ALL-IN OR HOLD RESERVE',
    type: 'ECONOMY_OF_FORCE',
    situation: 'The decisive engagement begins today. You can fully commit all Class V stocks to III Corps (maximum combat power) or hold 30% in reserve in case the operation extends beyond 48hrs. Intelligence indicates 60% probability operation completes in 48hrs. 40% probability it extends to 72hrs.',
    question: 'Do you commit fully or hold reserve?',
    relatedUnits: ['III_CORPS'],
    relatedNodes: ['ASP', 'DEPOT_B'],
    forceMultiplierBonus: 15,
    optimalChoice: 'B',
    choices: [
      { id: 'A', text: 'All-in — commit everything to III Corps for maximum shock effect in the decisive engagement', doctrineBasis: 'Mass — maximum force at decisive point; but no reserve for extension', outcome: 'ACCEPTABLE', doctrineNote: 'Full commitment maximizes Day 24 combat power. 40% chance of 72hr extension leaves III Corps without ammo on Day 27. High risk, high reward.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 25, description: 'III Corps at maximum combat power for Day 24' }, { type: 'STONEWALL', delta: 4, description: '40% probability of Day 27 Class V stonewall if operation extends' }] },
      { id: 'B', text: 'Commit 70%, hold 30% reserve — full force today, sustainment for potential extension', doctrineBasis: 'ADP 3-0: Economy of force — retain reserve to sustain operations if extended', outcome: 'OPTIMAL', doctrineNote: 'III Corps at 70% is still overwhelming for the decisive engagement. The 30% reserve covers the 40% extension probability. This is the textbook balance between mass and sustainability.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 18, description: 'III Corps at 70% — decisive engagement supported' }, { type: 'MULTIPLIER', delta: 15, description: 'Force Multiplier: reserve covers extension scenario — campaign not at risk' }] },
      { id: 'C', text: 'Commit 50%, hold 50% — balanced approach across both scenarios', doctrineBasis: 'Over-conservative — 50% may not generate decisive combat effect', outcome: 'SUBOPTIMAL', doctrineNote: 'III Corps at 50% may not generate the decisive effect needed. Enemy can potentially withstand a half-powered attack. The engagement may not be decisive — extending the operation anyway.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 8, description: 'III Corps at 50% — decisive effect uncertain' }, { type: 'SIGMA', delta: -0.2, description: 'Indecisive engagement — theater sigma marginally impacted' }] },
      { id: 'D', text: 'Hold everything — wait for the enemy to show their main effort before committing', doctrineBasis: 'Reactive allocation in decisive engagement — never appropriate', outcome: 'FAILURE', doctrineNote: 'Withholding all supply from III Corps during the decisive engagement is a catastrophic failure of sustainment. III Corps attacks with organic loads only — operation stalls. Enemy retains initiative.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: -20, description: 'III Corps attacks on organic loads only — operation stalls' }, { type: 'SIGMA', delta: -0.8, description: 'Theater sigma collapses — campaign at risk' }] }
    ]
  },
  {
    id: 'D18_C1_D27',
    day: 27,
    title: 'ECONOMY OF FORCE — ACCEPT DEGRADATION SOMEWHERE',
    type: 'ECONOMY_OF_FORCE',
    situation: 'Three days until end of campaign. You have enough Class IX to restore one of: 4ID (main effort support), Aviation BDE (theater enabler), or FOB3 (economy of force unit). Campaign victory depends on III Corps readiness. 4ID directly supports III Corps. FOB3 is a secondary position.',
    question: 'Where do the Class IX repair parts go?',
    relatedUnits: ['4ID', 'AVN_BDE', 'FOB3'],
    relatedNodes: ['DEPOT_B'],
    forceMultiplierBonus: 12,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: '4ID — directly enables III Corps main effort with 3 days remaining', doctrineBasis: 'Support the main effort — 4ID directly enables the decisive operation', outcome: 'OPTIMAL', doctrineNote: 'With 3 days remaining, supporting the main effort (III Corps via 4ID) is the decisive investment. FOB3 is economy of force — it can accept degradation. Aviation can be supplemented by theater assets.', effects: [{ type: 'READINESS', unitId: '4ID', delta: 20, description: '4ID maintenance restored — III Corps support maintained' }, { type: 'READINESS', unitId: 'FOB3', delta: -6, description: 'FOB3 continues degradation — acceptable economy of force' }, { type: 'MULTIPLIER', delta: 12, description: 'Force Multiplier: main effort supported through campaign end' }] },
      { id: 'B', text: 'Aviation BDE — air support is a theater-wide force multiplier', doctrineBasis: 'Theater asset priority — valid argument but 4ID directly supports main effort', outcome: 'ACCEPTABLE', doctrineNote: 'Aviation multiplies everyone, but 4ID directly enables III Corps at the decisive point. With 3 days remaining, direct support wins over indirect.', effects: [{ type: 'READINESS', unitId: 'AVN_BDE', delta: 18, description: 'Aviation restored — theater air support available' }, { type: 'READINESS', unitId: '4ID', delta: -5, description: '4ID maintenance continues to degrade — some III Corps support degradation' }] },
      { id: 'C', text: 'FOB3 — forward position must be held through campaign end', doctrineBasis: 'Geographic priority misapplied — FOB3 is economy of force position', outcome: 'FAILURE', doctrineNote: 'FOB3 is the economy of force unit — it is supposed to accept degradation. Investing in FOB3 while the main effort support (4ID) degrades inverts the priority hierarchy.', effects: [{ type: 'READINESS', unitId: 'FOB3', delta: 15, description: 'FOB3 restored — but it is the economy of force unit' }, { type: 'READINESS', unitId: '4ID', delta: -10, description: '4ID degrades — III Corps main effort support compromised' }, { type: 'SIGMA', delta: -0.3, description: 'Priority inversion degrades theater sigma' }] },
      { id: 'D', text: 'Hold the Class IX — preserve for campaign end contingency', doctrineBasis: 'Reserve — not appropriate when current need is certain and campaign is nearly over', outcome: 'SUBOPTIMAL', doctrineNote: 'Holding parts for a contingency with 3 days remaining wastes them. All three units continue to degrade. The contingency is less costly than certain degradation.', effects: [{ type: 'READINESS', delta: -8, description: 'All three units continue to degrade — no maintenance support' }] }
    ]
  },
  {
    id: 'D19_C1_D29',
    day: 29,
    title: 'FINAL PUSH — LAST CONVOY TO WIN THE CAMPAIGN',
    type: 'PRE_POSITION',
    situation: 'Final day of logistics operations. One convoy remains. III Corps reports 42% Class V — enough for 1 day of moderate contact. Intelligence: the enemy will make a final push tonight. If III Corps holds, the campaign is won. If not, the theater LOC collapses. Everything rides on tonight.',
    question: 'How do you use your last convoy?',
    relatedUnits: ['III_CORPS'],
    relatedNodes: ['ASP', 'FOB1'],
    forceMultiplierBonus: 20,
    optimalChoice: 'A',
    choices: [
      { id: 'A', text: 'Push all Class V to III Corps immediately — give them everything for tonight', doctrineBasis: 'Mass at decisive point — all remaining logistics support the final engagement', outcome: 'OPTIMAL', doctrineNote: 'This is the campaign culmination. All logistics doctrine points to this: mass your sustainment at the decisive point for the decisive moment. III Corps holds. Campaign won.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 30, description: 'III Corps at maximum combat power for final engagement' }, { type: 'SIGMA', delta: 0.5, description: 'Final action lifts theater sigma' }, { type: 'MULTIPLIER', delta: 20, description: 'CAMPAIGN FORCE MULTIPLIER: decisive victory supported' }] },
      { id: 'B', text: 'Split between III Corps and Aviation — combined arms for the final fight', doctrineBasis: 'Combined arms resupply — valid but half measures in final engagement', outcome: 'ACCEPTABLE', doctrineNote: 'Aviation adds combat power but III Corps at 65% ammo is the primary risk. Splitting ensures combined arms but leaves III Corps marginally under-supplied for a heavy contact scenario.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: 15, description: 'III Corps partially restored — above threshold for final engagement' }, { type: 'READINESS', unitId: 'AVN_BDE', delta: 12, description: 'Aviation partially restored' }] },
      { id: 'C', text: 'Hold the convoy — maintain a reserve in case of LOC emergency overnight', doctrineBasis: 'Reserve — inappropriate when certain decisive need exists', outcome: 'FAILURE', doctrineNote: 'III Corps enters the final engagement at 42% ammo. This is below the critical threshold for heavy contact. The LOC emergency you are protecting against is less probable than III Corps failure under fire.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: -15, description: 'III Corps collapses under enemy final push — 42% insufficient' }, { type: 'SIGMA', delta: -1.0, description: 'Theater sigma collapses — campaign outcome at risk' }] },
      { id: 'D', text: 'Request emergency resupply from theater — this is beyond organic capability', doctrineBasis: 'Escalation on final day — too late, no time for theater response', outcome: 'FAILURE', doctrineNote: 'Theater resupply takes 24–48hrs to coordinate and deliver. The enemy attacks tonight. This is an organic sustainment problem you must solve now. The convoy is your solution.', effects: [{ type: 'READINESS', unitId: 'III_CORPS', delta: -20, description: 'III Corps enters final engagement unsupported — campaign failure' }] }
    ]
  },
  {
    id: 'D20_C1_D30',
    day: 30,
    title: 'THEATER AAR — WHAT DRIVES THE DOCTRINE CHANGE',
    type: 'PUSH_PULL',
    situation: 'Campaign complete. The Theater AAR identifies two systemic failures: (1) Request cycle times exceeded 48hrs in 38% of cases, and (2) Stonewall rate peaked at 12.7%. You must recommend ONE doctrine change for the next campaign. This recommendation will shape how the theater operates going forward.',
    question: 'What is your doctrine recommendation?',
    relatedUnits: ['III_CORPS', 'FOB1', 'FOB2'],
    relatedNodes: ['DEPOT_A', 'DEPOT_B'],
    forceMultiplierBonus: 10,
    optimalChoice: 'B',
    choices: [
      { id: 'A', text: 'Increase depot capacity — more stock on hand means more buffer time when LOCs are cut', doctrineBasis: 'Stockage solution — addresses symptom, not root cause', outcome: 'ACCEPTABLE', doctrineNote: 'More depot stock buys time but does not fix why requests took 38% longer than the USL. The root cause was process (no standardized SOP, siloed visibility) — not stock levels alone.', effects: [{ type: 'SIGMA', delta: 0.2, description: 'Marginal sigma improvement from stockage increase' }, { type: 'RCT', delta: -4, description: 'Minor RCT improvement from buffer stock' }] },
      { id: 'B', text: 'Mandate push distribution by default for all anticipated requirements — pull only for unforecasted demand', doctrineBasis: 'ADP 4-0: Push distribution is the correct default for predictable theater operations', outcome: 'OPTIMAL', doctrineNote: 'Root cause analysis: 80% of RCT violations occurred when distribution waited for formal pull requests on anticipated requirements. Mandating push for all predictable demand addresses the primary driver.', effects: [{ type: 'SIGMA', delta: 0.6, description: 'Theater sigma improves significantly from push mandate' }, { type: 'RCT', delta: -14, description: 'RCT drops from proactive push discipline' }, { type: 'STONEWALL', delta: -6, description: 'Stonewall rate drops — supply arrives before crisis' }, { type: 'MULTIPLIER', delta: 10, description: 'Force Multiplier: doctrine change improves future campaign posture' }] },
      { id: 'C', text: 'Establish a DIWG (Distribution Integration Working Group) — weekly sync to deconflict priorities', doctrineBasis: 'Process solution — addresses coordination gap, right direction but incomplete', outcome: 'ACCEPTABLE', doctrineNote: 'A DIWG addresses the siloed visibility problem (RC3 from the root cause analysis). Weekly sync catches priority conflicts before they become crises. Necessary but not sufficient alone.', effects: [{ type: 'SIGMA', delta: 0.3, description: 'Sigma improves from coordination improvement' }, { type: 'RCT', delta: -6, description: 'Priority conflicts caught earlier — RCT improvement' }] },
      { id: 'D', text: 'Add more convoy assets — throughput capacity was the binding constraint throughout', doctrineBasis: 'Asset solution — addresses capacity, not the process failures causing delays', outcome: 'SUBOPTIMAL', doctrineNote: 'Convoy capacity was not the primary constraint. The analysis shows requests sat in queue long before convoys were even tasked. More convoys on top of a broken request process just means faster delivery of the wrong things.', effects: [{ type: 'RCT', delta: -3, description: 'Marginal RCT improvement from additional assets' }, { type: 'SIGMA', delta: 0.1, description: 'Marginal sigma improvement' }] }
    ]
  }
];

export const DECISION_TYPES: Record<string, string> = {
  PUSH_PULL: 'Push vs Pull Distribution',
  PRIORITY: 'Priority of Supply',
  LOC: 'LOC Management',
  AIR_GROUND: 'Air vs Ground',
  TRIAGE: 'Unit Triage',
  ECONOMY_OF_FORCE: 'Economy of Force',
  PRE_POSITION: 'Pre-positioning'
};

// ── GENERIC DECISIONS (apply to all campaigns by day range) ──────────────────
// These fire for Campaigns 2-6 since they have no campaign-specific decisions.
// Designed as universal logistics doctrine situations.

export const GENERIC_DECISIONS: any[] = [
  {
    id:'GEN_D2', day:2,
    title:'PUSH OR PULL — OPENING MOVE',
    type:'PUSH_PULL',
    situation:'Your forward units have not yet submitted formal requests. Supply exists at your depots. The question is whether you move it forward proactively or wait for requests to drive distribution.',
    question:'How do you open your distribution posture?',
    relatedUnits:['FOB1','FOB2'], relatedNodes:[], forceMultiplierBonus:10, optimalChoice:'A',
    choices:[
      { id:'A', text:'Push Class III and Class V forward now — before they ask', doctrineBasis:'ADP 4-0: Push for anticipated requirements', outcome:'OPTIMAL', doctrineNote:'Pre-empting demand prevents request cycle time violations. Supply in place before the fight is worth more than supply in transit during the fight.', effects:[{type:'READINESS',delta:10},{type:'RCT',delta:-6},{type:'SIGMA',delta:0.2}] },
      { id:'B', text:'Push Class III only, hold Class V pending threat confirmation', doctrineBasis:'Partial push — acceptable hedge', outcome:'ACCEPTABLE', doctrineNote:'Reasonable risk management. Class V will likely be needed but partial push is defensible.', effects:[{type:'READINESS',delta:5},{type:'RCT',delta:-3},{type:'SIGMA',delta:0.1}] },
      { id:'C', text:'Wait for formal requests — respect the pull system', doctrineBasis:'Pull misapplied in high-tempo scenario', outcome:'SUBOPTIMAL', doctrineNote:'Pull is correct for stable operations. Pre-combat buildup requires push. Waiting adds 24-48h delay.', effects:[{type:'RCT',delta:12},{type:'STONEWALL',delta:4}] },
      { id:'D', text:'Hold everything at depot until the situation clarifies', doctrineBasis:'Economy of force misapplied', outcome:'FAILURE', doctrineNote:'Withholding supply during pre-combat buildup guarantees readiness failure when tempo increases.', effects:[{type:'READINESS',delta:-12},{type:'SIGMA',delta:-0.3},{type:'STONEWALL',delta:8}] },
    ]
  },
  {
    id:'GEN_D5', day:5,
    title:'TWO UNITS NEED THE SAME CONVOY',
    type:'PRIORITY',
    situation:'You have one Class III convoy. Two units are below 40%. One is your main effort — the other is economy of force. You cannot fully resupply both today.',
    question:'Who gets the convoy?',
    relatedUnits:['FOB1','FOB2'], relatedNodes:[], forceMultiplierBonus:14, optimalChoice:'A',
    choices:[
      { id:'A', text:'Main effort gets full resupply — economy of force accepts degradation', doctrineBasis:'ATP 4-0: Priority of sustainment follows priority of effort', outcome:'OPTIMAL', doctrineNote:'Maneuver priority is doctrine. The economy of force unit accepts risk so the main effort can succeed.', effects:[{type:'READINESS',unitId:'FOB1',delta:20},{type:'READINESS',unitId:'FOB2',delta:-5},{type:'SIGMA',delta:0.2}] },
      { id:'B', text:'Split the load equally between both units', doctrineBasis:'Equitable distribution — tactically sound but suboptimal', outcome:'ACCEPTABLE', doctrineNote:'Both units receive partial supply. Neither reaches full capability. Acceptable if priority is unclear.', effects:[{type:'READINESS',delta:8},{type:'RCT',delta:4}] },
      { id:'C', text:'Economy of force gets the convoy — they are lower and will stonewall first', doctrineBasis:'Reactive triage — wrong priority framework', outcome:'SUBOPTIMAL', doctrineNote:'Supplying the weaker unit first sounds logical but violates mission priority doctrine. Main effort suffers.', effects:[{type:'READINESS',unitId:'FOB2',delta:18},{type:'READINESS',unitId:'FOB1',delta:-8}] },
      { id:'D', text:'Request more assets from higher — escalate the shortage', doctrineBasis:'Escalation for time-sensitive tactical decision is not appropriate', outcome:'FAILURE', doctrineNote:'This decision is yours. Escalating costs 24 hours and leaves both units unsupplied.', effects:[{type:'RCT',delta:20},{type:'SIGMA',delta:-0.4},{type:'STONEWALL',delta:6}] },
    ]
  },
  {
    id:'GEN_D9', day:9,
    title:'LOC INTERDICTION — REROUTE DECISION',
    type:'LOC',
    situation:'The primary MSR has been interdicted by enemy activity. You have two options: route via the alternate LOC (+2 day transit) or push through the primary with escort (+50% interdiction risk).',
    question:'How do you keep supply moving?',
    relatedUnits:['FOB1','FOB2'], relatedNodes:[], forceMultiplierBonus:12, optimalChoice:'A',
    choices:[
      { id:'A', text:'Reroute all convoys to the alternate LOC — accept longer transit, maintain security', doctrineBasis:'ADP 4-0: Security of LOCs before throughput speed', outcome:'OPTIMAL', doctrineNote:'Protecting convoys from interdiction is worth the extra 2 days. A destroyed convoy delivers nothing and costs everything.', effects:[{type:'RCT',delta:8},{type:'SIGMA',delta:0.1},{type:'STONEWALL',delta:-3}] },
      { id:'B', text:'Split: priority loads via alternate, routine via primary with escort', doctrineBasis:'Risk-based routing — acceptable compromise', outcome:'ACCEPTABLE', doctrineNote:'Reasonable triage. Priority loads protected, some risk accepted on routine. Monitor for losses.', effects:[{type:'RCT',delta:5},{type:'SIGMA',delta:0.1}] },
      { id:'C', text:'Push all convoys through primary MSR — speed is worth the risk', doctrineBasis:'Speed over security — misapplied when interdiction is confirmed', outcome:'SUBOPTIMAL', doctrineNote:'Moving fast on a compromised route loses convoys. One interdicted convoy sets resupply back further than 2 days.', effects:[{type:'RCT',delta:-2},{type:'STONEWALL',delta:5},{type:'SIGMA',delta:-0.2}] },
      { id:'D', text:'Stop all convoy movement until route is cleared by security forces', doctrineBasis:'Full halt — only appropriate if enemy is in force, not skirmishers', outcome:'FAILURE', doctrineNote:'Stopping supply movement for 24+ hours while units are in contact guarantees stonewall.', effects:[{type:'RCT',delta:24},{type:'SIGMA',delta:-0.5},{type:'STONEWALL',delta:10}] },
    ]
  },
  {
    id:'GEN_D14', day:14,
    title:'MID-CAMPAIGN READINESS TRIAGE',
    type:'TRIAGE',
    situation:'Day 14. Two units are in AMBER, one approaching RED. You have limited convoy capacity. You can fully restore one unit or partially restore all three.',
    question:'How do you allocate remaining convoy capacity?',
    relatedUnits:['FOB1','FOB2','FOB3'], relatedNodes:[], forceMultiplierBonus:12, optimalChoice:'B',
    choices:[
      { id:'A', text:'Full resupply of main effort unit — bring one to GREEN, accept degradation elsewhere', doctrineBasis:'Priority of sustainment: concentrate assets on decisive effort', outcome:'OPTIMAL', doctrineNote:'Getting one unit to GREEN enables decisive action. Distributing thin leaves everyone marginal.', effects:[{type:'READINESS',delta:20},{type:'SIGMA',delta:0.3}] },
      { id:'B', text:'Partial resupply across all three — keep everyone out of RED', doctrineBasis:'Triage distribution — prevent cascading failure', outcome:'OPTIMAL', doctrineNote:'When no unit has decisive advantage, preventing simultaneous stonewall is the right call.', effects:[{type:'READINESS',delta:10},{type:'SIGMA',delta:0.2},{type:'RCT',delta:-4}] },
      { id:'C', text:'Resupply the unit approaching RED first — crisis management', doctrineBasis:'Reactive triage — correct if stonewall is imminent', outcome:'ACCEPTABLE', doctrineNote:'Preventing stonewall is valid. But this is reactive, not proactive. Earlier action would have been better.', effects:[{type:'READINESS',delta:8},{type:'STONEWALL',delta:-2}] },
      { id:'D', text:'Hold convoy capacity in reserve — wait for the situation to stabilize', doctrineBasis:'Reserve mentality in high-tempo operations — not appropriate', outcome:'FAILURE', doctrineNote:'Supply does not age better in the depot. Holding back when units are degrading accelerates the collapse.', effects:[{type:'READINESS',delta:-10},{type:'SIGMA',delta:-0.3},{type:'STONEWALL',delta:8}] },
    ]
  },
]



// ── DOCTRINE-GROUNDED DECISIONS (Days 3, 6, 8, 11, 17, 20) ──────────────────
// Sourced from: Commander's Supply Management Handbook (USMC 2014),
// ADP 4-0 Sustainment, ATP 4-0.1, FM 4-0

export const LSCO_DECISIONS: any[] = [
  {
    id:'LSCO_D3', day:3,
    title:'MAINTENANCE CRISIS — VEHICLES DEADLINING',
    type:'PRIORITY',
    doctrineRef:'MCO P4400.150E / ADP 4-0 Para 3-14',
    situation:'3 vehicles deadlined at your forward FOBs. CL IX (Repair Parts) at 22% theater-wide. Deadlined vehicles reduce convoy capacity by 35%. The Maintenance Management Officer is requesting a priority parts run.',
    question:'How do you handle the maintenance crisis?',
    relatedUnits:['FOB1','FOB2'], relatedNodes:[], forceMultiplierBonus:12, optimalChoice:'A',
    choices:[
      { id:'A', text:'Task immediate priority CL IX convoy to the MMO — vehicle readiness is convoy throughput', doctrineBasis:'ADP 4-0: Maintenance directly supports distribution. Deadlined vehicles reduce the ability to sustain forward forces.', outcome:'OPTIMAL', doctrineNote:'Correct. Repair parts (CL IX) are a combat multiplier. Every deadlined vehicle is a convoy that doesn\'t run. Priority-tasking the parts run restores throughput within 24 hours.', effects:[{type:'READINESS',delta:12},{type:'RCT',delta:-8},{type:'SIGMA',delta:0.2}] },
      { id:'B', text:'Cross-level repair parts from the highest-readiness FOB to cover the shortfall', doctrineBasis:'Lateral transfer — acceptable interim solution', outcome:'ACCEPTABLE', doctrineNote:'Lateral transfer works but weakens the donor unit. Acceptable if a priority convoy is unavailable. Monitor donor unit for secondary readiness degradation.', effects:[{type:'READINESS',delta:6},{type:'RCT',delta:-3}] },
      { id:'C', text:'Accept degraded convoy capacity — continue operations with 65% vehicle availability', doctrineBasis:'Accepting readiness degradation — never the preferred option', outcome:'SUBOPTIMAL', doctrineNote:'Reducing convoy capacity under pressure accelerates the logistics death spiral. Less capacity means slower resupply means more readiness degradation.', effects:[{type:'RCT',delta:10},{type:'SIGMA',delta:-0.2},{type:'STONEWALL',delta:4}] },
      { id:'D', text:'Request guidance from Higher HQ on repair parts prioritization', doctrineBasis:'Escalation on tactical supply decision — doctrine violation', outcome:'FAILURE', doctrineNote:'MCO P4400.150E is clear: the CO owns the supply account. Escalating a tactical CL IX priority to HHQ wastes 24 hours and signals loss of command authority.', effects:[{type:'RCT',delta:18},{type:'SIGMA',delta:-0.4},{type:'STONEWALL',delta:8}] },
    ]
  },
  {
    id:'LSCO_D6', day:6,
    title:'PUSH STOCKAGE vs. UNIT REQUEST — PRE-EXPENDED BIN',
    type:'PRE_POSITION',
    doctrineRef:'MCO P4400.150E Section VII / ADP 4-0',
    situation:'Day 6. Intelligence indicates OPFOR will intensify operations Day 8-10. Units are currently at AMBER. You have 48 hours and 4 available convoys. The question: do you push supply forward now, or hold capacity for reactive distribution when units request it?',
    question:'How do you posture your supply for the coming threat surge?',
    relatedUnits:['FOB1','FOB2','FOB3'], relatedNodes:[], forceMultiplierBonus:14, optimalChoice:'A',
    choices:[
      { id:'A', text:'Pre-position Class III, V, and IX forward now — push before the fight, not during it', doctrineBasis:'ADP 4-0: Push distribution for predictable requirements. Pre-combat buildup requires proactive sustainment.', outcome:'OPTIMAL', doctrineNote:'Pre-positioning before OPFOR escalation is textbook. Supply in place before contact is worth double its value compared to supply en route during contact. Units fight better knowing supply is already there.', effects:[{type:'READINESS',delta:18},{type:'RCT',delta:-10},{type:'SIGMA',delta:0.3}] },
      { id:'B', text:'Pre-position Class III only — hold V and IX pending confirmation of OPFOR intent', doctrineBasis:'Partial push — hedging on intelligence', outcome:'ACCEPTABLE', doctrineNote:'Reasonable risk management if intelligence is uncertain. However, CL V (ammo) shortfall on Day 8-10 will significantly degrade combat power.', effects:[{type:'READINESS',delta:8},{type:'RCT',delta:-4},{type:'SIGMA',delta:0.1}] },
      { id:'C', text:'Hold all convoys in reserve — wait for the situation to develop before committing', doctrineBasis:'Economy of force misapplied — correct doctrine for after objectives are seized, not pre-combat', outcome:'SUBOPTIMAL', doctrineNote:'Withholding when escalation is 48 hours away is reactive sustainment at its worst. Units will be requesting supply at the exact moment they need to be fighting.', effects:[{type:'RCT',delta:14},{type:'STONEWALL',delta:5}] },
      { id:'D', text:'Wait for units to submit Priority 01 requests — respect the formal request system', doctrineBasis:'Pull misapplied — formal request system not designed for pre-combat buildup', outcome:'FAILURE', doctrineNote:'Priority 01 requests during contact are too late. ADP 4-0 explicitly states push distribution is the correct method for predictable high-tempo requirements. Waiting for formal pull requests during buildup violates sustainment doctrine.', effects:[{type:'RCT',delta:24},{type:'SIGMA',delta:-0.5},{type:'STONEWALL',delta:10}] },
    ]
  },
  {
    id:'LSCO_D8', day:8,
    title:'CONVOY SECURITY vs. THROUGHPUT SPEED',
    type:'LOC',
    doctrineRef:'ADP 4-0 Para 4-22 / FM 4-01 Route Security',
    situation:'OPFOR has conducted 2 interdictions on your primary MSR this week. You have 6 convoys staged. Three options for today\'s resupply run. Each has different risk and time cost.',
    question:'How do you secure tonight\'s convoy movement?',
    relatedUnits:['FOB1','FOB2'], relatedNodes:[], forceMultiplierBonus:11, optimalChoice:'B',
    choices:[
      { id:'A', text:'Route ALL convoys via alternate LOC — +2 days transit, zero interdiction risk', doctrineBasis:'Security over speed — correct when MSR threat is confirmed', outcome:'OPTIMAL', doctrineNote:'With 2 interdictions in one week, the MSR threat is confirmed active. Protecting the convoy is worth the 2-day delay. A destroyed convoy delivers nothing and costs everything — vehicles, cargo, and personnel.', effects:[{type:'RCT',delta:6},{type:'SIGMA',delta:0.1},{type:'STONEWALL',delta:-2}] },
      { id:'B', text:'Use primary MSR with armed escort — +1 day, 70% reduction in interdiction risk', doctrineBasis:'Risk-based routing with security — doctrine-correct compromise', outcome:'OPTIMAL', doctrineNote:'Armed escort with the primary MSR is the balanced approach. 70% risk reduction while maintaining acceptable throughput speed. Monitor for further interdiction attempts.', effects:[{type:'READINESS',delta:8},{type:'RCT',delta:2},{type:'SIGMA',delta:0.15}] },
      { id:'C', text:'Push convoys through primary MSR unescorted — speed is critical right now', doctrineBasis:'Throughput without security — high-risk when threat is confirmed', outcome:'SUBOPTIMAL', doctrineNote:'Moving fast on a compromised route is gambling with your supply chain. One successful ambush costs more time and readiness than the 1-2 hours saved by skipping escort.', effects:[{type:'RCT',delta:-2},{type:'STONEWALL',delta:6},{type:'SIGMA',delta:-0.3}] },
      { id:'D', text:'Suspend all convoy movement until route clearance operations are complete', doctrineBasis:'Full halt — only appropriate with enemy forces in strength, not skirmishers', outcome:'FAILURE', doctrineNote:'Stopping supply movement during active operations while units are in contact guarantees stonewall within 48 hours. Route clearance operations take 24-72 hours. Your units cannot wait that long.', effects:[{type:'RCT',delta:24},{type:'SIGMA',delta:-0.6},{type:'STONEWALL',delta:12}] },
    ]
  },
  {
    id:'LSCO_D11', day:11,
    title:'MEDICAL MATERIEL — CLASS VIII CRISIS',
    type:'PRIORITY',
    doctrineRef:'ADP 4-0 Para 4-8 / TCCC Guidelines',
    situation:'Day 11. Combat casualties have depleted CL VIII (Medical Materiel) at FOB IRON to 14%. Aviation Brigade (AVN BDE) is requesting a priority CL VIII air sortie. FOB IRON is ground-only accessible due to weather. MEDEVAC is operational but consuming blood products and surgical supplies.',
    question:'How do you prioritize CL VIII distribution?',
    relatedUnits:['FOB1','AVN_BDE'], relatedNodes:[], forceMultiplierBonus:15, optimalChoice:'A',
    choices:[
      { id:'A', text:'Task emergency air sortie for CL VIII to FOB IRON immediately — personnel readiness is non-negotiable', doctrineBasis:'ADP 4-0: CL VIII is life-critical. Personnel readiness always exceeds equipment readiness in priority.', outcome:'OPTIMAL', doctrineNote:'CL VIII at 14% with active MEDEVAC is a medical emergency, not a logistics inconvenience. Emergency air sortie is the only correct response. Personnel readiness (CL VIII) takes priority over all other supply classes when life is at risk.', effects:[{type:'READINESS',unitId:'FOB1',delta:22},{type:'SIGMA',delta:0.3},{type:'RCT',delta:-5}] },
      { id:'B', text:'Lateral transfer CL VIII from AVN BDE to FOB IRON — they have 48%, can spare 20%', doctrineBasis:'Lateral transfer for life-critical supply — acceptable if air is unavailable', outcome:'ACCEPTABLE', doctrineNote:'Lateral transfer from AVN BDE works but takes longer than air sortie and weakens aviation medical readiness. Acceptable only if air sortie is truly unavailable. AVN BDE donor unit risks secondary degradation.', effects:[{type:'READINESS',delta:12},{type:'RCT',delta:4}] },
      { id:'C', text:'Continue current allocation — FOB IRON is managing; prioritize fuel and ammo first', doctrineBasis:'Deferring CL VIII — doctrine violation when life is at stake', outcome:'SUBOPTIMAL', doctrineNote:'Personnel health directly determines combat effectiveness. 14% CL VIII with active casualties is a crisis requiring immediate action. Prioritizing CL III and CL V over medical materiel when troops are injured is the wrong call.', effects:[{type:'READINESS',delta:-10},{type:'SIGMA',delta:-0.3}] },
      { id:'D', text:'Request MEDLOG support from theater — escalate to higher HQ for emergency medical resupply', doctrineBasis:'Escalation when organic solution exists — delay is unacceptable', outcome:'FAILURE', doctrineNote:'Theater MEDLOG support takes 48-72 hours. You have organic air assets and 14% CL VIII remaining. This is your decision to make. Escalating to theater when a life-critical solution is within your authority costs lives.', effects:[{type:'READINESS',delta:-20},{type:'SIGMA',delta:-0.5},{type:'STONEWALL',delta:6}] },
    ]
  },
  {
    id:'LSCO_D17', day:17,
    title:'ACCOUNTABILITY FAILURE — CONVOY DISCREPANCY',
    type:'ECONOMY_OF_FORCE',
    doctrineRef:'MCO P4400.150E / MLSR Reporting Requirements',
    situation:'Day 17. A convoy delivered to FOB VALOR reports short 40% of its CL V (ammo) manifest. The unit shows receipt for the full load. Your Supply Officer suspects pilferage or route compromise. You have 5 days to resolve before the discrepancy becomes an MLSR (Missing Lost Stolen or Recovered) report.',
    question:'How do you resolve the accountability discrepancy?',
    relatedUnits:['FOB2'], relatedNodes:[], forceMultiplierBonus:10, optimalChoice:'A',
    choices:[
      { id:'A', text:'Initiate immediate causative research — physical inventory at FOB VALOR within 24 hours', doctrineBasis:'MCO P4400.150E: Supply Officer has 5 days for causative research. Physical inventory is the correct first action.', outcome:'OPTIMAL', doctrineNote:'Causative research first. A physical inventory at FOB VALOR determines whether the CL V is on hand but unrecorded, or truly missing. Accurate accountability is non-negotiable — the CO is personally accountable for all supply.', effects:[{type:'SIGMA',delta:0.2},{type:'RCT',delta:-3}] },
      { id:'B', text:'Accept the FOB VALOR manifest as correct — assume convoy manifest error', doctrineBasis:'Assuming manifest error without investigation — accountability failure', outcome:'SUBOPTIMAL', doctrineNote:'Accepting discrepancies without investigation erodes supply accountability. If the CL V is genuinely missing, you have 48 hours to initiate an MLSR. Assuming manifest error without research is improper.', effects:[{type:'RCT',delta:5},{type:'SIGMA',delta:-0.1}] },
      { id:'C', text:'Replace the missing CL V immediately from depot — deal with accountability later', doctrineBasis:'Resupply before investigation — addresses symptom not cause', outcome:'SUBOPTIMAL', doctrineNote:'Replacing supply before determining what happened rewards potential theft and fails accountability requirements. Resupply AND investigate simultaneously.', effects:[{type:'READINESS',delta:5},{type:'SIGMA',delta:-0.15}] },
      { id:'D', text:'Hold all CL V convoys pending investigation — no more ammo moves until resolved', doctrineBasis:'Full halt on ammunition distribution — catastrophic overreaction', outcome:'FAILURE', doctrineNote:'Stopping all CL V movement while units are in contact over a single manifest discrepancy is disproportionate and dangerous. Investigate the discrepancy while continuing distribution operations.', effects:[{type:'RCT',delta:20},{type:'STONEWALL',delta:8},{type:'SIGMA',delta:-0.4}] },
    ]
  },
  {
    id:'LSCO_D20', day:20,
    title:'END-STATE SUSTAINMENT — FINAL PUSH',
    type:'ECONOMY_OF_FORCE',
    doctrineRef:'ADP 4-0 Para 1-3 / Culminating Point Analysis',
    situation:`Final phase. ${5} days remaining in the campaign. Units are degraded. You have limited convoy capacity. This is the last major resupply window. Every decision from here determines whether the theater holds or collapses.`,
    question:'How do you sustain the theater through the final phase?',
    relatedUnits:['FOB1','FOB2','FOB3'], relatedNodes:[], forceMultiplierBonus:18, optimalChoice:'A',
    choices:[
      { id:'A', text:'ALL-IN push: maximum pre-positioning of CL III and CL V for the final days — burn convoy capacity now', doctrineBasis:'ADP 4-0: Pre-position for final phase requirements. Culminating point must be avoided.', outcome:'OPTIMAL', doctrineNote:'With 5 days remaining, this is the critical window. Every unit that enters the final phase below 60% supply risks culmination. Push everything you have now. The theater either holds through the final days or it doesn\'t — there is no middle ground.', effects:[{type:'READINESS',delta:20},{type:'RCT',delta:-12},{type:'SIGMA',delta:0.4}] },
      { id:'B', text:'Prioritize main effort only — bring the decisive unit to GREEN, accept degradation elsewhere', doctrineBasis:'Economy of force — concentrate sustainment on the decisive effort', outcome:'ACCEPTABLE', doctrineNote:'With limited capacity in the final phase, concentrating on the decisive effort is doctrinally sound. Accept economy of force on supporting units. The main effort must succeed.', effects:[{type:'READINESS',delta:14},{type:'SIGMA',delta:0.2}] },
      { id:'C', text:'Distribute evenly — keep all units at AMBER to prevent any single unit from collapsing', doctrineBasis:'Equal distribution — prevents cascade but enables no decisive action', outcome:'SUBOPTIMAL', doctrineNote:'Equal distribution keeps everyone equally mediocre. In the final phase, decisive action requires one unit at full strength. Amber across the board means no unit can execute its mission effectively.', effects:[{type:'READINESS',delta:8},{type:'SIGMA',delta:0.05}] },
      { id:'D', text:'Hold convoy capacity in reserve — wait to see how the final phase develops', doctrineBasis:'Final phase reserve — catastrophic if units reach culminating point', outcome:'FAILURE', doctrineNote:'Holding supply back in the final 5 days is the classic sustainment failure mode. If units reach their culminating point before resupply arrives, the campaign is lost regardless of tactical success. This is not economy of force — this is logistics paralysis.', effects:[{type:'RCT',delta:20},{type:'SIGMA',delta:-0.6},{type:'STONEWALL',delta:10}] },
    ]
  },
]

export function getDecisionsForScenario(scenarioId: string, day: number): any | null {
  // Campaign 1 uses specific decisions
  if (scenarioId === 'CAMPAIGN_1') {
    return CAMPAIGN_1_DECISIONS.find(d => d.day === day) ?? null
  }
  // All other campaigns: LSCO decisions first (more specific), then generic
  return LSCO_DECISIONS.find(d => d.day === day)
      ?? GENERIC_DECISIONS.find(d => d.day === day)
      ?? null
}
