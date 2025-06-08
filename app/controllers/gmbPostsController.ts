import GmbPost from '#models/gmbPost'
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
     * Affiche la liste des posts GMB avec pagination et filtres
     */
    async index({ inertia, request }: HttpContext) {
        const page = request.input('page', 1)
        const limit = request.input('limit', 15)
        const search = request.input('search', '')
        const status = request.input('status', '')
        const client = request.input('client', '')
        const project = request.input('project', '')
        const sortBy = request.input('sortBy', 'date')
        const sortOrder = request.input('sortOrder', 'desc')

        const query = GmbPost.query()

        // Recherche textuelle
        if (search) {
            query.where((builder) => {
                builder
                    .where('text', 'ILIKE', `%${search}%`)
                    .orWhere('keyword', 'ILIKE', `%${search}%`)
                    .orWhere('client', 'ILIKE', `%${search}%`)
                    .orWhere('project_name', 'ILIKE', `%${search}%`)
            })
        }

        // Filtres
        if (status) {
            query.where('status', status)
        }

        if (client) {
            query.where('client', 'ILIKE', `%${client}%`)
        }

        if (project) {
            query.where('project_name', 'ILIKE', `%${project}%`)
        }

        // Tri
        query.orderBy(sortBy, sortOrder)

        // Pagination
        const posts = await query.paginate(page, limit)

        // Debug : vérifier la sérialisation avec naming strategy
        const serializedPosts = posts.serialize()
        console.log('Posts sérialisés avec naming strategy:', serializedPosts)
        
        if (serializedPosts.data && serializedPosts.data.length > 0) {
            console.log('Premier post:', serializedPosts.data[0])
            console.log('Clés disponibles:', Object.keys(serializedPosts.data[0]))
        }

        // Données pour les filtres
        const clients = await GmbPost.query().select('client').groupBy('client').orderBy('client')

        const projects = await GmbPost.query()
            .select('project_name')
            .groupBy('project_name')
            .orderBy('project_name')

        const statuses = await GmbPost.query().select('status').groupBy('status').orderBy('status')

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
        })
    }

    /**
     * Affiche le formulaire de création d'un nouveau post
     */
    async create({ inertia }: HttpContext) {
        // Récupération des options pour les selects
        const clients = await GmbPost.query().select('client').groupBy('client').orderBy('client')

        const projects = await GmbPost.query()
            .select('project_name', 'client')
            .groupBy('project_name', 'client')
            .orderBy('project_name')

        return inertia.render('gmbPosts/create', {
            clients: clients.map((c) => c.client),
            projects: projects,
        })
    }

    /**
     * Stocke un nouveau post en base de données
     */
    async store({ request, response, session }: HttpContext) {
        try {
            const payload = await request.validateUsing(createGmbPostValidator)

            // Conversion de la date si nécessaire
            const postData = {
                ...payload,
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
    async update({ params, request, response, session }: HttpContext) {
        console.log('=== MÉTHODE UPDATE APPELÉE ===')
        console.log('Paramètres de l\'URL:', params)
        console.log('Méthode HTTP:', request.method())
        console.log('URL complète:', request.url())
        console.log('================================')
        
        try {
            const post = await GmbPost.findOrFail(params.id)
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
    async destroy({ params, response, session }: HttpContext) {
        try {
            const post = await GmbPost.findOrFail(params.id)
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
    async duplicate({ params, response, session }: HttpContext) {
        try {
            const originalPost = await GmbPost.findOrFail(params.id)

            const duplicatedData = {
                status: originalPost.status, // 🔴 Copier le statut original
                text: originalPost.text,
                date: DateTime.now(), // Nouvelle date
                image_url: originalPost.image_url,
                link_url: originalPost.link_url,
                keyword: originalPost.keyword,
                client: originalPost.client,
                project_name: originalPost.project_name,
                location_id: originalPost.location_id,
                account_id: originalPost.account_id,
                notion_id: originalPost.notion_id, // 🔴 Copier le notion_id aussi
            }

            await GmbPost.create(duplicatedData)

            session.flash('notification', {
                type: 'success',
                message: 'Post dupliqué avec succès !',
            })

            return response.redirect().toRoute('gmbPosts.index') // 🔴 Retourner à l'index
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
     * Retourne les statistiques des posts
     */
    async stats({ inertia }: HttpContext) {
        try {
            const totalPosts = await GmbPost.query().count('* as total')

            const postsByStatus = await GmbPost.query()
                .select('status')
                .count('* as count')
                .groupBy('status')

            const postsByClient = await GmbPost.query()
                .select('client')
                .count('* as count')
                .groupBy('client')
                .orderBy('count', 'desc')
                .limit(10)

            const recentPosts = await GmbPost.query()
                .where('created_at', '>=', DateTime.now().minus({ days: 30 }))
                .count('* as count')

            return inertia.render('gmbPosts/stats', {
                stats: {
                    total: totalPosts[0].$extras.total,
                    recent: recentPosts[0].$extras.count,
                    byStatus: postsByStatus.map((item) => ({
                        status: item.status,
                        count: item.$extras.count,
                    })),
                    byClient: postsByClient.map((item) => ({
                        client: item.client,
                        count: item.$extras.count,
                    })),
                },
            })
        } catch (error) {
            return inertia.render('gmb-posts/stats', {
                stats: {
                    total: 0,
                    recent: 0,
                    byStatus: [],
                    byClient: [],
                },
            })
        }
    }
}
