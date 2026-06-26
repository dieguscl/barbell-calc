export interface PlateConfiguration {
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
  disabledPlates?: number[]
  /**
   * When false (default, "simple mode"), any plate strictly below
   * SMALL_PLATE_THRESHOLD (5kg / 10lb) may appear at most once per side.
   * When true ("advanced"), small plates can repeat freely (legacy behavior).
   */
  allowRepeatSmallPlates?: boolean
  /** Override the default plate set (advanced custom inventory). */
  availablePlatesOverride?: number[]
}

/** A plate strictly below this (per unit) is a "small" plate. */
const SMALL_PLATE_THRESHOLD = { KG: 5, LB: 10 } as const

export interface PlateInventory {
  [weight: number]: number
}

export const AVAILABLE_PLATES = {
  KG: [25, 20, 15, 10, 7.5, 5, 1.5, 1, 0.5],
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
  disabledPlates = [],
  allowRepeatSmallPlates = false,
  availablePlatesOverride,
}: CalculationParams): PlateConfiguration[] {
  const basePlateSet = availablePlatesOverride && availablePlatesOverride.length > 0
    ? [...availablePlatesOverride].sort((a, b) => b - a)
    : AVAILABLE_PLATES[units]
  const availablePlates = basePlateSet.filter(
    (plate) => !disabledPlates.includes(plate)
  )

  const shouldConvert = sourceUnits !== units
  const conversionRate = shouldConvert
    ? (sourceUnits === "KG" ? CONVERSION_RATES.KG_TO_LB : CONVERSION_RATES.LB_TO_KG)
    : 1

  const equivalentBarWeight = shouldConvert
    ? EQUIVALENT_BARBELLS[units]?.[barWeight.toString() as keyof typeof EQUIVALENT_BARBELLS[typeof units]] || barWeight
    : barWeight

  const convertedPR = PR ? PR * conversionRate : undefined
  const convertedValues = isPercentages
    ? values
    : values.map(v => v * conversionRate)

  const targetsPerSide = convertedValues.map(value => {
    if (isPercentages) {
      if (!convertedPR) throw new Error("PR is required for percentage calculations")
      return (convertedPR * (value / 100) - equivalentBarWeight) / 2
    }
    return (value - equivalentBarWeight) / 2
  })

  // Sort targets so we can build plates progressively from lightest to heaviest
  const sortedIndices = targetsPerSide
    .map((target, index) => ({ target, index }))
    .sort((a, b) => a.target - b.target)

  const results: PlateConfiguration[] = new Array(convertedValues.length)
  let currentBasePlates: number[] = []

  for (const { target, index } of sortedIndices) {
    const value = convertedValues[index]
    let targetWeight: number
    if (isPercentages) {
      if (!convertedPR) throw new Error("PR is required for percentage calculations")
      targetWeight = convertedPR * (value / 100)
    } else {
      targetWeight = value
    }

    if (target <= 0) {
      results[index] = {
        percentage: isPercentages ? values[index] : undefined,
        accurateWeight: targetWeight,
        roundedWeight: Math.round(targetWeight),
        closestWeight: equivalentBarWeight,
        plates: [],
      }
      currentBasePlates = []
      continue
    }

    // Try to reuse as many base plates as possible without exceeding the target
    let basePlates = [...currentBasePlates]

    // Before we even try to fit them, we should proactively drop plates that are 
    // too small to be worth carrying over. The carryOverThreshold logic at the end 
    // helps, but we also shouldn't hold onto small plates if they block a larger, 
    // more efficient plate from being used.
    // We already dropped them at the end of the last loop iter, but just in case:
    const carryOverThreshold = units === "KG" ? 10 : 25;
    basePlates = basePlates.filter(p => p >= carryOverThreshold);

    let baseSum = basePlates.reduce((sum, p) => sum + p, 0)

    // If the base plates sum exceeds the target, start removing the smallest plates
    while (baseSum > target + 0.001 && basePlates.length > 0) {
      // basePlates is sorted descending, so the smallest is at the end
      const smallest = basePlates.pop()!
      baseSum -= smallest
    }

    const remainder = target - baseSum
    let newPlates: number[] = []
    let finalTotalSideWeight = baseSum

    if (remainder > 0.001) {
      const remResult = calculatePlatesOptimal(remainder, availablePlates, units, allowRepeatSmallPlates)
      newPlates = remResult.plates
      finalTotalSideWeight += remResult.totalWeight
    }

    const finalPlates = [...basePlates, ...newPlates].sort((a, b) => b - a)

    // Update the base plates for the next, heavier target.
    // We only carry over larger plates, allowing smaller ones to be optimized for fewer disks.
    currentBasePlates = finalPlates.filter(p => p >= carryOverThreshold)

    // Calculate the actual total weight logic with barbell
    const actualTotalWeight = finalTotalSideWeight * 2 + equivalentBarWeight

    results[index] = {
      percentage: isPercentages ? values[index] : undefined,
      accurateWeight: targetWeight,
      roundedWeight: Math.round(targetWeight),
      closestWeight: actualTotalWeight,
      plates: finalPlates,
    }
  }

  return results
}


