interface PlateConfiguration {
  percentage?: number
  accurateWeight: number
  roundedWeight: number
  closestWeight: number
  plates: number[]
}

interface CalculationParams {
  PR?: number
  barWeight: number
  values: number[]
  units: "KG" | "LB"
  isPercentages: boolean
  sourceUnits: "KG" | "LB"
}

export interface PlateInventory {
  [weight: number]: number
}

const AVAILABLE_PLATES = {
  KG: [25, 20, 15, 10, 7.5, 5, 2.5, 1, 0.5],
  LB: [45, 35, 25, 10, 5, 2.5],
}

const EQUIVALENT_BARBELLS = {
  KG: {
    "45": 20,
    "35": 15,
  },
  LB: {
    "20": 45,
    "15": 35,
  }
}

const CONVERSION_RATES = {
  KG_TO_LB: 2.20462,
  LB_TO_KG: 0.453592
}

export function calculatePlateConfigurations({
  PR,
  barWeight,
  values,
  units,
  sourceUnits,
  isPercentages,
}: CalculationParams): PlateConfiguration[] {
  const availablePlates = AVAILABLE_PLATES[units]

  const shouldConvert = sourceUnits !== units
  const conversionRate = shouldConvert
    ? (sourceUnits === "KG" ? CONVERSION_RATES.KG_TO_LB : CONVERSION_RATES.LB_TO_KG)
    : 1

  const equivalentBarWeight = shouldConvert
    ? EQUIVALENT_BARBELLS[units][barWeight.toString() as keyof (typeof EQUIVALENT_BARBELLS)[typeof units]]
    : barWeight

  const convertedPR = PR ? PR * conversionRate : undefined
  const convertedValues = isPercentages
    ? values
    : values.map(v => v * conversionRate)

  // Step 1: Compute target weights per side for all configs
  const targetsPerSide = convertedValues.map(value => {
    if (isPercentages) {
      if (!convertedPR) throw new Error("PR is required for percentage calculations")
      return (convertedPR * (value / 100) - equivalentBarWeight) / 2
    }
    return (value - equivalentBarWeight) / 2
  })

  // Step 2: Find the smallest set of plate types that achieves the same
  // closest weights across ALL configs (cross-config consistency)
  const optimalPlates = findOptimalPlateSubset(targetsPerSide, availablePlates)

  // Step 3: Solve each config with the optimal plate subset
  return convertedValues.map((value, i) => {
    let targetWeight: number
    if (isPercentages) {
      if (!convertedPR) throw new Error("PR is required for percentage calculations")
      targetWeight = convertedPR * (value / 100)
    } else {
      targetWeight = value
    }

    const plateConfig = calculatePlatesOptimal(targetsPerSide[i], optimalPlates)
    const actualTotalWeight = plateConfig.totalWeight * 2 + equivalentBarWeight

    return {
      percentage: isPercentages ? value : undefined,
      accurateWeight: targetWeight,
      roundedWeight: Math.round(targetWeight),
      closestWeight: actualTotalWeight,
      plates: plateConfig.plates,
    }
  })
}

/**
 * Finds the smallest subset of plate types that can achieve the same
 * closest weight for ALL configurations as using the full plate set.
 *
 * Example: PR=100kg, bar=20kg
 *   70% → 25kg/side, 80% → 30kg/side, 90% → 35kg/side
 *   Independent DP: {25,5} for 70%+80%, {20,15} for 90% → 4 plate types
 *   Cross-optimized: {25,5} for all three → only 2 plate types
 *     70%: [25], 80%: [25,5], 90%: [25,5,5]
 *
 * With only 6 plate types per unit system, we can brute-force all 64 subsets.
 */
