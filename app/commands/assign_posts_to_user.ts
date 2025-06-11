import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import GmbPost from '#models/gmbPost'
import User from '#models/user'

export default class AssignPostsToUser extends BaseCommand {
  static commandName = 'assign:posts'
  static description = 'Assign existing posts to a default user'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    // Récupérer le premier utilisateur ou en créer un par défaut
    let defaultUser = await User.first()
    
    if (!defaultUser) {
      this.logger.info('Creating default user...')
      defaultUser = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'defaultpassword', // À changer !
      })
    }

    // Assigner tous les posts sans user_id à l'utilisateur par défaut
    const postsWithoutUser = await GmbPost.query().whereNull('user_id')
    
    if (postsWithoutUser.length === 0) {
      this.logger.info('No posts need user assignment')
      return
    }

    await GmbPost.query()
      .whereNull('user_id')
      .update({ user_id: defaultUser.id })

    this.logger.info(`Assigned ${postsWithoutUser.length} posts to user ${defaultUser.username}`)
  }
}
