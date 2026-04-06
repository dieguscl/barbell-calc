"use client"

import { useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { BarbellVisual } from "./barbell-visual"

interface PlateConfiguration {
  percentage?: number
  accurateWeight: number
  roundedWeight: number
  closestWeight: number
  plates: number[]
}

interface BarbellFullscreenModalProps {
  configurations: PlateConfiguration[]
  initialIndex: number
  units: "KG" | "LB"
  sourceUnits: "KG" | "LB"
  isPercentages: boolean
  onClose: () => void
}

export function BarbellFullscreenModal({
  configurations,
  initialIndex,
  units,
  sourceUnits,
  isPercentages,
  onClose,
}: BarbellFullscreenModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [landscape, setLandscape] = useState(false)

  const config = configurations[activeIndex]
  const prev = () => setActiveIndex(i => Math.max(0, i - 1))
  const next = () => setActiveIndex(i => Math.min(configurations.length - 1, i + 1))

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Swipe support
  useEffect(() => {
    let startX = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 50) dx > 0 ? prev() : next()
    }
    document.addEventListener("touchstart", onTouchStart)
    document.addEventListener("touchend", onTouchEnd)
    return () => {
      document.removeEventListener("touchstart", onTouchStart)
      document.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  const label = isPercentages && config.percentage != null
    ? `${config.percentage}%`
    : `#${activeIndex + 1}`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-background border rounded-xl w-full flex flex-col gap-5 p-5 shadow-2xl transition-all duration-300 ${landscape ? "max-w-3xl" : "max-w-md"}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {isPercentages ? "Porcentaje" : "Configuración"}
            </span>
            <h2 className="text-2xl font-bold tabular-nums leading-none mt-0.5">
              {config.closestWeight}{units}
              {isPercentages && config.percentage != null && (
                <span className="text-base font-normal text-muted-foreground ml-2">({label})</span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLandscape(l => !l)}
              title="Cambiar orientación"
              className={`p-2 rounded-lg transition-colors ${landscape ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barbell visual — enlarged */}
        <BarbellVisual plates={config.plates} units={units} height={landscape ? 320 : 180} maxScale={4} />

        {/* Plate summary */}
        {config.plates.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {(() => {
              const counts = config.plates.reduce((acc, p) => {
                acc[p] = (acc[p] || 0) + 1
                return acc
              }, {} as Record<number, number>)
              return Object.entries(counts)
                .map(([w, c]) => ({ weight: parseFloat(w), count: c }))
                .sort((a, b) => b.weight - a.weight)
                .map(({ weight, count }) => (
                  <span
                    key={weight}
                    className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-sm font-medium"
                  >
                    {weight}{units}
                    <span className="text-xs text-muted-foreground">x{count}</span>
                  </span>
                ))
            })()}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={prev}
            disabled={activeIndex === 0}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={26} />
          </button>
          <span className="text-sm text-muted-foreground font-medium tabular-nums">
            {activeIndex + 1} / {configurations.length}
          </span>
          <button
            onClick={next}
            disabled={activeIndex === configurations.length - 1}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={26} />
          </button>
        </div>
      </div>
    </div>
  )
}
