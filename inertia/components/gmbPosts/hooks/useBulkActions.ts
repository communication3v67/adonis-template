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
        location_id: '',
        account_id: '',
        notion_id: '',
    })

    // Vérifier s'il y a des modifications en masse
    const hasAnyBulkChanges = useCallback(() => {
        return Object.values(bulkEditData).some((value) => value.trim() !== '')
    }, [bulkEditData])

    // Réinitialiser les données d'édition en masse
    const resetBulkEdit = useCallback(() => {
        setBulkEditData({
            status: '',
            client: '',
            project_name: '',
            location_id: '',
            account_id: '',
            notion_id: '',
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
            if (value.trim() !== '') {
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
                    onSuccess: () => {
                        console.log('=== SUCCÈS ÉDITION MASSE ===')
                        resetBulkEdit()
                        notifications.show({
                            title: 'Succès',
                            message: `${selectedPosts.length} post(s) modifié(s) avec succès !`,
                            color: 'green',
                        })
                    },
                    onError: (errors) => {
                        console.log('=== ERREUR ÉDITION MASSE ===')
                        console.log('Erreurs reçues:', errors)
                        console.log('========================')
                        notifications.show({
                            title: 'Erreur',
                            message: 'Erreur lors de la modification en masse',
                            color: 'red',
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

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPosts.length} post(s) ?`)) {
            router.delete('/gmb-posts', {
                data: { ids: selectedPosts },
                onSuccess: () => {
                    notifications.show({
                        title: 'Succès',
                        message: 'Posts supprimés avec succès',
                        color: 'green',
                    })
                },
                onError: () => {
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la suppression',
                        color: 'red',
                    })
                },
            })
        }
    }, [])

    const updateBulkEditField = useCallback((field: keyof BulkEditData, value: string) => {
        setBulkEditData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }, [])

    return {
        bulkEditData,
        setBulkEditData,
        updateBulkEditField,
        hasAnyBulkChanges,
        resetBulkEdit,
        handleBulkEdit,
        handleBulkDelete,
    }
}
