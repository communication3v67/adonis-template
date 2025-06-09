import GmbPost from '#models/gmbPost'
import { NotionService } from '#services/notion_service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

// Validators pour les données GMB Posts
const createGmbPostValidator = vine.compile(
    vine.object({
        status: vine.string().trim().minLength(1),
        text: vine.string().trim().minLength(1),
        date: vine.date(),
        image_url: vine.string().trim().optional(),
        link_url: vine.string().trim().url().optional(),
        keyword: vine.string().trim().optional(),
        client: vine.string().trim().minLength(1),
        project_name: vine.string().trim().minLength(1),
        location_id: vine.string().trim().minLength(1),
        account_id: vine.string().trim().minLength(1),
        notion_id: vine.string().trim().optional(),
    })
)

const updateGmbPostValidator = vine.compile(
    vine.object({
        status: vine.string().trim().optional(),
        text: vine.string().trim().optional(),
        date: vine.string().optional(),
        image_url: vine.string().trim().nullable().optional(),
        link_url: vine.string().trim().nullable().optional(),
        keyword: vine.string().trim().nullable().optional(),
        client: vine.string().trim().optional(),
        project_name: vine.string().trim().optional(),
        location_id: vine.string().trim().optional(),
        account_id: vine.string().trim().optional(),
        notion_id: vine.string().trim().nullable().optional(),
    })
)

