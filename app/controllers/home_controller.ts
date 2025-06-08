import { NotionService } from '#services/notion_service'
import type { HttpContext } from '@adonisjs/core/http'
export default class HomeController {
    /**
     * Affiche la page d'accueil avec les donnees Notion
     */
    async index({ inertia }: HttpContext) {
        try {
            console.log('=== CHARGEMENT PAGE HOME ===')

            const notionService = new NotionService()

            // Recuperation des pages Notion
            const notionPages = await notionService.getPages()

            // Recuperation des infos de la base de donnees
            const databaseInfo = await notionService.getDatabaseInfo()

            console.log('Pages Notion recuperees:', notionPages.length)
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
                    title: databaseInfo.title?.[0]?.text?.content || 'Base de donnees Notion',
                    id: databaseInfo.id,
                    url: databaseInfo.url,
                    created_time: databaseInfo.created_time,
                    last_edited_time: databaseInfo.last_edited_time,
                },
                stats,
            })
        } catch (error) {
            console.error('Erreur lors du chargement de la page home:', error)

            // En cas d'erreur, afficher la page avec un message d'erreur
            return inertia.render('home', {
                notionPages: [],
                databaseInfo: null,
                stats: { totalPages: 0, recentPages: 0 },
                error: {
                    message: 'Impossible de charger les donnees Notion',
                    details: error.message,
                },
            })
        }
    }

    /**
     * API endpoint pour recuperer les pages Notion en AJAX
     */
    async getNotionPages({ response }: HttpContext) {
        try {
            const notionService = new NotionService()
            const pages = await notionService.getPages()

            return response.json({
                success: true,
                data: pages,
                count: pages.length,
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
