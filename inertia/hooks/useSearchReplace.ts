import { router } from '@inertiajs/react'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

interface Replacement {
    postId: number
    field: string
    newValue: string
}

export function useSearchReplace() {
    const [isProcessing, setIsProcessing] = useState(false)
    const [searchReplaceModalOpened, setSearchReplaceModalOpened] = useState(false)

    const openSearchReplaceModal = () => {
        setSearchReplaceModalOpened(true)
    }

    const closeSearchReplaceModal = () => {
        setSearchReplaceModalOpened(false)
    }

    const performSearchReplace = (replacements: Replacement[]) => {
        if (replacements.length === 0) return

        setIsProcessing(true)

        router.post(
            '/gmb-posts/bulk-search-replace',
            { replacements },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    notifications.show({
                        id: 'search-replace',
                        loading: true,
                        title: 'Traitement en cours',
                        message: 'Remplacement des textes...',
                        autoClose: false,
                        withCloseButton: false,
                    })
                },
                onSuccess: () => {
                    notifications.update({
                        id: 'search-replace',
                        color: 'teal',
                        title: 'Succès',
                        message: 'Les remplacements ont été effectués avec succès !',
                        // icon: <LuCheck size={16} />,
                        autoClose: 3000,
                    })
                    closeSearchReplaceModal()
                },
                onError: (errors) => {
                    console.error('Erreur lors du rechercher/remplacer:', errors)
                    notifications.update({
                        id: 'search-replace',
                        color: 'red',
                        title: 'Erreur',
                        message: 'Une erreur est survenue lors du traitement.',
                        // icon: <LuX size={16} />,
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
        searchReplaceModalOpened,
        openSearchReplaceModal,
        closeSearchReplaceModal,
        performSearchReplace,
    }
}
