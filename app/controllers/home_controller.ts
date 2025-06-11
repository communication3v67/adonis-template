import { NotionService } from '#services/notion_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
    /**
     * Affiche la page d'accueil avec les données Notion
     */
    async index({ inertia, auth }: HttpContext) {
        try {
            console.log('=== CHARGEMENT PAGE HOME ===')
            
            // Récupérer l'utilisateur connecté
            const user = auth.user!
            console.log(`👤 Utilisateur connecté: ${user.email} (Database: ${user.notionDatabaseId})`)

            // Initialiser le service Notion avec la bonne base de données
            const notionService = new NotionService(user.notionDatabaseId)

            // Récupération des pages Notion FILTRÉES par l'utilisateur
            let notionPages: any[] = []
            
            if (user.notionId) {
                // Si l'utilisateur a un notionId, filtrer les pages par référenceur
                console.log(`🎯 Filtrage par référenceur: ${user.notionId}`)
                notionPages = await notionService.getPages(user.notionId)
            } else {
                // Si l'utilisateur n'a pas de notionId, afficher un message explicatif
                console.log('⚠️ Utilisateur sans notionId - aucune page à afficher')
                notionPages = []
            }

            // Récupération des infos de la base de données
            const databaseInfo = await notionService.getDatabaseInfo()

            console.log(`Pages Notion récupérées: ${notionPages.length} pour la base ${user.notionDatabaseId}`)
            console.log('============================')

            // Calcul des statistiques
            const stats = {
                totalPages: notionPages.length,
                recentPages: notionPages.filter((page) => {
                    const createdDate = new Date(page.created_time)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return createdDate > weekAgo
                }).length,
            }

            return inertia.render('home', {
                notionPages,
                databaseInfo: {
                    title: databaseInfo.title?.[0]?.text?.content || 'Base de données Notion',
                    id: databaseInfo.id,
                    url: databaseInfo.url,
                    created_time: databaseInfo.created_time,
                    last_edited_time: databaseInfo.last_edited_time,
                },
                stats,
                userDatabase: user.notionDatabaseId || 'database_1', // Info pour debug
                userNotionId: user.notionId, // Info pour debug
                hasNotionId: !!user.notionId, // Info pour l'interface
            })
        } catch (error) {
            console.error('Erreur lors du chargement de la page home:', error)

            // En cas d'erreur, afficher la page avec un message d'erreur
            return inertia.render('home', {
                notionPages: [],
                databaseInfo: null,
                stats: { totalPages: 0, recentPages: 0 },
                userDatabase: auth.user?.notionDatabaseId || 'database_1',
                userNotionId: auth.user?.notionId,
                hasNotionId: !!auth.user?.notionId,
                error: {
                    message: 'Impossible de charger les données Notion',
                    details: error.message,
                },
            })
        }
    }

    /**
     * API endpoint pour récupérer les pages Notion en AJAX
     */
    async getNotionPages({ response, auth }: HttpContext) {
        try {
            const user = auth.user!
            const notionService = new NotionService(user.notionDatabaseId)
            
            let pages: any[] = []
            
            if (user.notionId) {
                pages = await notionService.getPages(user.notionId)
            } else {
                pages = [] // Pas de pages si pas de notionId
            }

            return response.json({
                success: true,
                data: pages,
                count: pages.length,
                userDatabase: user.notionDatabaseId,
                userNotionId: user.notionId,
                hasNotionId: !!user.notionId,
            })
        } catch (error) {
            console.error('Erreur API Notion:', error)

            return response.status(500).json({
                success: false,
                error: error.message,
            })
        }
    }
}
