import env from '#start/env'
import { Client } from '@notionhq/client'

interface NotionPage {
    id: string
    title: string
    url: string
    status: string
    referenceur: string | null
    created_time: string
    last_edited_time: string
    properties: any
}

interface NotionConfig {
    apiKey: string
    databaseId: string
}

export class NotionService {
    /**
     * Récupère la configuration Notion d'un utilisateur basée sur son notionDatabaseId
     */
    static getNotionConfigForUser(
        userDatabaseId?: string | null
    ): NotionConfig & { instance: number } {
        console.log('\n=== NOTION SERVICE GET CONFIG DEBUG ===')
        console.log('🔍 userDatabaseId reçu:', userDatabaseId, 'Type:', typeof userDatabaseId)
        
        if (userDatabaseId === 'database_2') {
            console.log('✅ Condition database_2 détectée !')
            const config = {
                apiKey: env.get('NOTION_API_KEY_2'),
                databaseId: env.get('NOTION_DATABASE_ID_2'),
                instance: 2,
            }
            
            console.log('🔍 Variables récupérées:')
            console.log('  - NOTION_API_KEY_2:', config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'NON DÉFINIE')
            console.log('  - NOTION_DATABASE_ID_2:', config.databaseId || 'NON DÉFINIE')
            console.log('  - instance:', config.instance)

            if (!config.apiKey || !config.databaseId) {
                console.error('❌ Variables manquantes pour database_2, retour à database_1')
                const fallbackConfig = {
                    apiKey: env.get('NOTION_API_KEY'),
                    databaseId: env.get('NOTION_DATABASE_ID'),
                    instance: 1,
                }
                console.log('🔍 Fallback config:')
                console.log('  - NOTION_API_KEY:', fallbackConfig.apiKey ? fallbackConfig.apiKey.substring(0, 20) + '...' : 'NON DÉFINIE')
                console.log('  - NOTION_DATABASE_ID:', fallbackConfig.databaseId || 'NON DÉFINIE')
                console.log('  - instance:', fallbackConfig.instance)
                console.log('=== FIN NOTION SERVICE GET CONFIG DEBUG ===\n')
                return fallbackConfig
            }
            
            console.log('✅ Configuration database_2 valide !')
            console.log('=== FIN NOTION SERVICE GET CONFIG DEBUG ===\n')
            return config
        }

        // Par défaut, utiliser la première instance
        console.log('⚠️ Utilisation de la configuration par défaut (database_1)')
        const defaultConfig = {
            apiKey: env.get('NOTION_API_KEY'),
            databaseId: env.get('NOTION_DATABASE_ID'),
            instance: 1,
        }
        
        console.log('🔍 Configuration par défaut:')
        console.log('  - NOTION_API_KEY:', defaultConfig.apiKey ? defaultConfig.apiKey.substring(0, 20) + '...' : 'NON DÉFINIE')
        console.log('  - NOTION_DATABASE_ID:', defaultConfig.databaseId || 'NON DÉFINIE')
        console.log('  - instance:', defaultConfig.instance)
        console.log('=== FIN NOTION SERVICE GET CONFIG DEBUG ===\n')
        
        return defaultConfig
    }
    private notion: Client
    private databaseId: string
    private config: NotionConfig

    constructor(userDatabaseId?: string) {
        // Déterminer quelle configuration utiliser selon userDatabaseId
        this.config = this.getNotionConfig(userDatabaseId)

        this.notion = new Client({
            auth: this.config.apiKey,
            fetch: (url, init) => {
                const headers = new Headers(init?.headers)
                headers.set('connection', 'close')
                return fetch(url, { ...init, headers })
            },
        })
        this.databaseId = this.config.databaseId

        console.log(`📡 NotionService initialisé avec:`, {
            databaseType: userDatabaseId || 'database_1',
            databaseId: this.databaseId.substring(0, 8) + '...',
            hasApiKey: !!this.config.apiKey,
        })
    }

