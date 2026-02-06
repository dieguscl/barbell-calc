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

  // Step 2: Find the smallest set of plate types that works consistently
  const optimalPlates = findOptimalPlateSubset(targetsPerSide, availablePlates)

  // Step 3: Solve each config with the optimal plate subset using heavy-first
  return convertedValues.map((value, i) => {
    let targetWeight: number
    if (isPercentages) {
      if (!convertedPR) throw new Error("PR is required for percentage calculations")
      targetWeight = convertedPR * (value / 100)
    } else {
      targetWeight = value
    }

    const plateConfig = calculatePlatesConsistent(targetsPerSide[i], optimalPlates)
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
 * Finds the smallest subset of plate types that works consistently
 * across ALL configurations, enforcing heavy plate usage.
 *
 * For each candidate subset, it validates using the "heavy-first" strategy:
 * configs MUST use the heaviest plate in the subset when their target allows it.
 * This prevents solutions like [15, 15, 1, 1]=32 when [25, 5, 1, 1]=32 is possible.
 *
 * Subsets that can't efficiently use their heaviest plate (i.e., too many plates
 * needed for the remainder) are rejected.
 */
function findOptimalPlateSubset(
  targetsPerSide: number[],
  availablePlates: number[]
): number[] {
  const n = availablePlates.length
  if (n === 0) return []

  // Reference: solve each target with DP using ALL available plates
  const refResults = targetsPerSide.map(t => calculatePlatesOptimal(t, availablePlates))

  let bestSubset = availablePlates
  let bestSize = n
  let bestTotalPlates = refResults.reduce((sum, r) => sum + r.plates.length, 0)
  let bestSubsetWeight = availablePlates.reduce((sum, p) => sum + p, 0)

  // Try all non-empty subsets (2^9 = 512 for KG, very fast)
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset = availablePlates.filter((_, i) => mask & (1 << i))

    if (subset.length > bestSize) continue

    let valid = true
    let totalPlates = 0
    const maxPlate = Math.max(...subset)

    for (let j = 0; j < targetsPerSide.length; j++) {
      if (targetsPerSide[j] <= 0) continue

      // Solve with heavy-first strategy (enforces heaviest plate usage)
      const result = calculatePlatesConsistent(targetsPerSide[j], subset)

      // Must achieve the same closest weight as with the full plate set
      if (Math.abs(result.totalWeight - refResults[j].totalWeight) > 0.01) {
        valid = false
        break
      }

      // If the closest weight can fit the heaviest plate, it MUST be used.
      // This rejects subsets like {25, 15, 1} where 32/side becomes [15, 15, 1, 1]
      // instead of using 25.
      if (result.totalWeight >= maxPlate - 0.01 && !result.plates.includes(maxPlate)) {
        valid = false
        break
      }

      // Allow at most 1 extra plate per config vs the optimal
      if (result.plates.length > refResults[j].plates.length + 1) {
        valid = false
        break
      }

      totalPlates += result.plates.length
    }

    if (valid) {
      const subsetWeight = subset.reduce((sum, p) => sum + p, 0)

      const isBetter =
        subset.length < bestSize ||
        (subset.length === bestSize && totalPlates < bestTotalPlates) ||
        (subset.length === bestSize && totalPlates === bestTotalPlates && subsetWeight > bestSubsetWeight)

      if (isBetter) {
        bestSubset = subset
        bestSize = subset.length
        bestTotalPlates = totalPlates
        bestSubsetWeight = subsetWeight
      }
    }
  }

  return bestSubset
}

/**
 * Solves a plate configuration using a "heavy-first" strategy:
 * 1. Use as many of the heaviest plate as possible
 * 2. Solve the remainder with DP
 * 3. Accept if the result is within +1 plate of pure DP
 * 4. Otherwise fall back to pure DP
 *
 * This ensures heavy plates are used consistently across configs.
 * E.g., for 32kg/side with {25, 5, 1}: gives [25, 5, 1, 1] instead of [15, 15, 1, 1].
 */
function calculatePlatesConsistent(
  targetWeight: number,
  availablePlates: number[]
): { plates: number[]; totalWeight: number } {
  if (targetWeight <= 0) return { plates: [], totalWeight: 0 }

  // Pure DP solution (minimum plates, for comparison)
  const dpResult = calculatePlatesOptimal(targetWeight, availablePlates)

  const sorted = [...availablePlates].sort((a, b) => b - a)
  const heaviest = sorted[0]

  // If target can't fit the heaviest plate, just use DP
  if (targetWeight < heaviest - 0.001) {
    return dpResult
  }

  // Try using max heavy plates, then max-1, etc.
  const numHeavy = Math.floor((targetWeight + 0.001) / heaviest)

  for (let h = numHeavy; h >= 1; h--) {
    const remainder = targetWeight - h * heaviest

    const remResult =
      remainder > 0.001
        ? calculatePlatesOptimal(remainder, availablePlates)
        : { plates: [] as number[], totalWeight: 0 }

    const totalWeight = h * heaviest + remResult.totalWeight
    const totalPlates = h + remResult.plates.length

    // Check if closest weight matches the DP solution
    if (Math.abs(totalWeight - dpResult.totalWeight) <= 0.01) {
      // Accept if plate count is within +1 of pure DP
      if (totalPlates <= dpResult.plates.length + 1) {
        const plates = [
          ...Array(h).fill(heaviest) as number[],
          ...remResult.plates,
        ].sort((a, b) => b - a)
        return { plates, totalWeight }
      }
    }
  }

  // Fallback to pure DP (e.g., when forcing heavy plate costs too many plates)
  return dpResult
}

/**
 * Pure dynamic programming (coin change) to find the minimum number of plates
 * to reach the closest achievable weight to the target.
 */
function calculatePlatesOptimal(
  targetWeight: number,
  availablePlates: number[]
): { plates: number[]; totalWeight: number } {
  if (targetWeight <= 0) return { plates: [], totalWeight: 0 }

  const factor = 2
  const target = Math.round(targetWeight * factor)
  const coins = availablePlates.map((p) => Math.round(p * factor))
  const maxCoin = Math.max(...coins)

  const limit = target + maxCoin
  const dp = new Array(limit + 1).fill(Infinity)
  const usedCoin = new Array(limit + 1).fill(-1)
  dp[0] = 0

  for (let w = 1; w <= limit; w++) {
    // Iterate coins from heaviest to lightest so ties prefer heavier plates
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
      bestW = candidates.reduce((best, w) => {
        if (best === -1) return w
        if (dp[w] < dp[best]) return w
        if (dp[w] === dp[best] && w <= target && best > target) return w
        return best
      }, -1)
      break
    }
  }

  if (bestW <= 0) return { plates: [], totalWeight: 0 }

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
 * configuration (per side).
 */
export function calculatePlateInventory(
  configurations: PlateConfiguration[]
): PlateInventory {
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