/**
 * Find the closest achievable side weight to the target.
 *
 * In simple mode (allowRepeatSmallPlates = false) every plate strictly below
 * SMALL_PLATE_THRESHOLD may be used at most once. Since the small-plate set is
 * tiny (≤3 in KG, ≤2 in LB) we enumerate every subset of small plates and solve
 * the remainder with the unbounded large-plate DP, then keep the best result.
 *
 * In advanced mode every plate is unbounded — identical to the legacy behavior.
 */
function calculatePlatesOptimal(
  targetWeight: number,
  availablePlates: number[],
  units: "KG" | "LB",
  allowRepeatSmallPlates: boolean = false
): { plates: number[]; totalWeight: number } {
  if (targetWeight <= 0) return { plates: [], totalWeight: 0 }

  if (allowRepeatSmallPlates) {
    return unboundedClosest(targetWeight, availablePlates, units)
  }

  const threshold = SMALL_PLATE_THRESHOLD[units]
  const smallPlates = availablePlates.filter((p) => p < threshold)
  const largePlates = availablePlates.filter((p) => p >= threshold)

  // No small plates to constrain → plain unbounded solve.
  if (smallPlates.length === 0) {
    return unboundedClosest(targetWeight, availablePlates, units)
  }

  let best: { plates: number[]; totalWeight: number } | null = null
  const subsetCount = 1 << smallPlates.length

  for (let mask = 0; mask < subsetCount; mask++) {
    const chosenSmall: number[] = []
    let smallSum = 0
    for (let i = 0; i < smallPlates.length; i++) {
      if (mask & (1 << i)) {
        chosenSmall.push(smallPlates[i])
        smallSum += smallPlates[i]
      }
    }

    const remainder = targetWeight - smallSum
    const large = remainder > 0.001
      ? unboundedClosest(remainder, largePlates, units)
      : { plates: [] as number[], totalWeight: 0 }

    const plates = [...chosenSmall, ...large.plates].sort((a, b) => b - a)
    const totalWeight = smallSum + large.totalWeight

    if (best === null) {
      best = { plates, totalWeight }
      continue
    }

    const diff = Math.abs(totalWeight - targetWeight)
    const bestDiff = Math.abs(best.totalWeight - targetWeight)
    // Primary: closest to target. Secondary: fewest plates.
    if (diff < bestDiff - 0.001 ||
        (Math.abs(diff - bestDiff) <= 0.001 && plates.length < best.plates.length)) {
      best = { plates, totalWeight }
    }
  }

  return best ?? { plates: [], totalWeight: 0 }
}

/**
 * Pure dynamic programming (coin change) to find the minimum number of plates
 * to reach the closest achievable weight to the target. Every plate is
 * unbounded (may repeat any number of times).
 */
function unboundedClosest(
  targetWeight: number,
  availablePlates: number[],
  units: "KG" | "LB"
): { plates: number[]; totalWeight: number } {
  if (targetWeight <= 0 || availablePlates.length === 0) {
    return { plates: [], totalWeight: 0 }
  }

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
      const p = availablePlates[i]
      const threshold = units === "KG" ? 10 : 25
      const cost = p < threshold ? 1000 : 1

      if (coins[i] <= w && dp[w - coins[i]] + cost < dp[w]) {
        dp[w] = dp[w - coins[i]] + cost
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
