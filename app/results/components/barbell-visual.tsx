"use client"

interface BarbellVisualProps {
  plates: number[]
  units: "KG" | "LB"
}

const PLATE_COLORS: Record<string, Record<number, { bg: string; text: string }>> = {
  KG: {
    25:   { bg: "bg-red-600",    text: "text-white" },
    20:   { bg: "bg-blue-600",   text: "text-white" },
    15:   { bg: "bg-yellow-400", text: "text-black" },
    10:   { bg: "bg-green-600",  text: "text-white" },
    7.5:  { bg: "bg-pink-500",   text: "text-white" },
    5:    { bg: "bg-white border border-gray-300", text: "text-black" },
    2.5:  { bg: "bg-red-400",    text: "text-white" },
    1.25: { bg: "bg-yellow-300", text: "text-black" },
    1:    { bg: "bg-zinc-600",   text: "text-white" },
    0.5:  { bg: "bg-green-500",  text: "text-white" },
  },
  LB: {
    45:  { bg: "bg-blue-600",   text: "text-white" },
    35:  { bg: "bg-yellow-400", text: "text-black" },
    25:  { bg: "bg-green-600",  text: "text-white" },
    10:  { bg: "bg-white border border-gray-300", text: "text-black" },
    5:   { bg: "bg-red-500",    text: "text-white" },
    2.5: { bg: "bg-zinc-400",   text: "text-black" },
  },
}

function getPlateHeight(weight: number, units: "KG" | "LB"): number {
  if (units === "KG") {
    if (weight >= 25) return 100
    if (weight >= 20) return 92
    if (weight >= 15) return 84
    if (weight >= 10) return 76
    if (weight >= 7.5) return 68
    if (weight >= 5)  return 60
    if (weight >= 2.5) return 44
    if (weight >= 1)  return 36
    return 30
  }
  // LB
  if (weight >= 45) return 100
  if (weight >= 35) return 92
  if (weight >= 25) return 84
  if (weight >= 10) return 60
  if (weight >= 5)  return 44
  return 32
}

function getPlateWidth(weight: number, units: "KG" | "LB"): number {
  if (units === "KG") {
    if (weight >= 15) return 28
    if (weight >= 5)  return 20
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
    <div
      className={`relative rounded-sm ${style.bg} flex items-center justify-center shrink-0`}
      style={{ height: `${height}px`, width: `${width}px` }}
    >
      <span
        className={`text-[9px] font-bold ${style.text} leading-none`}
        style={{ writingMode: height > 40 ? "vertical-rl" : undefined, textOrientation: "mixed" }}
      >
        {weight}
      </span>
    </div>
  )
}

export function BarbellVisual({ plates, units }: BarbellVisualProps) {
  if (plates.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-3 w-48 bg-zinc-400 rounded-full" />
      </div>
    )
  }

  // Left side: reversed (smallest on outside, largest near center)
  const leftPlates = [...plates].reverse()
  // Right side: largest near center, smallest on outside
  const rightPlates = [...plates]

  return (
    <div className="flex items-center justify-center py-4 overflow-x-auto">
      {/* Left bar end (sleeve end) */}
      <div className="w-1.5 h-5 bg-zinc-500 rounded-l-full shrink-0" />
      {/* Left sleeve */}
      <div className="w-4 h-2.5 bg-zinc-400 shrink-0" />

      {/* Left plates */}
      <div className="flex items-center gap-[2px]">
        {leftPlates.map((plate, i) => (
          <Plate key={`l-${i}`} weight={plate} units={units} />
        ))}
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
        {rightPlates.map((plate, i) => (
          <Plate key={`r-${i}`} weight={plate} units={units} />
        ))}
      </div>

      {/* Right sleeve */}
      <div className="w-4 h-2.5 bg-zinc-400 shrink-0" />
      {/* Right bar end */}
      <div className="w-1.5 h-5 bg-zinc-500 rounded-r-full shrink-0" />
    </div>
  )
}
