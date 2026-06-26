"use client"

import { useMemo, useState } from "react"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./plate-configurations"
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

  const movementKey = movement.trim().toLowerCase()

  return (
    <div className="space-y-10 mt-6">
      {people.map((person, i) => {
        const prStr = person.movements[movementKey]?.pr
        const pr = prStr ? parseFloat(prStr) : undefined
        const bar = customBar ?? parseFloat(genderToBar(person.gender, units))

        if (!pr) {
          return (
            <div key={person.id} className="border rounded-lg p-5">
              <div
                className="text-lg font-semibold capitalize mb-2"
                style={{ color: nameColor(person.name, i) }}
              >
                {person.name}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {person.name} · {movement} — {t("prRequired")}
              </div>
            </div>
          )
        }

        const configs = calculatePlateConfigurations({
          PR: pr,
          barWeight: bar,
          values,
          units,
          sourceUnits: person.units,
          isPercentages: true,
          allowRepeatSmallPlates,
          disabledPlates,
        })
        const inventory = calculatePlateInventory(configs)

        return (
          <div key={person.id} className="space-y-2">
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
              sourceUnits={person.units}
              PR={pr}
              isPercentages={true}
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