    /**
     * Détermine la configuration Notion à utiliser selon l'utilisateur
     */
    private getNotionConfig(userDatabaseId?: string): NotionConfig {
        if (userDatabaseId === 'database_2') {
            const config = {
                apiKey: env.get('NOTION_API_KEY_2'),
                databaseId: env.get('NOTION_DATABASE_ID_2'),
            }

            console.log('🔍 Configuration database_2 détectée:')
            console.log('  - API Key définie:', !!config.apiKey)
            console.log('  - API Key commence par "secret_":', config.apiKey?.startsWith('secret_'))
            console.log('  - Database ID défini:', !!config.databaseId)
            console.log('  - Database ID longueur:', config.databaseId?.length)

            if (!config.apiKey || !config.databaseId) {
                console.error('❌ Variables manquantes pour database_2:')
                console.error('  - NOTION_API_KEY_2:', config.apiKey ? 'Définie' : 'MANQUANTE')
                console.error(
                    '  - NOTION_DATABASE_ID_2:',
                    config.databaseId ? 'Définie' : 'MANQUANTE'
                )
            }

            return config
        }

        // Par défaut, utiliser la première instance
        const config = {
            apiKey: env.get('NOTION_API_KEY'),
            databaseId: env.get('NOTION_DATABASE_ID'),
        }

        console.log('🔍 Configuration database_1 (par défaut):')
        console.log('  - API Key définie:', !!config.apiKey)
        console.log('  - Database ID défini:', !!config.databaseId)

        return config
    }

