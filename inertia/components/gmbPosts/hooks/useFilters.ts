import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import { FilterState, AdvancedFilterState } from '../types'

/**
 * Hook personnalisé pour gérer les filtres avec harmonisation avancée
 * Version améliorée qui gère les conflits avec les filtres avancés
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Détection des conflits avec les filtres avancés
 * - Synchronisation intelligente entre les deux systèmes
 * - Préservation des filtres lors des mises à jour
 * - Gestion unifiée des actions de réinitialisation
 */
export const useFilters = (
    initialFilters: FilterState, 
    advancedFilters?: AdvancedFilterState
) => {
    const [localFilters, setLocalFilters] = useState(initialFilters)
    const [isApplyingFilters, setIsApplyingFilters] = useState(false)
    const [forceUpdateKey, setForceUpdateKey] = useState(0) // Clé pour forcer le re-render
    
    // Refs pour le tracking d'état
    const isFirstRender = useRef(true)
    // Ref pour tracker si nous avons des filtres locaux actifs
    const hasActiveFilters = useRef(false)
    // Ref pour tracker l'état des filtres avancés
    const lastAdvancedFiltersState = useRef<string>('')

    // Fonction pour vérifier si des filtres sont actifs
    const checkHasActiveFilters = (filters: FilterState) => {
        return !!(
            filters.search ||
            filters.status ||
            filters.client ||
            filters.project ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.sortBy !== 'date' ||
            filters.sortOrder !== 'desc'
        )
    }

    // Fonction pour détecter les conflits avec les filtres avancés
    const detectConflictsWithAdvanced = useCallback((basicFilters: FilterState, advFilters?: AdvancedFilterState) => {
        if (!advFilters?.isActive) return []

        const conflicts = []
        
        // Mapping des propriétés entre filtres de base et avancés
        const propertyMappings = [
            { basic: 'search', advanced: 'text' },
            { basic: 'status', advanced: 'status' },
            { basic: 'client', advanced: 'client' },
            { basic: 'project', advanced: 'project_name' }
        ]

        // Vérifier chaque mapping
        propertyMappings.forEach(({ basic, advanced }) => {
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
                    conflicts.push({ basic, advanced, value: basicValue })
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
                conflicts.push({ basic: 'date', advanced: 'date', value: 'date_range' })
            }
        }

        return conflicts
    }, [])

    // Fonction pour nettoyer les filtres en conflit
    const clearConflictingFilters = useCallback((conflicts: any[]) => {
        const updatedFilters = { ...localFilters }
        
        conflicts.forEach(({ basic }) => {
            if (basic === 'date') {
                updatedFilters.dateFrom = ''
                updatedFilters.dateTo = ''
            } else {
                updatedFilters[basic as keyof FilterState] = ''
            }
        })
        
        console.log('🧹 Nettoyage des filtres en conflit:', conflicts.map(c => c.basic))
        setLocalFilters(updatedFilters)
        return updatedFilters
    }, [localFilters])

    // Synchroniser les filtres locaux avec les props avec gestion des conflits
    useEffect(() => {
        const hasLocalActiveFilters = checkHasActiveFilters(localFilters)
        const hasIncomingActiveFilters = checkHasActiveFilters(initialFilters)
        const advancedStateChanged = JSON.stringify(advancedFilters) !== lastAdvancedFiltersState.current
        
        if (isFirstRender.current) {
            // Premier rendu : prendre les filtres du serveur
            console.log('=== INITIALISATION FILTRES HARMONISÉS (PREMIER RENDU) ===')
            console.log('Filtres props:', initialFilters)
            console.log('Filtres avancés:', advancedFilters)
            setLocalFilters(initialFilters)
            hasActiveFilters.current = hasIncomingActiveFilters
            isFirstRender.current = false
            lastAdvancedFiltersState.current = JSON.stringify(advancedFilters)
            console.log('===========================================================')
        } else if (!hasLocalActiveFilters && hasIncomingActiveFilters && !advancedStateChanged) {
            // Si aucun filtre local actif mais des filtres arrivent du serveur (et pas de changement avancé)
            console.log('=== SYNCHRONISATION FILTRES (PAS DE FILTRES LOCAUX) ===')
            console.log('Filtres props:', initialFilters)
            setLocalFilters(initialFilters)
            hasActiveFilters.current = hasIncomingActiveFilters
            console.log('=========================================================')
        } else if (advancedStateChanged) {
            // Si les filtres avancés ont changé, vérifier les conflits
            console.log('=== GESTION CONFLITS AVEC FILTRES AVANCÉS ===')
            const conflicts = detectConflictsWithAdvanced(localFilters, advancedFilters)
            
            if (conflicts.length > 0) {
                console.log('⚠️ Conflits détectés:', conflicts)
                console.log('🔧 Résolution automatique : priorité aux filtres avancés')
                clearConflictingFilters(conflicts)
            }
            
            lastAdvancedFiltersState.current = JSON.stringify(advancedFilters)
            console.log('=============================================')
        } else {
            // Conserver les filtres locaux lors des mises à jour de données
            console.log('=== FILTRES LOCAUX PRÉSERVÉS ===')
            console.log('Filtres locaux maintenus:', localFilters)
            console.log('Filtres props ignorés:', initialFilters)
            console.log('=================================')
        }
    }, [initialFilters, advancedFilters, detectConflictsWithAdvanced, clearConflictingFilters])

    // Mettre à jour le tracking des filtres actifs quand les filtres locaux changent
    useEffect(() => {
        hasActiveFilters.current = checkHasActiveFilters(localFilters)
    }, [localFilters])

    // Application automatique des filtres avec debounce pour la recherche
    useEffect(() => {
        // Ignorer l'effet lors du premier rendu
        if (isFirstRender.current) return

        // Si c'est juste un changement de texte de recherche, on debounce
        if (localFilters.search !== initialFilters.search && localFilters.search.length > 0) {
            const timeoutId = setTimeout(() => {
                console.log('=== AUTO-APPLICATION FILTRES (SEARCH) ===')
                console.log('Recherche auto-appliquée:', localFilters.search)
                console.log('==========================================')
                applyFilters()
            }, 800) // Délai de 800ms pour la recherche

            return () => clearTimeout(timeoutId)
        }
        // Pour les autres filtres, application immédiate si différents des props
        else if (
            localFilters.status !== initialFilters.status ||
            localFilters.client !== initialFilters.client ||
            localFilters.project !== initialFilters.project ||
            localFilters.sortBy !== initialFilters.sortBy ||
            localFilters.sortOrder !== initialFilters.sortOrder ||
            localFilters.dateFrom !== initialFilters.dateFrom ||
            localFilters.dateTo !== initialFilters.dateTo
        ) {
            console.log('=== AUTO-APPLICATION FILTRES ===')
            console.log('Filtres auto-appliqués:', localFilters)
            console.log('================================')
            applyFilters()
        }
    }, [
        localFilters.search,
        localFilters.status,
        localFilters.client,
        localFilters.project,
        localFilters.sortBy,
        localFilters.sortOrder,
        localFilters.dateFrom,
        localFilters.dateTo,
    ])

    const applyFilters = useCallback(() => {
        console.log('=== APPLICATION DES FILTRES ===')
        console.log('Filtres locaux:', localFilters)
        console.log('================================')

        setIsApplyingFilters(true)

        router.get('/gmb-posts', localFilters, {
            preserveState: true,
            replace: true,
            onFinish: () => {
                setIsApplyingFilters(false)
            },
        })
    }, [localFilters])

    const resetFilters = useCallback(() => {
        const resetFiltersData = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
            dateFrom: '',
            dateTo: '',
        }
        console.log('=== RÉINITIALISATION DES FILTRES RAPIDES ===')
        console.log('Données de réinitialisation:', resetFiltersData)
        console.log('=============================================')

        setLocalFilters(resetFiltersData)
        hasActiveFilters.current = false
        router.get('/gmb-posts', resetFiltersData, {
            preserveState: true,
            replace: true,
        })
    }, [])

    // Nouvelle fonction pour réinitialiser TOUS les filtres (rapides + avancés)
    const resetAllFilters = useCallback((onResetAdvanced?: () => void) => {
        const resetFiltersData = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
            dateFrom: '',
            dateTo: '',
        }
        
        console.log('=== RÉINITIALISATION DES FILTRES RAPIDES ===')
        console.log('Données de réinitialisation:', resetFiltersData)
        console.log('=============================================')

        // FORCER la mise à jour immédiate de l'état local
        setLocalFilters(resetFiltersData)
        hasActiveFilters.current = false
        
        // Forcer un re-render de tous les composants
        setForceUpdateKey(prev => prev + 1)
        
        // Réinitialiser les filtres avancés si la fonction est fournie
        if (onResetAdvanced) {
            console.log('🔄 Réinitialisation des filtres avancés demandée')
            onResetAdvanced()
        }
        
        // Appel immédiat sans timeout pour éviter les conflits
        router.get('/gmb-posts', resetFiltersData, {
            preserveState: true,
            replace: true,
            onSuccess: () => {
                console.log('✅ Réinitialisation des filtres rapides terminée')
            },
            onError: () => {
                console.error('❌ Erreur lors de la réinitialisation des filtres rapides')
            }
        })
    }, [])

    // Fonction pour vérifier s'il y a des conflits actifs
    const hasConflictsWithAdvanced = useCallback(() => {
        return detectConflictsWithAdvanced(localFilters, advancedFilters).length > 0
    }, [localFilters, advancedFilters, detectConflictsWithAdvanced])

    const updateFilter = useCallback((key: keyof FilterState, value: string) => {
        setLocalFilters((prev) => ({
            ...prev,
            [key]: value,
        }))
    }, [])

    const handleSort = useCallback((sortBy: string, sortOrder: string) => {
        console.log('=== CHANGEMENT DE TRI ===')
        console.log('Nouveau tri:', sortBy, sortOrder)
        console.log('===========================')

        setLocalFilters((prev) => ({
            ...prev,
            sortBy,
            sortOrder,
        }))
    }, [])

    return {
        filters: localFilters,
        setFilters: setLocalFilters,
        updateFilter,
        isApplyingFilters,
        applyFilters,
        resetFilters,
        resetAllFilters,
        handleSort,
        forceUpdateKey, // Exposer la clé pour forcer les re-renders
        // Nouvelles fonctions pour la gestion des conflits
        hasConflictsWithAdvanced,
        detectConflictsWithAdvanced: () => detectConflictsWithAdvanced(localFilters, advancedFilters),
        clearConflictingFilters,
    }
}
