/**
 * LOG ACTUAL — Scenario Unit Rosters
 * Maps unit IDs to theater-correct names for each campaign.
 * These names drive ALL generated text — feed events, AI reports, commander dialog.
 */

export interface UnitRosterEntry {
  name:      string   // full display name
  shortName: string   // HUD label
  type:      string   // classification for event text
  nodeId:    string   // matches scenarioNodes node ID
}

export const SCENARIO_UNIT_ROSTERS: Record<string, Record<string, UnitRosterEntry>> = {

  // ── CAMPAIGN 1: EUROPEAN THEATER ────────────────────────────────────────────
  CAMPAIGN_1: {
    FOB1:      { name:'FOB Iron (Warsaw)',         shortName:'FOB IRON',    type:'Forward Operating Base',    nodeId:'FOB_WAR' },
    FOB2:      { name:'FOB Valor (Gdansk)',         shortName:'FOB VALOR',   type:'Forward Operating Base',    nodeId:'FOB_GDA' },
    FOB3:      { name:'FOB Eagle (Krakow)',          shortName:'FOB EAGLE',   type:'Forward Operating Base',    nodeId:'FOB_KRA' },
    III_CORPS: { name:'III Corps (Vilnius)',          shortName:'III CORPS',   type:'Corps Headquarters',         nodeId:'FOB_VIL' },
    AVN_BDE:   { name:'Aviation BDE (Malbork)',      shortName:'AVN BDE',     type:'Combat Aviation Brigade',    nodeId:'AVN_MAL' },
    '4ID':     { name:'4th Infantry Division',       shortName:'4ID',         type:'Division Headquarters',      nodeId:'FOB_KRA' },
  },

  // ── CAMPAIGN 2: BALTIC SHIELD ────────────────────────────────────────────────
  CAMPAIGN_2: {
    FOB1:      { name:'FOB Iron (Tallinn)',          shortName:'FOB IRON',    type:'Forward Operating Base',    nodeId:'FOB_TAL' },
    FOB2:      { name:'FOB Valor (Tartu)',            shortName:'FOB VALOR',   type:'Forward Operating Base',    nodeId:'FOB_TAR' },
    FOB3:      { name:'FOB Eagle (Kaunas)',           shortName:'FOB EAGLE',   type:'Forward Operating Base',    nodeId:'FOB_KUN' },
    III_CORPS: { name:'NATO eFP BG (Siauliai)',       shortName:'eFP BG',      type:'NATO Battlegroup',           nodeId:'FOB_SIA' },
    AVN_BDE:   { name:'Aviation BDE (Amari AB)',     shortName:'AVN BDE',     type:'Combat Aviation Brigade',    nodeId:'AVN_TAL' },
    '4ID':     { name:'2nd Infantry Division',        shortName:'2ID',         type:'Division Headquarters',      nodeId:'FOB_TAL' },
  },

  // ── CAMPAIGN 3: DESERT LINES (Jordan/Iraq) ───────────────────────────────────
  CAMPAIGN_3: {
    FOB1:      { name:'FOB Rutbah (Al-Rutba)',       shortName:'FOB RUTBAH',  type:'Forward Operating Base',    nodeId:'FOB_RTB' },
    FOB2:      { name:'FOB Ramadi',                  shortName:'FOB RAMADI',  type:'Forward Operating Base',    nodeId:'FOB_RMD' },
    FOB3:      { name:'FOB Mosul',                   shortName:'FOB MOSUL',   type:'Forward Operating Base',    nodeId:'FOB_MSL' },
    III_CORPS: { name:'III Corps (Tikrit)',           shortName:'III CORPS',   type:'Corps Headquarters',         nodeId:'FOB_TKR' },
    AVN_BDE:   { name:'Aviation BDE (Baghdad)',       shortName:'AVN BDE',     type:'Combat Aviation Brigade',    nodeId:'AVN_BGW' },
    '4ID':     { name:'4th Infantry Division',        shortName:'4ID',         type:'Division Headquarters',      nodeId:'FOB_RMD' },
  },

  // ── CAMPAIGN 4: SAND BRIDGE (UAE/Kuwait) ─────────────────────────────────────
  CAMPAIGN_4: {
    FOB1:      { name:'Camp Buehring (Kuwait)',       shortName:'BUEHRING',    type:'Forward Operating Base',    nodeId:'FOB_BUE' },
    FOB2:      { name:'Camp Arifjan (Kuwait)',         shortName:'ARIFJAN',     type:'Forward Operating Base',    nodeId:'FOB_ARF' },
    FOB3:      { name:'Camp Ariz (Kuwait)',            shortName:'CAMP ARIZ',   type:'Forward Operating Base',    nodeId:'FOB_ARZ' },
    III_CORPS: { name:'III Corps (Nasiriyah)',         shortName:'III CORPS',   type:'Corps Headquarters',         nodeId:'FOB_NAS' },
    AVN_BDE:   { name:'Aviation BDE (Ali Al Salem)',  shortName:'AVN BDE',     type:'Combat Aviation Brigade',    nodeId:'AVN_ARF' },
    '4ID':     { name:'1st Cavalry Division',         shortName:'1CD',         type:'Division Headquarters',      nodeId:'FOB_ARF' },
  },

  // ── CAMPAIGN 5: PACIFIC PUSH (Korea) ─────────────────────────────────────────
  CAMPAIGN_5: {
    FOB1:      { name:'Camp Humphreys',              shortName:'HUMPHREYS',   type:'Forward Operating Base',    nodeId:'FOB_HUM' },
    FOB2:      { name:'Camp Casey',                  shortName:'CAMP CASEY',  type:'Forward Operating Base',    nodeId:'FOB_CSY' },
    FOB3:      { name:'Camp Walker (Daegu)',          shortName:'CAMP WALKER', type:'Forward Operating Base',    nodeId:'FOB_DAG' },
    III_CORPS: { name:'I Corps (Camp Red Cloud)',     shortName:'I CORPS',     type:'Corps Headquarters',         nodeId:'FOB_RED' },
    AVN_BDE:   { name:'Aviation BDE (Osan AB)',       shortName:'AVN BDE',     type:'Combat Aviation Brigade',    nodeId:'AVN_OSN' },
    '4ID':     { name:'2nd Infantry Division',        shortName:'2ID',         type:'Division Headquarters',      nodeId:'FOB_CSY' },
  },

  // ── CAMPAIGN 6: ISLAND HOP (Pacific) ─────────────────────────────────────────
  CAMPAIGN_6: {
    FOB1:      { name:'FOB Tinian',                  shortName:'FOB TINIAN',  type:'Forward Operating Base',    nodeId:'FOB_TIN' },
    FOB2:      { name:'FOB Palau',                   shortName:'FOB PALAU',   type:'Forward Operating Base',    nodeId:'FOB_PLU' },
    FOB3:      { name:'FOB Yap',                     shortName:'FOB YAP',     type:'Forward Operating Base',    nodeId:'FOB_YAP' },
    III_CORPS: { name:'III Corps (Chuuk)',            shortName:'III CORPS',   type:'Corps Headquarters',         nodeId:'FOB_CHK' },
    AVN_BDE:   { name:'Aviation BDE (Guam)',          shortName:'AVN BDE',     type:'Combat Aviation Brigade',    nodeId:'AVN_GUM' },
    '4ID':     { name:'3rd Marine Division',          shortName:'3 MARDIV',    type:'Division Headquarters',      nodeId:'FOB_TIN' },
  },
}

export function getUnitRoster(scenarioId: string): Record<string, UnitRosterEntry> {
  return SCENARIO_UNIT_ROSTERS[scenarioId] ?? SCENARIO_UNIT_ROSTERS['CAMPAIGN_1']
}

export function getUnitName(scenarioId: string, unitId: string): string {
  return SCENARIO_UNIT_ROSTERS[scenarioId]?.[unitId]?.name ?? unitId
}

export function getUnitShortName(scenarioId: string, unitId: string): string {
  return SCENARIO_UNIT_ROSTERS[scenarioId]?.[unitId]?.shortName ?? unitId
}
