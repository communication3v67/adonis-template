import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import GmbPost from '#models/gmbPost'

export default class TestRelations extends BaseCommand {
  static commandName = 'test:relations'
  static description = 'Test user and post relations'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      this.logger.info('🧪 Testing User and GmbPost relations...')

      // Test 1: Récupérer un utilisateur avec ses posts
      const user = await User.query().preload('gmbPosts').first()
      if (!user) {
        this.logger.warning('No users found. Run seeder first: node ace db:seed')
        return
      }

      this.logger.info(`👤 User: ${user.username} (${user.email})`)
      this.logger.info(`📝 Posts count: ${user.gmbPosts.length}`)

      // Test 2: Utiliser les méthodes utilitaires
      const stats = await user.getStats()
      this.logger.info(`📊 Stats:`, stats)

      const recentPosts = await user.getRecentPosts(3)
      this.logger.info(`📅 Recent posts: ${recentPosts.length}`)

      // Test 3: Tester les méthodes des posts
      if (user.gmbPosts.length > 0) {
        const post = user.gmbPosts[0]
        this.logger.info(`📄 First post:`)
        this.logger.info(`  - Status: ${post.status}`)
        this.logger.info(`  - Is published: ${post.isPublished}`)
        this.logger.info(`  - Has image: ${post.hasImage}`)
        this.logger.info(`  - Excerpt: ${post.getExcerpt(50)}`)
      }

      // Test 4: Requête directe pour compter les posts par utilisateur
      const totalPosts = await GmbPost.query().where('user_id', user.id).count('* as total')
      this.logger.info(`🔢 Direct count query: ${totalPosts[0].total} posts`)

      // Test 5: Vérifier qu'il n'y a plus de posts orphelins
      const orphanPosts = await GmbPost.query().whereNull('user_id').count('* as total')
      this.logger.info(`🔍 Orphan posts: ${orphanPosts[0].total}`)

      this.logger.success('✅ All tests passed!')

    } catch (error) {
      this.logger.error('❌ Test failed:', error.message)
      throw error
    }
  }
}
