import { calculatePlateConfigurations } from "./lib/calculations"

const SMALL = { KG: 5, LB: 10 } as const

function smallPlateCounts(plates: number[], units: "KG" | "LB") {
  const counts: Record<number, number> = {}
  for (const p of plates) if (p < SMALL[units]) counts[p] = (counts[p] || 0) + 1
  return counts
}

let failures = 0
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`)
  } else {
    failures++
    console.error(`  ✗ ${name} ${detail}`)
  }
}

// Targets chosen to tempt the solver into stacking small plates.
const cases = [
  { units: "KG" as const, barWeight: 20, values: [62, 63.5, 84, 101.5, 143] },
  { units: "LB" as const, barWeight: 45, values: [137.5, 142.5, 155, 200] },
]

console.log("Simple mode: no repeated small plate (<5kg / <10lb)")
for (const c of cases) {
  const configs = calculatePlateConfigurations({
    barWeight: c.barWeight,
    values: c.values,
    units: c.units,
    sourceUnits: c.units,
    isPercentages: false,
    allowRepeatSmallPlates: false,
  })
  configs.forEach((cfg, i) => {
    const counts = smallPlateCounts(cfg.plates, c.units)
    const offenders = Object.entries(counts).filter(([, n]) => n > 1)
    check(
      `${c.units} target ${c.values[i]} -> [${cfg.plates.join(", ")}] (=${cfg.closestWeight})`,
      offenders.length === 0,
      offenders.length ? `repeated small: ${JSON.stringify(offenders)}` : ""
    )
  })
}

console.log("\nAdvanced mode: repeated small plates allowed (regression)")
const adv = calculatePlateConfigurations({
  barWeight: 20,
  values: [63.5],
  units: "KG",
  sourceUnits: "KG",
  isPercentages: false,
  allowRepeatSmallPlates: true,
})
console.log(`  KG 63.5 advanced -> [${adv[0].plates.join(", ")}] (=${adv[0].closestWeight})`)

console.log(`\n${failures === 0 ? "ALL PASSED" : failures + " FAILED"}`)
if (failures > 0) process.exit(1)