export default class GmbPostsController {
    /**
    * Met à jour plusieurs posts en une fois
    */
    async bulkUpdate({ request, response, session, auth }: HttpContext) {
    try {
    // S'assurer qu'un utilisateur est connecté
            await auth.check()
    const currentUser = auth.user!

    const { ids, updateData } = request.only(['ids', 'updateData'])

            console.log('=== MÉTHODE BULK UPDATE ===')
    console.log('Utilisateur:', currentUser.id)
    console.log('IDs reçus:', ids)
    console.log('Données de mise à jour:', updateData)
    console.log('========================')

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        session.flash('notification', {
                    type: 'error',
            message: 'Aucun post sélectionné pour la mise à jour.',
    })
    return response.redirect().back()
    }

    if (!updateData || Object.keys(updateData).length === 0) {
        session.flash('notification', {
                    type: 'error',
            message: 'Aucune donnée de mise à jour fournie.',
        })
        return response.redirect().back()
    }

    // Nettoyer les données pour éviter les valeurs vides
    const cleanUpdateData: any = {}
            Object.entries(updateData).forEach(([key, value]) => {
        if (value && String(value).trim() !== '') {
                    cleanUpdateData[key] = value
        }
    })

    console.log('Données nettoyées:', cleanUpdateData)

    // Exécuter la mise à jour en masse SEULEMENT pour les posts de l'utilisateur connecté
            const updatedCount = await GmbPost.query()
        .whereIn('id', ids)
    .where('user_id', currentUser.id) // Sécurité : seulement les posts de l'utilisateur
    .update(cleanUpdateData)

            console.log(`${updatedCount} post(s) mis à jour`)

            session.flash('notification', {
            type: 'success',
        message: `${updatedCount} post(s) mis à jour avec succès !`,
    })

    return response.redirect().toRoute('gmbPosts.index')

    } catch (error) {
    console.error('Erreur mise à jour en masse:', error)
            console.error('Stack trace:', error.stack)

        session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la mise à jour en masse.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Affiche la liste des posts GMB avec pagination et filtres pour l'utilisateur connecté
     */
    async index({ inertia, request, auth }: HttpContext) {
        const page = request.input('page', 1)
        const limit = request.input('limit', 15)
        const search = request.input('search', '')
        const status = request.input('status', '')
        const client = request.input('client', '')
        const project = request.input('project', '')
        const sortBy = request.input('sortBy', 'date')
        const sortOrder = request.input('sortOrder', 'desc')

        console.log('=== FILTRES REÇUS ===')
        console.log('Utilisateur connecté:', auth.user?.id)
        console.log('Recherche:', search)
        console.log('Statut:', status)
        console.log('Client:', client)
        console.log('Projet:', project)
        console.log('Tri:', sortBy, sortOrder)
        console.log('=====================')

        // S'assurer qu'un utilisateur est connecté
        await auth.check()
        const currentUser = auth.user!

        const query = GmbPost.query().where('user_id', currentUser.id)

        // Recherche textuelle (compatible MySQL avec LOWER pour insensibilité à la casse)
        if (search) {
            const searchLower = search.toLowerCase()
            query.where((builder) => {
                builder
                    .whereRaw('LOWER(text) LIKE ?', [`%${searchLower}%`])
                    .orWhereRaw('LOWER(keyword) LIKE ?', [`%${searchLower}%`])
                    .orWhereRaw('LOWER(client) LIKE ?', [`%${searchLower}%`])
                    .orWhereRaw('LOWER(project_name) LIKE ?', [`%${searchLower}%`])
            })
        }

        // Filtres (compatible MySQL)
        if (status) {
            query.where('status', status)
        }

        if (client) {
            const clientLower = client.toLowerCase()
            query.whereRaw('LOWER(client) LIKE ?', [`%${clientLower}%`])
        }

        if (project) {
            const projectLower = project.toLowerCase()
            query.whereRaw('LOWER(project_name) LIKE ?', [`%${projectLower}%`])
        }

        // Tri
        query.orderBy(sortBy, sortOrder)

        console.log('Requête SQL générée:', query.toQuery())

        // Pagination
        const posts = await query.paginate(page, limit)

        // Debug : vérifier la sérialisation avec naming strategy
        const serializedPosts = posts.serialize()
        console.log('Posts sérialisés pour utilisateur', currentUser.id, ':', serializedPosts.data.length)
        
        if (serializedPosts.data && serializedPosts.data.length > 0) {
            console.log('Premier post:', serializedPosts.data[0])
            console.log('Clés disponibles:', Object.keys(serializedPosts.data[0]))
        }

        // Données pour les filtres (limitées à l'utilisateur connecté)
        const clients = await GmbPost.query()
            .where('user_id', currentUser.id)
            .select('client')
            .groupBy('client')
            .orderBy('client')

        const projects = await GmbPost.query()
            .where('user_id', currentUser.id)
            .select('project_name')
            .groupBy('project_name')
            .orderBy('project_name')

        const statuses = await GmbPost.query()
            .where('user_id', currentUser.id)
            .select('status')
            .groupBy('status')
            .orderBy('status')

        // Compter les posts "Post à générer" pour l'utilisateur connecté
        const postsToGenerateCount = await GmbPost.query()
            .where('user_id', currentUser.id)
            .where('status', 'Post à générer')
            .count('* as total')
        
        const postsToGenerate = Number(postsToGenerateCount[0].$extras.total)
        
        console.log(`=== COMPTEUR POSTS A GENERER ===`)
        console.log(`Utilisateur ID: ${currentUser.id}`)
        console.log(`Requête count: ${JSON.stringify(postsToGenerateCount)}`)
        console.log(`Posts "Post à générer" pour l'utilisateur ${currentUser.id}:`, postsToGenerate)
        console.log(`Notion ID de l'utilisateur:`, currentUser.notionId)
        console.log(`===============================`)

        return inertia.render('gmbPosts/index', {
            posts: serializedPosts,
            filters: {
                search,
                status,
                client,
                project,
                sortBy,
                sortOrder,
            },
            filterOptions: {
                clients: clients.map((c) => c.client),
                projects: projects.map((p) => p.project_name),
                statuses: statuses.map((s) => s.status),
            },
            currentUser: {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                notion_id: currentUser.notionId  // Convertir notionId en notion_id pour le frontend
            },
            postsToGenerateCount: postsToGenerate
        })
    }

    /**
     * Affiche le formulaire de création d'un nouveau post
     */
    async create({ inertia, auth }: HttpContext) {
        // S'assurer qu'un utilisateur est connecté
        await auth.check()
        const currentUser = auth.user!

        // Récupération des options pour les selects (limitées à l'utilisateur)
        const clients = await GmbPost.query()
            .where('user_id', currentUser.id)
            .select('client')
            .groupBy('client')
            .orderBy('client')

        const projects = await GmbPost.query()
            .where('user_id', currentUser.id)
            .select('project_name', 'client')
            .groupBy('project_name', 'client')
            .orderBy('project_name')

        return inertia.render('gmbPosts/create', {
            clients: clients.map((c) => c.client),
            projects: projects,
            currentUser: {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                notion_id: currentUser.notionId  // Convertir notionId en notion_id pour le frontend
            }
        })
    }

    /**
     * Stocke un nouveau post en base de données
     */
    async store({ request, response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const payload = await request.validateUsing(createGmbPostValidator)

            // Conversion de la date si nécessaire
            const postData = {
                ...payload,
                user_id: currentUser.id, // Associer le post à l'utilisateur connecté
                date: DateTime.fromJSDate(new Date(payload.date)),
            }

            await GmbPost.create(postData)

            session.flash('notification', {
                type: 'success',
                message: 'Post GMB créé avec succès !',
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la création du post.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Affiche un post spécifique
     */
    async show({ params, inertia }: HttpContext) {
        const post = await GmbPost.findOrFail(params.id)

        return inertia.render('gmbPosts/show', {
            post: post.serialize(),
        })
    }

    /**
     * Affiche le formulaire d'édition d'un post
     */
    async edit({ params, inertia }: HttpContext) {
        const post = await GmbPost.findOrFail(params.id)

        // Options pour les selects
        const clients = await GmbPost.query().select('client').groupBy('client').orderBy('client')

        const projects = await GmbPost.query()
            .select('project_name', 'client')
            .groupBy('project_name', 'client')
            .orderBy('project_name')

        return inertia.render('gmbPosts/edit', {
            post: post.serialize(),
            clients: clients.map((c) => c.client),
            projects: projects,
        })
    }

    /**
     * Met à jour un post existant
     */
    async update({ params, request, response, session, auth }: HttpContext) {
        console.log('=== MÉTHODE UPDATE APPELÉE ===')
        console.log('Paramètres de l\'URL:', params)
        console.log('Méthode HTTP:', request.method())
        console.log('URL complète:', request.url())
        console.log('================================')
        
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const post = await GmbPost.findOrFail(params.id)
            
            // Vérifier que le post appartient à l'utilisateur connecté
            if (post.user_id !== currentUser.id) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Vous n\'avez pas l\'autorisation de modifier ce post.',
                })
                return response.redirect().toRoute('gmbPosts.index')
            }

            const payload = request.all()

            console.log('Payload reçu:', payload)
            console.log('Post avant modification:', post.toJSON())

            // Nettoyer et préparer les données
            const updateData: any = {}
            
            // Traiter chaque champ individuellement sans validation stricte
            if (payload.status !== undefined) updateData.status = payload.status || null
            if (payload.text !== undefined) updateData.text = payload.text || null
            if (payload.image_url !== undefined) updateData.image_url = payload.image_url || null
            if (payload.link_url !== undefined) updateData.link_url = payload.link_url || null
            if (payload.keyword !== undefined) updateData.keyword = payload.keyword || null
            if (payload.client !== undefined) updateData.client = payload.client || null
            if (payload.project_name !== undefined) updateData.project_name = payload.project_name || null
            if (payload.location_id !== undefined) updateData.location_id = payload.location_id || null
            if (payload.account_id !== undefined) updateData.account_id = payload.account_id || null
            if (payload.notion_id !== undefined) updateData.notion_id = payload.notion_id || null
            
            // Gestion spéciale pour la date
            if (payload.date !== undefined && payload.date) {
                try {
                    updateData.date = DateTime.fromISO(payload.date)
                } catch (error) {
                    console.error('Erreur parsing date:', error)
                    // Si erreur de parsing, garder la date originale
                }
            }

            console.log('Données à mettre à jour:', updateData)

            // Appliquer les modifications
            Object.keys(updateData).forEach(key => {
                post[key] = updateData[key]
            })

            await post.save()

            console.log('Post après modification:', post.toJSON())

            session.flash('notification', {
                type: 'success',
                message: 'Post GMB mis à jour avec succès !',
            })

            return response.redirect().toRoute('gmbPosts.index')

        } catch (error) {
            console.error('Erreur mise à jour:', error)
            console.error('Stack trace:', error.stack)

            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la mise à jour du post.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Supprime un post
     */
    async destroy({ params, response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const post = await GmbPost.findOrFail(params.id)
            
            // Vérifier que le post appartient à l'utilisateur connecté
            if (post.user_id !== currentUser.id) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Vous n\'avez pas l\'autorisation de supprimer ce post.',
                })
                return response.redirect().toRoute('gmbPosts.index')
            }

            await post.delete()

            session.flash('notification', {
                type: 'success',
                message: 'Post GMB supprimé avec succès !',
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la suppression du post.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Supprime plusieurs posts en une fois
     */
    async bulkDestroy({ request, response, session }: HttpContext) {
        try {
            const { ids } = request.only(['ids'])

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Aucun post sélectionné pour la suppression.',
                })
                return response.redirect().back()
            }

            await GmbPost.query().whereIn('id', ids).delete()

            session.flash('notification', {
                type: 'success',
                message: `${ids.length} post(s) supprimé(s) avec succès !`,
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la suppression des posts.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Duplique un post existant
     */
    async duplicate({ params, response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const originalPost = await GmbPost.findOrFail(params.id)
            
            // Vérifier que le post appartient à l'utilisateur connecté
            if (originalPost.user_id !== currentUser.id) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Vous n\'avez pas l\'autorisation de dupliquer ce post.',
                })
                return response.redirect().toRoute('gmbPosts.index')
            }

            const duplicatedData = {
                user_id: currentUser.id, // Maintenir la propriété de l'utilisateur
                status: originalPost.status,
                text: originalPost.text,
                date: DateTime.now(), // Nouvelle date
                image_url: originalPost.image_url,
                link_url: originalPost.link_url,
                keyword: originalPost.keyword,
                client: originalPost.client,
                project_name: originalPost.project_name,
                location_id: originalPost.location_id,
                account_id: originalPost.account_id,
                notion_id: originalPost.notion_id,
            }

            await GmbPost.create(duplicatedData)

            session.flash('notification', {
                type: 'success',
                message: 'Post dupliqué avec succès !',
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la duplication du post.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Exporte les posts au format JSON
     */
    async export({ request, response }: HttpContext) {
        try {
            const { format = 'json' } = request.qs()

            const posts = await GmbPost.query().orderBy('date', 'desc')

            if (format === 'json') {
                const serializedPosts = posts.map((post) => post.serialize())

                response.header('Content-Type', 'application/json')
                response.header('Content-Disposition', 'attachment; filename="gmb-posts.json"')

                return response.send(JSON.stringify(serializedPosts, null, 2))
            }

            // Autres formats d'export peuvent être ajoutés ici (CSV, Excel, etc.)
            return response.badRequest({ message: "Format d'export non supporté" })
        } catch (error) {
            return response.internalServerError({ message: "Erreur lors de l'export" })
        }
    }

    /**
     * API endpoint pour récupérer les projets d'un client
     */
    async getProjectsByClient({ request, response }: HttpContext) {
        try {
            const { client } = request.qs()

            if (!client) {
                return response.badRequest({ message: 'Client requis' })
            }

            const projects = await GmbPost.query()
                .select('project_name')
                .where('client', client)
                .groupBy('project_name')
                .orderBy('project_name')

            return response.json({
                projects: projects.map((p) => p.project_name),
            })
        } catch (error) {
            return response.internalServerError({
                message: 'Erreur lors de la récupération des projets',
            })
        }
    }

    /**
     * Synchronise les données depuis Notion pour l'utilisateur connecté
     */
    async syncFromNotion({ response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            // Vérifier que l'utilisateur a un notion_id
            if (!currentUser.notionId) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Votre compte n\'est pas lié à Notion. Veuillez configurer votre ID Notion.',
                })
                return response.redirect().back()
            }

            console.log(`Synchronisation Notion pour l'utilisateur ${currentUser.username} (Notion ID: ${currentUser.notionId})`)

            const notionService = new NotionService()
            
            // Récupérer uniquement les pages "À générer" assignées à cet utilisateur
            const notionPages = await notionService.getPagesForUser(currentUser.notionId)

            console.log(`${notionPages.length} pages Notion trouvées pour l'utilisateur`)

            let createdCount = 0
            let updatedCount = 0
            let skippedCount = 0

            for (const notionPage of notionPages) {
                try {
                    // Vérifier si un post existe déjà avec ce notion_id
                    const existingPost = await GmbPost.query()
                        .where('notion_id', notionPage.id)
                        .where('user_id', currentUser.id)
                        .first()

                    const postData = {
                        user_id: currentUser.id,
                        status: 'draft', // Statut par défaut pour les imports Notion
                        text: notionPage.title || 'Titre depuis Notion',
                        date: DateTime.now(),
                        notion_id: notionPage.id,
                        client: 'Import Notion', // Valeur par défaut
                        project_name: 'Projet Notion', // Valeur par défaut
                        location_id: 'notion_import',
                        account_id: 'notion_account',
                        keyword: 'notion',
                    }

                    if (existingPost) {
                        // Mettre à jour le post existant
                        await existingPost.merge({
                            text: notionPage.title || existingPost.text,
                            // Conserver les autres champs existants
                        }).save()
                        updatedCount++
                        console.log(`Post mis à jour: ${notionPage.title}`)
                    } else {
                        // Créer un nouveau post
                        await GmbPost.create(postData)
                        createdCount++
                        console.log(`Nouveau post créé: ${notionPage.title}`)
                    }
                } catch (pageError) {
                    console.error(`Erreur pour la page ${notionPage.id}:`, pageError)
                    skippedCount++
                }
            }

            const message = `Synchronisation terminée: ${createdCount} nouveaux posts, ${updatedCount} mis à jour, ${skippedCount} ignorés`
            
            session.flash('notification', {
                type: 'success',
                message,
            })

            console.log(message)
            return response.redirect().toRoute('gmbPosts.index')

        } catch (error) {
            console.error('Erreur synchronisation Notion:', error)
            
            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la synchronisation avec Notion: ' + error.message,
            })

            return response.redirect().back()
        }
    }

    /**
     * Affiche les pages Notion disponibles pour l'utilisateur
     */
    async notionPreview({ inertia, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            if (!currentUser.notionId) {
                return inertia.render('gmbPosts/notion-preview', {
                    error: 'Votre compte n\'est pas lié à Notion.',
                    pages: [],
                    currentUser: {
                        id: currentUser.id,
                        username: currentUser.username,
                        email: currentUser.email,
                        notion_id: currentUser.notionId  // Convertir pour le frontend
                    }
                })
            }

            const notionService = new NotionService()
            const notionPages = await notionService.getPagesForUser(currentUser.notionId)

            return inertia.render('gmbPosts/notion-preview', {
                pages: notionPages,
                currentUser: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    notion_id: currentUser.notionId  // Convertir pour le frontend
                },
                stats: {
                    totalPages: notionPages.length,
                    toGenerate: notionPages.filter(p => p.status === 'À générer').length
                }
            })

        } catch (error) {
            console.error('Erreur prévisualisation Notion:', error)
            
            return inertia.render('gmbPosts/notion-preview', {
                error: 'Erreur lors de la récupération des données Notion: ' + error.message,
                pages: [],
                currentUser: {
                    id: auth.user?.id,
                    username: auth.user?.username,
                    email: auth.user?.email,
                    notion_id: auth.user?.notionId  // Convertir pour le frontend
                }
            })
        }
    }

