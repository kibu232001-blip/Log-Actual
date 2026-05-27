/**
 * LOG ACTUAL — Scenario Unit Starting Conditions
 * Each campaign's units are calibrated to the brief's stated parameters:
 *   startingSigma, startingStonewallRate, startingRCT, enemyActivityLevel
 *
 * Design target: ~80% failure rate without active, correct play.
 * Units drain 6-12% per critical class per day — 5-8 days to stonewall
 * without a resupply convoy.
 */

import { Unit } from '../types/game'

const maint = (err: number, dl: number, wo: number, short: boolean) =>
  ({ equipmentReadinessRate:err, vehiclesDeadlined:dl, pendingWorkOrders:wo, repairPartsShortage:short })

// ── CAMPAIGN 1: IRON SUSTAIN (European Theater) ───────────────────────────────
// σ1.8 | SW 12.7% | RCT 38h | Activity 0.35 | 30 days
// FOB Iron already in RED (MSR interdicted). Triage needed immediately.
export const CAMPAIGN_1_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'III Corps', shortName:'III CORPS', type:'CORPS', nodeId:'FOB_VIL',
    readiness:72, status:'AMBER', isManeuver:true,
    maintenance: maint(78,6,14,false), personnelStrength:74, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:62, CL_II:48, CL_III:41, CL_IV:58, CL_V:38, CL_VIII:55, CL_IX:44 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2.5, CL_IX:3 },
    history:[{day:1,readiness:72,status:'AMBER'}],
  },
  {
    id:'FOB1', name:'FOB Iron', shortName:'FOB IRON', type:'BRIGADE', nodeId:'FOB_WAR',
    readiness:18, status:'RED', isManeuver:true,
    maintenance: maint(54,12,22,true), personnelStrength:52, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:38, CL_II:44, CL_III:14, CL_IV:41, CL_V:18, CL_VIII:22, CL_IX:12 },
    dailyConsumption:{ CL_I:4, CL_II:1, CL_III:7, CL_IV:1, CL_V:6, CL_VIII:2, CL_IX:2.5 },
    history:[{day:1,readiness:18,status:'RED'}],
  },
  {
    id:'FOB2', name:'FOB Valor', shortName:'FOB VALOR', type:'BRIGADE', nodeId:'FOB_GDA',
    readiness:65, status:'AMBER', isManeuver:true,
    maintenance: maint(82,4,8,false), personnelStrength:81, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:64, CL_II:54, CL_III:48, CL_IV:52, CL_V:41, CL_VIII:58, CL_IX:52 },
    dailyConsumption:{ CL_I:4, CL_II:1, CL_III:6, CL_IV:1, CL_V:5, CL_VIII:1.8, CL_IX:2.5 },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
  {
    id:'4ID', name:'4th Infantry Division', shortName:'4ID', type:'DIVISION', nodeId:'FOB_KRA',
    readiness:91, status:'GREEN', isManeuver:true,
    maintenance: maint(91,2,5,false), personnelStrength:94, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:75, CL_II:68, CL_III:71, CL_IV:62, CL_V:74, CL_VIII:70, CL_IX:65 },
    dailyConsumption:{ CL_I:6, CL_II:2, CL_III:10, CL_IV:2, CL_V:8, CL_VIII:3, CL_IX:4 },
    history:[{day:1,readiness:91,status:'GREEN'}],
  },
  {
    id:'FOB3', name:'FOB Eagle', shortName:'FOB EAGLE', type:'BRIGADE', nodeId:'FOB_KRA',
    readiness:88, status:'GREEN', isManeuver:true,
    maintenance: maint(86,3,7,false), personnelStrength:88, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:70, CL_II:58, CL_III:66, CL_IV:54, CL_V:63, CL_VIII:62, CL_IX:71 },
    dailyConsumption:{ CL_I:4, CL_II:1, CL_III:6, CL_IV:1, CL_V:5, CL_VIII:1.5, CL_IX:2.5 },
    history:[{day:1,readiness:88,status:'GREEN'}],
  },
  {
    id:'AVN_BDE', name:'Aviation Brigade', shortName:'AVN BDE', type:'AVIATION', nodeId:'AVN_MAL',
    readiness:65, status:'AMBER', isManeuver:false,
    maintenance: maint(68,8,18,true), personnelStrength:71, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:58, CL_II:62, CL_III:31, CL_IV:44, CL_V:38, CL_VIII:48, CL_IX:24 },
    dailyConsumption:{ CL_I:3, CL_II:1, CL_III:11, CL_IV:1, CL_V:3, CL_VIII:1.5, CL_IX:6 },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
]

