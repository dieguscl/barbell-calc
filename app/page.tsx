"use client"

import { WeightCalculatorForm } from "./components/weight-calculator-form"
import { useLocale } from "@/lib/locale-context"

export default function Home() {
  const { t } = useLocale()

  return (
    <main className="pt-14 container mx-auto p-4 flex flex-col items-center gap-12 max-w-2xl">
      <div className="text-center w-full mb-2">
        <h1 className="scroll-m-20 text-5xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-br from-primary via-emerald-500 to-green-600 dark:from-primary dark:via-emerald-400 dark:to-green-500 bg-clip-text text-transparent drop-shadow-sm pb-2">
          {t("appTitle")}
        </h1>
      </div>
      <WeightCalculatorForm />
    </main>
  )
}
