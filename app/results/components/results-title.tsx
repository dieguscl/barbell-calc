"use client"

import { TypographyH1 } from "@/components/ui/typography-h1"
import { useLocale } from "@/lib/locale-context"

export function ResultsTitle() {
  const { t } = useLocale()
  return <TypographyH1>{t("results")}</TypographyH1>
}
