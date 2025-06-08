import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
    async run() {
        // Créer un utilisateur de test
        const user = await User.firstOrCreate(
            { email: 'admin@test.com' },
            {
                username: 'Admin Test',
                email: 'admin@test.com',
                password: 'password123',
                avatar: null,
                notionId: null,
            }
        )

        console.log(`✅ User created/found: ${user.email} (ID: ${user.id})`)

        // Créer un deuxième utilisateur pour les tests
        const user2 = await User.firstOrCreate(
            { email: 'user@test.com' },
            {
                username: 'User Test',
                email: 'user@test.com',
                password: 'password123',
                avatar: null,
                notionId: 'notion_test_123',
            }
        )

        console.log(`✅ Second user created/found: ${user2.email} (ID: ${user2.id})`)
        console.log(
            `📊 Total users: ${await User.query()
                .count('* as total')
                .then((r) => r[0].total)}`
        )
    }
}
