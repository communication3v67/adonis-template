import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
    async run() {
        console.log('🌱 Création des utilisateurs avec configuration Notion...')
        
        // Créer un utilisateur de test avec la première base Notion
        const user1 = await User.firstOrCreate(
            { email: 'admin@test.com' },
            {
                username: 'Admin Test',
                email: 'admin@test.com',
                password: 'password123',
                avatar: null,
                notionId: null,
                notionDatabaseId: 'database_1',
            }
        )

        console.log(`✅ Utilisateur 1: ${user1.email} (ID: ${user1.id}) - Base: ${user1.notionDatabaseId}`)

        // Créer un deuxième utilisateur avec la deuxième base Notion
        const user2 = await User.firstOrCreate(
            { email: 'user@test.com' },
            {
                username: 'User Test',
                email: 'user@test.com',
                password: 'password123',
                avatar: null,
                notionId: 'notion_test_123',
                notionDatabaseId: 'database_2',
            }
        )

        console.log(`✅ Utilisateur 2: ${user2.email} (ID: ${user2.id}) - Base: ${user2.notionDatabaseId}`)
        
        // Compter le total
        const totalUsers = await User.query().count('* as total')
        console.log(`📊 Total utilisateurs: ${totalUsers[0].total}`)
        
        console.log('')
        console.log('🎉 Configuration Notion multi-instances prête !')
        console.log('  👥 admin@test.com → database_1 (NOTION_API_KEY + NOTION_DATABASE_ID)')
        console.log('  👥 user@test.com → database_2 (NOTION_API_KEY_2 + NOTION_DATABASE_ID_2)')
    }
}
