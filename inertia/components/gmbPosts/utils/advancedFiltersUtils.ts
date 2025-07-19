import { AdvancedFilterState } from '../types'

/**
 * Convertit les filtres avancés en paramètres URL pour les requêtes serveur
 */
export const advancedFiltersToUrlParams = (advancedFilters: AdvancedFilterState): Record<string, string> => {
    if (!advancedFilters.isActive || !advancedFilters.groups || advancedFilters.groups.length === 0) {
        return {}
    }

    // Sérialiser les filtres avancés en JSON pour l'envoi au serveur
    const serializedFilters = JSON.stringify({
        groups: advancedFilters.groups.map(group => ({
            condition: group.condition,
            filters: group.filters.filter(filter => 
                filter.property && 
                filter.operator && 
                filter.value !== '' && 
                filter.value !== null && 
                filter.value !== undefined
            )
        })).filter(group => group.filters.length > 0)
    })

    // Retourner les paramètres pour l'URL
    return {
        advanced_filters: serializedFilters
    }
}

/**
 * Convertit les paramètres URL en filtres avancés
 */
export const urlParamsToAdvancedFilters = (params: URLSearchParams): AdvancedFilterState | null => {
    const advancedFiltersParam = params.get('advanced_filters')
    
    if (!advancedFiltersParam) {
        return null
    }

    try {
        const parsed = JSON.parse(advancedFiltersParam)
        return {
            isActive: true,
            groups: parsed.groups || []
        }
    } catch (error) {
        console.error('Erreur parsing filtres avancés depuis URL:', error)
        return null
    }
}

/**
 * Génère une signature unique pour les filtres avancés (pour détection de changements)
 */
export const getAdvancedFiltersSignature = (advancedFilters: AdvancedFilterState): string => {
    if (!advancedFilters.isActive || !advancedFilters.groups || advancedFilters.groups.length === 0) {
        return ''
    }

    // Créer une signature basée sur le contenu des filtres
    const filtersContent = advancedFilters.groups.map(group => ({
        condition: group.condition,
        filters: group.filters
            .filter(filter => 
                filter.property && 
                filter.operator && 
                filter.value !== '' && 
                filter.value !== null && 
                filter.value !== undefined
            )
            .map(filter => `${filter.property}:${filter.operator}:${JSON.stringify(filter.value)}`)
            .sort() // Trier pour avoir une signature stable
    })).filter(group => group.filters.length > 0)

    return JSON.stringify(filtersContent)
}

/**
 * Vérifie si deux états de filtres avancés sont équivalents
 */
export const areAdvancedFiltersEqual = (
    filters1: AdvancedFilterState | undefined, 
    filters2: AdvancedFilterState | undefined
): boolean => {
    const sig1 = filters1 ? getAdvancedFiltersSignature(filters1) : ''
    const sig2 = filters2 ? getAdvancedFiltersSignature(filters2) : ''
    return sig1 === sig2
}
