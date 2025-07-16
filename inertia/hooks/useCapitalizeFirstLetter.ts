import { router } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

export function useCapitalizeFirstLetter() {
    const [isProcessing, setIsProcessing] = useState(false)

    const capitalizeFirstLetter = (selectedPosts: number[]) => {
        // Vérification de sécurité (ne devrait pas arriver si le bouton est bien désactivé)
        if (selectedPosts.length === 0) {
            console.warn('Aucun post sélectionné pour la capitalisation')
            return
        }

        setIsProcessing(true)

        router.post(
            '/gmb-posts/capitalize-first-letter',
            { ids: selectedPosts },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    notifications.show({
                        id: 'capitalize-first-letter',
                        loading: true,
                        title: 'Traitement en cours',
                        message: 'Mise en majuscule de la première lettre en cours...',
                        autoClose: false,
                        withCloseButton: false,
                    })
                },
                onSuccess: () => {
                    notifications.update({
                        id: 'capitalize-first-letter',
                        color: 'teal',
                        title: 'Succès',
                        message: 'La première lettre a été mise en majuscule avec succès !',
                        autoClose: 3000,
                    })
                },
                onError: (errors) => {
                    console.error('Erreur lors de la mise en majuscule:', errors)
                    notifications.update({
                        id: 'capitalize-first-letter',
                        color: 'red',
                        title: 'Erreur',
                        message: 'Une erreur est survenue lors du traitement.',
                        autoClose: 5000,
                    })
                },
                onFinish: () => {
                    setIsProcessing(false)
                },
            }
        )
    }

    return {
        isProcessing,
        capitalizeFirstLetter,
    }
}
