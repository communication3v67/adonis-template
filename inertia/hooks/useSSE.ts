import { useEffect, useRef, useState } from 'react'
import { notifications } from '@mantine/notifications'
import { SSE_CLIENT_CONFIG } from '../config/sse'

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
 * Hook pour gérer les connexions SSE personnalisées avec gestion avancée des conflits
 */
export const useSSE = (userId: number) => {
    const [isConnected, setIsConnected] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [reconnectAttempts, setReconnectAttempts] = useState(0)
    const maxReconnectAttempts = SSE_CLIENT_CONFIG.MAX_RECONNECT_ATTEMPTS || 15
    
    // Gestion des actions utilisateur en cours pour éviter les conflits
    const [pendingUserActions, setPendingUserActions] = useState<Set<number>>(new Set())
    const pendingTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())

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
                
                // Tentative de reconnexion avec backoff amélioré
                if (reconnectAttempts < maxReconnectAttempts) {
                    // Backoff exponentiel avec jitter pour éviter l'effet "thundering herd"
                    const baseDelay = 1000 * Math.pow(2, Math.min(reconnectAttempts, 6)) // Max 64 secondes de base
                    const jitter = Math.random() * 1000 // Ajout aléatoire de 0-1s
                    const delay = Math.min(baseDelay + jitter, 60000) // Max 1 minute
                    
                    console.log(`🔄 SSE: Reconnexion dans ${Math.round(delay)}ms (tentative ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempts(prev => prev + 1)
                        connect()
                    }, delay)
                } else {
                    console.error('❌ SSE: Nombre maximum de tentatives de reconnexion atteint')
                    setConnectionStatus('error')
                    
                    // Reset automatique du compteur après 5 minutes
                    setTimeout(() => {
                        console.log('🔄 SSE: Reset du compteur de reconnexion après timeout')
                        setReconnectAttempts(0)
                    }, 300000) // 5 minutes
                    
                    notifications.show({
                        title: 'Connexion perdue',
                        message: `La connexion temps réel a été perdue après ${maxReconnectAttempts} tentatives. Elle sera réactivée automatiquement dans 5 minutes.`,
                        color: 'orange',
                        autoClose: 15000,
                    })
                }
            }

        } catch (error) {
            console.error('❌ SSE: Erreur d\'initialisation:', error)
            setConnectionStatus('error')
        }
    }

    // Fonction pour marquer une action utilisateur - VERSION AMÉLIORÉE AVEC PROTECTION ADAPTATIVE
    const markUserAction = (postId: number) => {
        // Marquer l'action utilisateur globalement
        window.lastUserAction = Date.now()
        
        setPendingUserActions(prev => new Set(prev).add(postId))
        
        // Nettoyer le timeout précédent s'il existe
        const existingTimeout = pendingTimeouts.current.get(postId)
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }
        
        // NOUVEAU : Délai adaptatif selon la qualité du réseau
        const baseProtection = SSE_CLIENT_CONFIG.USER_ACTION_PROTECTION
        const networkQuality = window.networkQuality || 'normal'
        
        let adaptiveDelay = baseProtection
        if (networkQuality === 'slow') {
            adaptiveDelay = Math.max(baseProtection, SSE_CLIENT_CONFIG.ADAPTIVE_PROTECTION.SLOW_NETWORK)
        } else if (networkQuality === 'very_slow') {
            adaptiveDelay = Math.max(baseProtection, SSE_CLIENT_CONFIG.ADAPTIVE_PROTECTION.SLOW_NETWORK * 1.5)
        }
        
        // Programmer le nettoyage de la protection avec délai adaptatif
        const timeout = setTimeout(() => {
            setPendingUserActions(prev => {
                const newSet = new Set(prev)
                newSet.delete(postId)
                return newSet
            })
            pendingTimeouts.current.delete(postId)
            console.log(`🛡️ Protection SSE retirée pour post ${postId} (réseau: ${networkQuality})`)
        }, adaptiveDelay)
        
        pendingTimeouts.current.set(postId, timeout)
        console.log(`🛡️ Protection SSE activée pour post ${postId} (${adaptiveDelay / 1000}s, réseau: ${networkQuality})`)
    }

    // Gestionnaire de mise à jour des posts avec gestion améliorée des conflits
    const handlePostUpdate = (event: PostUpdateEvent) => {
        const { action, text, client, id } = event.data
        console.log(`📨 Post ${action}:`, text?.substring(0, 50))
        
        // 🛡️ PROTECTION MULTI-NIVEAUX :
        
        // 1. Vérifier si une action utilisateur est en cours sur ce post spécifique
        if (pendingUserActions.has(id)) {
            console.log(`🙅 Événement SSE ignoré pour post ${id} - action utilisateur en cours`)
            return
        }
        
        // 2. Vérifier si une édition inline est en cours (protection globale)
        if (window._isInlineEditing) {
            console.log(`🙅 Événement SSE ignoré - édition inline globale en cours`)
            return
        }
        
        // 3. Vérifier le timing des actions utilisateur récentes avec délai adaptatif
        const timeSinceUserAction = Date.now() - (window.lastUserAction || 0)
        const networkQuality = window.networkQuality || 'normal'
        const adaptiveStabilization = networkQuality === 'slow' || networkQuality === 'very_slow' 
            ? SSE_CLIENT_CONFIG.STABILIZATION_DELAY * 1.5 
            : SSE_CLIENT_CONFIG.STABILIZATION_DELAY
            
        if (timeSinceUserAction < adaptiveStabilization) {
            console.log(`🙅 Événement SSE ignoré - action utilisateur trop récente (${timeSinceUserAction}ms < ${adaptiveStabilization}ms, réseau: ${networkQuality})`)
            return
        }
        
        // 4. Marquer le timestamp SSE global pour coordination
        window.lastSSEUpdate = Date.now()
        
        // ✅ Événement SSE traité - logging selon le type d'action
        if (action === 'created') {
            console.log('🆕 Nouveau post créé (SSE):', text)
        } else if (action === 'updated') {
            console.log('✏️ Post mis à jour (SSE):', text)
        } else if (action === 'deleted') {
            console.log('🗑️ Post supprimé (SSE):', id)
        } else if (action === 'status_changed') {
            console.log('🔄 Statut changé (SSE):', event.data.status)
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
    
    // Nettoyage amélioré des timeouts au démontage - PROTECTION ANTI-LEAKS
    useEffect(() => {
        return () => {
            console.log('🧹 Nettoyage complet des timeouts SSE - protection anti-leaks')
            
            // Nettoyage sécurisé avec compteur
            let timeoutCount = 0
            pendingTimeouts.current.forEach((timeout, postId) => {
                try {
                    clearTimeout(timeout)
                    timeoutCount++
                } catch (error) {
                    console.warn(`⚠️ Erreur nettoyage timeout post ${postId}:`, error)
                }
            })
            
            pendingTimeouts.current.clear()
            console.log(`✅ ${timeoutCount} timeouts nettoyés avec succès`)
            
            // Nettoyer aussi les actions en attente
            setPendingUserActions(new Set())
        }
    }, [])

    return {
        isConnected,
        connectionStatus,
        reconnect,
        reconnectAttempts,
        maxReconnectAttempts,
        setCallbacks,
        markUserAction,
        pendingUserActions,
    }
}
