"use client"

import { useState, useMemo } from "react"
import { TypographyH1 } from "@/components/ui/typography-h1"
import { WeightCalculatorForm, getEquivalentBarWeight } from "./components/weight-calculator-form"
import type { CalculationResults } from "./components/weight-calculator-form"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./results/components/plate-configurations"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function Home() {
  const { t } = useLocale()
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [disabledPlates, setDisabledPlates] = useState<number[]>([])

  // Recalculate configurations when disabled plates change on the home view
  const activeConfigurations = useMemo(() => {
    if (!results) return []
    return calculatePlateConfigurations({
      PR: results.PR,
      barWeight: parseFloat(getEquivalentBarWeight("20", results.units)), // Not ideal strictly but sufficient since bar isn't returned
      values: results.configurations.map(c => c.percentage || c.accurateWeight),
      units: results.units,
      sourceUnits: results.sourceUnits,
      isPercentages: results.isPercentages,
      disabledPlates
    })
  }, [results, disabledPlates])

  const combinedInventory = useMemo(() => {
    if (!results) return {}
    const currentInventory = calculatePlateInventory(activeConfigurations)
    const combined = { ...results.baseInventory }
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
  }, [results, activeConfigurations, disabledPlates])

  return (
    <main className="pt-14 container mx-auto p-4 flex flex-col items-center gap-12 max-w-2xl">
      {results ? (
        <>
          <div className="flex items-center gap-3 w-full">
            <Button variant="ghost" size="icon" onClick={() => setResults(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <TypographyH1>{t("results")}</TypographyH1>
          </div>
          <PlateConfigurations
            configurations={activeConfigurations}
            baseInventory={combinedInventory}
            disabledPlates={disabledPlates}
            onTogglePlate={(plate) => {
              setDisabledPlates(prev =>
                prev.includes(plate) ? prev.filter(p => p !== plate) : [...prev, plate]
              )
            }}
            units={results.units}
            sourceUnits={results.sourceUnits}
            PR={results.PR}
            isPercentages={results.isPercentages}
            onEdit={() => {
              setResults(null)
              setDisabledPlates([])
            }}
          />
        </>
      ) : (
        <>
          <div className="text-center w-full mb-2">
            <h1 className="scroll-m-20 text-5xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-br from-primary via-emerald-500 to-green-600 dark:from-primary dark:via-emerald-400 dark:to-green-500 bg-clip-text text-transparent drop-shadow-sm pb-2">
              {t("appTitle")}
            </h1>
          </div>
          <WeightCalculatorForm onCalculate={setResults} />
        </>
      )}
    </main>
  )
}
