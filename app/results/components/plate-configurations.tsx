"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import { BarbellVisual } from "./barbell-visual"
import { PlateInventoryDisplay } from "./plate-inventory-display"
import type { PlateInventory } from "@/lib/calculations"

interface PlateConfiguration {
  percentage?: number
  accurateWeight: number
  roundedWeight: number
  closestWeight: number
  plates: number[]
}

interface Props {
  configurations: PlateConfiguration[]
  inventory: PlateInventory
  units: "KG" | "LB"
  sourceUnits: "KG" | "LB"
  PR?: number
  isPercentages: boolean
}

function PlateSummary({ plates, units }: { plates: number[]; units: "KG" | "LB" }) {
  if (plates.length === 0) return null

  const counts = plates.reduce((acc, plate) => {
    acc[plate] = (acc[plate] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const sorted = Object.entries(counts)
    .map(([weight, count]) => ({ weight: parseFloat(weight), count }))
    .sort((a, b) => b.weight - a.weight)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
      {sorted.map(({ weight, count }) => (
        <span
          key={weight}
          className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md font-medium"
        >
          {weight}{units} <span className="text-xs opacity-60">x{count}</span>
        </span>
      ))}
    </div>
  )
}

export function PlateConfigurations({ configurations, inventory, units, sourceUnits, PR, isPercentages }: Props) {
  const { t } = useLocale()

  return (
    <div className="space-y-6 mt-6">
      {PR && (
        <div className="text-xl font-bold text-center">
          PR: {Math.round(PR)}{sourceUnits}
        </div>
      )}

      <PlateInventoryDisplay inventory={inventory} units={units} />

      {configurations.map((config, index) => (
        <div key={index} className="border rounded-lg p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold">
              {isPercentages
                ? `${t("liftAt")} ${config.percentage}%`
                : `${t("lift")} #${index + 1}`}
            </h3>
            <span className="text-2xl font-bold tabular-nums">
              {config.closestWeight}{units}
            </span>
          </div>

          {(config.accurateWeight !== config.roundedWeight || config.closestWeight !== config.roundedWeight) && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              {config.accurateWeight !== config.roundedWeight && (
                <>
                  <span>{t("roundedWeight")}: {config.roundedWeight}{units}</span>
                  <span>{t("accurate")}: {config.accurateWeight.toFixed(1)}{units}</span>
                </>
              )}
              {config.closestWeight !== config.roundedWeight && (
                <span>{t("closestConfig")}: {config.closestWeight}{units}</span>
              )}
            </div>
          )}

          <BarbellVisual plates={config.plates} units={units} />

          <PlateSummary plates={config.plates} units={units} />
        </div>
      ))}

      <Button asChild className="w-full">
        <Link href="/">
          {t("calculateAnother")}
        </Link>
      </Button>
    </div>
  )
}
