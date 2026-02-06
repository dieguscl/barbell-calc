"use client"

import { TypographyH1 } from "@/components/ui/typography-h1"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Props {
  editUrl: string
}

export function ResultsTitle({ editUrl }: Props) {
  const { t } = useLocale()
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" asChild>
        <Link href={editUrl}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <TypographyH1>{t("results")}</TypographyH1>
    </div>
  )
}
