"use client"

import { motion } from "framer-motion"
import { useLocale } from "@/lib/locale-context"
import type { PlateInventory } from "@/lib/calculations"

const PLATE_COLORS: Record<string, Record<number, { bg: string; text: string; border?: string }>> = {
  KG: {
    25:   { bg: "bg-gradient-to-br from-red-500 to-red-600 shadow-md",    text: "text-white", border: "border border-red-400/50" },
    20:   { bg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md",   text: "text-white", border: "border border-blue-400/50" },
    15:   { bg: "bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-md", text: "text-yellow-950", border: "border border-yellow-300/50" },
    10:   { bg: "bg-gradient-to-br from-green-500 to-green-600 shadow-md",  text: "text-white", border: "border border-green-400/50" },
    7.5:  { bg: "bg-gradient-to-br from-pink-500 to-pink-600 shadow-md",   text: "text-white", border: "border border-pink-400/50" },
    5:    { bg: "bg-gradient-to-br from-gray-50 to-gray-200 shadow-md dark:from-zinc-800 dark:to-zinc-900",      text: "text-gray-900 dark:text-gray-100", border: "border border-gray-300 dark:border-zinc-700" },
    2.5:  { bg: "bg-gradient-to-br from-red-400 to-red-500 shadow-md",    text: "text-white", border: "border border-red-300/50" },
    1.25: { bg: "bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-md", text: "text-yellow-950", border: "border border-yellow-200/50" },
    1:    { bg: "bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-md",   text: "text-white", border: "border border-zinc-400/50" },
    0.5:  { bg: "bg-gradient-to-br from-green-400 to-green-500 shadow-md",  text: "text-white", border: "border border-green-300/50" },
  },
  LB: {
    45:  { bg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md",   text: "text-white", border: "border border-blue-400/50" },
    35:  { bg: "bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-md", text: "text-yellow-950", border: "border border-yellow-300/50" },
    25:  { bg: "bg-gradient-to-br from-green-500 to-green-600 shadow-md",  text: "text-white", border: "border border-green-400/50" },
    10:  { bg: "bg-gradient-to-br from-gray-50 to-gray-200 shadow-md dark:from-zinc-800 dark:to-zinc-900",      text: "text-gray-900 dark:text-gray-100", border: "border border-gray-300 dark:border-zinc-700" },
    5:   { bg: "bg-gradient-to-br from-red-500 to-red-600 shadow-md",    text: "text-white", border: "border border-red-400/50" },
    2.5: { bg: "bg-gradient-to-br from-zinc-400 to-zinc-500 shadow-md",   text: "text-zinc-950", border: "border border-zinc-300/50" },
  },
}

function getPlateStyle(weight: number, units: "KG" | "LB") {
  return PLATE_COLORS[units][weight] ?? { bg: "bg-zinc-500", text: "text-white" }
}

interface Props {
  inventory: PlateInventory
  disabledPlates: number[]
  onTogglePlate: (weight: number) => void
  units: "KG" | "LB"
}

export function PlateInventoryDisplay({ inventory, disabledPlates, onTogglePlate, units }: Props) {
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
          const isDisabled = disabledPlates.includes(weight)

          return (
            <motion.button
              key={weight}
              onClick={() => onTogglePlate(weight)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`
                relative overflow-hidden
                ${style.bg} ${style.text} ${style.border ?? ""}
                rounded-lg px-3 py-2 flex items-center gap-2
                font-semibold text-sm transition-opacity duration-300
                ${isDisabled ? "opacity-40" : "opacity-100"}
              `}
            >
              <span>{weight}{units}</span>
              <span className="opacity-70 text-xs font-normal">x{count * 2}</span>

              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center p-1 pointer-events-none">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full text-red-500 drop-shadow-md"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      d="M18 6L6 18M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
