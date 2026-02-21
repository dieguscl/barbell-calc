import { calculatePlateConfigurations, calculatePlateInventory } from './lib/calculations';

const configs = calculatePlateConfigurations({
  PR: 60,
  barWeight: 20,
  values: [70, 80, 90],
  units: "KG",
  sourceUnits: "KG",
  isPercentages: true
});

console.log(JSON.stringify(configs, null, 2));
