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
        for (let i = 0; i < coins.length; i++) {
            if (coins[i] <= w && dp[w - coins[i]] + 1 < dp[w]) {
                dp[w] = dp[w - coins[i]] + 1
                usedCoin[w] = i
            }
        }
    }

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

        let basePlates = [...currentBasePlates]
        let baseSum = basePlates.reduce((sum, p) => sum + p, 0)

        while (baseSum > target + 0.001 && basePlates.length > 0) {
            const smallest = basePlates.pop()!
            baseSum -= smallest
        }

        const remainder = target - baseSum
        let newPlates: number[] = []
        let finalTotalSideWeight = baseSum

        if (remainder > 0.001) {
            const remResult = calculatePlatesOptimal(remainder, availablePlates)
            newPlates = remResult.plates
            finalTotalSideWeight += remResult.totalWeight
        }

        const finalPlates = [...basePlates, ...newPlates].sort((a, b) => b - a)
        currentBasePlates = [...finalPlates]

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


// test cases
const testCases = [
    {
        name: "Standard KG sequence",
        params: { barWeight: 20, values: [60, 100, 140, 180], units: "KG" as const, sourceUnits: "KG" as const, isPercentages: false }
    },
    {
        name: "Percentages of PR (100kg)",
        params: { PR: 100, barWeight: 20, values: [50, 75, 90, 100], units: "KG" as const, sourceUnits: "KG" as const, isPercentages: true }
    },
    {
        name: "Standard LB sequence",
        params: { barWeight: 45, values: [135, 225, 315, 405], units: "LB" as const, sourceUnits: "LB" as const, isPercentages: false }
    },
    {
        name: "Unit Conversion: Source LB, Target KG",
        params: { barWeight: 20, values: [135, 225, 315], units: "KG" as const, sourceUnits: "LB" as const, isPercentages: false }
    },
    {
        name: "Unit Conversion: Source KG, Target LB",
        params: { barWeight: 45, values: [60, 100, 140], units: "LB" as const, sourceUnits: "KG" as const, isPercentages: false }
    },
    {
        name: "Inexact Weights (Requires math to find closest match)",
        params: { barWeight: 20, values: [61.25, 102.3, 144.9], units: "KG" as const, sourceUnits: "KG" as const, isPercentages: false }
    },
    {
        name: "Weights equal or below bar weight",
        params: { barWeight: 20, values: [10, 15, 20], units: "KG" as const, sourceUnits: "KG" as const, isPercentages: false }
    }
];

console.log("Running comprehensive test cases for calculatePlateConfigurations...\n");

testCases.forEach((tc, i) => {
    console.log(`\n======================================================`);
    console.log(`Test Case ${i + 1}: ${tc.name}`);
    console.log(`======================================================`);

    try {
        const configs = calculatePlateConfigurations(tc.params);

        configs.forEach((config, idx) => {
            const val = tc.params.values[idx];
            const targetStr = tc.params.isPercentages ? `${val}% of PR ${tc.params.PR}` : `${val}`;
            console.log(`  Target: ${targetStr}`);
            console.log(`    Closest Formed: ${config.closestWeight} (Accurate: ${config.accurateWeight.toFixed(2)})`);
            console.log(`    Plates per side: [${config.plates.join(', ')}]`);
        });
    } catch (err: any) {
        console.error(`  Error: ${err.message}`);
    }
});

