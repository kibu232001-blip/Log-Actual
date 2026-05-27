/**
 * LOG ACTUAL — MTOE Burn Rate Engine
 * KibuglogalVentures LLC
 *
 * Modified Table of Organization and Equipment (MTOE) defines
 * authorized strength and equipment for each unit type.
 * Consumption rates are derived from real Army planning factors:
 *   - DA Pam 710-2-1 (Unit Supply Operations)
 *   - ATP 4-11 (Army Motor Transport Operations)
 *   - FM 4-0 (Sustainment)
 *
 * Burn rates scale with:
 *   1. Operational tempo (REDCON / alert level)
 *   2. Personnel strength (fewer soldiers = less consumption)
 *   3. Equipment density from MTOE
 *   4. Environmental conditions
 *   5. Mission type (offensive burns more than defensive)
 */

export type UnitTypeId = 'CORPS' | 'DIVISION' | 'BRIGADE' | 'AVIATION' | 'SUPPORT' | 'SPECIAL_OPS'
export type OperationalTempo = 'SUSTAINMENT' | 'DEFENSIVE' | 'OFFENSIVE' | 'SURGE'
export type EnvironmentType  = 'TEMPERATE' | 'DESERT' | 'ARCTIC' | 'JUNGLE' | 'MARITIME'

// ── MTOE AUTHORIZATION TABLE ──────────────────────────────────────────────────
// Based on actual Army MTOE for each echelon.
// Key fields: authorized personnel, combat vehicles, aircraft, wheeled vehicles

export interface MTOEProfile {
  unitType: UnitTypeId
  label: string
  authorizedStrength: number       // personnel
  combatVehicles: number           // tanks, IFVs, APCs
  aircraft: number                 // rotary/fixed wing
  wheeled: number                  // trucks, HMMWVs
  generators: number               // power generation sets
  // Base daily planning factors (percentages of unit capacity)
  // Source: DA Pam 710-2-1 Table B-5
  baseBurnRates: {
    CL_I:    number   // Food/water: lbs per person per day → converted to %
    CL_II:   number   // Clothing/equipment: wear rate
    CL_III:  number   // POL: gallons per vehicle per day → %
    CL_IV:   number   // Construction: operational rate
    CL_V:    number   // Ammunition: rounds per weapon per day → %
    CL_VIII: number   // Medical: patients per day / sick call rate
    CL_IX:   number   // Repair parts: equipment density factor
  }
}

export const MTOE_PROFILES: Record<UnitTypeId, MTOEProfile> = {
  CORPS: {
    unitType: 'CORPS', label: 'Corps HQ + assigned',
    authorizedStrength: 2200, combatVehicles: 85, aircraft: 12, wheeled: 420, generators: 48,
    baseBurnRates: {
      CL_I:    4.5,   // 2200 personnel × 6.5 lbs/day
      CL_II:   1.2,   // Low wear — HQ-heavy unit
      CL_III:  7.5,   // Large vehicle fleet, generators, aircraft support
      CL_IV:   1.0,   // Minimal construction
      CL_V:    5.5,   // Limited direct combat
      CL_VIII: 2.8,   // Medical: large force generates more patients
      CL_IX:   3.5,   // Diverse equipment mix requires broad parts range
    },
  },
  DIVISION: {
    unitType: 'DIVISION', label: 'Infantry/Armor Division',
    authorizedStrength: 17000, combatVehicles: 300, aircraft: 0, wheeled: 1800, generators: 180,
    baseBurnRates: {
      CL_I:    5.5,   // 17k personnel
      CL_II:   1.8,   // High wear on field equipment
      CL_III:  9.0,   // 300 combat vehicles + 1800 wheeled
      CL_IV:   2.0,   // Field fortification
      CL_V:    8.5,   // High ammunition consumption
      CL_VIII: 3.2,   // Large force, field conditions
      CL_IX:   4.5,   // Massive equipment density
    },
  },
  BRIGADE: {
    unitType: 'BRIGADE', label: 'Brigade Combat Team',
    authorizedStrength: 4500, combatVehicles: 88, aircraft: 0, wheeled: 380, generators: 42,
    baseBurnRates: {
      CL_I:    3.5,   // Standard infantry consumption
      CL_II:   1.5,   // Moderate wear
      CL_III:  6.0,   // 88 combat vehicles + trucks
      CL_IV:   1.2,   // Some field engineering
      CL_V:    6.5,   // Primary combat unit — high ammo
      CL_VIII: 2.2,   // Field medical, casualties
      CL_IX:   3.0,   // BCT equipment profile
    },
  },
  AVIATION: {
    unitType: 'AVIATION', label: 'Combat Aviation Brigade',
    authorizedStrength: 3200, combatVehicles: 8, aircraft: 165, wheeled: 280, generators: 62,
    baseBurnRates: {
      CL_I:    2.5,   // Smaller ground force
      CL_II:   1.0,   // Lower wear rate
      CL_III:  11.5,  // CRITICAL: 165 aircraft × JP-8 consumption
      CL_IV:   0.8,   // Minimal construction
      CL_V:    4.0,   // Weapon systems but limited ground combat
      CL_VIII: 1.8,   // Smaller force, controlled environment
      CL_IX:   6.5,   // Aircraft parts are expensive and critical
    },
  },
  SUPPORT: {
    unitType: 'SUPPORT', label: 'Sustainment Brigade',
    authorizedStrength: 3800, combatVehicles: 12, aircraft: 0, wheeled: 680, generators: 88,
    baseBurnRates: {
      CL_I:    2.8,   // Moderate force
      CL_II:   1.0,   // Administrative wear
      CL_III:  5.5,   // Large truck fleet
      CL_IV:   1.5,   // Some construction for logistics nodes
      CL_V:    1.5,   // Minimal direct combat
      CL_VIII: 1.5,   // Rear area, lower casualty rate
      CL_IX:   2.5,   // Vehicle-heavy but less complex
    },
  },
  SPECIAL_OPS: {
    unitType: 'SPECIAL_OPS', label: 'Special Operations',
    authorizedStrength: 800, combatVehicles: 22, aircraft: 8, wheeled: 120, generators: 18,
    baseBurnRates: {
      CL_I:    2.0,   // Small, specialized force
      CL_II:   2.5,   // High-end equipment, high wear
      CL_III:  4.5,   // Lighter footprint but high-speed vehicles
      CL_IV:   0.5,   // Minimal
      CL_V:    7.5,   // High ammunition expenditure per person
      CL_VIII: 3.0,   // Higher risk, more casualties per capita
      CL_IX:   4.0,   // Specialized equipment, hard to replace
    },
  },
}

