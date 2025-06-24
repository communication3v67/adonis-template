import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import { 
    FilterState, 
    AdvancedFilterState, 
    createDefaultAdvancedFilterState 
} from '../types'
import { 
    advancedFiltersToUrlParams, 
    urlParamsToAdvancedFilters 
} from '../components/AdvancedFilters'

interface UnifiedFilterState {
    basic: FilterState
    advanced: AdvancedFilterState
}

/**
 * Hook unifié pour gérer TOUS les filtres (de base et avancés) 
 * avec persistance URL et préservation d'état
 */
export const useUnifiedFilters = (initialFilters: FilterState) => {
    // Ref pour savoir si c'est la première initialisation
    const isFirstRender = useRef(true)
    
    // État unifié des filtres
    const [unifiedFilters, setUnifiedFilters] = useState<UnifiedFilterState>(() => {
        // Initialiser les filtres avancés depuis l'URL côté client
        let advancedFromUrl = createDefaultAdvancedFilterState()
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            advancedFromUrl = urlParamsToAdvancedFilters(urlParams)
        }
        
        return {
            basic: initialFilters,
            advanced: advancedFromUrl
        }
    })
    
    const [isApplyingFilters, setIsApplyingFilters] = useState(false)

    // Synchroniser avec les props SEULEMENT au premier rendu
    useEffect(() => {
        if (isFirstRender.current) {
            console.log('=== INITIALISATION FILTRES UNIFIÉS ===')
            console.log('Filtres de base props:', initialFilters)
            
            let advancedFromUrl = createDefaultAdvancedFilterState()
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search)
                advancedFromUrl = urlParamsToAdvancedFilters(urlParams)
                console.log('Filtres avancés URL:', advancedFromUrl)
            }
            
            setUnifiedFilters({
                basic: initialFilters,
                advanced: advancedFromUrl
            })
            
            isFirstRender.current = false
            console.log('======================================')
        } else {
            // Après le premier rendu, préserver les filtres locaux
            console.log('=== PRÉSERVATION FILTRES UNIFIÉS ===')
            console.log('Filtres préservés, props ignorées')
            console.log('==================================')
        }
    }, [initialFilters])

    // Fonctions utilitaires
    const checkHasActiveBasicFilters = (basicFilters: FilterState) => {
        return !!(
            basicFilters.search ||
            basicFilters.status ||
            basicFilters.client ||
            basicFilters.project ||
            basicFilters.dateFrom ||
            basicFilters.dateTo ||
            basicFilters.sortBy !== 'date' ||
            basicFilters.sortOrder !== 'desc'
        )
    }

    const checkHasActiveAdvancedFilters = (advancedFilters: AdvancedFilterState) => {
        return advancedFilters.isActive && advancedFilters.groups.some(group =>
            group.filters.some(filter =>
                filter.value !== '' && filter.value !== null && filter.value !== undefined
            )
        )
    }

    // Application unifiée des filtres
    const applyUnifiedFilters = useCallback((newFilters?: Partial<UnifiedFilterState>) => {
        const filtersToApply = newFilters ? { ...unifiedFilters, ...newFilters } : unifiedFilters
        
        console.log('=== APPLICATION FILTRES UNIFIÉS ===')
        console.log('Filtres à appliquer:', filtersToApply)
        
        setIsApplyingFilters(true)

        // Construire tous les paramètres
        let allParams = { ...filtersToApply.basic }
        
        // Ajouter les filtres avancés s'ils sont actifs
        if (checkHasActiveAdvancedFilters(filtersToApply.advanced)) {
            const advancedParams = advancedFiltersToUrlParams(filtersToApply.advanced)
            allParams = { ...allParams, ...advancedParams }
        }
        
        console.log('Paramètres URL finaux:', allParams)
        console.log('=================================')

        router.get('/gmb-posts', allParams, {
            preserveState: true,
            replace: true,
            onFinish: () => {
                setIsApplyingFilters(false)
            },
        })
    }, [unifiedFilters])

    // Mise à jour des filtres de base
    const updateBasicFilter = useCallback((key: keyof FilterState, value: string) => {
        setUnifiedFilters(prev => ({
            ...prev,
            basic: {
                ...prev.basic,
                [key]: value
            }
        }))
    }, [])

    // Mise à jour des filtres avancés
    const updateAdvancedFilters = useCallback((newAdvancedFilters: AdvancedFilterState) => {
        const updatedFilters = {
            ...unifiedFilters,
            advanced: newAdvancedFilters
        }
        setUnifiedFilters(updatedFilters)
        // Auto-application pour les filtres avancés
        applyUnifiedFilters(updatedFilters)
    }, [unifiedFilters, applyUnifiedFilters])

    // Gestion de la plage de dates
    const updateDateRange = useCallback((dateFrom: string, dateTo: string) => {
        setUnifiedFilters(prev => ({
            ...prev,
            basic: {
                ...prev.basic,
                dateFrom,
                dateTo
            }
        }))
    }, [])

    // Réinitialisation des filtres de base
    const resetBasicFilters = useCallback(() => {
        const resetBasic = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
            dateFrom: '',
            dateTo: '',
        }
        
        const updatedFilters = {
            ...unifiedFilters,
            basic: resetBasic
        }
        
        setUnifiedFilters(updatedFilters)
        applyUnifiedFilters(updatedFilters)
    }, [unifiedFilters, applyUnifiedFilters])

    // Réinitialisation des filtres avancés
    const resetAdvancedFilters = useCallback(() => {
        const resetAdvanced = createDefaultAdvancedFilterState()
        
        const updatedFilters = {
            ...unifiedFilters,
            advanced: resetAdvanced
        }
        
        setUnifiedFilters(updatedFilters)
        applyUnifiedFilters(updatedFilters)
    }, [unifiedFilters, applyUnifiedFilters])

    // Réinitialisation globale
    const resetAllFilters = useCallback(() => {
        const resetFilters = {
            basic: {
                search: '',
                status: '',
                client: '',
                project: '',
                sortBy: 'date',
                sortOrder: 'desc',
                dateFrom: '',
                dateTo: '',
            },
            advanced: createDefaultAdvancedFilterState()
        }
        
        setUnifiedFilters(resetFilters)
        applyUnifiedFilters(resetFilters)
    }, [applyUnifiedFilters])

    // Gestion du tri
    const handleSort = useCallback((sortBy: string, sortOrder: string) => {
        setUnifiedFilters(prev => ({
            ...prev,
            basic: {
                ...prev.basic,
                sortBy,
                sortOrder
            }
        }))
    }, [])

    // Auto-application avec debounce pour la recherche
    useEffect(() => {
        if (isFirstRender.current) return

        const searchValue = unifiedFilters.basic.search
        const hasChanged = searchValue !== initialFilters.search

        if (hasChanged && searchValue.length > 0) {
            const timeoutId = setTimeout(() => {
                console.log('=== AUTO-APPLICATION RECHERCHE UNIFIÉE ===')
                applyUnifiedFilters()
            }, 800)

            return () => clearTimeout(timeoutId)
        } else if (hasChanged) {
            // Application immédiate pour les autres changements
            applyUnifiedFilters()
        }
    }, [
        unifiedFilters.basic.search,
        unifiedFilters.basic.status,
        unifiedFilters.basic.client,
        unifiedFilters.basic.project,
        unifiedFilters.basic.sortBy,
        unifiedFilters.basic.sortOrder,
        unifiedFilters.basic.dateFrom,
        unifiedFilters.basic.dateTo,
        applyUnifiedFilters
    ])

    // Calculs des états
    const basicActiveFiltersCount = [
        unifiedFilters.basic.search,
        unifiedFilters.basic.status,
        unifiedFilters.basic.client,
        unifiedFilters.basic.project,
        unifiedFilters.basic.dateFrom,
        unifiedFilters.basic.dateTo,
    ].filter(Boolean).length

    const advancedActiveFiltersCount = unifiedFilters.advanced.groups.reduce((acc, group) => 
        acc + group.filters.filter(filter => 
            filter.value !== '' && filter.value !== null && filter.value !== undefined
        ).length, 0
    )

    const hasActiveBasicFilters = checkHasActiveBasicFilters(unifiedFilters.basic)
    const hasActiveAdvancedFilters = checkHasActiveAdvancedFilters(unifiedFilters.advanced)
    const hasAnyActiveFilters = hasActiveBasicFilters || hasActiveAdvancedFilters

    return {
        // États
        filters: unifiedFilters.basic,
        advancedFilters: unifiedFilters.advanced,
        isApplyingFilters,
        
        // Compteurs
        basicActiveFiltersCount,
        advancedActiveFiltersCount,
        totalActiveFilters: basicActiveFiltersCount + advancedActiveFiltersCount,
        
        // États booléens
        hasActiveBasicFilters,
        hasActiveAdvancedFilters,
        hasAnyActiveFilters,
        
        // Actions de base
        updateFilter: updateBasicFilter,
        updateDateRange,
        handleSort,
        
        // Actions avancées
        updateAdvancedFilters,
        
        // Actions globales
        applyFilters: applyUnifiedFilters,
        resetBasicFilters,
        resetAdvancedFilters,
        resetAllFilters,
    }
}