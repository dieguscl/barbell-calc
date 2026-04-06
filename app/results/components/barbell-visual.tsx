"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface BarbellVisualProps {
  plates: number[]
  units: "KG" | "LB"
  height?: number
  maxScale?: number
}

const PLATE_COLORS: Record<string, Record<number, { bg: string; text: string; border?: string }>> = {
  KG: {
    25: { bg: "bg-gradient-to-br from-red-500 to-red-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.5)]", text: "text-white", border: "border border-red-400/50" },
    20: { bg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.5)]", text: "text-white", border: "border border-blue-400/50" },
    15: { bg: "bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.4)]", text: "text-yellow-950", border: "border border-yellow-300/50" },
    10: { bg: "bg-gradient-to-br from-green-500 to-green-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.5)]", text: "text-white", border: "border border-green-400/50" },
    7.5: { bg: "bg-gradient-to-br from-pink-500 to-pink-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.5)]", text: "text-white", border: "border border-pink-400/50" },
    5: { bg: "bg-gradient-to-br from-gray-50 to-gray-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),_0_2px_4px_rgba(0,0,0,0.3)] dark:from-zinc-800 dark:to-zinc-900 border dark:border-zinc-700", text: "text-gray-900 dark:text-gray-100", border: "border border-gray-300 dark:border-zinc-700" },
    2.5: { bg: "bg-gradient-to-br from-red-400 to-red-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_1px_2px_rgba(0,0,0,0.4)]", text: "text-white", border: "border border-red-300/50" },
    1.25: { bg: "bg-gradient-to-br from-yellow-300 to-yellow-400 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),_0_1px_2px_rgba(0,0,0,0.3)]", text: "text-yellow-950", border: "border border-yellow-200/50" },
    1: { bg: "bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_0_1px_2px_rgba(0,0,0,0.4)]", text: "text-white", border: "border border-zinc-400/50" },
    0.5: { bg: "bg-gradient-to-br from-green-400 to-green-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_1px_2px_rgba(0,0,0,0.4)]", text: "text-white", border: "border border-green-300/50" },
  },
  LB: {
    45: { bg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.5)]", text: "text-white", border: "border border-blue-400/50" },
    35: { bg: "bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.4)]", text: "text-yellow-950", border: "border border-yellow-300/50" },
    25: { bg: "bg-gradient-to-br from-green-500 to-green-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_4px_rgba(0,0,0,0.5)]", text: "text-white", border: "border border-green-400/50" },
    10: { bg: "bg-gradient-to-br from-gray-50 to-gray-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),_0_2px_4px_rgba(0,0,0,0.3)] dark:from-zinc-800 dark:to-zinc-900 border dark:border-zinc-700", text: "text-gray-900 dark:text-gray-100", border: "border border-gray-300 dark:border-zinc-700" },
    5: { bg: "bg-gradient-to-br from-red-500 to-red-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_1px_2px_rgba(0,0,0,0.4)]", text: "text-white", border: "border border-red-400/50" },
    2.5: { bg: "bg-gradient-to-br from-zinc-400 to-zinc-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),_0_1px_2px_rgba(0,0,0,0.3)]", text: "text-zinc-950", border: "border border-zinc-300/50" },
  },
}

function getPlateHeight(weight: number, units: "KG" | "LB"): number {
  if (units === "KG") {
    if (weight >= 25) return 100
    if (weight >= 20) return 92
    if (weight >= 15) return 84
    if (weight >= 10) return 76
    if (weight >= 7.5) return 68
    if (weight >= 5) return 60
    if (weight >= 2.5) return 44
    if (weight >= 1) return 36
    return 30
  }
  // LB
  if (weight >= 45) return 100
  if (weight >= 35) return 92
  if (weight >= 25) return 84
  if (weight >= 10) return 60
  if (weight >= 5) return 44
  return 32
}

function getPlateWidth(weight: number, units: "KG" | "LB"): number {
  if (units === "KG") {
    if (weight >= 15) return 28
    if (weight >= 5) return 20
    return 14
  }
  if (weight >= 25) return 28
  if (weight >= 10) return 20
  return 14
}

function getPlateStyle(weight: number, units: "KG" | "LB") {
  return PLATE_COLORS[units][weight] ?? { bg: "bg-zinc-500", text: "text-white" }
}

