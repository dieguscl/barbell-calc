"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import { PlateConfigurations } from "./components/plate-configurations"
import { ResultsTitle } from "./components/results-title"
import { SideBySide } from "./components/side-by-side"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"
import { useLocale } from "@/lib/locale-context"

function parseDisabled(raw: string | null): number[] {
  if (!raw) return []
  return raw.split(",").map((s) => parseFloat(s)).filter((n) => !isNaN(n))
}

export default function ResultsPage() {
  // Route to the right view BEFORE any heavy hooks so each subcomponent keeps a
  // stable hook order (rules of hooks).
  const searchParams = useSearchParams()
  if (searchParams.get("mode") === "sidebyside") {
    return <SideBySideResult />
  }
  return <SingleResult />
}

function SideBySideResult() {
  const searchParams = useSearchParams()
  const { t } = useLocale()

  const units = (searchParams.get("units") as "KG" | "LB") || "KG"
  const allowRepeatSmallPlates = searchParams.get("allowRepeat") === "true"
  const profileIds = (searchParams.get("profiles") || "").split(",").filter(Boolean)
  const movement = searchParams.get("movement") || ""
  const customBarRaw = searchParams.get("barWeight")
  const values = Array.from(searchParams.entries())
    .filter(([key]) => key.startsWith("value"))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => parseFloat(value || "0"))

  return (
    <main className="container mx-auto p-4 max-w-2xl mt-8">
      <div className="flex items-center justify-between">
        <ResultsTitle editUrl={`/?${searchParams.toString()}`} />
        <span className="text-sm text-muted-foreground">{t("sideBySide")}</span>
      </div>
      <SideBySide
        profileIds={profileIds}
        movement={movement}
        values={values}
        units={units}
        allowRepeatSmallPlates={allowRepeatSmallPlates}
        disabledFromUrl={parseDisabled(searchParams.get("disabled"))}
        customBar={customBarRaw ? parseFloat(customBarRaw) : undefined}
      />
    </main>
  )
}

function SingleResult() {
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  const units = (searchParams.get("units") as "KG" | "LB") || "KG"
  const sourceUnits = (searchParams.get("sourceUnits") as "KG" | "LB") || units
  const barWeight = parseFloat(searchParams.get("barWeight") || "20")
  const isPercentages = searchParams.get("isPercentages") === "true"
  const PR = searchParams.get("PR") ? parseFloat(searchParams.get("PR")!) : undefined
  const allowRepeatSmallPlates = searchParams.get("allowRepeat") === "true"

  const values = Array.from(searchParams.entries())
    .filter(([key]) => key.startsWith("value"))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => parseFloat(value || "0"))

  const [disabledPlates, setDisabledPlates] = useState<number[]>(
    parseDisabled(searchParams.get("disabled"))
  )

  // Calculate the "base inventory" using NO disabled plates, so every plate we might ever need is still displayed
  // We use this so a user can click a plate to disable it, and it won't disappear completely.
  const baseInventory = useMemo(() => {
    const configs = calculatePlateConfigurations({
      PR,
      barWeight,
      values,
      units,
      sourceUnits,
      isPercentages,
      allowRepeatSmallPlates,
      disabledPlates: [],
    })
    return calculatePlateInventory(configs)
  }, [PR, barWeight, values.join(","), units, sourceUnits, isPercentages, allowRepeatSmallPlates])

  const { configurations } = useMemo(() => {
    const configs = calculatePlateConfigurations({
      PR,
      barWeight,
      values,
      units,
      sourceUnits,
      isPercentages,
      allowRepeatSmallPlates,
      disabledPlates,
    })
    return { configurations: configs }
  }, [PR, barWeight, values.join(","), units, sourceUnits, isPercentages, allowRepeatSmallPlates, disabledPlates])

  const combinedInventory = useMemo(() => {
    const currentInventory = calculatePlateInventory(configurations)
    const combined = { ...baseInventory }
    for (const [weightStr, count] of Object.entries(currentInventory)) {
       const weight = parseFloat(weightStr)
       combined[weight] = Math.max(combined[weight] || 0, count)
    }
    // Ensure all disabled plates are shown
    for (const weight of disabledPlates) {
      if (combined[weight] === undefined) {
        combined[weight] = 0
      }
    }
    return combined
  }, [baseInventory, configurations, disabledPlates])

  const editUrl = `/?${searchParams.toString()}`

  const shareURL = async () => {
    const url = window.location.href
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = url
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      textArea.style.top = "0"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err)
      }
      document.body.removeChild(textArea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="container mx-auto p-4 max-w-2xl mt-8">
      <div className="flex items-center justify-between">
        <ResultsTitle editUrl={editUrl} />
        <Button
          variant="ghost"
          size="sm"
          onClick={shareURL}
          className="flex items-center gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {copied ? t("copied") : t("share")}
        </Button>
      </div>
      <PlateConfigurations
        configurations={configurations}
        baseInventory={combinedInventory}
        disabledPlates={disabledPlates}
        onTogglePlate={(plate) => {
          setDisabledPlates(prev =>
            prev.includes(plate) ? prev.filter(p => p !== plate) : [...prev, plate]
          )
        }}
        units={units}
        sourceUnits={sourceUnits}
        PR={PR}
        isPercentages={isPercentages}
        editUrl={editUrl}
      />
    </main>
  )
}