    /**
     * Envoie tous les posts "Post à générer" de l'utilisateur connecté vers le webhook n8n
     */
    async sendPostsToN8n({ response, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            // Vérifier que l'utilisateur a un notion_id
            if (!currentUser.notionId) {
                return response.status(400).json({
                    success: false,
                    message: 'Votre compte n\'est pas lié à Notion. Veuillez configurer votre notion_id.',
                })
            }

            // Récupérer tous les posts "Post à générer" pour l'utilisateur connecté
            const postsToGenerate = await GmbPost.query()
                .where('user_id', currentUser.id)
                .where('status', 'Post à générer')
                .orderBy('date', 'desc')

            if (postsToGenerate.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Aucun post "Post à générer" trouvé pour votre compte.',
                })
            }

            console.log(`🚀 Envoi de ${postsToGenerate.length} posts GMB vers n8n pour l'utilisateur ${currentUser.username}`)

            // Préparer les données au même format que home.tsx mais avec les données GMB
            const gmbPostsData = postsToGenerate.map((post) => ({
                // Identifiants
                id: post.id,
                gmb_post_id: post.id, // ID spécifique GMB
                notion_id: post.notion_id,
                
                // Informations principales
                title: post.text || `Post GMB - ${post.client}`,
                text: post.text,
                status: post.status,
                
                // Dates
                date: post.date?.toISO(),
                created_time: post.createdAt?.toISO(),
                last_edited_time: post.updatedAt?.toISO(),
                
                // Métadonnées GMB
                client: post.client,
                project_name: post.project_name,
                keyword: post.keyword,
                location_id: post.location_id,
                account_id: post.account_id,
                
                // URLs
                image_url: post.image_url,
                link_url: post.link_url,
                
                // Utilisateur
                user_id: post.user_id,
                user_notion_id: currentUser.notionId,  // Utiliser notionId
            }))

