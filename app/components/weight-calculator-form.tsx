"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Plus, X, RotateCcw, Share2, Trash2 } from "lucide-react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TypographyH3 } from "@/components/ui/typogrpahy-h3"
import { calculatePlateConfigurations, calculatePlateInventory } from "@/lib/calculations"
import type { PlateConfiguration, PlateInventory } from "@/lib/calculations"
import { AlertCircle, Check } from "lucide-react"
import { useLocale } from "@/lib/locale-context"

const STORAGE_KEYS = {
  UNITS: 'barbell-calc-units',
  BAR_WEIGHT: 'barbell-calc-bar-weight',
  MOVEMENT_PRS: 'barbell-calc-movement-prs'
} as const

const createFormSchema = (isPercentagesCalculation: boolean, t: (key: any) => string) => {
  return z.object({
    movement: z.string().optional(),
    PR: isPercentagesCalculation
      ? z.string().min(1, { message: t("prRequired") })
      : z.string().optional(),
    barWeight: z.string().refine((val) => {
      const validValues = [
        ...BAR_OPTIONS.KG.map(opt => opt.value),
        ...BAR_OPTIONS.LB.map(opt => opt.value)
      ];
      return validValues.includes(val);
    }, { message: t("selectBarWeight") }),
    percentages: z.array(z.string())
      .refine(
        (arr) => arr.some(val => val.trim() !== ""),
        { message: isPercentagesCalculation ? t("atLeastOnePercentage") : t("atLeastOneWeight") }
      ),
  })
}

const BAR_OPTIONS = {
  KG: [
    { value: "20", label: "20kg" },
    { value: "15", label: "15kg" },
  ],
  LB: [
    { value: "45", label: "45lb" },
    { value: "35", label: "35lb" },
  ],
}

export const getEquivalentBarWeight = (currentWeight: string, toUnit: "KG" | "LB") => {
  if (toUnit === "LB") {
    if (currentWeight === "20") return "45"
    if (currentWeight === "15") return "35"
  } else {
    if (currentWeight === "45") return "20"
    if (currentWeight === "35") return "15"
  }
  return currentWeight
}

export interface CalculationResults {
  configurations: PlateConfiguration[]
  baseInventory: PlateInventory
  units: "KG" | "LB"
  sourceUnits: "KG" | "LB"
  PR?: number
  isPercentages: boolean
}

interface WeightCalculatorFormProps {
  onCalculate: (results: CalculationResults) => void
}

