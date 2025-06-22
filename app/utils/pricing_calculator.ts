/**
 * Calculateur de prix pour les modèles d'IA
 * Basé sur les tokens d'entrée et de sortie
 */

export interface ModelPricing {
    inputTokenPrice: number // Prix pour 1M de tokens d'entrée
    cachedInputTokenPrice: number // Prix pour 1M de tokens d'entrée en cache
    outputTokenPrice: number // Prix pour 1M de tokens de sortie
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
    'gpt-4o-2024-08-06': {
        inputTokenPrice: 5.0,
        cachedInputTokenPrice: 2.5,
        outputTokenPrice: 20.0,
    },
    'gpt-4.1': {
        inputTokenPrice: 2.0,
        cachedInputTokenPrice: 0.5,
        outputTokenPrice: 8.0,
    },
    // Ajouter d'autres modèles ici
}

/**
 * Calcule le prix total basé sur le modèle et les tokens
 * @param model - Le nom du modèle utilisé
 * @param inputTokens - Nombre de tokens d'entrée
 * @param outputTokens - Nombre de tokens de sortie
 * @param cachedInputTokens - Nombre de tokens d'entrée en cache (optionnel)
 * @returns Le prix total en dollars ou null si calcul impossible
 */
export function calculatePrice(
    model: string | null | undefined,
    inputTokens: number | null | undefined,
    outputTokens: number | null | undefined,
    cachedInputTokens: number | null | undefined = null
): number | null {
    // Vérification stricte des paramètres
    if (
        !model ||
        inputTokens === null ||
        inputTokens === undefined ||
        inputTokens <= 0 ||
        outputTokens === null ||
        outputTokens === undefined ||
        outputTokens <= 0
    ) {
        return null
    }

    // Normaliser le nom du modèle (enlever les espaces et mettre en minuscules)
    const normalizedModel = model.toLowerCase().trim()

    // Récupérer le pricing du modèle
    const pricing = MODEL_PRICING[normalizedModel]
    if (!pricing) {
        console.warn(`Modèle non reconnu pour le pricing: ${model}`)
        return null
    }

    // Calculer le coût des tokens d'entrée
    const regularInputTokens =
        cachedInputTokens && cachedInputTokens > 0
            ? Math.max(0, inputTokens - cachedInputTokens)
            : inputTokens
    const inputCost = (regularInputTokens * pricing.inputTokenPrice) / 1_000_000

    // Calculer le coût des tokens d'entrée en cache
    const cachedInputCost =
        cachedInputTokens && cachedInputTokens > 0
            ? (cachedInputTokens * pricing.cachedInputTokenPrice) / 1_000_000
            : 0

    // Calculer le coût des tokens de sortie
    const outputCost = (outputTokens * pricing.outputTokenPrice) / 1_000_000

    // Retourner le coût total
    return inputCost + cachedInputCost + outputCost
}

/**
 * Formate le prix en euros avec le bon nombre de décimales
 * @param price - Prix en dollars
 * @param exchangeRate - Taux de change USD vers EUR (par défaut 0.92)
 * @returns Prix formaté en euros
 */
export function formatPriceInEuros(price: number | null, exchangeRate: number = 0.92): string {
    if (!price) return '-'

    const priceInEuros = price * exchangeRate

    if (priceInEuros < 0.01) {
        return `${(priceInEuros * 1000).toFixed(2)}m€` // Millièmes d'euros
    } else if (priceInEuros < 1) {
        return `${(priceInEuros * 100).toFixed(2)}c€` // Centimes d'euros
    } else {
        return `${priceInEuros.toFixed(2)}€`
    }
}

/**
 * Calcule les statistiques de coût pour une liste de posts
 */
export function calculateCostStats(
    posts: Array<{
        model?: string | null
        inputTokens?: number | null
        outputTokens?: number | null
        price?: number | null
    }>
) {
    const stats = {
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        postCount: 0,
        modelBreakdown: {} as Record<
            string,
            {
                cost: number
                inputTokens: number
                outputTokens: number
                postCount: number
            }
        >,
    }

    posts.forEach((post) => {
        if (post.price && post.inputTokens && post.outputTokens && post.model) {
            stats.totalCost += post.price
            stats.totalInputTokens += post.inputTokens
            stats.totalOutputTokens += post.outputTokens
            stats.postCount += 1

            if (!stats.modelBreakdown[post.model]) {
                stats.modelBreakdown[post.model] = {
                    cost: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    postCount: 0,
                }
            }

            stats.modelBreakdown[post.model].cost += post.price
            stats.modelBreakdown[post.model].inputTokens += post.inputTokens
            stats.modelBreakdown[post.model].outputTokens += post.outputTokens
            stats.modelBreakdown[post.model].postCount += 1
        }
    })

    return stats
}