// ── OPERATIONAL TEMPO MULTIPLIERS ────────────────────────────────────────────
// Source: ATP 4-0, Table 2-1 — Sustainment planning factors by OPTEMPO
export const TEMPO_MULTIPLIERS: Record<OperationalTempo, Record<string, number>> = {
  SUSTAINMENT: {
    CL_I:    0.80,   // Reduced activity
    CL_II:   0.70,
    CL_III:  0.65,   // Minimal vehicle movement
    CL_IV:   0.80,
    CL_V:    0.20,   // Almost no ammunition
    CL_VIII: 0.60,   // Lower casualty rate
    CL_IX:   0.75,
  },
  DEFENSIVE: {
    CL_I:    1.00,   // Normal consumption
    CL_II:   1.00,
    CL_III:  0.85,   // Less vehicle movement than offense
    CL_IV:   1.80,   // HIGH: fortification, barrier materials
    CL_V:    1.20,   // Moderate ammo (return fire)
    CL_VIII: 1.10,
    CL_IX:   0.90,
  },
  OFFENSIVE: {
    CL_I:    1.20,   // Higher physical demand
    CL_II:   1.30,   // Equipment takes more wear
    CL_III:  1.80,   // HIGH: sustained vehicle movement
    CL_IV:   0.80,   // Less fortification
    CL_V:    2.20,   // HIGH: aggressive fire missions
    CL_VIII: 1.50,   // More casualties
    CL_IX:   1.60,   // More vehicle breakdowns under stress
  },
  SURGE: {
    CL_I:    1.40,
    CL_II:   1.60,
    CL_III:  2.50,   // CRITICAL: maximum vehicle usage
    CL_IV:   1.00,
    CL_V:    3.00,   // CRITICAL: sustained combat
    CL_VIII: 2.20,   // High casualty rate
    CL_IX:   2.00,   // Maximum breakdown rate
  },
}

// ── ENVIRONMENTAL MULTIPLIERS ─────────────────────────────────────────────────
// Source: FM 4-0 Chapter 4 — Environmental considerations
export const ENV_MULTIPLIERS: Record<EnvironmentType, Record<string, number>> = {
  TEMPERATE: { CL_I:1.0, CL_II:1.0, CL_III:1.0, CL_IV:1.0, CL_V:1.0, CL_VIII:1.0, CL_IX:1.0 },
  DESERT: {
    CL_I:    1.40,   // Water requirement +40%
    CL_II:   1.20,   // Sand/heat degrades equipment
    CL_III:  1.30,   // Higher engine consumption in heat
    CL_IV:   0.90,
    CL_V:    1.10,
    CL_VIII: 1.30,   // Heat casualties
    CL_IX:   1.40,   // Sand/heat damage to parts
  },
  ARCTIC: {
    CL_I:    1.30,   // Caloric requirement increases
    CL_II:   1.50,   // Cold weather gear degrades fast
    CL_III:  1.60,   // Engines need more fuel in cold
    CL_IV:   1.20,   // Warming structures
    CL_V:    1.00,
    CL_VIII: 1.20,   // Cold injury
    CL_IX:   1.30,   // Cold weather breaks equipment
  },
  JUNGLE: {
    CL_I:    1.20,   // Resupply difficulty
    CL_II:   1.40,   // Rapid degradation in humidity
    CL_III:  1.10,
    CL_IV:   1.30,   // Clearing operations
    CL_V:    1.20,
    CL_VIII: 1.50,   // Disease, insect vectors
    CL_IX:   1.60,   // Humidity destroys electronics/parts
  },
  MARITIME: {
    CL_I:    1.10,
    CL_II:   1.30,   // Salt air corrosion
    CL_III:  1.20,   // Naval fuel mix
    CL_IV:   1.40,   // Pier/landing infrastructure
    CL_V:    1.10,
    CL_VIII: 1.10,
    CL_IX:   1.50,   // Salt corrosion on parts
  },
}