// ── CAMPAIGN 2: BALTIC SHIELD (Baltic States Defense) ─────────────────────────
// σ1.5 | SW 18% | RCT 44h | Activity 0.55 | 21 days
// Two LOCs interdicted. Two units already RED on Day 1. Triage required.
export const CAMPAIGN_2_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'eFP BG Siauliai', shortName:'eFP BG', type:'CORPS', nodeId:'FOB_SIA',
    readiness:22, status:'RED', isManeuver:true,
    maintenance: maint(58,11,20,true), personnelStrength:61, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:32, CL_II:38, CL_III:18, CL_IV:42, CL_V:22, CL_VIII:34, CL_IX:28 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2.5, CL_IX:3 },
    history:[{day:1,readiness:22,status:'RED'}],
  },
  {
    id:'FOB1', name:'FOB Iron (Tallinn)', shortName:'FOB IRON', type:'BRIGADE', nodeId:'FOB_TAL',
    readiness:45, status:'RED', isManeuver:true,
    maintenance: maint(62,9,17,true), personnelStrength:68, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:44, CL_II:40, CL_III:28, CL_IV:38, CL_V:31, CL_VIII:40, CL_IX:22 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:45,status:'RED'}],
  },
  {
    id:'FOB2', name:'FOB Valor (Tartu)', shortName:'FOB VALOR', type:'BRIGADE', nodeId:'FOB_TAR',
    readiness:58, status:'AMBER', isManeuver:true,
    maintenance: maint(72,6,12,false), personnelStrength:74, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:52, CL_II:44, CL_III:38, CL_IV:45, CL_V:36, CL_VIII:48, CL_IX:32 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:58,status:'AMBER'}],
  },
  {
    id:'4ID', name:'2nd Infantry Division', shortName:'2ID', type:'DIVISION', nodeId:'FOB_TAL',
    readiness:52, status:'AMBER', isManeuver:true,
    maintenance: maint(66,8,16,true), personnelStrength:70, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:48, CL_II:42, CL_III:32, CL_IV:44, CL_V:28, CL_VIII:44, CL_IX:30 },
    dailyConsumption:{ CL_I:6, CL_II:2, CL_III:10, CL_IV:2, CL_V:8, CL_VIII:3, CL_IX:4 },
    history:[{day:1,readiness:52,status:'AMBER'}],
  },
  {
    id:'FOB3', name:'FOB Eagle (Kaunas)', shortName:'FOB EAGLE', type:'BRIGADE', nodeId:'FOB_KUN',
    readiness:68, status:'AMBER', isManeuver:true,
    maintenance: maint(76,5,10,false), personnelStrength:78, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:60, CL_II:50, CL_III:44, CL_IV:48, CL_V:40, CL_VIII:54, CL_IX:38 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:1.8, CL_IX:3 },
    history:[{day:1,readiness:68,status:'AMBER'}],
  },
  {
    id:'AVN_BDE', name:'Aviation BDE (Amari)', shortName:'AVN BDE', type:'AVIATION', nodeId:'AVN_TAL',
    readiness:48, status:'RED', isManeuver:false,
    maintenance: maint(58,10,22,true), personnelStrength:62, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:44, CL_II:50, CL_III:24, CL_IV:38, CL_V:30, CL_VIII:40, CL_IX:20 },
    dailyConsumption:{ CL_I:3, CL_II:1, CL_III:12, CL_IV:1, CL_V:3, CL_VIII:1.5, CL_IX:6 },
    history:[{day:1,readiness:48,status:'RED'}],
  },
]

