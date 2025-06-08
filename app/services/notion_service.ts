import env from '#start/env'
import { Client } from '@notionhq/client'
interface NotionPage {
    id: string
    title: string
    url: string
    created_time: string
    last_edited_time: string
    properties: any
}
export class NotionService {
    private notion: Client
    private databaseId: string

    constructor() {
        this.notion = new Client({
            auth: env.get('NOTION_API_KEY'),
        })
        this.databaseId = env.get('NOTION_DATABASE_ID')
    }

    /**
     * Récupère toutes les pages de la base de données Notion
     */
    async getPages(): Promise<NotionPage[]> {
        try {
            console.log('=== REQUÊTE NOTION ===')
            console.log('Database ID:', this.databaseId)
            console.log('=======================')

            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                page_size: 100, // Limite par défaut
            })

            console.log('Pages trouvées:', response.results.length)

            const pages: NotionPage[] = response.results.map((page: any) => {
                // Extraction du titre selon le type de propriété
                let title = 'Sans titre'

                // Recherche du titre dans les propriétés
                const titleProperty = Object.values(page.properties).find(
                    (prop: any) => prop.type === 'title'
                ) as any

                if (titleProperty && titleProperty.title && titleProperty.title[0]) {
                    title = titleProperty.title[0].text.content
                }

                return {
                    id: page.id,
                    title,
                    url: page.url,
                    created_time: page.created_time,
                    last_edited_time: page.last_edited_time,
                    properties: page.properties,
                }
            })

            console.log('Pages formatées:', pages.length)
            return pages
        } catch (error) {
            console.error('Erreur lors de la récupération des pages Notion:', error)
            throw new Error(`Erreur Notion: ${error.message}`)
        }
    }

    /**
     * Récupère une page spécifique par son ID
     */
    async getPage(pageId: string) {
        try {
            const page = await this.notion.pages.retrieve({ page_id: pageId })
            return page
        } catch (error) {
            console.error('Erreur lors de la récupération de la page:', error)
            throw new Error(`Erreur Notion: ${error.message}`)
        }
    }

    /**
     * Récupère les informations de la base de données
     */
    async getDatabaseInfo() {
        try {
            const database = await this.notion.databases.retrieve({
                database_id: this.databaseId,
            })
            return database
        } catch (error) {
            console.error('Erreur lors de la récupération de la base de données:', error)
            throw new Error(`Erreur Notion: ${error.message}`)
        }
    }
}