function Plate({ weight, units }: { weight: number; units: "KG" | "LB" }) {
  const height = getPlateHeight(weight, units)
  const width = getPlateWidth(weight, units)
  const style = getPlateStyle(weight, units)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -20 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative rounded-sm ${style.bg} ${style.border ?? ""} flex items-center justify-center shrink-0`}
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      <span
        className={`text-[9px] font-bold ${style.text} leading-none`}
        style={{ writingMode: height > 40 ? "vertical-rl" : undefined, textOrientation: "mixed" }}
      >
        {weight}
      </span>
    </motion.div>
  )
}

export function BarbellVisual({ plates, units, height = 140, maxScale = 1 }: BarbellVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !contentRef.current) return

      const containerWidth = containerRef.current.clientWidth
      // Exact height of the container
      const containerHeight = containerRef.current.clientHeight
      const contentWidth = contentRef.current.scrollWidth

      // The maximum visible disc height is 100px.
      const contentHeight = 100

      // Only pad width slightly to avoid side edges touching
      const availableWidth = containerWidth - 16
      const availableHeight = containerHeight

      let newScale = 1

      if (contentWidth > 0 && contentHeight > 0) {
        newScale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight)
        newScale = Math.min(newScale, maxScale)
      }

      setScale(newScale)
    }

    updateScale()

    window.addEventListener("resize", updateScale)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateScale)
      if (containerRef.current) {
        observer.observe(containerRef.current)
      }
      if (contentRef.current) {
        observer.observe(contentRef.current)
      }
    }

    return () => {
      window.removeEventListener("resize", updateScale)
      if (observer) observer.disconnect()
    }
  }, [plates, units, height, maxScale])

  if (plates.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="h-3 w-48 bg-zinc-400 rounded-full" />
      </div>
    )
  }

  // Generate stable keys for plates based on weight and index, so they animate smoothly
  const platesWithKeys = useMemo(() => {
    const counts: Record<number, number> = {}
    return plates.map(weight => {
      counts[weight] = (counts[weight] || 0) + 1
      return { weight, key: `plate-${weight}-${counts[weight]}` }
    })
  }, [plates])

  // Left side: reversed (smallest on outside, largest near center)
  const leftPlates = [...platesWithKeys].reverse()
  // Right side: largest near center, smallest on outside
  const rightPlates = [...platesWithKeys]

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center overflow-hidden"
      style={{ height }}
    >
      <div
        ref={contentRef}
        className="w-max flex items-center justify-center origin-center transition-transform duration-200 shrink-0"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Left bar end (sleeve end) */}
        <div className="w-1.5 h-5 bg-zinc-500 rounded-l-full shrink-0" />
        {/* Left sleeve */}
        <div className="w-4 h-2.5 bg-zinc-400 shrink-0" />

        {/* Left plates */}
        <div className="flex items-center gap-[2px]">
          <AnimatePresence mode="popLayout">
            {leftPlates.map(({ weight, key }) => (
              <Plate key={`l-${key}`} weight={weight} units={units} />
            ))}
          </AnimatePresence>
        </div>

        {/* Left collar */}
        <div className="w-2 h-8 bg-zinc-500 rounded-sm shrink-0" />

        {/* Bar grip */}
        <div className="w-16 sm:w-24 h-2.5 bg-zinc-400 shrink-0 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Knurling marks */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[2px] h-2.5 bg-zinc-500/60" />
              ))}
            </div>
          </div>
        </div>

        {/* Right collar */}
        <div className="w-2 h-8 bg-zinc-500 rounded-sm shrink-0" />

        {/* Right plates */}
        <div className="flex items-center gap-[2px]">
          <AnimatePresence mode="popLayout">
            {rightPlates.map(({ weight, key }) => (
              <Plate key={`r-${key}`} weight={weight} units={units} />
            ))}
          </AnimatePresence>
        </div>

        {/* Right sleeve */}
        <div className="w-4 h-2.5 bg-zinc-400 shrink-0" />
        {/* Right bar end */}
        <div className="w-1.5 h-5 bg-zinc-500 rounded-r-full shrink-0" />
      </div>
    </div>
  )
}
