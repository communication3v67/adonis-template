import User from '#models/user'
import { NotionService } from '#services/notion_service'
import { HttpContext } from '@adonisjs/core/http'

export default class TestController {
    /**
     * Endpoint de test pour vérifier la configuration Notion des utilisateurs
     */
    async testUserNotionConfig({ request, response, auth }: HttpContext) {
        try {
            const { userId } = request.qs()

            console.log('🔍 Test debug - userId reçu:', userId)
            console.log('🔍 Test debug - Utilisateur connecté:', {
                id: auth.user?.id,
                email: auth.user?.email,
                username: auth.user?.username,
            })

            if (!userId) {
                // Si pas d'userId spécifié, utiliser l'utilisateur connecté
                const user = auth.user

                if (!user) {
                    return response.status(401).json({
                        success: false,
                        message: 'Aucun utilisateur connecté',
                    })
                }

                const config = NotionService.getNotionConfigForUser(user.notionDatabaseId)

                return response.json({
                    success: true,
                    message: "Configuration de l'utilisateur connecté",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        notionId: user.notionId,
                        notionDatabaseId: user.notionDatabaseId,
                    },
                    notion_config: {
                        api_key: config.apiKey
                            ? config.apiKey.substring(0, 20) + '...'
                            : 'NON DÉFINIE',
                        database_id: config.databaseId || 'NON DÉFINIE',
                        instance: config.instance,
                    },
                })
            }

            // Si userId est 'all', récupérer tous les utilisateurs pour debug
            if (userId === 'all') {
                const users = await User.all()

                const usersData = users.map((user) => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    notionId: user.notionId,
                    notionDatabaseId: user.notionDatabaseId,
                    // Test de la configuration
                    config: NotionService.getNotionConfigForUser(user.notionDatabaseId),
                }))

                return response.json({
                    success: true,
                    message: 'Liste de tous les utilisateurs et leurs configurations',
                    users: usersData,
                })
            }

            // Test pour un utilisateur spécifique
            const user = await User.find(userId)

            if (!user) {
                return response.status(404).json({
                    success: false,
                    message: `Utilisateur non trouvé (ID: ${userId})`,
                })
            }

            console.log('👤 Utilisateur trouvé:', {
                id: user.id,
                username: user.username,
                notionDatabaseId: user.notionDatabaseId,
                type: typeof user.notionDatabaseId,
            })

            const config = NotionService.getNotionConfigForUser(user.notionDatabaseId)

            return response.json({
                success: true,
                message: 'Configuration utilisateur',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    notionId: user.notionId,
                    notionDatabaseId: user.notionDatabaseId,
                },
                notion_config: {
                    api_key: config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'NON DÉFINIE',
                    database_id: config.databaseId || 'NON DÉFINIE',
                    instance: config.instance,
                },
            })
        } catch (error) {
            console.error('❌ Erreur test:', error)
            return response.status(500).json({
                success: false,
                message: 'Erreur lors du test',
                error: error.message,
            })
        }
    }
}
