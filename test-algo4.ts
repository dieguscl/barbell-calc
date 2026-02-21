import { calculatePlateConfigurations, calculatePlateInventory } from './lib/calculations';

const configs = calculatePlateConfigurations({
  PR: 60,
  barWeight: 15, // Let's try 15kg bar just in case
  values: [70, 80, 90], // Targets: 42 (13.5x2), 48 (16.5x2), 54 (19.5x2)
  units: "KG",
  sourceUnits: "KG",
  isPercentages: true
});

const inventory = calculatePlateInventory(configs);
console.log(JSON.stringify(configs, null, 2));
console.log("INVENTORY:", inventory);

