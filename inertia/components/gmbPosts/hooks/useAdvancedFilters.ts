import { useState, useCallback, useEffect, useRef } from 'react'
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

/**
 * Hook pour gérer les filtres avancés avec harmonisation intelligente
 * 
 * NOUVELLES FONCTIONNALITÉS D'HARMONISATION :
 * -------------------------------------------
 * - Communication bidirectionnelle avec les filtres rapides
 * - Détection automatique des conflits
 * - Résolution intelligente des conflits
 * - Synchronisation d'état améliorée
 * - Gestion unifiée des réinitialisations
 */
export const useAdvancedFilters = (
    initialFilters: FilterState,
    onConflictDetected?: (conflicts: any[]) => void
) => {
    // Refs pour le tracking d'état
    const isFirstRender = useRef(true)
    // Ref pour tracker si nous avons des filtres avancés actifs
    const hasActiveAdvancedFilters = useRef(false)
    // Ref pour tracker les derniers filtres de base
    const lastBasicFiltersState = useRef<string>('')
    
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(() => {
        // Initialiser depuis l'URL si des filtres avancés sont présents (côté client uniquement)
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const urlFilters = urlParamsToAdvancedFilters(urlParams)
            hasActiveAdvancedFilters.current = urlFilters.isActive
            return urlFilters
        }
        return createDefaultAdvancedFilterState()
    })

    const [isModalOpen, setIsModalOpen] = useState(false)

    // Fonction pour vérifier si des filtres avancés sont actifs
    const checkHasActiveAdvancedFilters = (filters: AdvancedFilterState) => {
        return filters.isActive && filters.groups.some(group =>
            group.filters.some(filter =>
                filter.value !== '' && filter.value !== null && filter.value !== undefined
            )
        )
    }

    // Fonction pour détecter les conflits avec les filtres de base
    const detectConflictsWithBasic = useCallback((advFilters: AdvancedFilterState, basicFilters: FilterState) => {
        if (!advFilters.isActive) return []

        const conflicts = []
        
        // Mapping des propriétés entre filtres avancés et de base
        const propertyMappings = [
            { advanced: 'text', basic: 'search' },
            { advanced: 'status', basic: 'status' },
            { advanced: 'client', basic: 'client' },
            { advanced: 'project_name', basic: 'project' }
        ]

        // Vérifier chaque mapping
        propertyMappings.forEach(({ advanced, basic }) => {
            const basicValue = basicFilters[basic as keyof FilterState]
            if (basicValue) {
                const hasAdvancedFilter = advFilters.groups.some(group =>
                    group.filters.some(filter =>
                        filter.property === advanced && 
                        filter.value !== '' && 
                        filter.value !== null
                    )
                )
                if (hasAdvancedFilter) {
                    conflicts.push({ advanced, basic, value: basicValue })
                }
            }
        })

        // Vérifier les dates
        if ((basicFilters.dateFrom || basicFilters.dateTo)) {
            const hasAdvancedDateFilter = advFilters.groups.some(group =>
                group.filters.some(filter =>
                    filter.property === 'date' && 
                    filter.value !== '' && 
                    filter.value !== null
                )
            )
            if (hasAdvancedDateFilter) {
                conflicts.push({ advanced: 'date', basic: 'date', value: 'date_range' })
            }
        }

        return conflicts
    }, [])

    // Initialiser et synchroniser les filtres avec harmonisation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const urlFilters = urlParamsToAdvancedFilters(urlParams)
            
            const hasLocalActiveFilters = checkHasActiveAdvancedFilters(advancedFilters)
            const hasIncomingActiveFilters = checkHasActiveAdvancedFilters(urlFilters)
            const basicFiltersChanged = JSON.stringify(initialFilters) !== lastBasicFiltersState.current
            
            if (isFirstRender.current) {
                // Premier rendu : prendre les filtres de l'URL
                console.log('=== INITIALISATION FILTRES AVANCÉS HARMONISÉS (PREMIER RENDU) ===')
                console.log('Filtres URL:', urlFilters)
                console.log('Filtres de base:', initialFilters)
                if (urlFilters.isActive) {
                    setAdvancedFilters(urlFilters)
                    // Détecter les conflits dès l'initialisation
                    const conflicts = detectConflictsWithBasic(urlFilters, initialFilters)
                    if (conflicts.length > 0 && onConflictDetected) {
                        console.log('🚨 Conflits détectés à l\'initialisation:', conflicts)
                        onConflictDetected(conflicts)
                    }
                }
                hasActiveAdvancedFilters.current = hasIncomingActiveFilters
                isFirstRender.current = false
                lastBasicFiltersState.current = JSON.stringify(initialFilters)
                console.log('===================================================================')
            } else if (!hasLocalActiveFilters && hasIncomingActiveFilters && !basicFiltersChanged) {
                // Si aucun filtre local actif mais des filtres arrivent de l'URL
                console.log('=== SYNCHRONISATION FILTRES AVANCÉS (PAS DE FILTRES LOCAUX) ===')
                console.log('Filtres URL:', urlFilters)
                setAdvancedFilters(urlFilters)
                hasActiveAdvancedFilters.current = hasIncomingActiveFilters
                console.log('==================================================================')
            } else if (basicFiltersChanged && hasLocalActiveFilters) {
                // Si les filtres de base ont changé et qu'on a des filtres avancés actifs
                console.log('=== VÉRIFICATION CONFLITS FILTRES DE BASE CHANGÉS ===')
                const conflicts = detectConflictsWithBasic(advancedFilters, initialFilters)
                if (conflicts.length > 0 && onConflictDetected) {
                    console.log('⚠️ Nouveaux conflits détectés:', conflicts)
                    onConflictDetected(conflicts)
                }
                lastBasicFiltersState.current = JSON.stringify(initialFilters)
                console.log('======================================================')
            } else {
                // Conserver les filtres avancés locaux lors des mises à jour de données
                console.log('=== FILTRES AVANCÉS LOCAUX PRÉSERVÉS ===')
                console.log('Filtres locaux maintenus:', advancedFilters)
                console.log('Filtres URL ignorés:', urlFilters)
                console.log('============================================')
            }
        }
    }, [initialFilters, detectConflictsWithBasic, onConflictDetected])

    // Mettre à jour le tracking des filtres avancés actifs
    useEffect(() => {
        hasActiveAdvancedFilters.current = checkHasActiveAdvancedFilters(advancedFilters)
    }, [advancedFilters])

    // Appliquer les filtres avancés avec détection de conflits
    const applyAdvancedFilters = useCallback((filters: AdvancedFilterState) => {
        console.log('=== APPLICATION FILTRES AVANCÉS HARMONISÉS ===')
        console.log('Filtres à appliquer:', filters)
        
        // Détecter les conflits avant application
        const conflicts = detectConflictsWithBasic(filters, initialFilters)
        if (conflicts.length > 0) {
            console.log('⚠️ Conflits détectés lors de l\'application:', conflicts)
            if (onConflictDetected) {
                onConflictDetected(conflicts)
            }
        }
        
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

        console.log('Paramètres finaux:', allParams)
        console.log('===============================================')

        // Naviguer avec Inertia avec préservation d'état
        if (typeof window !== 'undefined') {
            router.get(window.location.pathname, allParams, {
                preserveState: true,   // ✅ Préserver l'état des autres filtres
                preserveScroll: true,  // ✅ Préserver la position de scroll
                replace: true
            })
        }
    }, [initialFilters, detectConflictsWithBasic, onConflictDetected])

    // Réinitialiser les filtres avancés avec notification de l'harmonisation
    const resetAdvancedFilters = useCallback(() => {
        console.log('=== RÉINITIALISATION FILTRES AVANCÉS HARMONISÉS ===')
        
        const resetFilters = createDefaultAdvancedFilterState()
        
        setAdvancedFilters(resetFilters)
        hasActiveAdvancedFilters.current = false // Mettre à jour le tracking
        
        // Garder seulement les filtres de base
        const basicParams = { ...initialFilters }
        delete basicParams.advanced_filters
        
        // Supprimer les paramètres vides
        Object.keys(basicParams).forEach(key => {
            if (!basicParams[key as keyof typeof basicParams] || basicParams[key as keyof typeof basicParams] === '') {
                delete basicParams[key as keyof typeof basicParams]
            }
        })

        console.log('Paramètres après reset:', basicParams)
        console.log('====================================================')

        if (typeof window !== 'undefined') {
            router.get(window.location.pathname, basicParams, {
                preserveState: true,   // ✅ Préserver l'état des autres filtres
                preserveScroll: true,  // ✅ Préserver la position de scroll
                replace: true
            })
        }
    }, [initialFilters])

    // Ouvrir/fermer la modal - fonctions conservées pour compatibilité
    const openModal = useCallback(() => setIsModalOpen(true), [])
    const closeModal = useCallback(() => setIsModalOpen(false), [])

    // Compter les filtres actifs (amélioré)
    const activeFiltersCount = advancedFilters.groups.reduce((acc, group) => 
        acc + group.filters.filter(filter => 
            filter.value !== '' && filter.value !== null && filter.value !== undefined
        ).length, 0
    )

    // Vérifier si des filtres avancés sont actifs (utilise la fonction déjà définie)
    const hasActiveAdvancedFiltersValue = checkHasActiveAdvancedFilters(advancedFilters)

    return {
        advancedFilters,
        isModalOpen,
        activeFiltersCount,
        hasActiveAdvancedFilters: hasActiveAdvancedFiltersValue,
        openModal,
        closeModal,
        applyAdvancedFilters,
        resetAdvancedFilters,
        // Nouvelles fonctions pour l'harmonisation
        detectConflictsWithBasic: () => detectConflictsWithBasic(advancedFilters, initialFilters),
        hasConflictsWithBasic: () => detectConflictsWithBasic(advancedFilters, initialFilters).length > 0
    }
}