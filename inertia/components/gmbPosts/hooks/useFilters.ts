import { useState, useEffect, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { FilterState } from '../types'

/**
 * Hook personnalisé pour gérer les filtres avec debounce automatique
 */
export const useFilters = (initialFilters: FilterState) => {
    const [localFilters, setLocalFilters] = useState(initialFilters)
    const [isApplyingFilters, setIsApplyingFilters] = useState(false)

    // Synchroniser les filtres locaux avec les props quand ils changent
    useEffect(() => {
        console.log('=== SYNCHRONISATION FILTRES ===')
        console.log('Filtres props:', initialFilters)
        setLocalFilters(initialFilters)
        console.log('================================')
    }, [initialFilters])

    // Application automatique des filtres avec debounce pour la recherche
    useEffect(() => {
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
        console.log('=== RÉINITIALISATION DES FILTRES ===')
        console.log('Données de réinitialisation:', resetFiltersData)
        console.log('======================================')

        setLocalFilters(resetFiltersData)
        router.get('/gmb-posts', resetFiltersData, {
            preserveState: true,
            replace: true,
        })
    }, [])

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
        handleSort,
    }
}
