import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'
import { GmbPost } from '../types'

/**
 * Hook personnalisé pour gérer les actions individuelles sur les posts avec protection SSE
 */
export const usePostActions = (markUserAction?: (postId: number) => void) => {
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

    // Gestion de l'édition inline avec requêtes API pures (sans Inertia)
    const handleInlineEdit = useCallback(async (postId: number, field: string, value: string) => {
        return new Promise(async (resolve, reject) => {
            const updateData = { [field]: value }

            console.log('=== ÉDITION INLINE API ===')
            console.log('Post ID:', postId)
            console.log('Champ:', field)
            console.log('Nouvelle valeur:', value)
            console.log('==========================')
            
            // Marquer l'action utilisateur AVANT la requête pour éviter les conflits SSE
            if (markUserAction) {
                markUserAction(postId)
                console.log(`🛡️ Protection SSE activée pour post ${postId} (action utilisateur)`)
            }

            // Marquer qu'une édition inline est en cours
            window._isInlineEditing = true
            
            try {
                // Utiliser fetch au lieu d'Inertia pour éviter les rechargements
                const response = await fetch(`/gmb-posts/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify(updateData)
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.message || `Erreur HTTP: ${response.status}`)
                }

                const result = await response.json()
                
                console.log('=== SUCCÈS INLINE API ===')
                console.log('Mise à jour réussie - attente SSE pour synchronisation')
                console.log('Résultat:', result)
                console.log('==========================')
                
                // PAS de notification - la mise à jour optimiste SSE s'en charge
                // PAS de rechargement - l'état est entièrement préservé
                
                resolve(result)
            } catch (error) {
                console.log('=== ERREUR INLINE API ===')
                console.log('Erreur:', error)
                console.log('==========================')
                
                notifications.show({
                    title: 'Erreur',
                    message: `Erreur lors de la mise à jour du champ "${field}". ${error.message}`,
                    color: 'red',
                    autoClose: 5000,
                })
                reject(error)
            } finally {
                // Nettoyer le flag d'édition
                window._isInlineEditing = false
                console.log(`🏁 Édition ${field} terminée pour post ${postId}`)
            }
        })
    }, [markUserAction])

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
                only: [], // NE RIEN RAFRAÎCHIR - le SSE s'en chargera
                replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                onStart: () => {
                    console.log('💻 Début suppression du post')
                },
                onSuccess: () => {
                    console.log('=== SUCCÈS SUPPRESSION ===')
                    console.log('Suppression réussie - attente SSE pour synchronisation')
                    console.log('============================')
                    
                    // PAS de notification immédiate - attendre la mise à jour optimiste
                    // Le SSE va déclencher la suppression dans la liste
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
                only: [], // NE RIEN RAFRAÎCHIR - le SSE s'en chargera
                replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                onStart: () => {
                    console.log('💻 Début duplication du post')
                },
                onSuccess: (page) => {
                    console.log('=== SUCCÈS DUPLICATION ===')
                    console.log('Duplication réussie - attente SSE pour synchronisation')
                    console.log('==============================')
                    
                    // PAS de notification immédiate - attendre la mise à jour optimiste
                    // Le SSE va ajouter le nouveau post dans la liste
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
