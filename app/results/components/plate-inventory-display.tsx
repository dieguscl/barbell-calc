"use client"

import { useLocale } from "@/lib/locale-context"
import type { PlateInventory } from "@/lib/calculations"

const PLATE_COLORS: Record<string, Record<number, { bg: string; text: string; border?: string }>> = {
  KG: {
    25:   { bg: "bg-red-600",    text: "text-white" },
    20:   { bg: "bg-blue-600",   text: "text-white" },
    15:   { bg: "bg-yellow-400", text: "text-yellow-900" },
    10:   { bg: "bg-green-600",  text: "text-white" },
    7.5:  { bg: "bg-pink-500",   text: "text-white" },
    5:    { bg: "bg-white",      text: "text-gray-800", border: "border border-gray-300" },
    2.5:  { bg: "bg-red-400",    text: "text-white" },
    1.25: { bg: "bg-yellow-300", text: "text-yellow-900" },
    1:    { bg: "bg-zinc-600",   text: "text-white" },
    0.5:  { bg: "bg-green-500",  text: "text-white" },
  },
  LB: {
    45:  { bg: "bg-blue-600",   text: "text-white" },
    35:  { bg: "bg-yellow-400", text: "text-yellow-900" },
    25:  { bg: "bg-green-600",  text: "text-white" },
    10:  { bg: "bg-white",      text: "text-gray-800", border: "border border-gray-300" },
    5:   { bg: "bg-red-500",    text: "text-white" },
    2.5: { bg: "bg-zinc-400",   text: "text-zinc-900" },
  },
}

function getPlateStyle(weight: number, units: "KG" | "LB") {
  return PLATE_COLORS[units][weight] ?? { bg: "bg-zinc-500", text: "text-white" }
}

interface Props {
  inventory: PlateInventory
  units: "KG" | "LB"
}

export function PlateInventoryDisplay({ inventory, units }: Props) {
  const { t } = useLocale()

  const entries = Object.entries(inventory)
    .map(([weight, count]) => ({ weight: parseFloat(weight), count }))
    .sort((a, b) => b.weight - a.weight)

  const totalPerSide = entries.reduce((sum, e) => sum + e.count, 0)
  const totalDiscs = totalPerSide * 2

  if (entries.length === 0) return null

  return (
    <div className="border rounded-lg p-5 bg-card space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{t("grabThesePlates")}</h2>
        <span className="text-sm text-muted-foreground">
          {totalDiscs} {t("discsTotal")} ({totalPerSide} {t("perSide")})
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {entries.map(({ weight, count }) => {
          const style = getPlateStyle(weight, units)
          return (
            <div
              key={weight}
              className={`
                ${style.bg} ${style.text} ${style.border ?? ""}
                rounded-lg px-3 py-2 flex items-center gap-2
                font-semibold text-sm
              `}
            >
              <span>{weight}{units}</span>
              <span className="opacity-70 text-xs font-normal">x{count * 2}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
