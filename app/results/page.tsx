"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./components/plate-configurations"
import { ResultsTitle } from "./components/results-title"

export default function ResultsPage() {
  const searchParams = useSearchParams()

  const units = (searchParams.get("units") as "KG" | "LB") || "KG"
  const sourceUnits = (searchParams.get("sourceUnits") as "KG" | "LB") || units
  const barWeight = parseFloat(searchParams.get("barWeight") || "20")
  const isPercentages = searchParams.get("isPercentages") === "true"
  const PR = searchParams.get("PR") ? parseFloat(searchParams.get("PR")!) : undefined

  const values = Array.from(searchParams.entries())
    .filter(([key]) => key.startsWith("value"))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => parseFloat(value || "0"))

  const [disabledPlates, setDisabledPlates] = useState<number[]>([])

  // Calculate the "base inventory" using NO disabled plates, so every plate we might ever need is still displayed
  // We use this so a user can click a plate to disable it, and it won't disappear completely.
  const baseInventory = useMemo(() => {
    const configs = calculatePlateConfigurations({
      PR,
      barWeight,
      values,
      units,
      sourceUnits,
      isPercentages,
      disabledPlates: [],
    })
    return calculatePlateInventory(configs)
  }, [PR, barWeight, values.join(","), units, sourceUnits, isPercentages])

  const { configurations } = useMemo(() => {
    const configs = calculatePlateConfigurations({
      PR,
      barWeight,
      values,
      units,
      sourceUnits,
      isPercentages,
      disabledPlates,
    })
    return { configurations: configs }
  }, [PR, barWeight, values.join(","), units, sourceUnits, isPercentages, disabledPlates])

  const combinedInventory = useMemo(() => {
    const currentInventory = calculatePlateInventory(configurations)
    const combined = { ...baseInventory }
    for (const [weightStr, count] of Object.entries(currentInventory)) {
       const weight = parseFloat(weightStr)
       combined[weight] = Math.max(combined[weight] || 0, count)
    }
    // Ensure all disabled plates are shown
    for (const weight of disabledPlates) {
      if (combined[weight] === undefined) {
        combined[weight] = 0
      }
    }
    return combined
  }, [baseInventory, configurations, disabledPlates])

  const editUrl = `/?${searchParams.toString()}`

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <ResultsTitle editUrl={editUrl} />
      <PlateConfigurations
        configurations={configurations}
        baseInventory={combinedInventory}
        disabledPlates={disabledPlates}
        onTogglePlate={(plate) => {
          setDisabledPlates(prev =>
            prev.includes(plate) ? prev.filter(p => p !== plate) : [...prev, plate]
          )
        }}
        units={units}
        sourceUnits={sourceUnits}
        PR={PR}
        isPercentages={isPercentages}
        editUrl={editUrl}
      />
    </main>
  )
}
