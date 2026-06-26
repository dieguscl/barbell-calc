"use client"

import { useEffect, useMemo, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  ChevronDown,
  Settings2,
  Trash2,
  Share2,
  Check,
  Users,
  Pencil,
  Eye,
  X,
} from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { AVAILABLE_PLATES } from "@/lib/calculations"
import {
  loadProfiles,
  deleteProfile as deleteProfileStore,
  renameProfile as renameProfileStore,
  buildMeProfile,
  buildShareUrl,
  type Profile,
  type Gender,
  ME_ID,
} from "@/lib/profiles"

interface AdvancedSectionProps {
  units: "KG" | "LB"
  allowRepeatSmallPlates: boolean
  onAllowRepeatChange: (v: boolean) => void
  useCustomBar: boolean
  onUseCustomBarChange: (v: boolean) => void
  customBarWeight: string
  onCustomBarWeightChange: (v: string) => void
  disabledPlates: number[]
  onTogglePlate: (plate: number) => void
  canCompare: boolean
  onCompare: (selectedIds: string[]) => void
  isPercentages: boolean
  multiPerson: boolean
  onMultiPersonChange: (v: boolean) => void
  canCalcEveryone: boolean
  onCalculateEveryone: () => void
}

export function AdvancedSection(props: AdvancedSectionProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium">
          <Settings2 className="h-4 w-4" />
          {t("advanced")}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-6 border-t pt-4">
          <AlgorithmToggle {...props} />
          <CustomBar {...props} />
          <PlateInventory {...props} />
          {props.isPercentages && <ProfilesPanel {...props} />}
          {!props.isPercentages && <EveryonePanel {...props} />}
        </div>
      )}
    </div>
  )
}

function AlgorithmToggle({ allowRepeatSmallPlates, onAllowRepeatChange }: AdvancedSectionProps) {
  const { t } = useLocale()
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{t("allowRepeatSmallPlates")}</div>
        <div className="text-sm text-muted-foreground">{t("allowRepeatSmallPlatesDesc")}</div>
      </div>
      <Switch checked={allowRepeatSmallPlates} onCheckedChange={onAllowRepeatChange} />
    </div>
  )
}

function CustomBar({
  units,
  useCustomBar,
  onUseCustomBarChange,
  customBarWeight,
  onCustomBarWeightChange,
}: AdvancedSectionProps) {
  const { t } = useLocale()
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="font-medium">{t("useCustomBar")}</div>
        <Switch checked={useCustomBar} onCheckedChange={onUseCustomBarChange} />
      </div>
      {useCustomBar && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={t("customBarWeightPlaceholder")}
            value={customBarWeight}
            onChange={(e) => onCustomBarWeightChange(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">{units}</span>
        </div>
      )}
    </div>
  )
}

