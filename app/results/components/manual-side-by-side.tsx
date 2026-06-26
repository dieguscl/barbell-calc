"use client"

import { useState } from "react"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./plate-configurations"
import { useLocale } from "@/lib/locale-context"
import { nameColor } from "@/lib/name-color"
import { AlertCircle } from "lucide-react"

interface ManualPerson {
  name: string
  weights: number[]
}

interface Props {
  people: ManualPerson[]
  units: "KG" | "LB"
  bar: number
  allowRepeatSmallPlates: boolean
  disabledFromUrl: number[]
}

export function ManualSideBySide({
  people,
  units,
  bar,
  allowRepeatSmallPlates,
  disabledFromUrl,
}: Props) {
  const { t } = useLocale()
  const [disabledPlates, setDisabledPlates] = useState<number[]>(disabledFromUrl)

  const onTogglePlate = (plate: number) =>
    setDisabledPlates((prev) =>
      prev.includes(plate) ? prev.filter((p) => p !== plate) : [...prev, plate]
    )

  return (
    <div className="space-y-10 mt-6">
      {people.map((person, i) => {
        const configs = calculatePlateConfigurations({
          barWeight: bar,
          values: person.weights,
          units,
          sourceUnits: units,
          isPercentages: false,
          allowRepeatSmallPlates,
          disabledPlates,
        })
        const inventory = calculatePlateInventory(configs)
        return (
          <div key={i} className="space-y-2">
            <div
              className="text-2xl font-bold capitalize"
              style={{ color: nameColor(person.name, i) }}
            >
              {person.name}
            </div>
            <PlateConfigurations
              configurations={configs}
              baseInventory={inventory}
              disabledPlates={disabledPlates}
              onTogglePlate={onTogglePlate}
              units={units}
              sourceUnits={units}
              isPercentages={false}
            />
          </div>
        )
      })}

      {people.length === 0 && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {t("noProfiles")}
        </div>
      )}
    </div>
  )
}
