import { useState, useCallback } from 'react'
import { GmbPost } from '../types'

/**
 * Hook personnalisé pour gérer la sélection multiple de posts
 */
export const useSelection = (posts: GmbPost[]) => {
    const [selectedPosts, setSelectedPosts] = useState<number[]>([])

    const toggleSelectAll = useCallback(() => {
        if (selectedPosts.length === posts.length) {
            setSelectedPosts([])
        } else {
            setSelectedPosts(posts.map((post) => post.id))
        }
    }, [selectedPosts.length, posts])

    const toggleSelectPost = useCallback((postId: number) => {
        setSelectedPosts((prev) =>
            prev.includes(postId) 
                ? prev.filter((id) => id !== postId) 
                : [...prev, postId]
        )
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedPosts([])
    }, [])

    const isSelected = useCallback((postId: number) => {
        return selectedPosts.includes(postId)
    }, [selectedPosts])

    const isAllSelected = posts.length > 0 && selectedPosts.length === posts.length
    const isIndeterminate = selectedPosts.length > 0 && selectedPosts.length < posts.length

    return {
        selectedPosts,
        setSelectedPosts,
        toggleSelectAll,
        toggleSelectPost,
        clearSelection,
        isSelected,
        isAllSelected,
        isIndeterminate,
        selectedCount: selectedPosts.length,
    }
}
