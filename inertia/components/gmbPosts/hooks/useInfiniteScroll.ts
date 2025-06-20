import { useState, useEffect, useCallback } from 'react'
import { notifications } from '@mantine/notifications'
import { PaginatedPosts, InfiniteScrollState, FilterState } from '../types'
import { INFINITE_SCROLL_CONFIG } from '../utils/constants'

/**
 * Hook personnalisé pour gérer le scroll infini
 */
export const useInfiniteScroll = (initialPosts: PaginatedPosts, filters: FilterState) => {
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

    // Réinitialiser le scroll infini quand les posts changent
    useEffect(() => {
        console.log('=== MISE À JOUR SCROLL INFINI ===')  
        console.log('Nouveaux posts:', initialPosts.meta)
        console.log('Anciens posts dans le state:', state.allPosts.length)
        console.log('Nouveaux posts dans initialPosts:', initialPosts.data.length)
        
        const total = initialPosts.meta.total || 0
        const postsLoaded = initialPosts.data.length
        const hasMorePosts = postsLoaded < total
        
        // Comparer avec l'état actuel pour voir s'il y a vraiment un changement
        const hasRealChange = (
            state.allPosts.length !== initialPosts.data.length ||
            JSON.stringify(state.allPosts.map(p => p.id)) !== JSON.stringify(initialPosts.data.map(p => p.id))
        )
        
        console.log('Changement réel détecté:', hasRealChange)
        
        setState({
            allPosts: initialPosts.data,
            currentPage: 1,
            hasMore: hasMorePosts,
            isLoading: false,
            isLoadingMore: false,
        })
        
        console.log('Nouvel état:', {
            allPostsCount: initialPosts.data.length,
            hasMore: hasMorePosts,
            total
        })
        console.log('===================================')
    }, [initialPosts])

    const loadMorePosts = useCallback(async () => {
        console.log('=== LOAD MORE POSTS CALLED ===')
        console.log('isLoadingMore:', state.isLoadingMore)
        console.log('hasMore:', state.hasMore)
        console.log('currentPage:', state.currentPage)
        
        if (state.isLoadingMore || !state.hasMore) {
            console.log('❌ Sortie prématurée')
            return
        }

        setState(prev => ({ ...prev, isLoadingMore: true }))

        try {
            const nextPage = state.currentPage + 1
            const params = {
                ...filters,
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

            setState(prev => ({
                ...prev,
                allPosts: [...prev.allPosts, ...data.posts.data],
                currentPage: nextPage,
                hasMore: data.posts.data.length === INFINITE_SCROLL_CONFIG.ITEMS_PER_PAGE && 
                         (prev.allPosts.length + data.posts.data.length) < (initialPosts.meta.total || 0),
                isLoadingMore: false
            }))

            console.log(`✅ ${data.posts.data.length} nouveaux posts chargés`)
        } catch (error) {
            console.error('❌ Erreur chargement scroll infini:', error)
            setState(prev => ({ ...prev, isLoadingMore: false }))
            notifications.show({
                title: 'Erreur',
                message: 'Erreur lors du chargement des posts supplémentaires',
                color: 'red',
            })
        }
    }, [state.isLoadingMore, state.hasMore, state.currentPage, filters, initialPosts.meta.total])

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

    return {
        posts: state.allPosts,
        hasMore: state.hasMore,
        isLoading: state.isLoadingMore,
        loadMore: loadMorePosts,
    }
}
