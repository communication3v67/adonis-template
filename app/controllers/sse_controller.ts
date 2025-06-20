import type { HttpContext } from '@adonisjs/core/http'

interface SSEConnection {
  userId: number
  response: any
  channels: Set<string>
}

/**
 * Contrôleur SSE personnalisé pour les mises à jour en temps réel
 */
export default class SSEController {
  private static connections = new Map<string, SSEConnection>()

  /**
   * Endpoint SSE pour les événements en temps réel
   */
  async events({ request, response, auth }: HttpContext) {
    try {
      // S'assurer que l'utilisateur est authentifié
      await auth.check()
      const user = auth.user!

      // Configuration des headers SSE
      response.response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // ID unique pour cette connexion
      const connectionId = `${user.id}-${Date.now()}`
      
      // Stocker la connexion
      SSEController.connections.set(connectionId, {
        userId: user.id,
        response: response.response,
        channels: new Set()
      })

      console.log(`📡 SSE: Nouvelle connexion pour utilisateur ${user.id} (${connectionId})`)

      // Message initial de connexion
      this.sendEvent(response.response, 'connected', {
        userId: user.id,
        connectionId,
        timestamp: new Date().toISOString()
      })

      // Abonnement automatique aux canaux de l'utilisateur
      const userChannel = `gmb-posts/user/${user.id}`
      const notificationChannel = `notifications/user/${user.id}`
      
      const connection = SSEController.connections.get(connectionId)
      if (connection) {
        connection.channels.add(userChannel)
        connection.channels.add(notificationChannel)
      }

      // Ping périodique pour maintenir la connexion
      const pingInterval = setInterval(() => {
        if (SSEController.connections.has(connectionId)) {
          this.sendEvent(response.response, 'ping', { timestamp: new Date().toISOString() })
        } else {
          clearInterval(pingInterval)
        }
      }, 30000) // Ping toutes les 30 secondes

      // Gestion de la fermeture de connexion
      request.request.on('close', () => {
        console.log(`📡 SSE: Connexion fermée pour utilisateur ${user.id} (${connectionId})`)
        SSEController.connections.delete(connectionId)
        clearInterval(pingInterval)
      })

      request.request.on('error', (error) => {
        console.error(`📡 SSE: Erreur connexion ${connectionId}:`, error)
        SSEController.connections.delete(connectionId)
        clearInterval(pingInterval)
      })

    } catch (error) {
      console.error('📡 SSE: Erreur endpoint events:', error)
      response.status(500).send('Erreur SSE')
    }
  }

  /**
   * Envoie un événement SSE
   */
  private sendEvent(response: any, event: string, data: any) {
    try {
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      response.write(eventData)
    } catch (error) {
      console.error('📡 SSE: Erreur envoi événement:', error)
    }
  }

  /**
   * Diffuse un événement vers un canal spécifique
   */
  static broadcast(channel: string, event: { type: string; data: any }) {
    console.log(`📡 SSE: Diffusion sur canal ${channel}:`, event.type)
    
    let sentCount = 0
    
    for (const [connectionId, connection] of SSEController.connections.entries()) {
      if (connection.channels.has(channel)) {
        try {
          const eventData = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
          connection.response.write(eventData)
          sentCount++
        } catch (error) {
          console.error(`📡 SSE: Erreur envoi vers ${connectionId}:`, error)
          // Supprimer la connexion défaillante
          SSEController.connections.delete(connectionId)
        }
      }
    }
    
    console.log(`📡 SSE: Événement ${event.type} envoyé à ${sentCount} connexion(s)`)
  }

  /**
   * Vérifie l'autorisation d'un utilisateur pour un canal
   */
  static canAccessChannel(userId: number, channel: string): boolean {
    // Canal utilisateur - seulement le propriétaire
    if (channel.startsWith(`gmb-posts/user/`) || channel.startsWith(`notifications/user/`)) {
      const channelUserId = parseInt(channel.split('/')[2])
      return userId === channelUserId
    }
    
    // Canal post - vérification propriétaire (à implémenter si nécessaire)
    if (channel.startsWith(`gmb-posts/post/`)) {
      // TODO: Vérifier que l'utilisateur possède le post
      return true
    }
    
    return false
  }

  /**
   * Endpoint de test pour déclencher des événements SSE
   */
  async testEvent({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!
      
      const { type = 'notification', message = 'Test SSE depuis endpoint' } = request.qs()
      
      if (type === 'notification') {
        // Test notification
        SSEController.broadcast(`notifications/user/${user.id}`, {
          type: 'notification',
          data: {
            id: Date.now().toString(),
            type: 'info',
            title: 'Test SSE',
            message: message,
            timestamp: new Date().toISOString()
          }
        })
      } else if (type === 'post_update') {
        // Test mise à jour post fictive
        SSEController.broadcast(`gmb-posts/user/${user.id}`, {
          type: 'post_update',
          data: {
            id: 999,
            action: 'updated',
            text: 'Post de test SSE',
            client: 'Test Client',
            timestamp: new Date().toISOString()
          }
        })
      }
      
      return response.json({
        success: true,
        message: `Événement SSE de test envoyé (${type})`
      })
    } catch (error) {
      return response.status(500).json({ 
        success: false, 
        error: 'Erreur test SSE' 
      })
    }
  }
  /**
   * Statistiques du service de polling
   */
  async pollingStats({ response, auth }: HttpContext) {
    try {
      await auth.check()
      
      const { PostPollingService } = await import('#services/post_polling_service')
      const pollingService = PostPollingService.getInstance()
      
      return response.json({
        polling: pollingService.getStats(),
        connections: {
          total: SSEController.connections.size,
          by_user: this.getConnectionsByUser()
        }
      })
    } catch (error) {
      return response.status(500).json({ error: 'Erreur récupération stats polling' })
    }
  }
  
  private getConnectionsByUser() {
    const stats = {}
    for (const connection of SSEController.connections.values()) {
      const userId = connection.userId.toString()
      if (!stats[userId]) {
        stats[userId] = 0
      }
      stats[userId]++
    }
    return stats
  }
  
  async stats({ response, auth }: HttpContext) {
    try {
      await auth.check()
      
      const stats = {
        total_connections: SSEController.connections.size,
        connections_by_user: {},
        channels: new Set()
      }
      
      // Statistiques par utilisateur
      for (const connection of SSEController.connections.values()) {
        const userId = connection.userId.toString()
        if (!stats.connections_by_user[userId]) {
          stats.connections_by_user[userId] = 0
        }
        stats.connections_by_user[userId]++
        
        // Collecter tous les canaux
        for (const channel of connection.channels) {
          stats.channels.add(channel)
        }
      }
      
      return response.json({
        ...stats,
        channels: Array.from(stats.channels)
      })
    } catch (error) {
      return response.status(500).json({ error: 'Erreur récupération stats SSE' })
    }
  }
}
