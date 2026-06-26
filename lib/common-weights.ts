// Customizable "common starting weights" shown in manual mode when no weight
// is entered. Stored per units + gender (inferred from the selected bar) so the
// suggestions stay relevant. Defaults below are used until the user edits them.

export type CommonWeightsStore = Record<string, number[]>

export const DEFAULT_COMMON_WEIGHTS: CommonWeightsStore = {
  "KG-M": [50, 60, 70, 100],
  "KG-F": [45, 55, 65, 75],
  "LB-M": [115, 135, 155, 225],
  "LB-F": [65, 85, 105, 125],
}

const STORAGE_KEY = "barbell-calc-common-weights"

export function weightsKey(units: "KG" | "LB", isWomen: boolean): string {
  return `${units}-${isWomen ? "F" : "M"}`
}

export function loadCommonWeights(): CommonWeightsStore {
  if (typeof window === "undefined") return { ...DEFAULT_COMMON_WEIGHTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_COMMON_WEIGHTS }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_COMMON_WEIGHTS }
    // Merge so any missing combo falls back to its default.
    const merged: CommonWeightsStore = { ...DEFAULT_COMMON_WEIGHTS }
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) merged[k] = v.filter((n) => typeof n === "number" && !isNaN(n))
    }
    return merged
  } catch {
    return { ...DEFAULT_COMMON_WEIGHTS }
  }
}

export function saveCommonWeights(store: CommonWeightsStore): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// --- Common percentages (single list, unit/gender agnostic) ------------------

const PCT_KEY = "barbell-calc-common-percentages"
export const DEFAULT_COMMON_PERCENTAGES = [70, 75, 80, 85, 90]

export function loadCommonPercentages(): number[] {
  if (typeof window === "undefined") return [...DEFAULT_COMMON_PERCENTAGES]
  try {
    const raw = localStorage.getItem(PCT_KEY)
    if (!raw) return [...DEFAULT_COMMON_PERCENTAGES]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_COMMON_PERCENTAGES]
    return parsed.filter((n) => typeof n === "number" && !isNaN(n))
  } catch {
    return [...DEFAULT_COMMON_PERCENTAGES]
  }
}

export function saveCommonPercentages(list: number[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PCT_KEY, JSON.stringify(list))
}