// ── STRENGTH MODIFIER ─────────────────────────────────────────────────────────
// Personnel strength affects consumption non-linearly.
// A unit at 50% strength doesn't consume 50% — fixed costs remain.
export function strengthModifier(personnelStrength: number): number {
  if (personnelStrength >= 90) return 1.00
  if (personnelStrength >= 75) return 0.92
  if (personnelStrength >= 60) return 0.82
  if (personnelStrength >= 45) return 0.70
  if (personnelStrength >= 30) return 0.58
  if (personnelStrength >= 15) return 0.45
  return 0.30  // Skeleton crew — fixed costs only
}

// ── MASTER BURN RATE CALCULATOR ───────────────────────────────────────────────
// Returns actual daily consumption percentages for a given unit in given conditions

export interface BurnRateInputs {
  unitType: UnitTypeId
  personnelStrength: number    // 0-100
  operationalTempo: OperationalTempo
  environment: EnvironmentType
  isCommanderSurge?: boolean   // commander push doubles CL III & V
  isWeatherDegraded?: boolean  // rain/storm reduces vehicle movement
}

export interface BurnRateOutput {
  CL_I:    number
  CL_II:   number
  CL_III:  number
  CL_IV:   number
  CL_V:    number
  CL_VIII: number
  CL_IX:   number
  totalBurden: number  // sum of all rates (theater planning metric)
  criticalClass: string | null  // which class burns fastest vs current supply
}

export function calculateBurnRate(inputs: BurnRateInputs): BurnRateOutput {
  const profile = MTOE_PROFILES[inputs.unitType]
  if (!profile) return defaultBurnRate()

  const tempo = TEMPO_MULTIPLIERS[inputs.operationalTempo]
  const env   = ENV_MULTIPLIERS[inputs.environment]
  const strMod = strengthModifier(inputs.personnelStrength)
  const surgeMod = inputs.isCommanderSurge ? 1.8 : 1.0
  const weatherMod = inputs.isWeatherDegraded ? 0.75 : 1.0  // storms cut vehicle ops

  const cls = ['CL_I','CL_II','CL_III','CL_IV','CL_V','CL_VIII','CL_IX'] as const
  const result: any = { totalBurden:0, criticalClass:null }

  cls.forEach(c => {
    let rate = profile.baseBurnRates[c]
    rate *= tempo[c] ?? 1.0
    rate *= env[c] ?? 1.0
    rate *= strMod
    // Surge only affects fuel and ammo
    if (c === 'CL_III' || c === 'CL_V') rate *= surgeMod
    // Weather reduces CL III (less driving)
    if (c === 'CL_III') rate *= weatherMod
    result[c] = parseFloat(rate.toFixed(2))
    result.totalBurden += rate
  })

  result.totalBurden = parseFloat(result.totalBurden.toFixed(2))
  return result as BurnRateOutput
}

function defaultBurnRate(): BurnRateOutput {
  return { CL_I:3, CL_II:1, CL_III:5, CL_IV:1, CL_V:4, CL_VIII:2, CL_IX:2, totalBurden:18, criticalClass:null }
}

// ── SCENARIO ENVIRONMENT MAP ──────────────────────────────────────────────────
export const SCENARIO_ENVIRONMENT: Record<string, EnvironmentType> = {
  CAMPAIGN_1: 'TEMPERATE',   // Europe
  CAMPAIGN_2: 'TEMPERATE',   // Baltic
  CAMPAIGN_3: 'DESERT',      // Jordan/Iraq
  CAMPAIGN_4: 'DESERT',      // UAE/Kuwait
  CAMPAIGN_5: 'TEMPERATE',   // Korea
  CAMPAIGN_6: 'MARITIME',    // Pacific islands
}

// ── TEMPO FROM GAME STATE ─────────────────────────────────────────────────────
export function tempoFromDay(day: number, sigma: number, stonewallRate: number): OperationalTempo {
  if (stonewallRate > 15 || sigma < 1.5) return 'SURGE'
  if (day > 20 || stonewallRate > 5)     return 'OFFENSIVE'
  if (day > 10)                          return 'DEFENSIVE'
  return 'SUSTAINMENT'
}
