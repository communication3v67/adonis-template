import { useEffect, useRef, useState } from 'react'
import { notifications } from '@mantine/notifications'

// Types pour les événements
interface PostUpdateEvent {
    type: 'post_update'
    data: {
        id: number
        action: 'created' | 'updated' | 'deleted' | 'status_changed'
        text?: string
        status?: string
        client?: string
        timestamp: string
        [key: string]: any
    }
}

interface NotificationEvent {
    type: 'notification'
    data: {
        id: string
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        timestamp: string
    }
}

type TransmitEvent = PostUpdateEvent | NotificationEvent

/**
 * Hook pour gérer les connexions SSE Transmit
 */
export const useTransmit = (userId: number) => {
    const [isConnected, setIsConnected] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
    const subscriptionsRef = useRef<Map<string, any>>(new Map())
    const transmitRef = useRef<any>(null)

    // Initialiser Transmit
    useEffect(() => {
        let transmit: any = null

        const initTransmit = async () => {
            try {
                setConnectionStatus('connecting')
                
                // Import dynamique du client Transmit
                const { Transmit } = await import('@adonisjs/transmit-client')
                
                transmit = new Transmit({
                    baseUrl: window.location.origin,
                    beforeSubscribe: (channel: string, request: Request) => {
                        // Ajouter des headers d'authentification si nécessaire
                        console.log(`📡 SSE: Tentative d'abonnement au canal ${channel}`)
                    },
                    onSubscription: (channel: string) => {
                        console.log(`✅ SSE: Abonné au canal ${channel}`)
                    },
                    onSubscribeFailed: (response: Response) => {
                        console.error('❌ SSE: Échec d\'abonnement:', response.status, response.statusText)
                        setConnectionStatus('error')
                    },
                    onReconnectAttempt: (attempt: number) => {
                        console.log(`🔄 SSE: Tentative de reconnexion ${attempt}`)
                        setConnectionStatus('connecting')
                    },
                    onReconnectFailed: () => {
                        console.error('❌ SSE: Échec de reconnexion')
                        setConnectionStatus('error')
                        notifications.show({
                            title: 'Connexion perdue',
                            message: 'La connexion temps réel a été perdue. Actualisez la page si nécessaire.',
                            color: 'orange',
                        })
                    }
                })

                transmitRef.current = transmit
                setConnectionStatus('connected')
                setIsConnected(true)
                
                console.log('🚀 SSE: Client Transmit initialisé')
                
            } catch (error) {
                console.error('❌ SSE: Erreur d\'initialisation:', error)
                setConnectionStatus('error')
            }
        }

        initTransmit()

        return () => {
            // Nettoyer les abonnements
            subscriptionsRef.current.forEach((subscription) => {
                subscription.delete?.()
            })
            subscriptionsRef.current.clear()
            
            transmitRef.current = null
            setIsConnected(false)
            setConnectionStatus('disconnected')
        }
    }, [])

    // Fonction pour s'abonner aux mises à jour des posts de l'utilisateur
    const subscribeToUserPosts = (onPostUpdate: (event: PostUpdateEvent) => void) => {
        if (!transmitRef.current || !userId) return

        const channel = `gmb-posts/user/${userId}`
        
        if (subscriptionsRef.current.has(channel)) {
            console.log(`⚠️ SSE: Déjà abonné au canal ${channel}`)
            return
        }

        try {
            const subscription = transmitRef.current.subscription(channel)
            
            subscription.onMessage((event: TransmitEvent) => {
                console.log(`📨 SSE: Événement reçu sur ${channel}:`, event)
                
                if (event.type === 'post_update') {
                    onPostUpdate(event)
                }
            })

            subscription.create()
            subscriptionsRef.current.set(channel, subscription)
            
            console.log(`📡 SSE: Abonnement créé pour ${channel}`)
        } catch (error) {
            console.error(`❌ SSE: Erreur d'abonnement à ${channel}:`, error)
        }
    }

    // Fonction pour s'abonner aux notifications de l'utilisateur
    const subscribeToNotifications = (onNotification?: (event: NotificationEvent) => void) => {
        if (!transmitRef.current || !userId) return

        const channel = `notifications/user/${userId}`
        
        if (subscriptionsRef.current.has(channel)) {
            console.log(`⚠️ SSE: Déjà abonné au canal ${channel}`)
            return
        }

        try {
            const subscription = transmitRef.current.subscription(channel)
            
            subscription.onMessage((event: TransmitEvent) => {
                console.log(`🔔 SSE: Notification reçue sur ${channel}:`, event)
                
                if (event.type === 'notification') {
                    // Afficher automatiquement la notification
                    notifications.show({
                        id: event.data.id,
                        title: event.data.title,
                        message: event.data.message,
                        color: event.data.type === 'success' ? 'green' : 
                               event.data.type === 'error' ? 'red' :
                               event.data.type === 'warning' ? 'orange' : 'blue',
                        autoClose: event.data.type === 'error' ? 8000 : 5000,
                    })
                    
                    // Callback optionnel
                    onNotification?.(event)
                }
            })

            subscription.create()
            subscriptionsRef.current.set(channel, subscription)
            
            console.log(`🔔 SSE: Abonnement notifications créé pour ${channel}`)
        } catch (error) {
            console.error(`❌ SSE: Erreur d'abonnement notifications à ${channel}:`, error)
        }
    }

    // Fonction pour s'abonner à un post spécifique
    const subscribeToPost = (postId: number, onPostUpdate: (event: PostUpdateEvent) => void) => {
        if (!transmitRef.current) return

        const channel = `gmb-posts/post/${postId}`
        
        if (subscriptionsRef.current.has(channel)) {
            return
        }

        try {
            const subscription = transmitRef.current.subscription(channel)
            
            subscription.onMessage((event: TransmitEvent) => {
                if (event.type === 'post_update') {
                    onPostUpdate(event)
                }
            })

            subscription.create()
            subscriptionsRef.current.set(channel, subscription)
            
            console.log(`📡 SSE: Abonnement post créé pour ${channel}`)
        } catch (error) {
            console.error(`❌ SSE: Erreur d'abonnement post à ${channel}:`, error)
        }
    }

    // Fonction pour se désabonner d'un canal
    const unsubscribe = (channel: string) => {
        const subscription = subscriptionsRef.current.get(channel)
        if (subscription) {
            subscription.delete()
            subscriptionsRef.current.delete(channel)
            console.log(`📡 SSE: Désabonnement de ${channel}`)
        }
    }

    return {
        isConnected,
        connectionStatus,
        subscribeToUserPosts,
        subscribeToNotifications,
        subscribeToPost,
        unsubscribe,
    }
}
