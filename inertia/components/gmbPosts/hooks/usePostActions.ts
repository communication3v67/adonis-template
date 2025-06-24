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
                preserveState: true, // Préserver l'état des filtres
                preserveScroll: true, // Préserver la position de scroll
                onSuccess: (page) => {
                    console.log('=== SUCCÈS INLINE ===')
                    console.log('Page reçue:', page)
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: `Champ "${field}" mis à jour avec succès !`,
                        color: 'green',
                        autoClose: 3000,
                    })
                    resolve(page)
                },
                onError: (errors) => {
                    console.log('=== ERREUR INLINE ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: `Erreur lors de la mise à jour du champ "${field}". Vérifiez la valeur saisie.`,
                        color: 'red',
                        autoClose: 5000,
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
                preserveState: true, // Préserver l'état des filtres
                preserveScroll: true, // Préserver la position de scroll
                only: ['posts'], // ✅ AJOUT: Ne rafraîchir que les données des posts
                replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                onStart: () => {
                    console.log('💻 Début suppression du post')
                },
                onSuccess: () => {
                    console.log('=== SUCCÈS SUPPRESSION ===')
                    console.log('Post supprimé avec succès')
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: 'Post supprimé avec succès',
                        color: 'green',
                        autoClose: 3000,
                    })
                },
                onError: (errors) => {
                    console.log('=== ERREUR SUPPRESSION ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la suppression du post. Il se peut qu\'il soit toujours présent.',
                        color: 'red',
                        autoClose: 5000,
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
                preserveState: true, // Préserver l'état des filtres
                preserveScroll: true, // Préserver la position de scroll
                only: ['posts'], // ✅ AJOUT: Ne rafraîchir que les données des posts
                replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                onStart: () => {
                    console.log('💻 Début duplication du post')
                },
                onSuccess: (page) => {
                    console.log('=== SUCCÈS DUPLICATION ===')
                    console.log('Post dupliqué avec succès')
                    console.log('Page reçue:', page)
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: 'Post dupliqué avec succès ! Le nouveau post est maintenant disponible.',
                        color: 'green',
                        autoClose: 4000,
                    })
                },
                onError: (errors) => {
                    console.log('=== ERREUR DUPLICATION ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la duplication du post. Le post n\'a pas été dupliqué.',
                        color: 'red',
                        autoClose: 5000,
                    })
                },
                onFinish: () => {
                    console.log('🏁 Duplication terminée')
                }
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
