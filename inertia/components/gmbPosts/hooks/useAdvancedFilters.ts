import { useState, useCallback, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { 
    AdvancedFilterState, 
    FilterState,
    ExtendedFilterState,
    createDefaultAdvancedFilterState
} from '../types'
import { 
    advancedFiltersToUrlParams, 
    urlParamsToAdvancedFilters 
} from '../components/AdvancedFilters'

export const useAdvancedFilters = (initialFilters: FilterState) => {
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(() => {
        // Initialiser depuis l'URL si des filtres avancés sont présents (côté client uniquement)
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            return urlParamsToAdvancedFilters(urlParams)
        }
        return createDefaultAdvancedFilterState()
    })

    const [isModalOpen, setIsModalOpen] = useState(false)

    // Initialiser les filtres depuis l'URL côté client après l'hydratation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const urlFilters = urlParamsToAdvancedFilters(urlParams)
            if (urlFilters.isActive) {
                setAdvancedFilters(urlFilters)
            }
        }
    }, [])

    // Appliquer les filtres avancés
    const applyAdvancedFilters = useCallback((filters: AdvancedFilterState) => {
        setAdvancedFilters(filters)
        
        // Construire les paramètres pour Inertia
        const urlParams = advancedFiltersToUrlParams(filters)
        
        // Combiner avec les filtres existants
        const allParams = {
            ...initialFilters,
            ...urlParams,
            page: 1 // Reset à la première page
        }

        // Supprimer les paramètres vides
        Object.keys(allParams).forEach(key => {
            if (!allParams[key as keyof typeof allParams] || allParams[key as keyof typeof allParams] === '') {
                delete allParams[key as keyof typeof allParams]
            }
        })

        // Naviguer avec Inertia
        if (typeof window !== 'undefined') {
            router.get(window.location.pathname, allParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            })
        }
    }, [initialFilters])

    // Réinitialiser les filtres avancés
    const resetAdvancedFilters = useCallback(() => {
        const resetFilters = createDefaultAdvancedFilterState()
        
        setAdvancedFilters(resetFilters)
        
        // Garder seulement les filtres de base
        const basicParams = { ...initialFilters }
        delete basicParams.advanced_filters
        
        // Supprimer les paramètres vides
        Object.keys(basicParams).forEach(key => {
            if (!basicParams[key as keyof typeof basicParams] || basicParams[key as keyof typeof basicParams] === '') {
                delete basicParams[key as keyof typeof basicParams]
            }
        })

        if (typeof window !== 'undefined') {
            router.get(window.location.pathname, basicParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true
            })
        }
    }, [initialFilters])

    // Ouvrir/fermer la modal - fonctions conservées pour compatibilité
    const openModal = useCallback(() => setIsModalOpen(true), [])
    const closeModal = useCallback(() => setIsModalOpen(false), [])

    // Compter les filtres actifs
    const activeFiltersCount = advancedFilters.groups.reduce((acc, group) => 
        acc + group.filters.filter(filter => 
            filter.value !== '' && filter.value !== null && filter.value !== undefined
        ).length, 0
    )

    // Vérifier si des filtres avancés sont actifs
    const hasActiveAdvancedFilters = advancedFilters.isActive && activeFiltersCount > 0

    return {
        advancedFilters,
        isModalOpen,
        activeFiltersCount,
        hasActiveAdvancedFilters,
        openModal,
        closeModal,
        applyAdvancedFilters,
        resetAdvancedFilters
    }
}