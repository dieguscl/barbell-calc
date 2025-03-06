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
} from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TypographyH3 } from "@/components/ui/typogrpahy-h3"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

const STORAGE_KEYS = {
  UNITS: 'barbell-calc-units',
  BAR_WEIGHT: 'barbell-calc-bar-weight'
} as const

const createFormSchema = (isPercentagesCalculation: boolean) => {
  return z.object({
    PR: isPercentagesCalculation
      ? z.string().min(1, { message: "El PR es requerido" })
      : z.string().optional(),
    barWeight: z.string().refine((val) => {
      // Check if the value exists in either KG or LB options
      const validValues = [
        ...BAR_OPTIONS.KG.map(opt => opt.value),
        ...BAR_OPTIONS.LB.map(opt => opt.value)
      ];
      return validValues.includes(val);
    }, { message: "Por favor selecciona el peso de la barra" }),
    percentages: z.array(z.string())
      .refine(
        (arr) => arr.some(val => val.trim() !== ""),
        { message: `Debes ingresar al menos un ${isPercentagesCalculation ? "porcentaje" : "peso"}` }
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

function FormErrorMessage({ errors }: { errors: Record<string, any> }) {
  if (Object.keys(errors).length === 0) return null;

  return (
    <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4 flex items-start space-x-2">
      <AlertCircle className="h-5 w-5 mt-0.5" />
      <div className="space-y-1">
        <p className="font-medium">Por favor corrige los siguientes errores:</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {errors.PR?.message && <li>{errors.PR.message}</li>}
          {errors.barWeight?.message && <li>{errors.barWeight.message}</li>}
          {errors.percentages?.message && <li>{errors.percentages.message}</li>}
          {process.env.NODE_ENV === 'development' && (
            <li className="text-xs opacity-50">
              {JSON.stringify(errors, null, 2)}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

export function WeightCalculatorForm() {
  const router = useRouter()

  // 1. Initialize state with default values
  const [units, setUnits] = useState<"KG" | "LB">(() => {
    // Try to get from localStorage, fallback to "KG"
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.UNITS) as "KG" | "LB") || "KG"
    }
    return "KG"
  })
  const [isPercentagesCalculation, setIsPercentagesCalculation] = useState(true)
  const [percentageCount, setPercentageCount] = useState(1)

  // 1.a. Introduce isLoading state
  const [isLoading, setIsLoading] = useState(true)

  // 2. Create form schema based on initial state
  const formSchema = useMemo(() => createFormSchema(isPercentagesCalculation), [isPercentagesCalculation])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      PR: "",
      barWeight: "",
      percentages: [""],
    },
  })

  // 3. Populate form and update state based on URL parameters on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)

      // Set units from URL or localStorage
      const urlUnits = searchParams.get('units') as "KG" | "LB"
      const storedUnits = localStorage.getItem(STORAGE_KEYS.UNITS) as "KG" | "LB"
      if (urlUnits) {
        setUnits(urlUnits)
      } else if (storedUnits) {
        setUnits(storedUnits)
      }

      // Set calculation type from URL
      const urlIsPercentages = searchParams.get('isPercentages')
      if (urlIsPercentages !== null) {
        setIsPercentagesCalculation(urlIsPercentages !== 'false')
      }

      // Get stored barWeight
      const storedBarWeight = localStorage.getItem(STORAGE_KEYS.BAR_WEIGHT)

      // Get percentages/weights from URL
      const valueEntries = Array.from(searchParams.entries())
        .filter(([key]) => key.startsWith('value'))
        .sort((a, b) => a[0].localeCompare(b[0]))

      // Set form values from URL or localStorage
      form.reset({
        PR: searchParams.get('PR') || "",
        barWeight: searchParams.get('barWeight') || storedBarWeight || "",
        percentages: valueEntries.length > 0
          ? valueEntries.map(([_, value]) => value)
          : [""],
      })

      // Set percentage count
      setPercentageCount(Math.max(valueEntries.length || 1, 1))

      // 3.a. Update isLoading to false after initialization
      setIsLoading(false)
    }
  }, [form])

  const updateURL = (updates: Partial<{ units: "KG" | "LB"; isPercentagesCalculation: boolean }>) => {
    // Don't update URL if we're in SSR or if window is not available
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    const currentUnits = updates.units || units;
    const currentIsPercentages = updates.isPercentagesCalculation !== undefined ? updates.isPercentagesCalculation : isPercentagesCalculation;

    params.set('units', currentUnits);
    params.set('isPercentages', currentIsPercentages.toString());

    const values = form.getValues();

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

    // Update URL without navigation
    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  useEffect(() => {
    const subscription = form.watch(() => {
      updateURL({})
    })

    return () => subscription.unsubscribe()
  }, [form, units, isPercentagesCalculation])

  // Add effect to save units to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS, units)
  }, [units])

  // Add effect to save barWeight to localStorage
  useEffect(() => {
    const barWeight = form.getValues().barWeight
    if (barWeight) {
      localStorage.setItem(STORAGE_KEYS.BAR_WEIGHT, barWeight)
    }
  }, [form.watch('barWeight')])

  function onSubmit(alternateUnit: boolean = false) {
    return (values: z.infer<ReturnType<typeof createFormSchema>>) => {
      const searchParams = new URLSearchParams()
      const targetUnits = alternateUnit ? (units === "KG" ? "LB" : "KG") : units

      const numericValues = values.percentages
        .filter(val => val !== "") // Filter out empty values
        .map(val => parseFloat(val))

      searchParams.set('units', targetUnits)
      searchParams.set('barWeight', values.barWeight)
      searchParams.set('isPercentages', isPercentagesCalculation.toString())
      searchParams.set('sourceUnits', units) // Add source units for proper conversion

      if (isPercentagesCalculation && values.PR) {
        searchParams.set('PR', values.PR)
      }

      numericValues.forEach((value, index) => {
        searchParams.set(`value${index}`, value.toString())
      })

      router.push(`/results?${searchParams.toString()}`)
    }
  }

  const addPercentage = () => {
    setPercentageCount(prev => prev + 1)
    const currentPercentages = form.getValues().percentages
    form.setValue('percentages', [...currentPercentages, ""])
  }

  const removePercentage = (index: number) => {
    const currentPercentages = form.getValues().percentages
    const newPercentages = currentPercentages.filter((_, i) => i !== index)
    form.setValue('percentages', newPercentages)
    setPercentageCount(prev => prev - 1)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 4. Conditional Rendering Based on isLoading */}
      {isLoading ? (
        // 4.a. Loading Screen
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
        // 4.b. Main Form UI
        <>
          <Tabs
            defaultValue={units} // Ensure consistent defaultValue
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
            defaultValue={isPercentagesCalculation ? "percentages" : "weights"} // Ensure consistent defaultValue
            onValueChange={(value) => {
              const isPercentages = value === "percentages";
              setIsPercentagesCalculation(isPercentages);
              updateURL({ isPercentagesCalculation: isPercentages });
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="percentages" aria-selected={isPercentagesCalculation} data-state={isPercentagesCalculation ? "active" : "inactive"}>
                Porcentajes
              </TabsTrigger>
              <TabsTrigger value="weights" aria-selected={!isPercentagesCalculation} data-state={!isPercentagesCalculation ? "active" : "inactive"}>
                Pesos Manuales
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit(false))} className="space-y-8">
              {isPercentagesCalculation && (
                <FormField
                  control={form.control}
                  name="PR"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <TypographyH3>PR</TypographyH3>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 320" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="barWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <TypographyH3>Peso de barra</TypographyH3>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el peso de la barra" />
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
              {Array.from({ length: percentageCount }).map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`percentages.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <FormLabel>{isPercentagesCalculation ? "Porcentaje" : "Peso"} {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={isPercentagesCalculation ? "e.g. 85" : "e.g. 100"}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="self-end"
                          onClick={() => removePercentage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              ))}

              {/* Add this error message section */}
              {form.formState.errors.percentages && (
                <div className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {isPercentagesCalculation
                      ? "Debes ingresar al menos un porcentaje para realizar el cálculo"
                      : "Debes ingresar al menos un peso para realizar el cálculo"
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
                Agregar {isPercentagesCalculation ? "porcentaje" : "peso"}
              </Button>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                >
                  Calcular
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
                  Calcular en {units === "KG" ? "LB" : "KG"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  )
} 