// ── CAMPAIGN 3: DESERT LINES (Jordan → Iraq/Syria) ────────────────────────────
// σ1.6 | SW 15% | RCT 42h | Activity 0.50 | 25 days
// Heat multiplier: CL_I +40%, CL_III +35%. Long LOCs. FOB Iron nearly isolated.
// NOTE: heat multipliers are BAKED INTO dailyConsumption for this campaign.
export const CAMPAIGN_3_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'III Corps (Tikrit)', shortName:'III CORPS', type:'CORPS', nodeId:'FOB_TKR',
    readiness:60, status:'AMBER', isManeuver:true,
    maintenance: maint(70,7,15,false), personnelStrength:72, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:52, CL_II:44, CL_III:38, CL_IV:50, CL_V:42, CL_VIII:50, CL_IX:38 },
    // Heat: CL_I × 1.4, CL_III × 1.35
    dailyConsumption:{ CL_I:7, CL_II:1, CL_III:12, CL_IV:1, CL_V:7, CL_VIII:2.5, CL_IX:3 },
    history:[{day:1,readiness:60,status:'AMBER'}],
  },
  {
    id:'FOB1', name:'FOB Iron (Rutbah)', shortName:'FOB RUTBAH', type:'BRIGADE', nodeId:'FOB_RTB',
    readiness:28, status:'RED', isManeuver:true,
    maintenance: maint(55,11,21,true), personnelStrength:55, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:30, CL_II:38, CL_III:16, CL_IV:40, CL_V:22, CL_VIII:28, CL_IX:18 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:10, CL_IV:1, CL_V:6, CL_VIII:2, CL_IX:2.5 },
    history:[{day:1,readiness:28,status:'RED'}],
  },
  {
    id:'FOB2', name:'FOB Valor (Ramadi)', shortName:'FOB RAMADI', type:'BRIGADE', nodeId:'FOB_RMD',
    readiness:55, status:'AMBER', isManeuver:true,
    maintenance: maint(68,7,14,false), personnelStrength:70, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:50, CL_II:42, CL_III:34, CL_IV:44, CL_V:36, CL_VIII:46, CL_IX:30 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:10, CL_IV:1, CL_V:6, CL_VIII:2, CL_IX:2.5 },
    history:[{day:1,readiness:55,status:'AMBER'}],
  },
  {
    id:'4ID', name:'82nd Airborne', shortName:'82 ABN', type:'DIVISION', nodeId:'FOB_RTB',
    readiness:48, status:'RED', isManeuver:true,
    maintenance: maint(60,9,19,true), personnelStrength:64, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:42, CL_II:36, CL_III:22, CL_IV:40, CL_V:28, CL_VIII:38, CL_IX:24 },
    dailyConsumption:{ CL_I:7, CL_II:2, CL_III:12, CL_IV:2, CL_V:8, CL_VIII:3, CL_IX:4 },
    history:[{day:1,readiness:48,status:'RED'}],
  },
  {
    id:'FOB3', name:'FOB Eagle (Mosul)', shortName:'FOB MOSUL', type:'BRIGADE', nodeId:'FOB_MSL',
    readiness:65, status:'AMBER', isManeuver:true,
    maintenance: maint(74,5,11,false), personnelStrength:76, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:58, CL_II:48, CL_III:42, CL_IV:50, CL_V:44, CL_VIII:52, CL_IX:36 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:10, CL_IV:1, CL_V:6, CL_VIII:1.8, CL_IX:2.5 },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
  {
    id:'AVN_BDE', name:'Aviation BDE (Baghdad)', shortName:'AVN BDE', type:'AVIATION', nodeId:'AVN_BGW',
    readiness:58, status:'AMBER', isManeuver:false,
    maintenance: maint(64,9,19,true), personnelStrength:68, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:50, CL_II:54, CL_III:26, CL_IV:42, CL_V:32, CL_VIII:44, CL_IX:22 },
    // Aviation burns extreme CL_III in desert heat
    dailyConsumption:{ CL_I:4, CL_II:1, CL_III:16, CL_IV:1, CL_V:3, CL_VIII:1.5, CL_IX:6 },
    history:[{day:1,readiness:58,status:'AMBER'}],
  },
]

