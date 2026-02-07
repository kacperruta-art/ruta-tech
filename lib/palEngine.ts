import {differenceInYears} from 'date-fns'

// ══════════════════════════════════════════════════════════
// ── RUTA-TECH Predictive Asset Lifecycle (PAL) Engine ────
// ══════════════════════════════════════════════════════════
// Calculates a composite Health Score (0-100) by combining:
//   1. Age-based depreciation curve
//   2. Repair history penalty
//   3. Maintenance history bonus
//   4. Optional manual condition override

export interface PalAssetData {
  installDate: string | null
  expectedLifespan: number
  repairCount: number
  maintenanceCount: number
  manualCondition?: string
}

export interface PalResult {
  score: number
  status: 'critical' | 'warning' | 'good' | 'excellent'
  color: string
  label: string
  recommendation: string
}

export function calculateHealthScore(asset: PalAssetData): PalResult {
  // 1. Safety Check — missing data yields an "unknown/critical" state
  if (!asset.installDate || !asset.expectedLifespan) {
    return {
      score: 0,
      status: 'critical',
      color: '#ef4444',
      label: 'Unbekannt',
      recommendation: 'Daten fehlen: Installationsdatum nachtragen!',
    }
  }

  // 2. Base Health (age-based linear depreciation)
  const age = differenceInYears(new Date(), new Date(asset.installDate))
  const lifespan = Math.max(1, asset.expectedLifespan)
  const baseHealth = Math.max(0, ((lifespan - age) / lifespan) * 100)

  let score = baseHealth

  // 3. RUTA-TECH Modifiers
  // PENALTY: -5 pts per repair event (recurring issues erode health)
  score -= asset.repairCount * 5

  // BONUS: +2 pts per maintenance event (well-cared-for assets last longer)
  // Only applied when the asset still has positive health
  if (score > 0) {
    score += asset.maintenanceCount * 2
  }

  // CRITICAL RESET: >3 repairs signals a "money pit" — force cap
  if (asset.repairCount > 3) {
    score = Math.min(score, 20)
  }

  // 4. Manual Condition Override (blended with algorithmic score)
  if (asset.manualCondition) {
    const conditionMap: Record<string, number> = {
      '5': 100,
      '4': 80,
      '3': 50,
      '2': 30,
      '1': 10,
    }
    const manualScore = conditionMap[asset.manualCondition] ?? score

    // If manual assessment is critical, trust the human fully
    if (manualScore <= 20) {
      score = manualScore
    } else {
      // Weighted blend: 50/50 algorithmic vs. manual
      score = (score + manualScore) / 2
    }
  }

  // Clamp result to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  // 5. Determine status tier, color, label, and recommendation
  let status: PalResult['status'] = 'good'
  let color = '#22c55e'
  let label = 'Neuwertig'
  let rec = 'Keine Massnahmen erforderlich.'

  if (score >= 80) {
    status = 'excellent'
    label = 'Neuwertig'
    color = '#22c55e' // Green
  } else if (score >= 50) {
    status = 'good'
    label = 'Gut'
    color = '#84cc16' // Lime
  } else if (score >= 25) {
    status = 'warning'
    label = 'Abgenutzt'
    color = '#eab308' // Yellow
    rec = 'Wartung einplanen. Zustand beobachten.'
  } else {
    status = 'critical'
    label = 'Kritisch / EOL'
    color = '#ef4444' // Red
    rec = 'SOFORTIGER ERSATZ EMPFOHLEN (CAPEX planen).'
  }

  return {score, status, color, label, recommendation: rec}
}
