import { calculatePlateConfigurations, calculatePlateInventory } from './lib/calculations';

const plates = [45, 35, 25, 10, 5, 2.5];

function calculatePlatesOptimalNew(
  targetWeight: number,
  availablePlates: number[],
  units: "KG" | "LB"
): { plates: number[]; totalWeight: number } {
  if (targetWeight <= 0) return { plates: [], totalWeight: 0 }

  const factor = units === "KG" ? 2 : 2 // LB minimum plate is 2.5, KG minimum is 0.5. 2.5 * 2 = 5 (integer). 0.5 * 2 = 1.
  const target = Math.round(targetWeight * factor)
  const coins = availablePlates.map((p) => Math.round(p * factor))
  const maxCoin = Math.max(...coins)

  const limit = target + maxCoin
  const dp = new Array(limit + 1).fill(Infinity)
  const usedCoin = new Array(limit + 1).fill(-1)
  dp[0] = 0

  for (let w = 1; w <= limit; w++) {
    for (let i = 0; i < coins.length; i++) {
      const p = availablePlates[i];
      // Massive penalty for light plates so DP will always prefer a heavy plate 
      // over multiple light plates.
      const threshold = units === "KG" ? 10 : 25;
      const cost = p < threshold ? 1000 : 1; 
      
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

console.log(calculatePlatesOptimalNew(25, plates, "LB")); 
console.log(calculatePlatesOptimalNew(20, plates, "LB")); 
console.log(calculatePlatesOptimalNew(30, plates, "LB"));

