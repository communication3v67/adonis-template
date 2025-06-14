// Script de test pour vérifier la récupération des utilisateurs
// Utilisation : node ace test:users

import { BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'

export default class TestUsers extends BaseCommand {
  static commandName = 'test:users'
  static description = 'Test la récupération des utilisateurs et leurs configurations Notion'

  async run() {
    this.logger.info('🔍 Test de récupération des utilisateurs...')
    
    try {
      // Récupérer tous les utilisateurs
      const users = await User.all()
      
      this.logger.info(`📊 Nombre d'utilisateurs trouvés: ${users.length}`)
      
      for (const user of users) {
        this.logger.info(`\n👤 Utilisateur: ${user.username} (ID: ${user.id})`)
        this.logger.info(`  📧 Email: ${user.email}`)
        this.logger.info(`  🔗 Notion ID: ${user.notionId || 'Non défini'}`)
        this.logger.info(`  🗃️ Notion Database ID: ${user.notionDatabaseId || 'Non défini'}`)
        this.logger.info(`  🕐 Créé le: ${user.createdAt.toFormat('dd/MM/yyyy HH:mm')}`)
      }
      
      // Test spécifique pour un utilisateur avec database_2
      this.logger.info('\n🧪 Test recherche utilisateur avec database_2...')
      const userWithDatabase2 = await User.query()
        .where('notion_database_id', 'database_2')
        .first()
      
      if (userWithDatabase2) {
        this.logger.info(`✅ Utilisateur trouvé: ${userWithDatabase2.username}`)
        this.logger.info(`  🗃️ Database ID: ${userWithDatabase2.notionDatabaseId}`)
      } else {
        this.logger.warning('⚠️ Aucun utilisateur avec database_2 trouvé')
      }
      
    } catch (error) {
      this.logger.error('❌ Erreur:', error.message)
      this.logger.error(error.stack)
    }
  }
}
