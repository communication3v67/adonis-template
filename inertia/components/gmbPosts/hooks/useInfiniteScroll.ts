// Types globaux pour la protection d'édition et des requêtes multiples
declare global {
    interface Window {
        _isInlineEditing: boolean
        _isModalEditing: boolean
        lastSSEUpdate: number
        lastUserAction: number
        _editingPostId: number | null
        _editingField: string | null
        _loadingPages: Set<string> // Nouvelle protection contre les requêtes multiples
    }
}

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef, useMemo } from 'react'
import { notifications } from '@mantine/notifications'
import { PaginatedPosts, InfiniteScrollState, FilterState, AdvancedFilterState, GmbPost } from '../types'
import { INFINITE_SCROLL_CONFIG } from '../utils/constants'
import { advancedFiltersToUrlParams, getAdvancedFiltersSignature } from '../utils/advancedFiltersUtils'
import { debugAdvancedFilters } from '../utils/debugAdvancedFilters'
import { useOptimisticUpdates } from './useOptimisticUpdates'

/**
 * Fonction utilitaire pour dédupliquer une liste de posts par ID
 */
const deduplicatePostsById = (posts: GmbPost[]): GmbPost[] => {
    const seenIds = new Set<number>()
    const uniquePosts: GmbPost[] = []
    
    for (const post of posts) {
        if (!seenIds.has(post.id)) {
            seenIds.add(post.id)
            uniquePosts.push(post)
        } else {
            console.log(`🖮️ Dédoublon détecté et supprimé: Post ID ${post.id}`)
        }
    }
    
    return uniquePosts
}

/**
 * Fonction utilitaire pour trier globalement une liste de posts
 */
const sortPostsGlobally = (posts: GmbPost[], sortBy: string, sortOrder: string): GmbPost[] => {
    return posts.sort((a, b) => {
        let aValue = a[sortBy as keyof GmbPost]
        let bValue = b[sortBy as keyof GmbPost]
        
        // Gestion spéciale pour les dates
        if (sortBy === 'date' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
            aValue = new Date(aValue as string).getTime()
            bValue = new Date(bValue as string).getTime()
        }
        
        // Gestion pour les valeurs numériques
        if (sortBy === 'id' || sortBy === 'price' || sortBy === 'input_tokens' || sortBy === 'output_tokens') {
            aValue = Number(aValue) || 0
            bValue = Number(bValue) || 0
        }
        
        // Gestion pour les chaînes de caractères (insensible à la casse)
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
        }
        if (typeof bValue === 'string') {
            bValue = bValue.toLowerCase()
        }
        
        if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
        } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        }
    })
}

/**
 * Interface pour les méthodes exposées du hook
 */
export interface InfiniteScrollMethods {
    updatePostOptimistically: (action: 'created' | 'updated' | 'deleted' | 'status_changed', postData: Partial<GmbPost> & { id: number }) => void
    refreshFromServer: () => void
}

/**
 * Hook personnalisé pour gérer le scroll infini avec support des filtres avancés et mises à jour optimistes
 */
