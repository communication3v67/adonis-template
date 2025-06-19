import transmit from '@adonisjs/transmit/services/main'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Configuration des autorisations pour les canaux Transmit
 */

// Canal global pour tous les posts GMB d'un utilisateur
transmit.authorize<{ userId: string }>('gmb-posts/user/:userId', (ctx: HttpContext, { userId }) => {
  // L'utilisateur ne peut écouter que ses propres posts
  return ctx.auth.user?.id === parseInt(userId)
})

// Canal spécifique pour un post GMB
transmit.authorize<{ postId: string }>('gmb-posts/post/:postId', async (ctx: HttpContext, { postId }) => {
  // Vérifier que l'utilisateur peut accéder à ce post spécifique
  const { default: GmbPost } = await import('#models/gmb_post')
  
  try {
    const post = await GmbPost.findOrFail(parseInt(postId))
    return post.userId === ctx.auth.user?.id
  } catch {
    return false
  }
})

// Canal pour les notifications système de l'utilisateur
transmit.authorize<{ userId: string }>('notifications/user/:userId', (ctx: HttpContext, { userId }) => {
  return ctx.auth.user?.id === parseInt(userId)
})

export default transmit
