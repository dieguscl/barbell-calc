import { calculatePlateConfigurations, calculatePlateInventory } from './lib/calculations';

const configs = calculatePlateConfigurations({
  PR: 60,
  barWeight: 20,
  values: [70, 80, 90], // target weights => 42, 48, 54. Targets per side => 11, 14, 17
  units: "KG",
  sourceUnits: "KG",
  isPercentages: true
});

console.log(JSON.stringify(configs, null, 2));

const inventory = calculatePlateInventory(configs);
console.log("INVENTORY:", inventory);