            // URL du webhook n8n (réutiliser le même que home.tsx)
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
            const n8nAuthToken = process.env.N8N_AUTH_TOKEN
            
            if (!n8nWebhookUrl) {
                throw new Error('URL du webhook n8n non configurée (N8N_WEBHOOK_URL)')
            }

            // Headers avec authentification
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }

            if (n8nAuthToken) {
                headers['Authorization'] = `Bearer ${n8nAuthToken}`
                console.log('🔐 Token d\'authentification ajouté')
            }

            // Préparer les données pour n8n (même structure que home.tsx)
            const webhookData = {
                // Métadonnées de la requête
                source: 'adonis-gmb-posts',
                timestamp: new Date().toISOString(),
                bulk_operation: true,
                total_posts: gmbPostsData.length,
                
                // Données utilisateur
                user: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    notion_id: currentUser.notionId,  // Utiliser notionId
                },
                
                // Posts GMB (utiliser la même clé que home.tsx pour compatibilité)
                notion_pages: gmbPostsData, // Garder le même nom pour compatibilité avec le workflow n8n
                gmb_posts: gmbPostsData, // Version alternative plus explicite
                
                // Statistiques
                summary: {
                    total_posts: gmbPostsData.length,
                    posts_with_text: gmbPostsData.filter(p => p.text && p.text.trim() !== '').length,
                    posts_with_keyword: gmbPostsData.filter(p => p.keyword).length,
                    posts_with_images: gmbPostsData.filter(p => p.image_url).length,
                    posts_with_links: gmbPostsData.filter(p => p.link_url).length,
                    unique_clients: [...new Set(gmbPostsData.map(p => p.client))].length,
                    unique_projects: [...new Set(gmbPostsData.map(p => p.project_name))].length,
                }
            }

            console.log('🎆 Envoi vers n8n:', {
                url: n8nWebhookUrl,
                total_posts: webhookData.total_posts,
                user: currentUser.username,
                summary: webhookData.summary
            })

            // Envoi vers n8n
            const n8nResponse = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(webhookData),
            })

            console.log('📡 Statut réponse n8n:', n8nResponse.status)

            if (!n8nResponse.ok) {
                const errorText = await n8nResponse.text()
                console.error('❌ Erreur n8n (texte):', errorText.substring(0, 500))
                throw new Error(`Erreur n8n: ${n8nResponse.status} - ${n8nResponse.statusText}`)
            }

            // Traitement de la réponse
            const contentType = n8nResponse.headers.get('content-type')
            const responseText = await n8nResponse.text()
            
            let n8nResult
            try {
                if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                    n8nResult = JSON.parse(responseText)
                } else {
                    n8nResult = {
                        success: true,
                        message: 'Envoi des posts GMB réussi (réponse non-JSON)',
                        raw_response: responseText.substring(0, 300),
                        content_type: contentType,
                        notice: 'Ajoutez un nœud "Respond to Webhook" à votre workflow n8n pour une réponse JSON.',
                    }
                }
            } catch (parseError) {
                n8nResult = {
                    success: false,
                    message: 'Envoi des posts GMB effectué mais réponse non parsable',
                    error: parseError.message,
                    raw_response: responseText.substring(0, 300),
                }
            }
            
            console.log('✅ Réponse n8n pour posts GMB:', n8nResult)
            
            return response.json({
                success: true,
                data: n8nResult,
                message: `${gmbPostsData.length} posts GMB envoyés avec succès vers n8n`,
                posts_sent: gmbPostsData.length,
                user_notion_id: currentUser.notionId,  // Utiliser notionId
                debug: {
                    webhook_url: n8nWebhookUrl,
                    total_posts_sent: gmbPostsData.length,
                    response_status: n8nResponse.status,
                    content_type: contentType,
                },
            })

        } catch (error) {
            console.error('🚨 Erreur envoi posts GMB vers n8n:', error)
            
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de l\'envoi des posts GMB vers n8n',
                error: error.message,
                debug: {
                    webhook_url: process.env.N8N_WEBHOOK_URL || 'Non configurée',
                    timestamp: new Date().toISOString(),
                },
            })
        }
    }
}
