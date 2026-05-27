/**
 * LOG ACTUAL — Scenario Auto-Dispatch Routes
 * Each campaign maps to correct node IDs from scenarioNodes.ts.
 * Routes define where convoys originate, which unit they serve,
 * travel time, and whether air or ground.
 *
 * These replace the hardcoded CAMPAIGN_1-only routes in gameStore.
 */

export interface ScenarioRoute {
  from: string       // node ID (depot / port / ASP)
  toUnit: string     // unit ID
  locId: string      // LOC ID from scenarioNodes
  travelDays: number
  isAir: boolean
  defaultClass: number  // 0=CL_I 1=CL_II 2=CL_III 3=CL_IV 4=CL_V 5=CL_VIII 6=CL_IX
}

const C1_ROUTES: ScenarioRoute[] = [
  { from:'PORT_ANT', toUnit:'FOB3',      locId:'l01', travelDays:3, isAir:false, defaultClass:0 },
  { from:'DEP_KTN',  toUnit:'FOB3',      locId:'l05', travelDays:2, isAir:false, defaultClass:2 },
  { from:'ASP_MIE',  toUnit:'FOB3',      locId:'l06', travelDays:1, isAir:false, defaultClass:4 },
  { from:'DEP_BYD',  toUnit:'FOB2',      locId:'l08', travelDays:2, isAir:false, defaultClass:2 },
  { from:'APS_RAM',  toUnit:'FOB1',      locId:'l03', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'DEP_BYD',  toUnit:'FOB1',      locId:'l09', travelDays:2, isAir:false, defaultClass:0 },
  { from:'APS_WAR',  toUnit:'III_CORPS', locId:'l04', travelDays:1, isAir:true,  defaultClass:2 },
  { from:'DEP_KTN',  toUnit:'AVN_BDE',   locId:'l05', travelDays:2, isAir:false, defaultClass:2 },
]

const C2_ROUTES: ScenarioRoute[] = [
  { from:'PORT_RIG',  toUnit:'FOB1',      locId:'l05', travelDays:3, isAir:false, defaultClass:0 },
  { from:'PORT_KLA',  toUnit:'FOB3',      locId:'l03', travelDays:2, isAir:false, defaultClass:0 },
  { from:'DEP_VIL',   toUnit:'FOB3',      locId:'l03', travelDays:2, isAir:false, defaultClass:2 },
  { from:'DEP_RIG',   toUnit:'FOB1',      locId:'l05', travelDays:2, isAir:false, defaultClass:2 },
  { from:'APS_RIG',   toUnit:'FOB1',      locId:'l08', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'APS_PAL',   toUnit:'FOB3',      locId:'l09', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'DEP_VIL',   toUnit:'III_CORPS', locId:'l04', travelDays:3, isAir:false, defaultClass:0 }, // LOC interdicted
  { from:'DEP_RIG',   toUnit:'FOB2',      locId:'l06', travelDays:2, isAir:false, defaultClass:2 },
]

const C3_ROUTES: ScenarioRoute[] = [
  { from:'PORT_AQJ', toUnit:'FOB1',      locId:'l03', travelDays:5, isAir:false, defaultClass:0 }, // 600km
  { from:'DEP_AMM',  toUnit:'FOB1',      locId:'l03', travelDays:4, isAir:false, defaultClass:2 }, // long ground
  { from:'DEP_AMM',  toUnit:'FOB2',      locId:'l04', travelDays:3, isAir:false, defaultClass:0 },
  { from:'DEP_BGW',  toUnit:'FOB2',      locId:'l05', travelDays:2, isAir:false, defaultClass:2 },
  { from:'APS_BGW',  toUnit:'FOB1',      locId:'l09', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'APS_BGW',  toUnit:'FOB3',      locId:'l10', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'DEP_BGW',  toUnit:'III_CORPS', locId:'l06', travelDays:2, isAir:false, defaultClass:0 },
  { from:'APS_AMM',  toUnit:'4ID',       locId:'l08', travelDays:2, isAir:true,  defaultClass:2 },
]

const C4_ROUTES: ScenarioRoute[] = [
  { from:'PORT_JBL', toUnit:'FOB1',      locId:'l05', travelDays:2, isAir:false, defaultClass:0 },
  { from:'DEP_AUH',  toUnit:'FOB1',      locId:'l05', travelDays:2, isAir:false, defaultClass:2 },
  { from:'DEP_KWT',  toUnit:'FOB1',      locId:'l05', travelDays:1, isAir:false, defaultClass:0 },
  { from:'DEP_KWT',  toUnit:'FOB2',      locId:'l06', travelDays:1, isAir:false, defaultClass:2 },
  { from:'APS_KWI',  toUnit:'FOB1',      locId:'l10', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'DEP_AUH',  toUnit:'FOB2',      locId:'l04', travelDays:3, isAir:false, defaultClass:0 },
  { from:'ASP_RYD',  toUnit:'FOB3',      locId:'l07', travelDays:2, isAir:false, defaultClass:4 },
  { from:'APS_KWI',  toUnit:'III_CORPS', locId:'l11', travelDays:1, isAir:true,  defaultClass:2 },
]