    /**
     * Récupère les pages de la base de données Notion avec filtres et logs détaillés
     * @param userNotionId - ID Notion de l'utilisateur pour filtrer les pages assignées
     */
    async getPages(userNotionId?: string): Promise<NotionPage[]> {
        try {
            console.log('=== REQUÊTE NOTION AVEC LOGS DÉTAILLÉS ===')
            console.log('Database ID:', this.databaseId)
            if (userNotionId) {
                console.log('🎯 Filtrage pour utilisateur Notion ID:', userNotionId)
            }
            console.log('==========================================')

            // D'abord, récupérer les métadonnées de la base pour identifier les vraies IDs
            const database = await this.notion.databases.retrieve({
                database_id: this.databaseId,
            })

            console.log('📋 Propriétés de la base:', Object.keys(database.properties))

            // Trouver l'ID réel des propriétés ET leurs types
            let etatPropertyId = 'État'
            let etatPropertyType = 'select' // Par défaut
            let referenceurPropertyId = 'Référenceurs'

            for (const [id, property] of Object.entries(database.properties)) {
                const prop = property as any
                console.log(`🔍 Propriété trouvée: "${prop.name}" (ID: ${id}, Type: ${prop.type})`)

                if (prop.name === 'État') {
                    etatPropertyId = id
                    etatPropertyType = prop.type
                    console.log(`✅ ID propriété État trouvé: ${id} (Type: ${prop.type})`)

                    // Log des options disponibles selon le type
                    if (prop.type === 'select' && prop.select?.options) {
                        console.log('  📝 Options disponibles pour État (SELECT):')
                        prop.select.options.forEach((option: any) => {
                            console.log(
                                `    - "${option.name}" (ID: ${option.id}, Couleur: ${option.color})`
                            )
                        })
                    } else if (prop.type === 'status' && prop.status?.options) {
                        console.log('  📝 Options disponibles pour État (STATUS):')
                        prop.status.options.forEach((option: any) => {
                            console.log(
                                `    - "${option.name}" (ID: ${option.id}, Couleur: ${option.color})`
                            )
                        })
                    } else {
                        console.log(`  ⚠️ Type de propriété État non supporté: ${prop.type}`)
                    }
                }

                if (prop.name === 'Référenceurs') {
                    referenceurPropertyId = id
                    console.log(`✅ ID propriété Référenceurs trouvé: ${id} (Type: ${prop.type})`)
                }
            }

            console.log(`🎯 Propriétés finales utilisées:`)
            console.log(`  - État: "${etatPropertyId}" (Type: ${etatPropertyType})`)
            console.log(`  - Référenceurs: "${referenceurPropertyId}"`)

            // Construction des filtres avec le bon type
            const filters: any[] = []

            // Filtre pour l'état selon son type réel
            if (etatPropertyType === 'select') {
                filters.push({
                    property: etatPropertyId,
                    select: {
                        equals: 'À générer',
                    },
                })
                console.log(`📋 Filtre 1 (État SELECT): État = "À générer"`)
            } else if (etatPropertyType === 'status') {
                filters.push({
                    property: etatPropertyId,
                    status: {
                        equals: 'À générer',
                    },
                })
                console.log(`📋 Filtre 1 (État STATUS): État = "À générer"`)
            } else {
                console.log(
                    `⚠️ Impossible de filtrer sur État - type non supporté: ${etatPropertyType}`
                )
                // On continue sans ce filtre pour voir ce qui se passe
            }

            // Ajouter le filtre pour le référenceur si userNotionId est fourni
            if (userNotionId) {
                filters.push({
                    property: referenceurPropertyId,
                    relation: {
                        contains: userNotionId,
                    },
                })
                console.log(`📋 Filtre 2 (utilisateur): Référenceurs contient "${userNotionId}"`)
            } else {
                console.log(`📋 Pas de filtre utilisateur (userNotionId non fourni)`)
            }

            let queryParams: any = {
                database_id: this.databaseId,
                page_size: 100,
            }

            // Ajouter les filtres seulement s'il y en a
            if (filters.length > 0) {
                queryParams.filter = {
                    and: filters,
                }
            } else {
                console.log('⚠️ Aucun filtre appliqué - récupération de toutes les pages')
            }

            console.log(
                '🔧 Filtres appliqués:',
                JSON.stringify(queryParams.filter || 'Aucun', null, 2)
            )

            const response = await this.notion.databases.query(queryParams)

            console.log(`📊 Pages trouvées: ${response.results.length}`)

            const pages: NotionPage[] = response.results
                .map((page: any, index: number) => {
                    console.log(`\n📄 === PAGE ${index + 1} ===`)

                    // Extraction du titre - CORRIGÉ pour éviter la troncature
                    let title = 'Sans titre'
                    const titleProperty = Object.values(page.properties).find(
                        (prop: any) => prop.type === 'title'
                    ) as any

                    if (titleProperty && titleProperty.title && Array.isArray(titleProperty.title)) {
                        // ✅ CORRECTION : Concaténer TOUS les segments de rich text
                        title = titleProperty.title
                            .map((segment: any) => segment.text?.content || '')
                            .join('')
                            .trim()
                        
                        // Debug pour tracer la reconstruction complète
                        console.log(`  📝 Titre reconstruit (${titleProperty.title.length} segments): "${title}"`)
                        if (titleProperty.title.length > 1) {
                            console.log(`  🔍 Détail des segments:`)
                            titleProperty.title.forEach((segment: any, i: number) => {
                                console.log(`    ${i + 1}. "${segment.text?.content || ''}"${segment.text?.link ? ' (avec lien)' : ''}`)
                            })
                        }
                    }
                    console.log(`  📝 Titre final: "${title}"`)

                    // Extraction du référenceur
                    const referenceurProperty = page.properties[referenceurPropertyId]
                    console.log(
                        `  🔍 Propriété Référenceurs brute:`,
                        JSON.stringify(referenceurProperty, null, 2)
                    )

                    const referenceur = referenceurProperty?.relation?.[0]?.id || null
                    console.log(`  👤 Référenceur extrait: "${referenceur}"`)

                    // Vérifier si le référenceur est null
                    if (!referenceur) {
                        console.log(`  ⚠️ Page ignorée: aucun référenceur assigné`)
                        return null // Retourner null pour cette page
                    }

                    // Extraction du statut
                    const statusProperty = page.properties[etatPropertyId]
                    console.log(
                        `  🔍 Propriété État brute:`,
                        JSON.stringify(statusProperty, null, 2)
                    )

                    let status = 'Non défini'
                    if (etatPropertyType === 'select') {
                        status = statusProperty?.select?.name || 'Non défini'
                    } else if (etatPropertyType === 'status') {
                        status = statusProperty?.status?.name || 'Non défini'
                    }
                    console.log(`  📊 État extrait: "${status}"`)

                    // Comparaison pour debug
                    if (userNotionId) {
                        const match = referenceur === userNotionId
                        console.log(`  🔍 Comparaison référenceur:`)
                        console.log(`    🎯 Recherché: "${userNotionId}"`)
                        console.log(`    📋 Trouvé: "${referenceur}"`)
                        console.log(`    ✅ Match: ${match ? '✅' : '❌'}`)
                    }

                    console.log(`  ✅ Page conservée`)

                    return {
                        id: page.id,
                        title,
                        status,
                        referenceur,
                        url: page.url,
                        created_time: page.created_time,
                        last_edited_time: page.last_edited_time,
                        properties: page.properties,
                    }
                })
                .filter((page) => page !== null) // Filtrer les pages null
                .map((page) => page as NotionPage) // Type assertion pour TypeScript

            console.log(`\n📈 Résumé final:`)
            console.log(`  📄 Pages récupérées depuis Notion: ${response.results.length}`)
            console.log(`  📄 Pages avec référenceur: ${pages.length}`)
            console.log(
                `  🚫 Pages ignorées (sans référenceur): ${response.results.length - pages.length}`
            )

            if (pages.length > 0) {
                console.log('  🎆 Première page:', {
                    title: pages[0].title,
                    status: pages[0].status,
                    referenceur: pages[0].referenceur,
                })
            } else {
                console.log('  ⚠️ Aucune page ne correspond aux critères')
            }

            return pages
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des pages Notion:', error)
            console.error("📋 Message d'erreur:", error.message)
            console.error('📋 Stack trace:', error.stack)
            throw new Error(`Erreur Notion: ${error.message}`)
        }
    }

