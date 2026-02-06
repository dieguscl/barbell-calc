export type Locale = "en" | "es" | "pt"

export const translations = {
  en: {
    // App
    appTitle: "Barbell Calculator",
    appDescription: "Calculate your barbell weights",

    // Theme toggle
    toggleTheme: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",

    // Form
    movement: "Movement",
    movementPlaceholder: "e.g. Squat",
    selectMovement: "Select a movement",
    addNew: "Add new",
    pr: "PR",
    prPlaceholder: "e.g. 320",
    barWeight: "Bar weight",
    barWeightPlaceholder: "Select bar weight",
    percentages: "Percentages",
    weights: "Weights",
    percentagesTab: "Percentages",
    manualWeightsTab: "Manual Weights",
    percentagePlaceholder: "e.g. 85",
    weightPlaceholder: "e.g. 100",
    addPercentage: "Add percentage",
    addWeight: "Add weight",
    calculate: "Calculate",
    calculateIn: "Calculate in",
    share: "Share",
    copied: "Copied",
    reset: "Reset",

    // Validation
    prRequired: "PR is required",
    selectBarWeight: "Please select the bar weight",
    atLeastOnePercentage: "You must enter at least one percentage",
    atLeastOneWeight: "You must enter at least one weight",
    fixErrors: "Please fix the following errors:",
    atLeastOnePercentageCalc: "You must enter at least one percentage to calculate",
    atLeastOneWeightCalc: "You must enter at least one weight to calculate",

    // Results
    results: "Results",
    liftAt: "Lift at",
    lift: "Lift",
    roundedWeight: "Rounded weight",
    accurate: "Accurate",
    closestConfig: "Closest configuration",
    weight: "Weight",
    calculateAnother: "Calculate another weight",
  },
  es: {
    // App
    appTitle: "Calculadora de Barra",
    appDescription: "Calcula los pesos de tu barra",

    // Theme toggle
    toggleTheme: "Cambiar tema",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",

    // Form
    movement: "Movimiento",
    movementPlaceholder: "e.g. Squat",
    selectMovement: "Selecciona un movimiento",
    addNew: "Agregar nuevo",
    pr: "PR",
    prPlaceholder: "e.g. 320",
    barWeight: "Peso de barra",
    barWeightPlaceholder: "Selecciona el peso de la barra",
    percentages: "Porcentajes",
    weights: "Pesos",
    percentagesTab: "Porcentajes",
    manualWeightsTab: "Pesos Manuales",
    percentagePlaceholder: "e.g. 85",
    weightPlaceholder: "e.g. 100",
    addPercentage: "Agregar porcentaje",
    addWeight: "Agregar peso",
    calculate: "Calcular",
    calculateIn: "Calcular en",
    share: "Compartir",
    copied: "Copiado",
    reset: "Reiniciar",

    // Validation
    prRequired: "El PR es requerido",
    selectBarWeight: "Por favor selecciona el peso de la barra",
    atLeastOnePercentage: "Debes ingresar al menos un porcentaje",
    atLeastOneWeight: "Debes ingresar al menos un peso",
    fixErrors: "Por favor corrige los siguientes errores:",
    atLeastOnePercentageCalc: "Debes ingresar al menos un porcentaje para realizar el cálculo",
    atLeastOneWeightCalc: "Debes ingresar al menos un peso para realizar el cálculo",

    // Results
    results: "Resultados",
    liftAt: "Levantamiento al",
    lift: "Levantamiento",
    roundedWeight: "Peso redondeado",
    accurate: "Preciso",
    closestConfig: "Configuración más cercana",
    weight: "Peso",
    calculateAnother: "Calcular otro peso",
  },
  pt: {
    // App
    appTitle: "Calculadora de Barra",
    appDescription: "Calcule os pesos da sua barra",

    // Theme toggle
    toggleTheme: "Alternar tema",
    light: "Claro",
    dark: "Escuro",
    system: "Sistema",

    // Form
    movement: "Movimento",
    movementPlaceholder: "e.g. Squat",
    selectMovement: "Selecione um movimento",
    addNew: "Adicionar novo",
    pr: "PR",
    prPlaceholder: "e.g. 320",
    barWeight: "Peso da barra",
    barWeightPlaceholder: "Selecione o peso da barra",
    percentages: "Porcentagens",
    weights: "Pesos",
    percentagesTab: "Porcentagens",
    manualWeightsTab: "Pesos Manuais",
    percentagePlaceholder: "e.g. 85",
    weightPlaceholder: "e.g. 100",
    addPercentage: "Adicionar porcentagem",
    addWeight: "Adicionar peso",
    calculate: "Calcular",
    calculateIn: "Calcular em",
    share: "Compartilhar",
    copied: "Copiado",
    reset: "Reiniciar",

    // Validation
    prRequired: "O PR é obrigatório",
    selectBarWeight: "Por favor selecione o peso da barra",
    atLeastOnePercentage: "Você deve inserir pelo menos uma porcentagem",
    atLeastOneWeight: "Você deve inserir pelo menos um peso",
    fixErrors: "Por favor corrija os seguintes erros:",
    atLeastOnePercentageCalc: "Você deve inserir pelo menos uma porcentagem para calcular",
    atLeastOneWeightCalc: "Você deve inserir pelo menos um peso para calcular",

    // Results
    results: "Resultados",
    liftAt: "Levantamento a",
    lift: "Levantamento",
    roundedWeight: "Peso arredondado",
    accurate: "Preciso",
    closestConfig: "Configuração mais próxima",
    weight: "Peso",
    calculateAnother: "Calcular outro peso",
  },
} as const

export type TranslationKey = keyof typeof translations.en
