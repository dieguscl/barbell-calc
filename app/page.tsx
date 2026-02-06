"use client"

import { TypographyH1 } from "@/components/ui/typography-h1"
import { WeightCalculatorForm } from "./components/weight-calculator-form"
import { useLocale } from "@/lib/locale-context"

export default function Home() {
  const { t } = useLocale()

  return (
    <main className="pt-14 container mx-auto p-4 flex flex-col items-center gap-12">
      <TypographyH1>{t("appTitle")}</TypographyH1>
      <WeightCalculatorForm />
    </main>
  )
}