const C5_ROUTES: ScenarioRoute[] = [
  { from:'PORT_PUS', toUnit:'FOB1',      locId:'l04', travelDays:2, isAir:false, defaultClass:0 },
  { from:'PORT_ICN', toUnit:'FOB2',      locId:'l02', travelDays:2, isAir:false, defaultClass:0 },
  { from:'DEP_CRL',  toUnit:'FOB1',      locId:'l04', travelDays:2, isAir:false, defaultClass:2 },
  { from:'DEP_CRL',  toUnit:'FOB3',      locId:'l06', travelDays:1, isAir:false, defaultClass:2 },
  { from:'APS_YOK',  toUnit:'FOB1',      locId:'l10', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'APS_OSN',  toUnit:'FOB2',      locId:'l11', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'APS_OSN',  toUnit:'III_CORPS', locId:'l14', travelDays:1, isAir:true,  defaultClass:2 },
  { from:'DEP_DAG',  toUnit:'4ID',       locId:'l05', travelDays:1, isAir:false, defaultClass:0 },
]

const C6_ROUTES: ScenarioRoute[] = [
  // No ground routes — ALL air and sea
  { from:'APS_UAM',  toUnit:'FOB1',      locId:'l04', travelDays:1, isAir:true,  defaultClass:0 },
  { from:'APS_UAM',  toUnit:'FOB2',      locId:'l05', travelDays:2, isAir:true,  defaultClass:0 },
  { from:'APS_UAM',  toUnit:'FOB3',      locId:'l06', travelDays:2, isAir:true,  defaultClass:2 }, // contested
  { from:'APS_UAM',  toUnit:'III_CORPS', locId:'l07', travelDays:2, isAir:true,  defaultClass:2 },
  { from:'PORT_GUM', toUnit:'4ID',       locId:'l02', travelDays:2, isAir:false, defaultClass:0 }, // sea
  { from:'DEP_SPN',  toUnit:'FOB1',      locId:'l03', travelDays:1, isAir:false, defaultClass:4 }, // sea
  { from:'AVN_GUM',  toUnit:'FOB1',      locId:'l10', travelDays:1, isAir:true,  defaultClass:4 },
  { from:'PORT_GUM', toUnit:'FOB2',      locId:'l08', travelDays:3, isAir:false, defaultClass:0 }, // sea
]

export const SCENARIO_ROUTES: Record<string, ScenarioRoute[]> = {
  CAMPAIGN_1: C1_ROUTES,
  CAMPAIGN_2: C2_ROUTES,
  CAMPAIGN_3: C3_ROUTES,
  CAMPAIGN_4: C4_ROUTES,
  CAMPAIGN_5: C5_ROUTES,
  CAMPAIGN_6: C6_ROUTES,
}

export function getScenarioRoutes(scenarioId: string): ScenarioRoute[] {
  return SCENARIO_ROUTES[scenarioId] || C1_ROUTES
}

// ── SCENARIO META: parameters read by gameStore ───────────────────────────────
export interface ScenarioMeta {
  totalDays: number
  enemyActivityLevel: number
  // Special mechanics flags
  heatMultiplier?: boolean        // C3: CL_I +40%, CL_III +35%
  rctProcessPenalty?: boolean     // C4: passive RCT increase without dispatches
  dayGatedThreat?: number         // C5: port threat escalates after this day
  airOnlyLogistics?: boolean      // C6: ground convoys interdicted/penalized
}

export const SCENARIO_META: Record<string, ScenarioMeta> = {
  CAMPAIGN_1: { totalDays:30, enemyActivityLevel:0.35 },
  CAMPAIGN_2: { totalDays:21, enemyActivityLevel:0.55 },
  CAMPAIGN_3: { totalDays:25, enemyActivityLevel:0.50, heatMultiplier:true },
  CAMPAIGN_4: { totalDays:20, enemyActivityLevel:0.15, rctProcessPenalty:true },
  CAMPAIGN_5: { totalDays:28, enemyActivityLevel:0.40, dayGatedThreat:10 },
  CAMPAIGN_6: { totalDays:35, enemyActivityLevel:0.60, airOnlyLogistics:true },
}

export function getScenarioMeta(scenarioId: string): ScenarioMeta {
  return SCENARIO_META[scenarioId] || SCENARIO_META.CAMPAIGN_1
}
