"use client"

import { useMemo, useState } from "react"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./plate-configurations"
import { Button } from "@/components/ui/button"
import { getProfile, genderToBar, type Profile } from "@/lib/profiles"
import { useLocale } from "@/lib/locale-context"
import { nameColor } from "@/lib/name-color"
import { AlertCircle } from "lucide-react"

interface Props {
  profileIds: string[]
  movement: string
  values: number[]
  units: "KG" | "LB"
  allowRepeatSmallPlates: boolean
  disabledFromUrl: number[]
  customBar?: number
}

export function SideBySide({
  profileIds,
  movement,
  values,
  units,
  allowRepeatSmallPlates,
  disabledFromUrl,
  customBar,
}: Props) {
  const { t } = useLocale()
  const [disabledPlates, setDisabledPlates] = useState<number[]>(disabledFromUrl)

  const people = useMemo(
    () => profileIds.map((id) => getProfile(id)).filter((p): p is Profile => !!p),
    [profileIds]
  )

  const onTogglePlate = (plate: number) =>
    setDisabledPlates((prev) =>
      prev.includes(plate) ? prev.filter((p) => p !== plate) : [...prev, plate]
    )

  const [active, setActive] = useState(0)
  const movementKey = movement.trim().toLowerCase()

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
  const prStr = person.movements[movementKey]?.pr
  const pr = prStr ? parseFloat(prStr) : undefined
  const bar = customBar ?? parseFloat(genderToBar(person.gender, units))

  const configs = pr
    ? calculatePlateConfigurations({
        PR: pr,
        barWeight: bar,
        values,
        units,
        sourceUnits: person.units,
        isPercentages: true,
        allowRepeatSmallPlates,
        disabledPlates,
      })
    : []
  const inventory = calculatePlateInventory(configs)

  return (
    <div className="space-y-4 mt-6">
      <div className="flex flex-wrap gap-1">
        {people.map((p, i) => (
          <Button
            key={p.id}
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
        {pr ? (
          <PlateConfigurations
            configurations={configs}
            baseInventory={inventory}
            disabledPlates={disabledPlates}
            onTogglePlate={onTogglePlate}
            units={units}
            sourceUnits={person.units}
            PR={pr}
            isPercentages={true}
          />
        ) : (
          <div className="text-sm text-muted-foreground flex items-center gap-2 border rounded-lg p-5">
            <AlertCircle className="h-4 w-4" />
            {person.name} · {movement} — {t("prRequired")}
          </div>
        )}
      </div>
    </div>
  )
}
