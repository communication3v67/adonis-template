import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from '@inertiajs/react'
import { FilterState, AdvancedFilterState } from '../types'

/**
 * Hook personnalisé pour gérer les filtres avec harmonisation avancée
 * VERSION CORRIGÉE : Résout le problème d'effacement du champ de recherche
 * 
 * PRINCIPALES CORRECTIONS :
 * - Préservation stricte des filtres locaux après le premier rendu
 * - Protection contre les écrasements lors des mises à jour SSE
 * - Gestion plus fine du debounce pour la recherche
 * - Séparation claire entre saisie utilisateur et synchronisation serveur
 */
export const useFilters = (
    initialFilters: FilterState, 
    advancedFilters?: AdvancedFilterState
) => {
    const [localFilters, setLocalFilters] = useState(initialFilters)
    const [isApplyingFilters, setIsApplyingFilters] = useState(false)
    const [forceUpdateKey, setForceUpdateKey] = useState(0)
    
    // Refs pour le tracking d'état et la protection
    const isFirstRender = useRef(true)
    const hasUserInteracted = useRef(false) // Nouveau : tracker les interactions utilisateur
    const debounceTimeoutRef = useRef<NodeJS.Timeout>()
    const lastSSEUpdateRef = useRef(0)
    const pendingSearchValue = useRef<string | null>(null)
    
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

        return conflicts
    }, [])

    // Fonction pour nettoyer les filtres en conflit
    const clearConflictingFilters = useCallback((conflicts: any[]) => {
        setLocalFilters(currentFilters => {
            const updatedFilters = { ...currentFilters }
            
            conflicts.forEach(({ basic }) => {
                if (basic === 'date') {
                    updatedFilters.dateFrom = ''
                    updatedFilters.dateTo = ''
                } else {
                    updatedFilters[basic as keyof FilterState] = ''
                }
            })
            
            console.log('🧹 Nettoyage des filtres en conflit:', conflicts.map(c => c.basic))
            return updatedFilters
        })
    }, [])

    // Synchronisation ULTRA-RESTRICTIVE - seulement au premier rendu
    useEffect(() => {
        if (isFirstRender.current) {
            // Premier rendu UNIQUEMENT : prendre les filtres du serveur
            console.log('=== INITIALISATION FILTRES (PREMIÈRE FOIS SEULEMENT) ===')
            console.log('Filtres initiaux du serveur:', initialFilters)
            setLocalFilters(initialFilters)
            isFirstRender.current = false
            console.log('========================================================')
        } else {
            // Après le premier rendu : JAMAIS écraser les filtres locaux
            console.log('=== PROTECTION FILTRES LOCAUX ACTIVÉE ===')
            console.log('Filtres locaux protégés:', localFilters)
            console.log('Props serveur ignorées:', initialFilters)
            console.log('=====================================')
        }
    }, [initialFilters])

    // Gestion séparée des conflits avec filtres avancés
    useEffect(() => {
        if (!isFirstRender.current && advancedFilters) {
            const conflicts = detectConflictsWithAdvanced(localFilters, advancedFilters)
            
            if (conflicts.length > 0) {
                console.log('⚠️ Conflits détectés avec filtres avancés:', conflicts)
                console.log('🔧 Résolution automatique : priorité aux filtres avancés')
                clearConflictingFilters(conflicts)
            }
        }
    }, [advancedFilters, detectConflictsWithAdvanced, clearConflictingFilters])

    // Application des filtres avec debounce amélioré
    const applyFilters = useCallback(() => {
        console.log('=== APPLICATION DES FILTRES ===')
        console.log('Filtres à appliquer:', localFilters)

        setIsApplyingFilters(true)

        router.get('/gmb-posts', localFilters, {
            preserveState: true,
            replace: true,
            onFinish: () => {
                setIsApplyingFilters(false)
                // Marquer que l'application est terminée
                pendingSearchValue.current = null
            },
        })
    }, [localFilters])

    // Auto-application avec protection SSE et debounce intelligent
    useEffect(() => {
        // Ignorer l'effet lors du premier rendu
        if (isFirstRender.current) return
        
        // Nettoyer le timeout précédent
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }

        // Protection contre les mises à jour SSE récentes
        const timeSinceSSE = Date.now() - lastSSEUpdateRef.current
        if (timeSinceSSE < 1000) {
            console.log('📞 Auto-application bloquée (mise à jour SSE récente)')
            return
        }

        // Vérifier si les filtres ont réellement changé par rapport aux props initiales
        const searchChanged = localFilters.search !== initialFilters.search
        const otherFiltersChanged = (
            localFilters.status !== initialFilters.status ||
            localFilters.client !== initialFilters.client ||
            localFilters.project !== initialFilters.project ||
            localFilters.sortBy !== initialFilters.sortBy ||
            localFilters.sortOrder !== initialFilters.sortOrder ||
            localFilters.dateFrom !== initialFilters.dateFrom ||
            localFilters.dateTo !== initialFilters.dateTo
        )

        if (searchChanged) {
            // Debounce pour la recherche
            console.log('🔍 Préparation auto-application recherche avec debounce')
            pendingSearchValue.current = localFilters.search
            
            debounceTimeoutRef.current = setTimeout(() => {
                // Vérifier que la valeur n'a pas changé entre temps
                if (pendingSearchValue.current === localFilters.search) {
                    console.log('=== AUTO-APPLICATION RECHERCHE (DEBOUNCE) ===')
                    console.log('Recherche appliquée:', localFilters.search)
                    applyFilters()
                }
            }, 800)
        } else if (otherFiltersChanged) {
            // Application immédiate pour les autres filtres
            console.log('=== AUTO-APPLICATION FILTRES (IMMÉDIATE) ===')
            applyFilters()
        }

        // Cleanup
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
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
        applyFilters,
        initialFilters
    ])

    // Fonction de mise à jour avec protection
    const updateFilter = useCallback((key: keyof FilterState, value: string) => {
        console.log(`=== MISE À JOUR FILTRE ${key.toUpperCase()} ===`)
        console.log('Ancienne valeur:', localFilters[key])
        console.log('Nouvelle valeur:', value)
        
        // Marquer l'interaction utilisateur
        hasUserInteracted.current = true
        
        setLocalFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            console.log('Nouveaux filtres locaux:', newFilters)
            return newFilters
        })
    }, [localFilters])

    // Réinitialisation simple
    const resetFilters = useCallback(() => {
        const resetData = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
            dateFrom: '',
            dateTo: '',
        }
        
        console.log('=== RÉINITIALISATION FILTRES ===')
        hasUserInteracted.current = false
        setLocalFilters(resetData)
        
        router.get('/gmb-posts', resetData, {
            preserveState: true,
            replace: true,
        })
    }, [])

    // Réinitialisation globale
    const resetAllFilters = useCallback((onResetAdvanced?: () => void) => {
        const resetData = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
            dateFrom: '',
            dateTo: '',
        }
        
        console.log('=== RÉINITIALISATION GLOBALE ===')
        
        // Réinitialiser les états de tracking
        hasUserInteracted.current = false
        pendingSearchValue.current = null
        
        // Mettre à jour l'état local
        setLocalFilters(resetData)
        
        // Forcer un re-render
        setForceUpdateKey(prev => prev + 1)
        
        // Réinitialiser les filtres avancés
        if (onResetAdvanced) {
            onResetAdvanced()
        }
        
        // Navigation
        router.get('/gmb-posts', resetData, {
            preserveState: true,
            replace: true,
        })
    }, [])

    // Gestionnaire de tri
    const handleSort = useCallback((sortBy: string, sortOrder: string) => {
        console.log('=== CHANGEMENT DE TRI ===')
        console.log('Nouveau tri:', sortBy, sortOrder)
        
        hasUserInteracted.current = true
        setLocalFilters((prev) => ({
            ...prev,
            sortBy,
            sortOrder,
        }))
    }, [])

    // Fonction pour marquer les mises à jour SSE
    const markSSEUpdate = useCallback(() => {
        lastSSEUpdateRef.current = Date.now()
        console.log('📡 Mise à jour SSE marquée - protection activée')
    }, [])

    // Fonction pour vérifier les conflits
    const hasConflictsWithAdvanced = useCallback(() => {
        return detectConflictsWithAdvanced(localFilters, advancedFilters).length > 0
    }, [localFilters, advancedFilters, detectConflictsWithAdvanced])

    return {
        filters: localFilters,
        setFilters: setLocalFilters,
        updateFilter,
        isApplyingFilters,
        applyFilters,
        resetFilters,
        resetAllFilters,
        handleSort,
        forceUpdateKey,
        markSSEUpdate,
        hasConflictsWithAdvanced,
        detectConflictsWithAdvanced: () => detectConflictsWithAdvanced(localFilters, advancedFilters),
        clearConflictingFilters,
        hasActiveFilters: checkHasActiveFilters(localFilters),
    }
}
