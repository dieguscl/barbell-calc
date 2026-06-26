"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, X, Plus } from "lucide-react"
import { useLocale } from "@/lib/locale-context"

export interface ManualPerson {
  name: string
  weights: string[]
}

interface Props {
  units: "KG" | "LB"
  people: ManualPerson[]
  onChange: (people: ManualPerson[]) => void
}

// Main-UI editor for "calculate for everyone" in manual mode: a person×weight
// grid. Column count is shared, so everyone always has the same number of weights.
export function MultiPersonWeights({ units, people, onChange }: Props) {
  const { t } = useLocale()
  const weightCount = people[0]?.weights.length ?? 1

  const addPerson = () =>
    onChange([...people, { name: "", weights: Array(weightCount).fill("") }])
  const removePerson = (i: number) =>
    onChange(people.length > 1 ? people.filter((_, idx) => idx !== i) : people)
  const addWeightColumn = () =>
    onChange(people.map((p) => ({ ...p, weights: [...p.weights, ""] })))
  const removeLastWeightColumn = () =>
    onChange(
      weightCount > 1 ? people.map((p) => ({ ...p, weights: p.weights.slice(0, -1) })) : people
    )
  const setName = (i: number, val: string) =>
    onChange(people.map((p, idx) => (idx === i ? { ...p, name: val } : p)))
  const setWeight = (i: number, j: number, val: string) =>
    onChange(
      people.map((p, idx) =>
        idx === i ? { ...p, weights: p.weights.map((w, wi) => (wi === j ? val : w)) } : p
      )
    )

  return (
    <div className="space-y-4">
      {people.map((p, i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={`${t("profileName")} #${i + 1}`}
              value={p.name}
              onChange={(e) => setName(i, e.target.value)}
              className="h-9"
            />
            {people.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removePerson(i)}
                aria-label="remove person"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {p.weights.map((w, j) => (
              <div key={j} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{t("weightNum")} {j + 1}</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={w}
                  onChange={(e) => setWeight(i, j, e.target.value)}
                  placeholder={t("weightPlaceholder")}
                  className="h-9 w-24"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addPerson}>
          <Plus className="h-4 w-4 mr-1" />
          {t("addPerson")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addWeightColumn}>
          <Plus className="h-4 w-4 mr-1" />
          {t("addWeight")}
        </Button>
        {weightCount > 1 && (
          <Button type="button" variant="ghost" size="sm" onClick={removeLastWeightColumn}>
            <X className="h-4 w-4 mr-1" />
            {t("weightNum")}
          </Button>
        )}
      </div>
    </div>
  )
}