    /**
     * Récupère toutes les pages sans filtre (méthode de compatibilité)
     */
    async getAllPages(): Promise<NotionPage[]> {
        return this.getPages()
    }

    /**
     * Récupère les pages pour un utilisateur spécifique
     */
    async getPagesForUser(userNotionId: string): Promise<NotionPage[]> {
        return this.getPages(userNotionId)
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
     * Récupère les informations de la base de données avec debug des propriétés
     */
    async getDatabaseInfo() {
        try {
            const database = await this.notion.databases.retrieve({
                database_id: this.databaseId,
            })

            console.log('=== DEBUG BASE NOTION ===')
            console.log('Nom de la base:', database.title?.[0]?.text?.content || 'Non défini')
            console.log('Propriétés disponibles:')

            for (const [id, property] of Object.entries(database.properties)) {
                const prop = property as any
                console.log(`  - ${prop.name} (ID: ${id}, Type: ${prop.type})`)

                if (prop.type === 'select' && prop.select?.options) {
                    console.log(`    Options SELECT:`)
                    prop.select.options.forEach((option: any) => {
                        console.log(`      - ${option.name} (ID: ${option.id})`)
                    })
                } else if (prop.type === 'status' && prop.status?.options) {
                    console.log(`    Options STATUS:`)
                    prop.status.options.forEach((option: any) => {
                        console.log(`      - ${option.name} (ID: ${option.id})`)
                    })
                }
            }
            console.log('========================')

            return database
        } catch (error) {
            console.error('Erreur lors de la récupération de la base de données:', error)
            throw new Error(`Erreur Notion: ${error.message}`)
        }
    }

    /**
     * Met à jour le statut d'une page Notion en utilisant l'ID dynamique
     */
    async updatePageStatus(pageId: string, newStatus: string) {
        try {
            // Récupérer d'abord l'ID et le type de la propriété État
            const database = await this.notion.databases.retrieve({
                database_id: this.databaseId,
            })

            let etatPropertyId = 'État'
            let etatPropertyType = 'select'

            for (const [id, property] of Object.entries(database.properties)) {
                const prop = property as any
                if (prop.name === 'État') {
                    etatPropertyId = id
                    etatPropertyType = prop.type
                    break
                }
            }

            const updateData: any = {}

            if (etatPropertyType === 'select') {
                updateData[etatPropertyId] = {
                    select: {
                        name: newStatus,
                    },
                }
            } else if (etatPropertyType === 'status') {
                updateData[etatPropertyId] = {
                    status: {
                        name: newStatus,
                    },
                }
            }

            const response = await this.notion.pages.update({
                page_id: pageId,
                properties: updateData,
            })

            return response
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la page:', error)
            throw new Error(`Erreur Notion: ${error.message}`)
        }
    }
}