function PlateInventory({ units, disabledPlates, onTogglePlate }: AdvancedSectionProps) {
  const { t } = useLocale()
  return (
    <div className="space-y-2">
      <div className="font-medium">{t("plateInventory")}</div>
      <div className="text-sm text-muted-foreground">{t("plateInventoryDesc")}</div>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_PLATES[units].map((plate) => {
          const disabled = disabledPlates.includes(plate)
          return (
            <button
              key={plate}
              type="button"
              onClick={() => onTogglePlate(plate)}
              className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors ${
                disabled
                  ? "bg-muted text-muted-foreground line-through opacity-60"
                  : "bg-primary/10 border-primary/40"
              }`}
            >
              {plate}{units}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProfilesPanel({ units, canCompare, onCompare }: AdvancedSectionProps) {
  const { t } = useLocale()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selected, setSelected] = useState<string[]>([ME_ID])
  const [shareOpen, setShareOpen] = useState(false)
  const [shareName, setShareName] = useState("")
  const [shareGender, setShareGender] = useState<Gender>("M")
  const [copied, setCopied] = useState(false)
  const [me, setMe] = useState<Profile | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setProfiles(loadProfiles())
    const meProfile = buildMeProfile(t("me"))
    setMe(meProfile)
    setShareGender(meProfile.gender)
  }, [t])

  const startRename = (p: Profile) => {
    setEditingId(p.id)
    setDraftName(p.name)
  }
  const saveRename = () => {
    if (editingId) setProfiles(renameProfileStore(editingId, draftName))
    setEditingId(null)
  }
  const toggleExpand = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id))

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    const me = buildMeProfile(shareName.trim() || t("me"))
    return buildShareUrl(window.location.origin, { ...me, gender: shareGender })
  }, [shareName, shareGender, t])

  const toggleSelected = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleDelete = (id: string) => {
    setProfiles(deleteProfileStore(id))
    setSelected((prev) => prev.filter((x) => x !== id))
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable; QR still works
    }
  }

  const everyone: Profile[] = me ? [me, ...profiles] : profiles

  return (
    <div className="space-y-4">
      <div>
        <div className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t("profiles")}
        </div>
        <div className="text-sm text-muted-foreground">{t("profilesDesc")}</div>
      </div>

      {/* People list: compare selection + rename + inspect */}
      <div className="space-y-2">
        {everyone.map((p) => {
          const isMe = p.id === ME_ID
          const movementEntries = Object.entries(p.movements)
          return (
            <div key={p.id} className="rounded-md border">
              <div className="flex items-center gap-2 p-2">
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleSelected(p.id)}
                  className="h-4 w-4"
                />
                {editingId === p.id ? (
                  <>
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      autoFocus
                      className="h-8 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename()
                        if (e.key === "Escape") setEditingId(null)
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={saveRename} aria-label="save">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)} aria-label="cancel">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button type="button" className="flex-1 text-left capitalize" onClick={() => toggleExpand(p.id)}>
                      {p.name}
                    </button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(p.id)} aria-label="inspect">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {!isMe && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRename(p)} aria-label="rename">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!isMe && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} aria-label="delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
              {expandedId === p.id && (
                <div className="border-t p-3 text-sm space-y-1">
                  <div className="text-muted-foreground">
                    {p.gender === "F" ? t("female") : t("male")} · {p.units}
                  </div>
                  {movementEntries.length === 0 ? (
                    <div className="text-muted-foreground">0 {t("importMovements")}</div>
                  ) : (
                    <ul className="space-y-1">
                      {movementEntries.map(([m, { pr }]) => (
                        <li key={m} className="flex justify-between">
                          <span className="capitalize">{m}</span>
                          <span className="font-medium">{pr} {p.units}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {profiles.length === 0 && (
          <div className="text-sm text-muted-foreground">{t("noProfiles")}</div>
        )}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={!canCompare || selected.length < 1}
        onClick={() => onCompare(selected)}
      >
        {t("compareSideBySide")}
      </Button>
      {!canCompare && (
        <div className="text-xs text-muted-foreground text-center">{t("selectPeople")}</div>
      )}

      {/* Share my PRs */}
      <div className="border-t pt-4 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShareOpen((s) => !s)}
        >
          <Share2 className="h-4 w-4 mr-2" />
          {t("shareMyProfile")}
        </Button>

        {shareOpen && (
          <div className="space-y-3">
            <Input
              placeholder={t("profileNamePlaceholder")}
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
            />
            <div className="flex gap-2">
              {(["M", "F"] as Gender[]).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={shareGender === g ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setShareGender(g)}
                >
                  {g === "M" ? t("male") : t("female")}
                </Button>
              ))}
            </div>
            <div className="flex justify-center bg-white p-4 rounded-md">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
              {copied ? t("copied") : t("copyLink")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Manual mode: enable "calculate for everyone". People are added/edited via
// tabs in the main UI; this is the enable + trigger.
function EveryonePanel({ multiPerson, onMultiPersonChange }: AdvancedSectionProps) {
  const { t } = useLocale()
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("manualCompare")}
          </div>
          <div className="text-sm text-muted-foreground">{t("manualCompareDesc")}</div>
        </div>
        <Switch checked={multiPerson} onCheckedChange={onMultiPersonChange} />
      </div>
    </div>
  )
}

