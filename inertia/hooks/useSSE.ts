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

type SSEEvent = PostUpdateEvent | NotificationEvent

/**
 * Hook pour gérer les connexions SSE personnalisées
 */
export const useSSE = (userId: number) => {
    const [isConnected, setIsConnected] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [reconnectAttempts, setReconnectAttempts] = useState(0)
    const maxReconnectAttempts = 5

    // Callbacks pour les événements
    const callbacksRef = useRef<{
        onPostUpdate?: (event: PostUpdateEvent) => void
        onNotification?: (event: NotificationEvent) => void
    }>({})

    // Fonction pour se connecter au SSE
    const connect = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        setConnectionStatus('connecting')
        console.log('📻 SSE: Tentative de connexion...')

        try {
            const eventSource = new EventSource('/__sse/events')
            eventSourceRef.current = eventSource

            eventSource.onopen = () => {
                console.log('✅ SSE: Connexion établie')
                setIsConnected(true)
                setConnectionStatus('connected')
                setReconnectAttempts(0)
            }

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    console.log('📨 SSE: Message reçu:', data)
                } catch (error) {
                    console.error('Erreur parsing message SSE:', error)
                }
            }

            // Gestion des événements typés
            eventSource.addEventListener('connected', (event) => {
                const data = JSON.parse(event.data)
                console.log('🔗 SSE: Connecté avec succès:', data)
            })

            eventSource.addEventListener('post_update', (event) => {
                const data = JSON.parse(event.data) as PostUpdateEvent['data']
                console.log('📨 SSE: Mise à jour post:', data)
                const postEvent: PostUpdateEvent = { type: 'post_update', data }
                
                // Appeler le callback personnalisé si défini
                if (callbacksRef.current.onPostUpdate) {
                    callbacksRef.current.onPostUpdate(postEvent)
                }
                
                // Gestion par défaut
                handlePostUpdate(postEvent)
            })

            eventSource.addEventListener('notification', (event) => {
                const data = JSON.parse(event.data) as NotificationEvent['data']
                console.log('🔔 SSE: Notification reçue:', data)
                const notificationEvent: NotificationEvent = { type: 'notification', data }
                
                // Appeler le callback personnalisé si défini
                if (callbacksRef.current.onNotification) {
                    callbacksRef.current.onNotification(notificationEvent)
                }
                
                // Gestion par défaut
                handleNotification(notificationEvent)
            })

            eventSource.addEventListener('ping', (event) => {
                // Ping reçu, connexion toujours active
                console.log('🏓 SSE: Ping reçu')
            })

            eventSource.onerror = (error) => {
                console.error('❌ SSE: Erreur de connexion:', error)
                setIsConnected(false)
                setConnectionStatus('error')
                
                // Tentative de reconnexion
                if (reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Backoff exponentiel
                    console.log(`🔄 SSE: Reconnexion dans ${delay}ms (tentative ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempts(prev => prev + 1)
                        connect()
                    }, delay)
                } else {
                    console.error('❌ SSE: Nombre maximum de tentatives de reconnexion atteint')
                    setConnectionStatus('error')
                    notifications.show({
                        title: 'Connexion perdue',
                        message: 'La connexion temps réel a été perdue. Actualisez la page si nécessaire.',
                        color: 'orange',
                        autoClose: 10000,
                    })
                }
            }

        } catch (error) {
            console.error('❌ SSE: Erreur d\'initialisation:', error)
            setConnectionStatus('error')
        }
    }

    // Gestionnaire de mise à jour des posts
    const handlePostUpdate = (event: PostUpdateEvent) => {
        const { action, text, client } = event.data
        console.log(`📨 Post ${action}:`, text?.substring(0, 50))
        
        // Affichage optionnel de notification pour les actions importantes
        if (action === 'created') {
            console.log('🆕 Nouveau post créé:', text)
        } else if (action === 'updated') {
            console.log('✏️ Post mis à jour:', text)
        } else if (action === 'deleted') {
            console.log('🗑️ Post supprimé:', event.data.id)
        }
    }

    // Gestionnaire de notifications
    const handleNotification = (event: NotificationEvent) => {
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
    }

    // Effet pour établir la connexion
    useEffect(() => {
        if (userId) {
            connect()
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            setIsConnected(false)
            setConnectionStatus('disconnected')
        }
    }, [userId])

    // Fonction pour forcer la reconnexion
    const reconnect = () => {
        setReconnectAttempts(0)
        connect()
    }

    // Fonction pour définir des callbacks personnalisés
    const setCallbacks = (callbacks: {
        onPostUpdate?: (event: PostUpdateEvent) => void
        onNotification?: (event: NotificationEvent) => void
    }) => {
        callbacksRef.current = callbacks
    }

    return {
        isConnected,
        connectionStatus,
        reconnect,
        reconnectAttempts,
        maxReconnectAttempts,
        setCallbacks,
    }
}
