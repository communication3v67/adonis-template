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
            console.log('🔍 DEBUG: Début de la requête fetch')
            
            const csrfToken = getCsrfToken()
            console.log('🔍 DEBUG: Token CSRF obtenu:', csrfToken ? 'OK' : 'MANQUANT')
            
            const response = await fetch('/gmb-posts/send-to-n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            })

            console.log('🔍 DEBUG: Réponse reçue:')
            console.log('  - Status:', response.status)
            console.log('  - StatusText:', response.statusText)
            console.log('  - OK:', response.ok)
            console.log('  - Headers:', Object.fromEntries(response.headers.entries()))

            // Toujours lire le texte de la réponse d'abord
            const responseText = await response.text()
            console.log('🔍 DEBUG: Texte de réponse (premiers 500 chars):', responseText.substring(0, 500))
            
            if (!response.ok) {
                console.log('🚨 DEBUG: Réponse NOT OK - Traitement de l\'erreur')
                
                // Gérer spécifiquement les erreurs 500 et autres codes d'erreur
                let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`
                console.log('🔍 DEBUG: Message d\'erreur initial:', errorMessage)
                
                // Essayer d'extraire un message d'erreur plus détaillé si disponible
                try {
                    const errorData = JSON.parse(responseText)
                    console.log('🔍 DEBUG: JSON d\'erreur parsé:', errorData)
                    if (errorData.message) {
                        errorMessage = errorData.message
                    } else if (errorData.error) {
                        errorMessage = errorData.error
                    }
                } catch (parseError) {
                    console.log('🔍 DEBUG: Impossible de parser le JSON d\'erreur:', parseError)
                    // Si ce n'est pas du JSON, utiliser le texte brut s'il est informatif
                    if (responseText && !responseText.trim().startsWith('<!DOCTYPE')) {
                        errorMessage = responseText.substring(0, 200) // Limiter à 200 caractères
                    }
                }
                
                console.log('🔍 DEBUG: Message d\'erreur final:', errorMessage)
                console.log('🚨 DEBUG: LANCEMENT DE L\'EXCEPTION')
                throw new Error(errorMessage)
            }
            
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
            console.log('🚨 DEBUG: ENTRÉE DANS LE CATCH')
            console.error('🚨 Erreur webhook complète:', error)
            console.log('🔍 DEBUG: Type d\'erreur:', typeof error)
            console.log('🔍 DEBUG: error instanceof Error:', error instanceof Error)
            
            // Gestion détaillée des différents types d'erreurs
            let errorMessage = 'Erreur inconnue lors de l\'envoi vers n8n'
            
            if (error instanceof Error) {
                errorMessage = error.message
                console.log('🔍 DEBUG: Message d\'erreur extrait:', errorMessage)
            } else if (typeof error === 'string') {
                errorMessage = error
                console.log('🔍 DEBUG: Erreur string:', errorMessage)
            }
            
            // Ajouter des informations contextuelles pour certaines erreurs
            if (errorMessage.includes('fetch')) {
                errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.'
            } else if (errorMessage.includes('404')) {
                errorMessage = 'Route non trouvée (404). La fonctionnalité d\'envoi vers n8n pourrait être désactivée.'
            } else if (errorMessage.includes('401')) {
                errorMessage = 'Non autorisé (401). Veuillez vous reconnecter.'
            } else if (errorMessage.includes('403')) {
                errorMessage = 'Accès interdit (403). Vous n\'avez pas les permissions nécessaires.'
            } else if (errorMessage.includes('500')) {
                errorMessage = 'Erreur interne du serveur (500). Le webhook n8n pourrait être indisponible.'
            }
            
            console.log('🔍 DEBUG: Message final pour notification:', errorMessage)
            console.log('🚨 DEBUG: TENTATIVE D\'AFFICHAGE DE LA NOTIFICATION')
            
            // Toujours afficher la notification d'erreur
            const notificationId = notifications.show({
                title: 'Erreur d\'envoi vers n8n',
                message: errorMessage,
                color: 'red',
                autoClose: 8000, // Garder plus longtemps pour les erreurs
            })
            
            console.log('🔍 DEBUG: Notification ID:', notificationId)
            console.log('🚨 DEBUG: NOTIFICATION ENVOYÉE')
            
            // Ouvrir la modale même en cas d'erreur pour afficher les détails
            setWebhookResponse({
                error: true,
                message: errorMessage,
                details: error instanceof Error ? error.stack : error
            })
            setShowWebhookModal(true)
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

            // Toujours lire le texte de la réponse d'abord
            const responseText = await response.text()
            
            if (!response.ok) {
                // Gérer spécifiquement les erreurs 500 et autres codes d'erreur
                let errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`
                
                // Essayer d'extraire un message d'erreur plus détaillé si disponible
                try {
                    const errorData = JSON.parse(responseText)
                    if (errorData.message) {
                        errorMessage = errorData.message
                    } else if (errorData.error) {
                        errorMessage = errorData.error
                    }
                } catch {
                    // Si ce n'est pas du JSON, utiliser le texte brut s'il est informatif
                    if (responseText && !responseText.trim().startsWith('<!DOCTYPE')) {
                        errorMessage = responseText.substring(0, 200) // Limiter à 200 caractères
                    }
                }
                
                throw new Error(errorMessage)
            }
            
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
            console.log('🚨 DEBUG: ENTRÉE DANS LE CATCH (POST INDIVIDUEL)')
            console.error('🚨 Erreur webhook post individuel:', error)
            console.log('🔍 DEBUG: Type d\'erreur:', typeof error)
            console.log('🔍 DEBUG: error instanceof Error:', error instanceof Error)
            
            // Gestion détaillée des différents types d'erreurs
            let errorMessage = 'Erreur inconnue lors de l\'envoi vers n8n'
            
            if (error instanceof Error) {
                errorMessage = error.message
                console.log('🔍 DEBUG: Message d\'erreur extrait:', errorMessage)
            } else if (typeof error === 'string') {
                errorMessage = error
                console.log('🔍 DEBUG: Erreur string:', errorMessage)
            }
            
            // Ajouter des informations contextuelles pour certaines erreurs
            if (errorMessage.includes('fetch')) {
                errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.'
            } else if (errorMessage.includes('404')) {
                errorMessage = 'Route non trouvée (404). La fonctionnalité d\'envoi vers n8n pourrait être désactivée.'
            } else if (errorMessage.includes('401')) {
                errorMessage = 'Non autorisé (401). Veuillez vous reconnecter.'
            } else if (errorMessage.includes('403')) {
                errorMessage = 'Accès interdit (403). Vous n\'avez pas les permissions nécessaires.'
            } else if (errorMessage.includes('500')) {
                errorMessage = 'Erreur interne du serveur (500). Le webhook n8n pourrait être indisponible.'
            }
            
            console.log('🔍 DEBUG: Message final pour notification:', errorMessage)
            console.log('🚨 DEBUG: TENTATIVE D\'AFFICHAGE DE LA NOTIFICATION (POST INDIVIDUEL)')
            
            // Toujours afficher la notification d'erreur
            const notificationId = notifications.show({
                title: 'Erreur d\'envoi du post vers n8n',
                message: errorMessage,
                color: 'red',
                autoClose: 8000, // Garder plus longtemps pour les erreurs
            })
            
            console.log('🔍 DEBUG: Notification ID (POST INDIVIDUEL):', notificationId)
            console.log('🚨 DEBUG: NOTIFICATION ENVOYÉE (POST INDIVIDUEL)')
            
            // Ouvrir la modale même en cas d'erreur pour afficher les détails
            setWebhookResponse({
                error: true,
                message: errorMessage,
                details: error instanceof Error ? error.stack : error,
                postId: post.id
            })
            setShowWebhookModal(true)
        } finally {
            setSendingSinglePost(null)
        }
    }, [getCsrfToken])

    // Fonction de test pour forcer une erreur (DEBUG)
    const testErrorNotification = useCallback(() => {
        console.log('🧪 TEST: Déclenchement d\'une notification d\'erreur de test')
        notifications.show({
            title: 'Test d\'erreur',
            message: 'Ceci est une notification d\'erreur de test pour vérifier le système de notifications',
            color: 'red',
            autoClose: 5000,
        })
    }, [])

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
        testErrorNotification, // DEBUG - fonction de test
    }
}
