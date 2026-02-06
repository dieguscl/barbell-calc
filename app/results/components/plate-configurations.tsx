"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useLocale } from "@/lib/locale-context"

interface PlateConfiguration {
  percentage?: number
  accurateWeight: number
  roundedWeight: number
  closestWeight: number
  plates: number[]
}

interface Props {
  configurations: PlateConfiguration[]
  units: "KG" | "LB"
  sourceUnits: "KG" | "LB"
  PR?: number
  isPercentages: boolean
}

export function PlateConfigurations({ configurations, units, sourceUnits, PR, isPercentages }: Props) {
  const { t } = useLocale()

  return (
    <div className="space-y-8">
      {PR && (
        <div className="text-xl font-bold">
          PR: {Math.round(PR)}{sourceUnits}
        </div>
      )}

      {configurations.map((config, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold">
            {isPercentages 
              ? `${t("liftAt")} ${config.percentage}%`
              : `${t("lift")} #${index + 1}`}
          </h3>
          
          <div className="text-sm text-muted-foreground">
            {config.accurateWeight !== config.roundedWeight ? (
              <p>
                {t("roundedWeight")}: {config.roundedWeight}{units} | 
                {t("accurate")}: {config.accurateWeight.toFixed(1)}{units}
                {config.closestWeight !== config.roundedWeight && 
                  ` | ${t("closestConfig")}: ${config.closestWeight}${units}`}
              </p>
            ) : (
              <p>
                {t("weight")}: {config.roundedWeight}{units}
                {config.closestWeight !== config.roundedWeight && 
                  ` | ${t("closestConfig")}: ${config.closestWeight}${units}`}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-lg">
            {config.plates.map((plate, i) => (
              <span key={i}>{plate}</span>
            ))}
            <span className="mx-4">|</span>
            {config.plates.slice().reverse().map((plate, i) => (
              <span key={i}>{plate}</span>
            ))}
          </div>
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
