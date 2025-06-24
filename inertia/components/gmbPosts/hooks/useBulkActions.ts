import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'
import { BulkEditData } from '../types'

/**
 * Hook personnalisé pour gérer les actions en masse
 */
export const useBulkActions = () => {
    const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
        status: '',
        client: '',
        project_name: '',
        city: '',
        location_id: '',
        account_id: '',
        notion_id: '',
        informations: '',
        images: [],
    })

    // Vérifier s'il y a des modifications en masse
    const hasAnyBulkChanges = useCallback(() => {
        return Object.entries(bulkEditData).some(([key, value]) => {
            if (key === 'images') {
                return Array.isArray(value) && value.length > 0
            }
            return typeof value === 'string' && value.trim() !== ''
        })
    }, [bulkEditData])

    // Réinitialiser les données d'édition en masse
    const resetBulkEdit = useCallback(() => {
        setBulkEditData({
            status: '',
            client: '',
            project_name: '',
            city: '',
            location_id: '',
            account_id: '',
            notion_id: '',
            informations: '',
            images: [],
        })
    }, [])

    // Gérer l'édition en masse
    const handleBulkEdit = useCallback((selectedPosts: number[]) => {
        if (selectedPosts.length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucun post sélectionné',
                color: 'blue',
            })
            return
        }

        if (!hasAnyBulkChanges()) {
            notifications.show({
                title: 'Information',
                message: 'Aucune modification sélectionnée',
                color: 'blue',
            })
            return
        }

        // Préparer les données à envoyer (seulement les champs modifiés)
        const updateData: any = {}
        Object.entries(bulkEditData).forEach(([key, value]) => {
            if (key === 'images') {
                if (Array.isArray(value) && value.length > 0) {
                    updateData[key] = value
                }
            } else if (typeof value === 'string' && value.trim() !== '') {
                updateData[key] = value
            }
        })

        const fieldsToUpdate = Object.keys(updateData)
        const confirmMessage = `Êtes-vous sûr de vouloir modifier ${fieldsToUpdate.join(', ')} pour ${selectedPosts.length} post(s) ?`

        if (confirm(confirmMessage)) {
            console.log('=== ÉDITION EN MASSE ===')
            console.log('Posts sélectionnés:', selectedPosts)
            console.log('Données à mettre à jour:', updateData)
            console.log('========================')

            router.post(
                '/gmb-posts/bulk-update',
                {
                    ids: selectedPosts,
                    updateData: updateData,
                },
                {
                    preserveState: true, // Préserver l'état des filtres
                    preserveScroll: true, // Préserver la position de scroll
                    only: ['posts'], // ✅ AJOUT: Ne rafraîchir que les données des posts
                    replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                    onStart: () => {
                        console.log('💻 Début édition en masse')
                    },
                    onSuccess: () => {
                        console.log('=== SUCCÈS ÉDITION MASSE ===')
                        resetBulkEdit()
                        notifications.show({
                            title: 'Succès',
                            message: `${selectedPosts.length} post(s) modifié(s) avec succès ! Champs mis à jour : ${fieldsToUpdate.join(', ')}`,
                            color: 'green',
                            autoClose: 5000,
                        })
                    },
                    onError: (errors) => {
                        console.log('=== ERREUR ÉDITION MASSE ===')
                        console.log('Erreurs reçues:', errors)
                        console.log('========================')
                        notifications.show({
                            title: 'Erreur',
                            message: 'Erreur lors de la modification en masse. Vérifiez les données et réessayez.',
                            color: 'red',
                            autoClose: 7000,
                        })
                    },
                }
            )
        }
    }, [bulkEditData, hasAnyBulkChanges, resetBulkEdit])

    // Gérer la suppression en masse
    const handleBulkDelete = useCallback((selectedPosts: number[]) => {
        if (selectedPosts.length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucun post sélectionné',
                color: 'blue',
            })
            return
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPosts.length} post(s) ? Cette action est irréversible.`)) {
            console.log('=== SUPPRESSION EN MASSE ===')
            console.log('Posts sélectionnés:', selectedPosts)
            console.log('========================')
            
            router.delete('/gmb-posts', {
                data: { ids: selectedPosts },
                preserveState: true, // Préserver l'état des filtres
                preserveScroll: true, // Préserver la position de scroll
                only: ['posts'], // ✅ AJOUT: Ne rafraîchir que les données des posts
                replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                onStart: () => {
                    console.log('💻 Début suppression en masse')
                },
                onSuccess: () => {
                    console.log('=== SUCCÈS SUPPRESSION MASSE ===')
                    console.log('Posts supprimés avec succès')
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: `${selectedPosts.length} post(s) supprimé(s) avec succès`,
                        color: 'green',
                        autoClose: 4000,
                    })
                },
                onError: (errors) => {
                    console.log('=== ERREUR SUPPRESSION MASSE ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: `Erreur lors de la suppression de ${selectedPosts.length} post(s). Certains posts peuvent ne pas avoir été supprimés.`,
                        color: 'red',
                        autoClose: 6000,
                    })
                },
            })
        }
    }, [])

    const updateBulkEditField = useCallback((field: keyof BulkEditData, value: string | string[]) => {
        setBulkEditData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }, [])

    // Gérer l'attribution d'images en masse
    const handleBulkImages = useCallback((selectedPosts: number[], images: string[], overwriteExisting: boolean = false) => {
        if (selectedPosts.length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucun post sélectionné',
                color: 'blue',
            })
            return
        }

        if (images.length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucune image fournie',
                color: 'blue',
            })
            return
        }

        const postsToUpdate = Math.min(selectedPosts.length, images.length)
        const behaviorText = overwriteExisting ? "" : " (seuls les posts sans image existante seront modifiés)"
        const confirmMessage = `Attribuer ${postsToUpdate} images à ${postsToUpdate} posts ?${images.length < selectedPosts.length ? ` (${selectedPosts.length - images.length} posts garderont leur image actuelle)` : ''}${behaviorText}`

        if (confirm(confirmMessage)) {
            console.log('=== ATTRIBUTION IMAGES EN MASSE ===')
            console.log('Posts sélectionnés:', selectedPosts)
            console.log('Images à attribuer:', images)
            console.log('====================================')

            router.post(
                '/gmb-posts/bulk-images',
                {
                    ids: selectedPosts,
                    images: images,
                    overwriteExisting: overwriteExisting,
                },
                {
                    preserveState: true, // Préserver l'état des filtres
                    preserveScroll: true, // Préserver la position de scroll
                    only: ['posts'], // ✅ AJOUT: Ne rafraîchir que les données des posts
                    replace: false, // ✅ AJOUT: Ne pas remplacer l'historique
                    onStart: () => {
                        console.log('💻 Début attribution d\'images en masse')
                    },
                    onSuccess: () => {
                        console.log('=== SUCCÈS ATTRIBUTION IMAGES ===')
                        notifications.show({
                            title: 'Succès',
                            message: `Images attribuées avec succès !`,
                            color: 'green',
                            autoClose: 5000,
                        })
                    },
                    onError: (errors) => {
                        console.log('=== ERREUR ATTRIBUTION IMAGES ===')
                        console.log('Erreurs reçues:', errors)
                        console.log('==================================')
                        notifications.show({
                            title: 'Erreur',
                            message: 'Erreur lors de l\'attribution des images. Vérifiez les URLs et réessayez.',
                            color: 'red',
                            autoClose: 7000,
                        })
                    },
                }
            )
        }
    }, [])

    return {
        bulkEditData,
        setBulkEditData,
        updateBulkEditField,
        hasAnyBulkChanges,
        resetBulkEdit,
        handleBulkEdit,
        handleBulkDelete,
        handleBulkImages,
    }
}
