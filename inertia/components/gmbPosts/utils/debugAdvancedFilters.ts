/**
 * Utilitaire de debug pour les filtres avancés
 * À utiliser temporairement pour diagnostiquer les problèmes
 */

import { useEffect, useRef } from 'react'
import { AdvancedFilterState } from '../types'
import { getAdvancedFiltersSignature, advancedFiltersToUrlParams } from './advancedFiltersUtils'

export const debugAdvancedFilters = (
    label: string,
    advancedFilters: AdvancedFilterState | undefined,
    hasActiveAdvancedFilters: boolean
) => {
    console.group(`🔍 DEBUG FILTRES AVANCÉS - ${label}`)
    console.log('hasActiveAdvancedFilters:', hasActiveAdvancedFilters)
    console.log('advancedFilters objet:', advancedFilters)
    
    if (advancedFilters) {
        console.log('isActive:', advancedFilters.isActive)
        console.log('groups count:', advancedFilters.groups?.length || 0)
        
        if (advancedFilters.groups && advancedFilters.groups.length > 0) {
            advancedFilters.groups.forEach((group, groupIndex) => {
                console.log(`Groupe ${groupIndex}:`, {
                    condition: group.condition,
                    filtersCount: group.filters?.length || 0,
                    filters: group.filters?.map(f => ({
                        property: f.property,
                        operator: f.operator,
                        value: f.value,
                        isEmpty: f.value === '' || f.value === null || f.value === undefined
                    }))
                })
            })
        }
        
        try {
            const signature = getAdvancedFiltersSignature(advancedFilters)
            console.log('Signature générée:', signature)
            
            const urlParams = advancedFiltersToUrlParams(advancedFilters)
            console.log('Paramètres URL:', urlParams)
        } catch (error) {
            console.error('Erreur lors de la génération de signature/URL:', error)
        }
    }
    
    console.groupEnd()
}

// Hook temporaire pour debug automatique
export const useAdvancedFiltersDebug = (
    advancedFilters: AdvancedFilterState | undefined,
    hasActiveAdvancedFilters: boolean
) => {
    const prevFiltersRef = useRef<string>('')
    const prevActiveRef = useRef<boolean>(false)
    
    useEffect(() => {
        const currentSig = advancedFilters ? getAdvancedFiltersSignature(advancedFilters) : ''
        
        if (currentSig !== prevFiltersRef.current || hasActiveAdvancedFilters !== prevActiveRef.current) {
            debugAdvancedFilters('Changement détecté', advancedFilters, hasActiveAdvancedFilters)
            prevFiltersRef.current = currentSig
            prevActiveRef.current = hasActiveAdvancedFilters
        }
    }, [advancedFilters, hasActiveAdvancedFilters])
}