// ── CAMPAIGN 4: SAND BRIDGE (UAE → Kuwait) ────────────────────────────────────
// σ1.3 | SW 8% | RCT 52h | Activity 0.15 | 20 days
// Process failure — supply exists but delivery is broken. All units AMBER.
// The 52h RCT means every request sits 4h past the USL before moving.
export const CAMPAIGN_4_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'III Corps (Nasiriyah)', shortName:'III CORPS', type:'CORPS', nodeId:'FOB_NAS',
    readiness:65, status:'AMBER', isManeuver:true,
    maintenance: maint(72,5,12,false), personnelStrength:74, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:60, CL_II:52, CL_III:46, CL_IV:56, CL_V:44, CL_VIII:58, CL_IX:48 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:6, CL_VIII:2.5, CL_IX:3 },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
  {
    id:'FOB1', name:'FOB Iron (Camp Buehring)', shortName:'BUEHRING', type:'BRIGADE', nodeId:'FOB_BUE',
    readiness:62, status:'AMBER', isManeuver:true,
    maintenance: maint(70,6,13,false), personnelStrength:72, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:58, CL_II:48, CL_III:42, CL_IV:52, CL_V:40, CL_VIII:54, CL_IX:44 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:7, CL_IV:1, CL_V:6, CL_VIII:2, CL_IX:2.5 },
    history:[{day:1,readiness:62,status:'AMBER'}],
  },
  {
    id:'FOB2', name:'FOB Valor (Camp Arifjan)', shortName:'ARIFJAN', type:'BRIGADE', nodeId:'FOB_ARF',
    readiness:58, status:'AMBER', isManeuver:true,
    maintenance: maint(68,6,14,false), personnelStrength:70, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:54, CL_II:46, CL_III:40, CL_IV:50, CL_V:38, CL_VIII:52, CL_IX:42 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:7, CL_IV:1, CL_V:6, CL_VIII:2, CL_IX:2.5 },
    history:[{day:1,readiness:58,status:'AMBER'}],
  },
  {
    id:'4ID', name:'1st Cavalry Division', shortName:'1 CAV', type:'DIVISION', nodeId:'FOB_BUE',
    readiness:70, status:'AMBER', isManeuver:true,
    maintenance: maint(76,4,10,false), personnelStrength:78, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:64, CL_II:56, CL_III:50, CL_IV:58, CL_V:48, CL_VIII:62, CL_IX:52 },
    dailyConsumption:{ CL_I:6, CL_II:2, CL_III:9, CL_IV:2, CL_V:7, CL_VIII:3, CL_IX:4 },
    history:[{day:1,readiness:70,status:'AMBER'}],
  },
  {
    id:'FOB3', name:'FOB Eagle (Camp Ariz)', shortName:'ARIZ', type:'BRIGADE', nodeId:'FOB_ARZ',
    readiness:55, status:'AMBER', isManeuver:true,
    maintenance: maint(66,7,14,false), personnelStrength:68, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:52, CL_II:44, CL_III:38, CL_IV:48, CL_V:36, CL_VIII:50, CL_IX:40 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:7, CL_IV:1, CL_V:6, CL_VIII:1.8, CL_IX:2.5 },
    history:[{day:1,readiness:55,status:'AMBER'}],
  },
  {
    id:'AVN_BDE', name:'Aviation BDE (Ali Al Salem)', shortName:'AVN BDE', type:'AVIATION', nodeId:'AVN_ARF',
    readiness:60, status:'AMBER', isManeuver:false,
    maintenance: maint(66,8,16,true), personnelStrength:68, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:56, CL_II:58, CL_III:36, CL_IV:46, CL_V:34, CL_VIII:50, CL_IX:30 },
    dailyConsumption:{ CL_I:3, CL_II:1, CL_III:10, CL_IV:1, CL_V:3, CL_VIII:1.5, CL_IX:6 },
    history:[{day:1,readiness:60,status:'AMBER'}],
  },
]

