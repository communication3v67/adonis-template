/**
 * Utilitaires pour le calcul et l'affichage des prix côté frontend
 */

export interface ModelPricing {
  inputTokenPrice: number  // Prix pour 1M de tokens d'entrée
  cachedInputTokenPrice: number  // Prix pour 1M de tokens d'entrée en cache
  outputTokenPrice: number  // Prix pour 1M de tokens de sortie
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': {
    inputTokenPrice: 5.00,
    cachedInputTokenPrice: 2.50,
    outputTokenPrice: 20.00,
  },
  'gpt-4.1': {
    inputTokenPrice: 2.00,
    cachedInputTokenPrice: 0.50,
    outputTokenPrice: 8.00,
  },
}

/**
 * Calcule le prix en temps réel côté frontend
 */
export function calculatePrice(
  model: string | null | undefined,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
  cachedInputTokens: number | null | undefined = null
): number | null {
  // Vérification stricte des paramètres
  if (!model || 
      inputTokens === null || inputTokens === undefined || inputTokens <= 0 ||
      outputTokens === null || outputTokens === undefined || outputTokens <= 0) {
    return null
  }

  const normalizedModel = model.toLowerCase().trim()
  const pricing = MODEL_PRICING[normalizedModel]
  if (!pricing) {
    return null
  }

  const regularInputTokens = (cachedInputTokens && cachedInputTokens > 0)
    ? Math.max(0, inputTokens - cachedInputTokens)
    : inputTokens
  const inputCost = (regularInputTokens * pricing.inputTokenPrice) / 1_000_000
  const cachedInputCost = (cachedInputTokens && cachedInputTokens > 0)
    ? (cachedInputTokens * pricing.cachedInputTokenPrice) / 1_000_000 
    : 0
  const outputCost = (outputTokens * pricing.outputTokenPrice) / 1_000_000

  return inputCost + cachedInputCost + outputCost
}

/**
 * Formate le prix pour l'affichage
 */
export function formatPrice(price: number | null, currency: string = '€'): string {
  if (!price || price === 0) return '-'
  
  // Convertir USD vers EUR (taux approximatif)
  const priceInEuros = price * 0.92
  
  if (priceInEuros < 0.001) {
    return `${(priceInEuros * 1000).toFixed(3)}m${currency}` // Millièmes
  } else if (priceInEuros < 0.01) {
    return `${(priceInEuros * 1000).toFixed(2)}m${currency}` // Millièmes
  } else if (priceInEuros < 1) {
    return `${(priceInEuros * 100).toFixed(2)}c${currency}` // Centimes
  } else {
    return `${priceInEuros.toFixed(4)}${currency}`
  }
}

/**
 * Calcule et formate le prix en temps réel
 */
export function calculateAndFormatPrice(
  model: string | null,
  inputTokens: number | null,
  outputTokens: number | null
): string {
  const price = calculatePrice(model, inputTokens, outputTokens)
  return formatPrice(price)
}

/**
 * Obtient les informations de pricing pour un modèle
 */
export function getModelPricing(model: string | null): ModelPricing | null {
  if (!model) return null
  const normalizedModel = model.toLowerCase().trim()
  return MODEL_PRICING[normalizedModel] || null
}

/**
 * Liste des modèles disponibles
 */
export function getAvailableModels(): string[] {
  return Object.keys(MODEL_PRICING)
}
