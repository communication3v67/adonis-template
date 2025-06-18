import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'
import { GmbPost } from '../types'

/**
 * Hook personnalisé pour gérer les actions individuelles sur les posts
 */
export const usePostActions = () => {
    const [editingPost, setEditingPost] = useState<GmbPost | null>(null)
    const [editModalOpened, setEditModalOpened] = useState(false)

    // Gestion de l'édition en modal
    const handleEdit = useCallback((post: GmbPost) => {
        setEditingPost(post)
        setEditModalOpened(true)
    }, [])

    const closeEditModal = useCallback(() => {
        setEditModalOpened(false)
        setEditingPost(null)
    }, [])

    // Gestion de l'édition inline
    const handleInlineEdit = useCallback(async (postId: number, field: string, value: string) => {
        return new Promise((resolve, reject) => {
            const updateData = { [field]: value }

            console.log('=== ÉDITION INLINE ===')
            console.log('Post ID:', postId)
            console.log('Champ:', field)
            console.log('Nouvelle valeur:', value)
            console.log('========================')

            router.put(`/gmb-posts/${postId}`, updateData, {
                onSuccess: (page) => {
                    console.log('=== SUCCÈS INLINE ===')
                    console.log('Page reçue:', page)
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: `${field} mis à jour avec succès !`,
                        color: 'green',
                    })
                    resolve(page)
                },
                onError: (errors) => {
                    console.log('=== ERREUR INLINE ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: `Erreur lors de la mise à jour de ${field}`,
                        color: 'red',
                    })
                    reject(errors)
                },
            })
        })
    }, [])

    // Gestion de la suppression
    const handleDelete = useCallback((postId: number) => {
        if (
            confirm('Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.')
        ) {
            console.log('=== SUPPRESSION POST ===')
            console.log('Post ID:', postId)
            console.log('========================')

            router.delete(`/gmb-posts/${postId}`, {
                onSuccess: () => {
                    console.log('=== SUCCÈS SUPPRESSION ===')
                    console.log('Post supprimé avec succès')
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: 'Post supprimé avec succès',
                        color: 'green',
                    })
                },
                onError: (errors) => {
                    console.log('=== ERREUR SUPPRESSION ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la suppression du post',
                        color: 'red',
                    })
                },
            })
        }
    }, [])

    // Gestion de la duplication
    const handleDuplicate = useCallback((postId: number) => {
        console.log('=== DUPLICATION POST ===')
        console.log('Post ID:', postId)
        console.log('========================')

        router.post(
            `/gmb-posts/${postId}/duplicate`,
            {},
            {
                onSuccess: () => {
                    console.log('=== SUCCÈS DUPLICATION ===')
                    console.log('Post dupliqué avec succès')
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: 'Post dupliqué avec succès',
                        color: 'green',
                    })
                },
                onError: (errors) => {
                    console.log('=== ERREUR DUPLICATION ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la duplication du post',
                        color: 'red',
                    })
                },
            }
        )
    }, [])

    return {
        editingPost,
        editModalOpened,
        handleEdit,
        closeEditModal,
        handleInlineEdit,
        handleDelete,
        handleDuplicate,
    }
}