export function WeightCalculatorForm({ onCalculate }: WeightCalculatorFormProps) {
  const { t } = useLocale()

  // 1. Initialize state with default values
  const [units, setUnits] = useState<"KG" | "LB">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.UNITS) as "KG" | "LB") || "KG"
    }
    return "KG"
  })
  const [isPercentagesCalculation, setIsPercentagesCalculation] = useState(true)
  const [percentageCount, setPercentageCount] = useState(1)

  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [savedMovements, setSavedMovements] = useState<string[]>([])
  const [isAddingMovement, setIsAddingMovement] = useState(false)

  // 2. Create form schema based on initial state
  const formSchema = useMemo(() => createFormSchema(isPercentagesCalculation, t), [isPercentagesCalculation, t])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movement: "",
      PR: "",
      barWeight: "",
      percentages: [""],
    },
  })

  // Load saved movements on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPRs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENT_PRS) || '{}')
      setSavedMovements(Object.keys(storedPRs).sort())
    }
  }, [])

  // 3. Populate form and update state based on URL parameters on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)

      const urlUnits = searchParams.get('units') as "KG" | "LB"
      const storedUnits = localStorage.getItem(STORAGE_KEYS.UNITS) as "KG" | "LB"
      const activeUnits = urlUnits || storedUnits || "KG"

      if (urlUnits) {
        setUnits(urlUnits)
      } else if (storedUnits) {
        setUnits(storedUnits)
      }

      const urlIsPercentages = searchParams.get('isPercentages')
      if (urlIsPercentages !== null) {
        setIsPercentagesCalculation(urlIsPercentages !== 'false')
      }

      const storedBarWeight = localStorage.getItem(STORAGE_KEYS.BAR_WEIGHT)
      const initialBarWeight = searchParams.get('barWeight') || storedBarWeight || ""
      const adjustedBarWeight = initialBarWeight ? getEquivalentBarWeight(initialBarWeight, activeUnits) : ""

      const valueEntries = Array.from(searchParams.entries())
        .filter(([key]) => key.startsWith('value'))
        .sort((a, b) => a[0].localeCompare(b[0]))

      form.reset({
        movement: searchParams.get('movement') || "",
        PR: searchParams.get('PR') || "",
        barWeight: adjustedBarWeight,
        percentages: valueEntries.length > 0
          ? valueEntries.map(([_, value]) => value)
          : [""],
      })

      setPercentageCount(Math.max(valueEntries.length || 1, 1))
      setIsLoading(false)
    }
  }, [form])

  const updateURL = (updates: Partial<{ units: "KG" | "LB"; isPercentagesCalculation: boolean }>) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    const currentUnits = updates.units || units;
    const currentIsPercentages = updates.isPercentagesCalculation !== undefined ? updates.isPercentagesCalculation : isPercentagesCalculation;

    params.set('units', currentUnits);
    params.set('isPercentages', currentIsPercentages.toString());

    const values = form.getValues();

    if (values.movement) {
      params.set('movement', values.movement);
    }

    if (values.barWeight) {
      params.set('barWeight', values.barWeight);
    }

    if (currentIsPercentages && values.PR) {
      params.set('PR', values.PR);
    }

    if (Array.isArray(values.percentages)) {
      values.percentages.forEach((value: string, index: number) => {
        if (value) {
          params.set(`value${index}`, value);
        }
      });
    }

    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      updateURL({})
    })

    return () => subscription.unsubscribe()
  }, [form, units, isPercentagesCalculation])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS, units)

    // Translate barWeight to the new unit
    const currentBarWeight = form.getValues('barWeight')
    if (currentBarWeight) {
      const equivalent = getEquivalentBarWeight(currentBarWeight, units)
      if (equivalent !== currentBarWeight) {
        form.setValue('barWeight', equivalent)
        localStorage.setItem(STORAGE_KEYS.BAR_WEIGHT, equivalent)
      }
    }

    // Update the unit for the active movement as well
    const values = form.getValues()
    if (values.movement && values.PR) {
      const storedPRs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENT_PRS) || '{}')
      const movementLower = values.movement.toLowerCase()
      const currentData = storedPRs[movementLower]

      let shouldUpdate = false
      if (typeof currentData === 'object' && currentData !== null) {
        if (currentData.units !== units || currentData.pr !== values.PR) shouldUpdate = true
      } else if (currentData !== undefined) {
        shouldUpdate = true
      }

      if (shouldUpdate) {
        storedPRs[movementLower] = { pr: values.PR, units }
        localStorage.setItem(STORAGE_KEYS.MOVEMENT_PRS, JSON.stringify(storedPRs))
        setSavedMovements(Object.keys(storedPRs).sort())
      }
    }
  }, [units, form])

  // Effect to load PR when movement changes via dropdown or manual input
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'movement' && value.movement) {
        const storedPRs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENT_PRS) || '{}')
        const savedData = storedPRs[value.movement.toLowerCase()]
        if (savedData !== undefined) {
          if (typeof savedData === 'object' && savedData !== null) {
            form.setValue('PR', savedData.pr)
            if (savedData.units && savedData.units !== units) {
              setUnits(savedData.units as "KG" | "LB")
              updateURL({ units: savedData.units as "KG" | "LB" })
            }
          } else {
            // Backward compatibility for old string format
            form.setValue('PR', savedData)
          }
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, units])

  // Add effect to save barWeight and PR to localStorage
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'barWeight' && value.barWeight) {
        localStorage.setItem(STORAGE_KEYS.BAR_WEIGHT, value.barWeight)
      }

      if ((name === 'movement' || name === 'PR') && value.movement && value.PR) {
        const storedPRs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENT_PRS) || '{}')
        const movementLower = value.movement.toLowerCase()
        const currentData = storedPRs[movementLower]

        let shouldUpdate = false
        if (typeof currentData === 'object' && currentData !== null) {
          if (currentData.pr !== value.PR || currentData.units !== units) shouldUpdate = true
        } else {
          // Backward compatibility or new entry
          if (currentData !== value.PR) shouldUpdate = true
        }

        if (shouldUpdate) {
          storedPRs[movementLower] = { pr: value.PR, units }
          localStorage.setItem(STORAGE_KEYS.MOVEMENT_PRS, JSON.stringify(storedPRs))
          setSavedMovements(Object.keys(storedPRs).sort())
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, units])

  function onSubmit(alternateUnit: boolean = false) {
    return (values: z.infer<ReturnType<typeof createFormSchema>>) => {
      const searchParams = new URLSearchParams()
      const targetUnits = alternateUnit ? (units === "KG" ? "LB" : "KG") : units

      const numericValues = values.percentages
        .filter(val => val !== "")
        .map(val => parseFloat(val))

      searchParams.set('units', targetUnits)
      searchParams.set('barWeight', values.barWeight)
      searchParams.set('isPercentages', isPercentagesCalculation.toString())
      searchParams.set('sourceUnits', units)

      if (values.movement) {
        searchParams.set('movement', values.movement)
      }

      if (isPercentagesCalculation && values.PR) {
        searchParams.set('PR', values.PR)
      }

      numericValues.forEach((value, index) => {
        searchParams.set(`value${index}`, value.toString())
      })

      // Update URL for sharing without navigating
      window.history.replaceState({}, '', `?${searchParams.toString()}`)

      // Compute results client-side
      const PR = isPercentagesCalculation && values.PR ? parseFloat(values.PR) : undefined

      const baseConfigs = calculatePlateConfigurations({
        PR,
        barWeight: parseFloat(values.barWeight),
        values: numericValues,
        units: targetUnits,
        sourceUnits: units,
        isPercentages: isPercentagesCalculation,
        disabledPlates: [],
      })
      const baseInventory = calculatePlateInventory(baseConfigs)

      onCalculate({
        configurations: baseConfigs,
        baseInventory,
        units: targetUnits,
        sourceUnits: units,
        PR,
        isPercentages: isPercentagesCalculation,
      })
    }
  }

  const addPercentage = () => {
    setPercentageCount(prev => prev + 1)
    const currentPercentages = form.getValues().percentages
    form.setValue('percentages', [...currentPercentages, ""])

    setTimeout(() => {
      const inputs = document.querySelectorAll('input[name^="percentages."]');
      (inputs[inputs.length - 1] as HTMLInputElement)?.focus();
    }, 0);
  }

  const removePercentage = (index: number) => {
    const currentPercentages = form.getValues().percentages
    const newPercentages = currentPercentages.filter((_, i) => i !== index)
    form.setValue('percentages', newPercentages)
    setPercentageCount(prev => Math.max(newPercentages.length, 1))
  }

  const resetForm = () => {
    form.setValue('percentages', [""])
    setPercentageCount(1)
    updateURL({})
  }

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

  const deleteMovement = (movementToDelete: string) => {
    const storedPRs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENT_PRS) || '{}')
    delete storedPRs[movementToDelete.toLowerCase()]
    localStorage.setItem(STORAGE_KEYS.MOVEMENT_PRS, JSON.stringify(storedPRs))
    setSavedMovements(Object.keys(storedPRs).sort())

    if (form.getValues().movement?.toLowerCase() === movementToDelete.toLowerCase()) {
      form.setValue('movement', "")
      form.setValue('PR', "")
    }
  }

  return (
    <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      ) : (
        <>
          <Tabs
            defaultValue={units}
            onValueChange={(value) => {
              setUnits(value as "KG" | "LB");
              updateURL({ units: value as "KG" | "LB" });
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="KG" aria-selected={units === "KG"} data-state={units === "KG" ? "active" : "inactive"}>
                KG
              </TabsTrigger>
              <TabsTrigger value="LB" aria-selected={units === "LB"} data-state={units === "LB" ? "active" : "inactive"}>
                LB
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            defaultValue={isPercentagesCalculation ? "percentages" : "weights"}
            onValueChange={(value) => {
              const isPercentages = value === "percentages";
              setIsPercentagesCalculation(isPercentages);
              updateURL({ isPercentagesCalculation: isPercentages });
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="percentages" aria-selected={isPercentagesCalculation} data-state={isPercentagesCalculation ? "active" : "inactive"}>
                {t("percentagesTab")}
              </TabsTrigger>
              <TabsTrigger value="weights" aria-selected={!isPercentagesCalculation} data-state={!isPercentagesCalculation ? "active" : "inactive"}>
                {t("manualWeightsTab")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit(false))} className="space-y-8">
              {isPercentagesCalculation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="movement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <TypographyH3>{t("movement")}</TypographyH3>
                        </FormLabel>
                        {isAddingMovement || savedMovements.length === 0 ? (
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder={t("movementPlaceholder")}
                                {...field}
                                autoFocus={isAddingMovement}
                              />
                            </FormControl>
                            {savedMovements.length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsAddingMovement(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Select
                            onValueChange={(value) => {
                              if (value === "add_new") {
                                setIsAddingMovement(true);
                                form.setValue('movement', "");
                                form.setValue('PR', "");
                              } else {
                                field.onChange(value);
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectMovement")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {savedMovements.map((m) => (
                                <div key={m} className="flex items-center justify-between px-2 py-1 hover:bg-accent rounded-sm group">
                                  <SelectItem value={m} className="flex-1 hover:bg-transparent focus:bg-transparent">
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                  </SelectItem>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      deleteMovement(m);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <SelectSeparator />
                              <SelectItem value="add_new" className="text-primary font-medium">
                                <div className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  {t("addNew")}
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="PR"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <TypographyH3>{t("pr")}</TypographyH3>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={t("prPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="barWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <TypographyH3>{t("barWeight")}</TypographyH3>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("barWeightPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BAR_OPTIONS[units].map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Percentage inputs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <TypographyH3>{isPercentagesCalculation ? t("percentages") : t("weights")}</TypographyH3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={shareURL}
                      className="flex items-center gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      {copied ? t("copied") : t("share")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("reset")}
                    </Button>
                  </div>
                </div>
                {Array.from({ length: percentageCount }).map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`percentages.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <FormControl>
                              <Input
                                placeholder={isPercentagesCalculation ? t("percentagePlaceholder") : t("weightPlaceholder")}
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.includes(',')) {
                                    const parts = val.split(',').map(p => p.trim()).filter(p => p !== "");
                                    if (parts.length > 1) {
                                      const currentPercentages = [...form.getValues().percentages];
                                      currentPercentages.splice(index, 1, ...parts);
                                      form.setValue('percentages', currentPercentages);
                                      setPercentageCount(currentPercentages.length);

                                      setTimeout(() => {
                                        const inputs = document.querySelectorAll('input[name^="percentages."]');
                                        (inputs[index + parts.length - 1] as HTMLInputElement)?.focus();
                                      }, 0);
                                      return;
                                    }
                                  }
                                  field.onChange(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={percentageCount === 1}
                            onClick={() => removePercentage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Error message section */}
              {form.formState.errors.percentages && (
                <div className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {isPercentagesCalculation
                      ? t("atLeastOnePercentageCalc")
                      : t("atLeastOneWeightCalc")
                    }
                  </span>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addPercentage}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isPercentagesCalculation ? t("addPercentage") : t("addWeight")}
              </Button>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                >
                  {t("calculate")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const isValid = await form.trigger()
                    if (isValid) {
                      onSubmit(true)(form.getValues())
                    }
                  }}
                >
                  {t("calculateIn")} {units === "KG" ? "LB" : "KG"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  )
}
