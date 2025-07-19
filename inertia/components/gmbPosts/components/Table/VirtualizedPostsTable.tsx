import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { GmbPost } from '../../types'

interface VirtualizedTableProps {
    posts: GmbPost[]
    onPostUpdate: (post: GmbPost) => void
}

/**
 * Tableau virtualisé pour de très grosses listes
 * Seules les lignes visibles sont rendues
 */
export const VirtualizedPostsTable: React.FC<VirtualizedTableProps> = ({
    posts,
    onPostUpdate
}) => {
    const Row = useMemo(() => ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const post = posts[index]
        
        return (
            <div style={style}>
                <PostRow 
                    post={post}
                    onUpdate={onPostUpdate}
                    // ... autres props
                />
            </div>
        )
    }, [posts, onPostUpdate])

    return (
        <List
            height={600} // Hauteur visible
            itemCount={posts.length}
            itemSize={60} // Hauteur d'une ligne
            width="100%"
        >
            {Row}
        </List>
    )
}

// Alternative pour des listes de taille variable
export const VariableSizeVirtualizedTable = () => {
    // Implémentation avec VariableSizeList pour des hauteurs de lignes dynamiques
}
