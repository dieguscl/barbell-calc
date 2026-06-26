"use client"

import { useState } from "react"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./plate-configurations"
import { Button } from "@/components/ui/button"
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
  const [active, setActive] = useState(0)
  const [disabledPlates, setDisabledPlates] = useState<number[]>(disabledFromUrl)

  const onTogglePlate = (plate: number) =>
    setDisabledPlates((prev) =>
      prev.includes(plate) ? prev.filter((p) => p !== plate) : [...prev, plate]
    )

  if (people.length === 0) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-6">
        <AlertCircle className="h-4 w-4" />
        {t("noProfiles")}
      </div>
    )
  }

  const idx = Math.min(active, people.length - 1)
  const person = people[idx]
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
    <div className="space-y-4 mt-6">
      <div className="flex flex-wrap gap-1">
        {people.map((p, i) => (
          <Button
            key={i}
            type="button"
            size="sm"
            variant={i === idx ? "default" : "outline"}
            onClick={() => setActive(i)}
          >
            <span
              className="inline-block h-2 w-2 rounded-full mr-1.5 shrink-0"
              style={{ backgroundColor: nameColor(p.name, i) }}
            />
            {p.name}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold capitalize" style={{ color: nameColor(person.name, idx) }}>
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
    </div>
  )
}
