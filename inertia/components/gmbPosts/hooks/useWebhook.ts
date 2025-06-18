import { useState, useCallback } from 'react'
import { notifications } from '@mantine/notifications'
import { GmbPost } from '../types'

/**
 * Hook personnalisé pour gérer l'envoi vers webhook n8n
 */
export const useWebhook = () => {
    const [sendingToN8n, setSendingToN8n] = useState(false)
    const [sendingSinglePost, setSendingSinglePost] = useState<number | null>(null)
    const [webhookResponse, setWebhookResponse] = useState<any>(null)
    const [showWebhookModal, setShowWebhookModal] = useState(false)

    // Fonction pour obtenir le token CSRF
    const getCsrfToken = useCallback(() => {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content')
        
        if (!csrfToken) {
            throw new Error('Token CSRF manquant. Actualisez la page.')
        }
        
        return csrfToken
    }, [])

    // Envoyer tous les posts "Post à générer" vers n8n
    const sendPostsToN8n = useCallback(async (postsToGenerateCount: number) => {
        if (postsToGenerateCount === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucun post "Post à générer" à envoyer',
                color: 'blue',
            })
            return
        }

        setSendingToN8n(true)
        setWebhookResponse(null)

        try {
            console.log(`🚀 Envoi de ${postsToGenerateCount} posts GMB vers n8n`)
            
            const csrfToken = getCsrfToken()
            
            const response = await fetch('/gmb-posts/send-to-n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
            }

            const responseText = await response.text()
            
            // Vérifier si c'est du HTML (redirection)
            if (responseText.trim().startsWith('<!DOCTYPE')) {
                throw new Error("La requête a été redirigée. Problème d'authentification ou de route.")
            }

            const result = JSON.parse(responseText)
            
            setWebhookResponse(result.data || result)
            setShowWebhookModal(true)

            notifications.show({
                title: 'Succès',
                message: `${postsToGenerateCount} posts GMB envoyés avec succès vers n8n !`,
                color: 'green',
            })
        } catch (error) {
            console.error('🚨 Erreur webhook:', error)
            
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
            
            notifications.show({
                title: 'Erreur',
                message: `Erreur lors de l'envoi: ${errorMessage}`,
                color: 'red',
            })
        } finally {
            setSendingToN8n(false)
        }
    }, [getCsrfToken])

    // Envoyer un post individuel vers n8n
    const sendSinglePostToN8n = useCallback(async (post: GmbPost) => {
        // Vérification côté client
        if (post.status !== 'Post à générer') {
            notifications.show({
                title: 'Action non autorisée',
                message: `Ce post ne peut pas être envoyé. Statut actuel: "${post.status}". Seuls les posts "Post à générer" peuvent être envoyés.`,
                color: 'orange',
            })
            return
        }

        setSendingSinglePost(post.id)
        setWebhookResponse(null)

        try {
            console.log(`🚀 Envoi du post GMB individuel (ID: ${post.id}) vers n8n`)
            
            const csrfToken = getCsrfToken()

            const response = await fetch(`/gmb-posts/${post.id}/send-to-n8n`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
            }

            const responseText = await response.text()
            
            if (responseText.trim().startsWith('<!DOCTYPE')) {
                throw new Error("La requête a été redirigée. Problème d'authentification ou de route.")
            }

            const result = JSON.parse(responseText)
            
            setWebhookResponse(result.data || result)
            setShowWebhookModal(true)

            notifications.show({
                title: 'Succès',
                message: `Post "${post.text?.substring(0, 30)}..." envoyé avec succès vers n8n !`,
                color: 'green',
            })
        } catch (error) {
            console.error('🚨 Erreur webhook:', error)
            
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
            
            notifications.show({
                title: 'Erreur',
                message: `Erreur lors de l'envoi du post: ${errorMessage}`,
                color: 'red',
            })
        } finally {
            setSendingSinglePost(null)
        }
    }, [getCsrfToken])

    const closeWebhookModal = useCallback(() => {
        setShowWebhookModal(false)
        setWebhookResponse(null)
    }, [])

    return {
        sendingToN8n,
        sendingSinglePost,
        webhookResponse,
        showWebhookModal,
        sendPostsToN8n,
        sendSinglePostToN8n,
        closeWebhookModal,
    }
}