// ── CAMPAIGN 5: PACIFIC PUSH (Korean Peninsula) ───────────────────────────────
// σ1.9 | SW 10% | RCT 36h | Activity 0.40 | 28 days
// Best-ish start — but pre-position window closes at Day 10.
// After Day 10 port threat escalates. Every ton not moved is a ton you fight for.
export const CAMPAIGN_5_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'III Corps (Red Cloud)', shortName:'III CORPS', type:'CORPS', nodeId:'FOB_RED',
    readiness:62, status:'AMBER', isManeuver:true,
    maintenance: maint(72,6,13,false), personnelStrength:74, stonewallStreak:0, isDark:false,
    // One LOC is interdicted — can't reach easily
    supplyLevels:  { CL_I:50, CL_II:44, CL_III:36, CL_IV:50, CL_V:32, CL_VIII:48, CL_IX:34 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2.5, CL_IX:3 },
    history:[{day:1,readiness:62,status:'AMBER'}],
  },
  {
    id:'FOB1', name:'FOB Iron (Camp Humphreys)', shortName:'HUMPHREYS', type:'BRIGADE', nodeId:'FOB_HUM',
    readiness:78, status:'GREEN', isManeuver:true,
    maintenance: maint(84,3,8,false), personnelStrength:86, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:72, CL_II:62, CL_III:66, CL_IV:60, CL_V:68, CL_VIII:68, CL_IX:62 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:78,status:'GREEN'}],
  },
  {
    id:'FOB2', name:'FOB Valor (Camp Casey)', shortName:'CASEY', type:'BRIGADE', nodeId:'FOB_CSY',
    readiness:65, status:'AMBER', isManeuver:true,
    maintenance: maint(74,5,11,false), personnelStrength:76, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:60, CL_II:52, CL_III:54, CL_IV:54, CL_V:56, CL_VIII:58, CL_IX:50 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:65,status:'AMBER'}],
  },
  {
    id:'4ID', name:'7th Infantry Division', shortName:'7ID', type:'DIVISION', nodeId:'FOB_HUM',
    readiness:82, status:'GREEN', isManeuver:true,
    maintenance: maint(88,2,6,false), personnelStrength:90, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:76, CL_II:66, CL_III:70, CL_IV:64, CL_V:72, CL_VIII:72, CL_IX:66 },
    dailyConsumption:{ CL_I:6, CL_II:2, CL_III:10, CL_IV:2, CL_V:8, CL_VIII:3, CL_IX:4 },
    history:[{day:1,readiness:82,status:'GREEN'}],
  },
  {
    id:'FOB3', name:'FOB Eagle (Camp Walker)', shortName:'WALKER', type:'BRIGADE', nodeId:'FOB_DAG',
    readiness:72, status:'AMBER', isManeuver:true,
    maintenance: maint(80,4,9,false), personnelStrength:82, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:66, CL_II:56, CL_III:60, CL_IV:56, CL_V:62, CL_VIII:62, CL_IX:56 },
    dailyConsumption:{ CL_I:5, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:1.8, CL_IX:2.5 },
    history:[{day:1,readiness:72,status:'AMBER'}],
  },
  {
    id:'AVN_BDE', name:'Aviation BDE (Osan)', shortName:'AVN BDE', type:'AVIATION', nodeId:'AVN_OSN',
    readiness:70, status:'AMBER', isManeuver:false,
    maintenance: maint(76,6,14,false), personnelStrength:78, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:64, CL_II:66, CL_III:48, CL_IV:52, CL_V:44, CL_VIII:58, CL_IX:38 },
    dailyConsumption:{ CL_I:3, CL_II:1, CL_III:11, CL_IV:1, CL_V:3, CL_VIII:1.5, CL_IX:6 },
    history:[{day:1,readiness:70,status:'AMBER'}],
  },
]