export const useInfiniteScroll = (
    initialPosts: PaginatedPosts, 
    filters: FilterState,
    advancedFilters?: AdvancedFilterState,
    hasActiveAdvancedFilters: boolean = false
) => {
    const { applyOptimisticUpdate, updatePaginatedData } = useOptimisticUpdates()
    
    // Référence pour la signature des filtres précédente
    const previousSignatureRef = useRef<string>('')
    // Référence pour éviter la réinitialisation lors des mises à jour SSE
    const isSSEUpdateRef = useRef<boolean>(false)
    // Référence pour l'état initial servant de base
    const baseStateRef = useRef<PaginatedPosts | null>(null)
    
    const [state, setState] = useState<InfiniteScrollState>(() => {
        // Calcul simple basé sur le nombre de posts et le total
        const currentPage = 1
        const total = initialPosts.meta.total || 0
        const postsLoaded = initialPosts.data.length
        const hasMorePosts = postsLoaded < total
        
        console.log('=== INITIALISATION SCROLL INFINI ===')
        console.log('Posts chargés:', postsLoaded)
        console.log('Total posts:', total)
        console.log('HasMore:', hasMorePosts)
        console.log('=====================================')
        
        return {
            allPosts: initialPosts.data,
            currentPage,
            hasMore: hasMorePosts,
            isLoading: false,
            isLoadingMore: false,
        }
    })
    
    // Sauvegarde de l'état initial pour le rafraîchissement complet
    const [originalPaginatedData, setOriginalPaginatedData] = useState(initialPosts)

    // Réinitialiser le scroll infini quand les posts changent (seulement pour les changements majeurs)
    useEffect(() => {
        // 🛡️ PROTECTION CRITIQUE : Éviter les réinitialisations pendant l'édition inline
        if (window._isInlineEditing) {
            console.log('🛡️ Édition inline en cours - pas de réinitialisation scroll infini')
            return
        }
        
        // 🛡️ PROTECTION MODAL : Éviter les réinitialisations pendant l'édition modal
        if (window._isModalEditing) {
            console.log('🛡️ Édition modal en cours - pas de réinitialisation scroll infini')
            return
        }
        
        // 🛡️ PROTECTION SSE : Ignorer les mises à jour trop récentes 
        const timeSinceSSE = Date.now() - (window.lastSSEUpdate || 0)
        if (timeSinceSSE < 2000) { // 2 secondes de protection
            console.log('🛡️ Protection SSE active - préservation scroll infini')
            return
        }
        
    console.log('=== MISE À JOUR SCROLL INFINI ===')
    console.log('Nouveaux posts:', initialPosts.meta)
    console.log('Anciens posts dans le state:', state.allPosts.length)
    console.log('Nouveaux posts dans initialPosts:', initialPosts.data.length)
        
        // Debug des filtres avancés
        if (hasActiveAdvancedFilters && advancedFilters) {
            debugAdvancedFilters('useInfiniteScroll - Début effet', advancedFilters, hasActiveAdvancedFilters)
        }
    
    // Calculer une signature pour détecter les changements de contexte (filtres, tri)
    const currentSignature = JSON.stringify({
    search: filters.search,
    status: filters.status,
    client: filters.client,
    project: filters.project,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    hasAdvancedFilters: hasActiveAdvancedFilters,
    advancedFiltersSignature: hasActiveAdvancedFilters && advancedFilters ? getAdvancedFiltersSignature(advancedFilters) : ''
    })
    
    const previousSignature = previousSignatureRef.current
    
    // Vérifier si c'est un changement de contexte (filtres/tri) ou juste une mise à jour de données
    const isContextChange = currentSignature !== previousSignature
    
    // Vérifier si c'est le premier chargement
    const isFirstLoad = state.allPosts.length === 0 && !baseStateRef.current
    
    // Vérifier si on est dans une mise à jour SSE
    const isSSEUpdate = isSSEUpdateRef.current
    
    // Vérifier si c'est un changement majeur qui nécessite une réinitialisation - AMÉLIORÉ
    const currentTotal = initialPosts.meta.total || 0
    const originalTotal = originalPaginatedData.meta.total || 0
    const dynamicThreshold = Math.max(5, Math.floor(currentTotal * 0.05)) // 5% du total ou minimum 5
    
    const shouldReinitialize = (
        isFirstLoad ||  // Premier chargement
        (isContextChange && !isSSEUpdate) ||  // Changement de contexte (mais pas SSE)
        Math.abs(currentTotal - originalTotal) > dynamicThreshold  // Seuil adaptatif au lieu de fixe
    )
        
        console.log('  - Détection changements:')
        console.log('    * Premier chargement:', isFirstLoad)
        console.log('    * Changement contexte:', isContextChange)
        console.log('    * Mise à jour SSE:', isSSEUpdate)
        console.log('    * Doit réinitialiser:', shouldReinitialize)
    
    if (shouldReinitialize) {
    console.log('🔄 Changement majeur détecté - réinitialisation complète')
    console.log('  - Changement contexte:', isContextChange)
    console.log('  - Premier chargement:', isFirstLoad)
    console.log('  - Total diff:', Math.abs(currentTotal - originalTotal), '/ seuil:', dynamicThreshold)
            
            // NOUVEAU : Backup des filtres avant réinitialisation
            try {
                const filtersBackup = {
                    basic: filters,
                    advanced: advancedFilters,
                    timestamp: Date.now(),
                    url: window.location.href
                }
                sessionStorage.setItem('gmb_filters_backup', JSON.stringify(filtersBackup))
                console.log('💾 Backup des filtres sauvegardé avant réinitialisation')
            } catch (error) {
                console.warn('⚠️ Impossible de sauvegarder le backup des filtres:', error)
            }
            console.log('  - Signature précédente:', previousSignature.substring(0, 100) + '...')
            console.log('  - Signature actuelle:', currentSignature.substring(0, 100) + '...')
            console.log('  - Filtres avancés actifs:', hasActiveAdvancedFilters)
            if (hasActiveAdvancedFilters && advancedFilters) {
                console.log('  - Signature filtres avancés:', getAdvancedFiltersSignature(advancedFilters))
            }
        
        const total = initialPosts.meta.total || 0
        const postsLoaded = initialPosts.data.length
            const hasMorePosts = postsLoaded < total
            
            setState({
                allPosts: initialPosts.data,
                currentPage: 1,
                hasMore: hasMorePosts,
                isLoading: false,
                isLoadingMore: false,
            })
            
            setOriginalPaginatedData(initialPosts)
            baseStateRef.current = initialPosts  // Marquer l'état de base
            previousSignatureRef.current = currentSignature
            
            console.log('Nouvel état:', {
                allPostsCount: initialPosts.data.length,
                hasMore: hasMorePosts,
                total
            })
        } else {
            console.log('🚫 Changement ignoré - préservation totale du scroll infini')
            console.log('  - Raison: Mise à jour de données (SSE ou autre) sans changement de contexte')
            console.log('  - État scroll infini préservé avec', state.allPosts.length, 'posts')
            // NE RIEN FAIRE - laisser l'état scroll infini complètement intact
            // Les mises à jour optimistes SSE gèrent les changements de données
        }
        
        console.log('===================================')
    }, [initialPosts, filters, hasActiveAdvancedFilters, advancedFilters])

    const loadMorePosts = useCallback(async () => {
        console.log('=== LOAD MORE POSTS CALLED ===')
        console.log('isLoadingMore:', state.isLoadingMore)
        console.log('hasMore:', state.hasMore)
        console.log('currentPage:', state.currentPage)
        
        // 🛡️ PROTECTION : Éviter les requêtes multiples simultanées
        if (state.isLoadingMore || !state.hasMore) {
            console.log('❌ Sortie prématurée - déjà en cours de chargement ou plus de posts')
            return
        }

        setState(prev => ({ ...prev, isLoadingMore: true }))

        try {
            const nextPage = state.currentPage + 1
            
            // 🛡️ Vérifier que la page suivante n'est pas déjà en cours de chargement
            const loadingKey = `page-${nextPage}`
            if (window._loadingPages && window._loadingPages.has(loadingKey)) {
                console.log(`⚠️ Page ${nextPage} déjà en cours de chargement - ignoré`)
                setState(prev => ({ ...prev, isLoadingMore: false }))
                return
            }
            
            // Marquer la page comme en cours de chargement
            if (!window._loadingPages) window._loadingPages = new Set()
            window._loadingPages.add(loadingKey)
            
            // Construire les paramètres avec TOUS les filtres (basiques + avancés)
            let allParams = { ...filters }
            
            // Ajouter les filtres avancés s'ils sont actifs
            if (hasActiveAdvancedFilters && advancedFilters) {
                const advancedParams = advancedFiltersToUrlParams(advancedFilters)
                allParams = { ...allParams, ...advancedParams }
                console.log('🎆 Scroll infini - Filtres avancés inclus:', advancedParams)
            }
            
            const params = {
                ...allParams,
                page: nextPage.toString(),
                limit: INFINITE_SCROLL_CONFIG.ITEMS_PER_PAGE.toString(),
                loadMore: 'true'
            }
            
            const url = `/gmb-posts?${new URLSearchParams(params)}`
            console.log('🌐 URL de requête:', url)
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const data = await response.json()
            console.log('📦 Données reçues:', data.posts?.data?.length || 0, 'nouveaux posts')

            setState(prev => {
                // ✅ CORRECTION CRITIQUE : Concaténer, dédupliquer ET retrier globalement
                const allCombinedPosts = [...prev.allPosts, ...data.posts.data]
                
                // 🔍 ÉTAPE 1 : Déduplication pour éviter les doublons
                const deduplicatedPosts = deduplicatePostsById(allCombinedPosts)
                console.log(`🖮️ Déduplication: ${allCombinedPosts.length} -> ${deduplicatedPosts.length} posts uniques`)
                
                // 🔄 ÉTAPE 2 : Tri global avec notre fonction optimisée
                const sortedPosts = sortPostsGlobally(deduplicatedPosts, filters.sortBy, filters.sortOrder)
                
                console.log(`🔄 Tri global corrigé appliqué sur ${deduplicatedPosts.length} posts uniques (${filters.sortBy} ${filters.sortOrder})`)
                console.log(`📊 Premier post après tri: ${sortedPosts[0]?.[filters.sortBy]} | Dernier post: ${sortedPosts[sortedPosts.length - 1]?.[filters.sortBy]}`)
                
                return {
                    ...prev,
                    allPosts: sortedPosts,
                    currentPage: nextPage,
                    hasMore: data.posts.data.length === INFINITE_SCROLL_CONFIG.ITEMS_PER_PAGE && 
                             sortedPosts.length < (initialPosts.meta.total || 0),
                    isLoadingMore: false
                }
            })

            console.log(`✅ ${data.posts.data.length} nouveaux posts chargés et triés globalement`)
            console.log(`🎯 Tri ${filters.sortBy} ${filters.sortOrder} appliqué sur l'ensemble des posts`)
        } catch (error) {
            console.error('❌ Erreur chargement scroll infini:', error)
            setState(prev => ({ ...prev, isLoadingMore: false }))
            notifications.show({
                title: 'Erreur',
                message: 'Erreur lors du chargement des posts supplémentaires',
                color: 'red',
            })
        } finally {
            // 🧹 Nettoyer la protection de page en cours de chargement
            const nextPage = state.currentPage + 1
            const loadingKey = `page-${nextPage}`
            if (window._loadingPages) {
                window._loadingPages.delete(loadingKey)
                console.log(`🧹 Protection nettoyée pour page ${nextPage}`)
            }
        }
    }, [state.isLoadingMore, state.hasMore, state.currentPage, filters, advancedFilters, hasActiveAdvancedFilters, initialPosts.meta.total])

    // Fonctions pour les mises à jour optimistes avec gestion améliorée de la pagination
    const updatePostOptimistically = useCallback((action: 'created' | 'updated' | 'deleted' | 'status_changed', postData: Partial<GmbPost> & { id: number }) => {
        console.log(`🚀 Mise à jour optimiste: ${action} pour post ${postData.id}`)
        
        // Marquer qu'une mise à jour SSE est en cours
        isSSEUpdateRef.current = true
        
        setState(prevState => {
            // Appliquer la mise à jour optimiste puis déduplication et tri global
            const updatedPosts = applyOptimisticUpdate(
                prevState.allPosts,
                { action, data: postData },
                filters.sortBy,
                filters.sortOrder
            )
            
            // Déduplication pour éviter les doublons (ex: SSE + action utilisateur)
            const deduplicatedPosts = deduplicatePostsById(updatedPosts)
            
            // Appliquer le tri global pour s'assurer que l'ordre est correct
            const sortedPosts = sortPostsGlobally(deduplicatedPosts, filters.sortBy, filters.sortOrder)
            
            // Gestion intelligente de hasMore selon l'action
            let newHasMore = prevState.hasMore
            let adjustedTotal = prevState.allPosts.length // Estimer le total local
            
            if (action === 'created') {
                // Nouveau post ajouté - il pourrait y en avoir d'autres sur le serveur
                adjustedTotal = Math.max(adjustedTotal + 1, updatedPosts.length)
                // Si on a déjà tous les posts, on peut maintenant en avoir plus à charger
                newHasMore = true
                console.log('🆕 Post ajouté - hasMore=true pour permettre découverte de nouveaux posts')
            } else if (action === 'deleted') {
                // Post supprimé - il pourrait y en avoir un de plus à charger
                adjustedTotal = Math.max(0, adjustedTotal - 1)
                // Si on n'avait plus de posts à charger, il se peut qu'on en ait maintenant
                if (!prevState.hasMore && adjustedTotal > 0) {
                    newHasMore = true
                    console.log('🗑️ Post supprimé - réactivation hasMore car slot libre')
                }
            } else if (action === 'updated' || action === 'status_changed') {
                // Post mis à jour - pas de changement de pagination
                adjustedTotal = prevState.allPosts.length
                newHasMore = prevState.hasMore
                console.log('✏️ Post mis à jour - pagination inchangée')
            }
            
            const newState = {
                ...prevState,
                allPosts: sortedPosts,
                hasMore: newHasMore
            }
            
            console.log(`✨ État optimiste mis à jour: ${newState.allPosts.length} posts, hasMore=${newState.hasMore}`)
            return newState
        })
        
        // Reset le flag après mise à jour
        setTimeout(() => {
            isSSEUpdateRef.current = false
        }, 100)
    }, [applyOptimisticUpdate, filters.sortBy, filters.sortOrder])
    
    // Fonction pour forcer un rafraîchissement depuis le serveur
    const refreshFromServer = useCallback(() => {
        console.log('🔄 Rafraîchissement forcé depuis le serveur')
        // Cette fonction sera appelée par le composant parent si nécessaire
        window.location.reload()
    }, [])

    // Hook pour détecter le scroll en bas de page
    useEffect(() => {
        const handleScroll = () => {
            const threshold = INFINITE_SCROLL_CONFIG.SCROLL_THRESHOLD
            const scrollPosition = window.innerHeight + window.scrollY
            const documentHeight = document.documentElement.scrollHeight
            
            if (scrollPosition >= documentHeight - threshold) {
                loadMorePosts()
            }
        }

        // Throttling du scroll
        let timeoutId: NodeJS.Timeout
        const throttledHandleScroll = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleScroll, INFINITE_SCROLL_CONFIG.THROTTLE_DELAY)
        }

        window.addEventListener('scroll', throttledHandleScroll)
        return () => {
            window.removeEventListener('scroll', throttledHandleScroll)
            clearTimeout(timeoutId)
        }
    }, [loadMorePosts])

    // Mémorisation des calculs coûteux pour éviter les re-calculs
    const memoizedPosts = useMemo(() => {
        console.log('📊 Recalcul des posts mémorisés')
        return state.allPosts
    }, [state.allPosts])
    
    const memoizedStats = useMemo(() => {
        return {
            total: state.allPosts.length,
            hasMore: state.hasMore,
            isLoading: state.isLoadingMore
        }
    }, [state.allPosts.length, state.hasMore, state.isLoadingMore])
    
    // Mémorisation de la signature des filtres pour optimiser la détection de changements
    const filtersSignature = useMemo(() => {
        return JSON.stringify({
            basic: {
                search: filters.search,
                status: filters.status,
                client: filters.client,
                project: filters.project,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo
            },
            advanced: advancedFilters,
            hasAdvanced: hasActiveAdvancedFilters
        })
    }, [filters, advancedFilters, hasActiveAdvancedFilters])

    return {
        posts: memoizedPosts,
        hasMore: state.hasMore,
        isLoading: state.isLoadingMore,
        loadMore: loadMorePosts,
        updatePostOptimistically,
        refreshFromServer,
        stats: memoizedStats, // Stats mémorisées
    }
}
