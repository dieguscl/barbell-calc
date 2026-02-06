import { calculatePlateConfigurations } from "@/lib/calculations";
import { PlateConfigurations } from "./components/plate-configurations";
import { ResultsTitle } from "./components/results-title";
import { SearchParams } from "next/dist/server/request/search-params";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = {
  title: 'Results',
}

export default async function ResultsPage({
  searchParams: searchParamsPromise,
}: PageProps) {
  const searchParams = await searchParamsPromise;

  const units = searchParams.units as "KG" | "LB";
  const sourceUnits = searchParams.sourceUnits as "KG" | "LB";
  const barWeight = parseFloat(searchParams.barWeight as string);
  const isPercentages = searchParams.isPercentages === "true";
  const PR = searchParams.PR ? parseFloat(searchParams.PR as string) : undefined;

  const values = Object.entries(searchParams)
    .filter(([key]) => key.startsWith('value'))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_key, value]) => parseFloat(Array.isArray(value) ? value[0] : value ?? '0'));

  const configurations = calculatePlateConfigurations({
    PR,
    barWeight,
    values,
    units,
    sourceUnits,
    isPercentages,
  });

  return (
    <main className="container mx-auto p-4">
      <ResultsTitle />
      <PlateConfigurations
        configurations={configurations}
        units={units}
        sourceUnits={sourceUnits}
        PR={PR}
        isPercentages={isPercentages}
      />
    </main>
  );
}