// ── CAMPAIGN 6: ISLAND HOP (Pacific Island Chain) ─────────────────────────────
// σ2.1 | SW 9% | RCT 32h | Activity 0.60 | 35 days
// Best starting sigma — but NO GROUND ROUTES. All air/maritime.
// Economy of force mandatory. Yap and Chuuk will degrade without priority sorties.
// High enemy activity (0.60) — contested approaches, sortie losses.
export const CAMPAIGN_6_UNITS: Unit[] = [
  {
    id:'III_CORPS', name:'FOB Thunder (Chuuk)', shortName:'CHUUK', type:'CORPS', nodeId:'FOB_CHK',
    readiness:42, status:'RED', isManeuver:true,
    maintenance: maint(56,11,22,true), personnelStrength:60, stonewallStreak:0, isDark:false,
    // Farthest position, hardest to reach
    supplyLevels:  { CL_I:38, CL_II:40, CL_III:26, CL_IV:44, CL_V:28, CL_VIII:36, CL_IX:24 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2.5, CL_IX:3 },
    history:[{day:1,readiness:42,status:'RED'}],
  },
  {
    id:'FOB1', name:'FOB Iron (Tinian)', shortName:'TINIAN', type:'BRIGADE', nodeId:'FOB_TIN',
    readiness:75, status:'AMBER', isManeuver:true,
    maintenance: maint(80,4,9,false), personnelStrength:82, stonewallStreak:0, isDark:false,
    // Main effort — closest to Guam, easiest to supply
    supplyLevels:  { CL_I:68, CL_II:60, CL_III:62, CL_IV:58, CL_V:64, CL_VIII:64, CL_IX:58 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:75,status:'AMBER'}],
  },
  {
    id:'FOB2', name:'FOB Valor (Palau)', shortName:'PALAU', type:'BRIGADE', nodeId:'FOB_PLU',
    readiness:62, status:'AMBER', isManeuver:true,
    maintenance: maint(70,6,13,false), personnelStrength:72, stonewallStreak:0, isDark:false,
    supplyLevels:  { CL_I:56, CL_II:50, CL_III:46, CL_IV:52, CL_V:48, CL_VIII:54, CL_IX:42 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:62,status:'AMBER'}],
  },
  {
    id:'4ID', name:'Saipan Depot Reserve', shortName:'SPN DEPOT', type:'DIVISION', nodeId:'DEP_SPN',
    readiness:85, status:'GREEN', isManeuver:false,
    maintenance: maint(88,2,5,false), personnelStrength:88, stonewallStreak:0, isDark:false,
    // Depot unit — high readiness but its job is to stage, not fight
    supplyLevels:  { CL_I:80, CL_II:74, CL_III:76, CL_IV:72, CL_V:78, CL_VIII:76, CL_IX:72 },
    dailyConsumption:{ CL_I:3, CL_II:1, CL_III:4, CL_IV:1, CL_V:3, CL_VIII:2, CL_IX:2 },
    history:[{day:1,readiness:85,status:'GREEN'}],
  },
  {
    id:'FOB3', name:'FOB Eagle (Yap)', shortName:'YAP', type:'BRIGADE', nodeId:'FOB_YAP',
    readiness:48, status:'RED', isManeuver:true,
    maintenance: maint(60,9,18,true), personnelStrength:64, stonewallStreak:0, isDark:false,
    // Contested approach — supply convoys often interdicted
    supplyLevels:  { CL_I:44, CL_II:42, CL_III:30, CL_IV:46, CL_V:32, CL_VIII:40, CL_IX:26 },
    dailyConsumption:{ CL_I:6, CL_II:1, CL_III:8, CL_IV:1, CL_V:7, CL_VIII:2, CL_IX:3 },
    history:[{day:1,readiness:48,status:'RED'}],
  },
  {
    id:'AVN_BDE', name:'Aviation BDE (Guam)', shortName:'AVN BDE', type:'AVIATION', nodeId:'AVN_GUM',
    readiness:70, status:'AMBER', isManeuver:false,
    maintenance: maint(76,6,14,false), personnelStrength:78, stonewallStreak:0, isDark:false,
    // Aviation IS the supply chain here — must be kept GREEN
    supplyLevels:  { CL_I:64, CL_II:66, CL_III:55, CL_IV:54, CL_V:46, CL_VIII:60, CL_IX:42 },
    dailyConsumption:{ CL_I:3, CL_II:1, CL_III:12, CL_IV:1, CL_V:3, CL_VIII:1.5, CL_IX:6 },
    history:[{day:1,readiness:70,status:'AMBER'}],
  },
]

// ── LOOKUP ────────────────────────────────────────────────────────────────────
export const SCENARIO_UNITS: Record<string, Unit[]> = {
  CAMPAIGN_1: CAMPAIGN_1_UNITS,
  CAMPAIGN_2: CAMPAIGN_2_UNITS,
  CAMPAIGN_3: CAMPAIGN_3_UNITS,
  CAMPAIGN_4: CAMPAIGN_4_UNITS,
  CAMPAIGN_5: CAMPAIGN_5_UNITS,
  CAMPAIGN_6: CAMPAIGN_6_UNITS,
}

export function getScenarioUnits(scenarioId: string): Unit[] {
  return SCENARIO_UNITS[scenarioId] || CAMPAIGN_1_UNITS
}
