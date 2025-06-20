// Utilitaires pour les filtres avancés

export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Convertit les filtres avancés en paramètres d'URL
export const advancedFiltersToUrlParams = (filters: any): Record<string, string> => {
    if (!filters.isActive || filters.groups.length === 0) {
        return {}
    }

    const params: Record<string, string> = {}
    
    // Encoder les filtres avancés en JSON pour l'URL
    params.advanced_filters = JSON.stringify({
        groups: filters.groups.filter((group: any) => 
            group.filters.some((filter: any) => 
                filter.value !== '' && filter.value !== null && filter.value !== undefined
            )
        )
    })

    return params
}

// Parse les filtres avancés depuis les paramètres d'URL
export const urlParamsToAdvancedFilters = (params: URLSearchParams): any => {
    const advancedParam = params.get('advanced_filters')
    
    if (!advancedParam) {
        return {
            groups: [],
            isActive: false
        }
    }

    try {
        const parsed = JSON.parse(advancedParam)
        return {
            groups: parsed.groups || [],
            isActive: parsed.groups?.length > 0
        }
    } catch (error) {
        console.error('Erreur parsing filtres avancés:', error)
        return {
            groups: [],
            isActive: false
        }
    }
}