"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TypographyH3 } from "@/components/ui/typogrpahy-h3"
import { Check, UserPlus, AlertCircle } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import {
  decodeProfileShare,
  sharedToProfile,
  upsertProfile,
} from "@/lib/profiles"

function ImportContent() {
  const { t } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [added, setAdded] = useState(false)

  const payload = searchParams.get("p")
  const shared = useMemo(() => (payload ? decodeProfileShare(payload) : null), [payload])
  const [name, setName] = useState("")

  // Prefill the name with the shared one; the importer can override it.
  useEffect(() => {
    if (shared) setName(shared.name)
  }, [shared])

  const genderLabel = shared
    ? shared.gender === "F"
      ? t("female")
      : t("male")
    : ""
  const movementCount = shared ? Object.keys(shared.movements).length : 0

  const handleAdd = () => {
    if (!shared) return
    const finalName = name.trim() || shared.name
    upsertProfile(sharedToProfile({ ...shared, name: finalName }))
    setAdded(true)
  }

  return (
    <main className="container mx-auto p-4 max-w-md mt-12 flex flex-col gap-6">
      <TypographyH3>{t("importTitle")}</TypographyH3>

      {!shared ? (
        <div className="flex flex-col gap-4">
          <div className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{t("importInvalid")}</span>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            {t("goToCalculator")}
          </Button>
        </div>
      ) : added ? (
        <div className="flex flex-col gap-4">
          <div className="text-emerald-600 flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>{t("importSuccess")}</span>
          </div>
          <Button onClick={() => router.push("/")}>{t("goToCalculator")}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("profileName")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profileNamePlaceholder")}
              autoFocus
            />
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">
              {genderLabel} · {shared.units} · {movementCount} {t("importMovements")}
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {Object.entries(shared.movements).map(([m, { pr }]) => (
                <li key={m} className="flex justify-between">
                  <span className="capitalize">{m}</span>
                  <span className="font-medium">{pr} {shared.units}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">{t("importPrompt")}</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAdd} disabled={!name.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t("importAdd")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
              {t("importCancel")}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function ImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportContent />
    </Suspense>
  )
}
