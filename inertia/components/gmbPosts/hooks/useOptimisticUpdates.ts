import { useCallback, useRef } from 'react'
import { GmbPost, PaginatedPosts } from '../types'

/**
 * Fonction utilitaire pour trier globalement une liste de posts
 * (Réplique de la fonction dans useInfiniteScroll pour cohérence)
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
 * Hook pour la mise à jour optimiste des données locales
 * Évite les rechargements serveur et préserve le scroll infini
 */
export const useOptimisticUpdates = () => {
    // Référence pour tracker les mises à jour en cours
    const pendingUpdatesRef = useRef<Set<number>>(new Set())

    /**
     * Met à jour un post spécifique dans la liste locale
     */
    const updatePostInList = useCallback((
        currentPosts: GmbPost[], 
        updatedPost: Partial<GmbPost> & { id: number }
    ): GmbPost[] => {
        return currentPosts.map(post => 
            post.id === updatedPost.id 
                ? { ...post, ...updatedPost }
                : post
        )
    }, [])

    /**
     * Ajoute un nouveau post à la liste locale
     */
    const addPostToList = useCallback((
        currentPosts: GmbPost[], 
        newPost: GmbPost,
        sortBy: string = 'date',
        sortOrder: string = 'desc'
    ): GmbPost[] => {
        // Éviter les doublons
        if (currentPosts.some(post => post.id === newPost.id)) {
            console.log(`⚠️ Post ${newPost.id} déjà présent, mise à jour au lieu d'ajout`)
            return updatePostInList(currentPosts, newPost)
        }

        const newList = [...currentPosts, newPost]
        
        // Utiliser la fonction de tri globale améliorée
        return sortPostsGlobally(newList, sortBy, sortOrder)
    }, [updatePostInList])

    /**
     * Supprime un post de la liste locale
     */
    const removePostFromList = useCallback((
        currentPosts: GmbPost[], 
        postId: number
    ): GmbPost[] => {
        return currentPosts.filter(post => post.id !== postId)
    }, [])

    /**
     * Met à jour les données paginées de manière optimiste
     */
    const updatePaginatedData = useCallback((
        currentData: PaginatedPosts,
        updatedPosts: GmbPost[],
        action: 'update' | 'add' | 'remove',
        affectedCount: number = 0
    ): PaginatedPosts => {
        const newTotal = action === 'add' 
            ? currentData.meta.total + affectedCount
            : action === 'remove'
            ? Math.max(0, currentData.meta.total - affectedCount)
            : currentData.meta.total

        return {
            ...currentData,
            data: updatedPosts,
            meta: {
                ...currentData.meta,
                total: newTotal,
                // Recalculer si nécessaire
                last_page: Math.ceil(newTotal / (currentData.meta.per_page || 50))
            }
        }
    }, [])

    /**
     * Marque une mise à jour comme en cours
     */
    const markPendingUpdate = useCallback((postId: number) => {
        pendingUpdatesRef.current.add(postId)
        console.log(`🔄 Mise à jour optimiste en cours pour post ${postId}`)
        
        // Auto-nettoyage après 5 secondes
        setTimeout(() => {
            pendingUpdatesRef.current.delete(postId)
        }, 5000)
    }, [])

    /**
     * Vérifie si une mise à jour est en cours
     */
    const isPendingUpdate = useCallback((postId: number): boolean => {
        return pendingUpdatesRef.current.has(postId)
    }, [])

    /**
     * Applique une mise à jour optimiste basée sur un événement SSE
     */
    const applyOptimisticUpdate = useCallback((
        currentPosts: GmbPost[],
        sseEvent: {
            action: 'created' | 'updated' | 'deleted' | 'status_changed'
            data: Partial<GmbPost> & { id: number }
        },
        sortBy: string = 'date',
        sortOrder: string = 'desc'
    ): GmbPost[] => {
        const { action, data } = sseEvent
        
        console.log(`🚀 Mise à jour optimiste: ${action} pour post ${data.id}`)

        switch (action) {
            case 'created':
                return addPostToList(currentPosts, data as GmbPost, sortBy, sortOrder)
                
            case 'updated':
            case 'status_changed':
                return updatePostInList(currentPosts, data)
                
            case 'deleted':
                return removePostFromList(currentPosts, data.id)
                
            default:
                console.warn(`Action SSE non gérée: ${action}`)
                return currentPosts
        }
    }, [addPostToList, updatePostInList, removePostFromList])

    return {
        updatePostInList,
        addPostToList,
        removePostFromList,
        updatePaginatedData,
        applyOptimisticUpdate,
        markPendingUpdate,
        isPendingUpdate,
    }
}
