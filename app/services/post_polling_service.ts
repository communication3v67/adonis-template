import GmbPost from '#models/gmbPost'
import SSEController from '#controllers/sse_controller'

/**
 * Service de polling pour détecter les changements en base de données
 */
export class PostPollingService {
  private static instance: PostPollingService
  private intervalId: NodeJS.Timeout | null = null
  private lastCheck: Map<number, { updatedAt: string, hash: string }> = new Map()
  private isRunning = false

  static getInstance(): PostPollingService {
    if (!PostPollingService.instance) {
      PostPollingService.instance = new PostPollingService()
    }
    return PostPollingService.instance
  }

  /**
   * Démarre le polling
   */
  start(intervalMs: number = 30000) { // 30 secondes par défaut
    if (this.isRunning) {
      console.log('📊 Polling déjà en cours')
      return
    }

    console.log(`📊 Démarrage du polling des posts GMB (${intervalMs}ms)`)
    this.isRunning = true

    this.intervalId = setInterval(async () => {
      await this.checkForChanges()
    }, intervalMs)

    // Premier check immédiat
    this.checkForChanges()
  }

  /**
   * Arrête le polling
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      console.log('📊 Polling arrêté')
    }
  }

  /**
   * Vérifie les changements en base
   */
  private async checkForChanges() {
    try {
      console.log('🔍 Vérification des changements en base...')

      // Récupérer tous les posts avec leur timestamp de mise à jour
      const posts = await GmbPost.query()
        .select('id', 'user_id', 'text', 'status', 'client', 'updated_at')
        .orderBy('updated_at', 'desc')

      for (const post of posts) {
        const postId = post.id
        const currentHash = this.generatePostHash(post)
        const currentUpdatedAt = post.updatedAt.toISO()

        const lastKnown = this.lastCheck.get(postId)

        if (!lastKnown) {
          // Premier check pour ce post
          this.lastCheck.set(postId, {
            updatedAt: currentUpdatedAt,
            hash: currentHash
          })
          continue
        }

        // Vérifier si le post a été modifié
        if (lastKnown.updatedAt !== currentUpdatedAt || lastKnown.hash !== currentHash) {
          console.log(`🔄 Changement détecté pour le post ${postId}`)
          
          // Mettre à jour notre cache
          this.lastCheck.set(postId, {
            updatedAt: currentUpdatedAt,
            hash: currentHash
          })

          // Diffuser l'événement SSE
          await this.broadcastPostChange(post, 'updated')
        }
      }

      // Nettoyer les posts supprimés de notre cache
      await this.cleanupDeletedPosts(posts.map(p => p.id))

    } catch (error) {
      console.error('❌ Erreur lors du polling:', error)
    }
  }

  /**
   * Génère un hash pour détecter les changements de contenu
   */
  private generatePostHash(post: any): string {
    const content = `${post.text}-${post.status}-${post.client}`
    return Buffer.from(content).toString('base64')
  }

  /**
   * Diffuse un changement de post via SSE
   */
  private async broadcastPostChange(post: any, action: string) {
    try {
      const postData = {
        id: post.id,
        user_id: post.user_id,
        text: post.text,
        status: post.status,
        client: post.client,
        action,
        timestamp: new Date().toISOString(),
        source: 'database_polling'
      }

      // Diffuser vers le canal utilisateur
      SSEController.broadcast(`gmb-posts/user/${post.user_id}`, {
        type: 'post_update',
        data: postData
      })

      // Diffuser vers le canal post spécifique
      SSEController.broadcast(`gmb-posts/post/${post.id}`, {
        type: 'post_update',
        data: postData
      })

      console.log(`📻 SSE Polling: ${action} pour post ${post.id} (user ${post.user_id})`)
    } catch (error) {
      console.error('❌ Erreur diffusion SSE depuis polling:', error)
    }
  }

  /**
   * Nettoie les posts supprimés du cache
   */
  private async cleanupDeletedPosts(existingPostIds: number[]) {
    const cachedPostIds = Array.from(this.lastCheck.keys())
    
    for (const cachedId of cachedPostIds) {
      if (!existingPostIds.includes(cachedId)) {
        console.log(`🗑️ Post ${cachedId} supprimé détecté`)
        this.lastCheck.delete(cachedId)
        
        // On ne peut pas récupérer l'user_id du post supprimé facilement
        // Pour une implémentation complète, il faudrait une table de log
      }
    }
  }

  /**
   * Statistiques du polling
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      trackedPosts: this.lastCheck.size,
      lastCheckTime: new Date().toISOString()
    }
  }
}
