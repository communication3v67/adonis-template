import React, { memo } from 'react'
import { GmbPost } from '../../types'

interface PostRowProps {
    post: GmbPost
    isSelected: boolean
    // ... autres props
}

/**
 * Composant PostRow optimisé avec React.memo
 * Ne re-render que si les props du post spécifique changent
 */
export const PostRow = memo<PostRowProps>(({
    post,
    isSelected,
    // ... autres props
}) => {
    // Rendu du post...
    return (
        <tr key={post.id}>
            {/* ... contenu ... */}
        </tr>
    )
}, (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter les re-renders inutiles
    return (
        prevProps.post.id === nextProps.post.id &&
        JSON.stringify(prevProps.post) === JSON.stringify(nextProps.post) &&
        prevProps.isSelected === nextProps.isSelected
    )
})

PostRow.displayName = 'PostRow'