function findOptimalPlateSubset(
  targetsPerSide: number[],
  availablePlates: number[]
): number[] {
  const n = availablePlates.length
  if (n === 0) return []

  // Reference: solve each target with ALL available plates
  const refResults = targetsPerSide.map(t => calculatePlatesOptimal(t, availablePlates))

  let bestSubset = availablePlates
  let bestSize = n
  let bestTotalPlates = refResults.reduce((sum, r) => sum + r.plates.length, 0)

  // Try all non-empty subsets (2^6 = 64, very fast)
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset = availablePlates.filter((_, i) => mask & (1 << i))

    // Skip subsets that aren't potentially better
    if (subset.length > bestSize) continue

    let valid = true
    let totalPlates = 0

    for (let j = 0; j < targetsPerSide.length; j++) {
      // Configs with no plates needed are always valid
      if (targetsPerSide[j] <= 0) continue

      const result = calculatePlatesOptimal(targetsPerSide[j], subset)

      // Must achieve the same closest weight as with the full plate set
      if (Math.abs(result.totalWeight - refResults[j].totalWeight) > 0.01) {
        valid = false
        break
      }

      // Reject if this subset causes too many plates for any single config
      // (prevents degenerate solutions like 54x 0.5kg)
      const maxAllowed = refResults[j].plates.length + 2
      if (result.plates.length > maxAllowed) {
        valid = false
        break
      }

      totalPlates += result.plates.length
    }

    if (valid) {
      // Prefer: fewer plate types first, then fewer total plates
      if (subset.length < bestSize ||
          (subset.length === bestSize && totalPlates < bestTotalPlates)) {
        bestSubset = subset
        bestSize = subset.length
        bestTotalPlates = totalPlates
      }
    }
  }

  return bestSubset
}

/**
 * Uses dynamic programming (coin change) to find the minimum number of plates
 * to reach the closest achievable weight to the target.
 *
 * Superior to greedy because plate denominations (e.g. KG: 25, 20, 15, 5, 2.5, 0.5)
 * are NOT a canonical coin system. Greedy gives 35kg = [25, 5, 5] (3 plates),
 * DP gives [20, 15] (2 plates).
 */
function calculatePlatesOptimal(targetWeight: number, availablePlates: number[]) {
  if (targetWeight <= 0) return { plates: [] as number[], totalWeight: 0 }

  // Multiply by 2 to work with integers (smallest plate is 0.5kg)
  const factor = 2
  const target = Math.round(targetWeight * factor)
  const coins = availablePlates.map(p => Math.round(p * factor))
  const maxCoin = Math.max(...coins)

  // DP: dp[w] = minimum plates to achieve weight w
  // Search up to target + maxCoin to find closest achievable weight
  const limit = target + maxCoin
  const dp = new Array(limit + 1).fill(Infinity)
  const usedCoin = new Array(limit + 1).fill(-1)
  dp[0] = 0

  for (let w = 1; w <= limit; w++) {
    for (let i = 0; i < coins.length; i++) {
      if (coins[i] <= w && dp[w - coins[i]] + 1 < dp[w]) {
        dp[w] = dp[w - coins[i]] + 1
        usedCoin[w] = i
      }
    }
  }

  // Find closest reachable weight to target
  let bestW = -1
  for (let delta = 0; delta <= maxCoin; delta++) {
    const candidates: number[] = []
    if (target - delta >= 0 && dp[target - delta] < Infinity) {
      candidates.push(target - delta)
    }
    if (delta > 0 && target + delta <= limit && dp[target + delta] < Infinity) {
      candidates.push(target + delta)
    }

    if (candidates.length > 0) {
      // Among equally close, prefer under-target (safety), then fewer plates
      bestW = candidates.reduce((best, w) => {
        if (best === -1) return w
        if (dp[w] < dp[best]) return w
        if (dp[w] === dp[best] && w <= target && best > target) return w
        return best
      }, -1)
      break
    }
  }

  if (bestW <= 0) return { plates: [] as number[], totalWeight: 0 }

  // Backtrack to find which plates were used
  const resultPlates: number[] = []
  let w = bestW
  while (w > 0 && usedCoin[w] !== -1) {
    resultPlates.push(availablePlates[usedCoin[w]])
    w -= coins[usedCoin[w]]
  }

  resultPlates.sort((a, b) => b - a)

  return {
    plates: resultPlates,
    totalWeight: resultPlates.reduce((sum, p) => sum + p, 0),
  }
}

/**
 * Computes the plate inventory needed across all configurations.
 * For each plate weight, returns the maximum count needed in any single
 * configuration (per side). This tells the user exactly what plates to grab.
 */
export function calculatePlateInventory(configurations: PlateConfiguration[]): PlateInventory {
  const inventory: PlateInventory = {}

  for (const config of configurations) {
    const counts: Record<number, number> = {}
    for (const plate of config.plates) {
      counts[plate] = (counts[plate] || 0) + 1
    }
    for (const [weight, count] of Object.entries(counts)) {
      const w = parseFloat(weight)
      inventory[w] = Math.max(inventory[w] || 0, count)
    }
  }

  return inventory
}
