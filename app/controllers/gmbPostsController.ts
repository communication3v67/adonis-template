import SSEController from '#controllers/sse_controller'
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
        city: vine.string().trim().optional(),
        location_id: vine.string().trim().minLength(1),
        account_id: vine.string().trim().minLength(1),
        notion_id: vine.string().trim().optional(),
        informations: vine.string().trim().optional(),
        // Nouveaux champs IA
        input_tokens: vine.number().min(0).optional(),
        output_tokens: vine.number().min(0).optional(),
        model: vine.string().trim().optional(),
        price: vine.number().min(0).optional(),
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
        city: vine.string().trim().nullable().optional(),
        location_id: vine.string().trim().optional(),
        account_id: vine.string().trim().optional(),
        notion_id: vine.string().trim().nullable().optional(),
        informations: vine.string().trim().nullable().optional(),
        // Nouveaux champs IA
        input_tokens: vine.number().min(0).nullable().optional(),
        output_tokens: vine.number().min(0).nullable().optional(),
        model: vine.string().trim().nullable().optional(),
        price: vine.number().min(0).nullable().optional(),
    })
)

export default class GmbPostsController {
    /**
     * Formatte un post GMB pour l'envoi vers N8N
     * Fonction utilitaire commune pour assurer la cohérence
     */
    private formatPostForN8n(post: GmbPost, currentUser: any) {
        return {
            // Identifiants
            id: post.id,
            gmb_post_id: post.id,
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
            city: post.city,
            keyword: post.keyword,
            location_id: post.location_id,
            account_id: post.account_id,

            // URLs
            image_url: post.image_url,
            link_url: post.link_url,

            // Informations supplémentaires
            informations: post.informations,

            // Utilisateur
            user_id: post.user_id,
            user_notion_id: currentUser.notionId,
        }
    }

    /**
     * Crée la structure de données N8N unifiée
     * Format identique pour envoi individuel et bulk
     */
    private createN8nWebhookData(posts: any[], currentUser: any, notionConfig: any, isSinglePost: boolean = false) {
        return {
            // Métadonnées de la requête
            source: isSinglePost ? 'adonis-gmb-single-post' : 'adonis-gmb-posts',
            timestamp: new Date().toISOString(),
            bulk_operation: !isSinglePost,
            single_post: isSinglePost,
            total_posts: posts.length,

            // Configuration Notion de l'utilisateur connecté
            notion_config: {
                api_key: notionConfig.apiKey,
                database_id: notionConfig.databaseId,
                instance: notionConfig.instance,
            },

            // Données utilisateur
            user: {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                notion_id: currentUser.notionId,
            },

            // 🎯 FORMAT TABLEAU UNIFORME - même structure pour bulk et individuel
            notion_pages: posts, // Compatibilité avec workflows existants
            gmb_posts: posts,    // Version alternative plus explicite

            // Statistiques (générées même pour un seul post)
            summary: {
                total_posts: posts.length,
                posts_with_text: posts.filter(p => p.text && p.text.trim() !== '').length,
                posts_with_keyword: posts.filter(p => p.keyword).length,
                posts_with_images: posts.filter(p => p.image_url).length,
                posts_with_links: posts.filter(p => p.link_url).length,
                unique_clients: [...new Set(posts.map(p => p.client))].length,
                unique_projects: [...new Set(posts.map(p => p.project_name))].length,
            },

            // Données extraites pour compatibilité (pour un seul post)
            ...(isSinglePost && posts.length === 1 ? {
                extracted_data: {
                    entreprise: posts[0].client,
                    projet: posts[0].project_name,
                    ville: posts[0].city,
                    mot_cle: posts[0].keyword,
                    texte: posts[0].text,
                    statut: posts[0].status,
                    location_id: posts[0].location_id,
                    account_id: posts[0].account_id,
                    image_url: posts[0].image_url,
                    link_url: posts[0].link_url,
                    informations: posts[0].informations,
                }
            } : {})
        }
    }
    /**
     * Applique les filtres avancés à la requête
     */
    private applyAdvancedFilters(query: any, filters: any) {
        if (!filters.groups || !Array.isArray(filters.groups)) {
            return
        }

        filters.groups.forEach((group: any, groupIndex: number) => {
            if (!group.filters || !Array.isArray(group.filters)) {
                return
            }

            const validFilters = group.filters.filter(
                (filter: any) =>
                    filter.value !== '' && filter.value !== null && filter.value !== undefined
            )

            if (validFilters.length === 0) {
                return
            }

            // Utiliser une fonction pour grouper les conditions
            const applyGroupCondition =
                groupIndex === 0 ? 'where' : group.condition === 'or' ? 'orWhere' : 'where'

            query[applyGroupCondition]((groupBuilder: any) => {
                validFilters.forEach((filter: any, filterIndex: number) => {
                    const applyFilterCondition =
                        filterIndex === 0 ? 'where' : group.condition === 'or' ? 'orWhere' : 'where'

                    this.applySingleFilter(groupBuilder, filter, applyFilterCondition)
                })
            })
        })
    }

    /**
     * Applique un filtre individuel
     */
    private applySingleFilter(builder: any, filter: any, condition: string) {
        const { property, operator, value } = filter

        // Mapping des propriétés frontend vers les colonnes de base de données
        const columnMap: Record<string, string> = {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            project_name: 'project_name',
            location_id: 'location_id',
            account_id: 'account_id',
            notion_id: 'notion_id',
            image_url: 'image_url',
            link_url: 'link_url',
            input_tokens: 'input_tokens',
            output_tokens: 'output_tokens',
        }

        const column = columnMap[property] || property

        switch (operator) {
            case 'equals':
                if (Array.isArray(value)) {
                    builder[condition + 'In'](column, value)
                } else {
                    builder[condition](column, value)
                }
                break

            case 'not_equals':
                if (Array.isArray(value)) {
                    builder[condition + 'NotIn'](column, value)
                } else {
                    builder[condition](column, '!=', value)
                }
                break

            case 'contains':
                builder[condition + 'Raw'](`LOWER(${column}) LIKE ?`, [
                    `%${value.toString().toLowerCase()}%`,
                ])
                break

            case 'not_contains':
                builder[condition + 'Raw'](`LOWER(${column}) NOT LIKE ?`, [
                    `%${value.toString().toLowerCase()}%`,
                ])
                break

            case 'starts_with':
                builder[condition + 'Raw'](`LOWER(${column}) LIKE ?`, [
                    `${value.toString().toLowerCase()}%`,
                ])
                break

            case 'ends_with':
                builder[condition + 'Raw'](`LOWER(${column}) LIKE ?`, [
                    `%${value.toString().toLowerCase()}`,
                ])
                break

            case 'is_empty':
                builder[condition]((subBuilder: any) => {
                    subBuilder.whereNull(column).orWhere(column, '')
                })
                break

            case 'is_not_empty':
                builder[condition]((subBuilder: any) => {
                    subBuilder.whereNotNull(column).where(column, '!=', '')
                })
                break

            case 'before':
                builder[condition + 'Raw'](`DATE(${column}) < ?`, [value])
                break

            case 'after':
                builder[condition + 'Raw'](`DATE(${column}) > ?`, [value])
                break

            case 'on_or_before':
                builder[condition + 'Raw'](`DATE(${column}) <= ?`, [value])
                break

            case 'on_or_after':
                builder[condition + 'Raw'](`DATE(${column}) >= ?`, [value])
                break

            case 'between':
                if (value.from && value.to) {
                    if (property.includes('date') || property.includes('At')) {
                        builder[condition + 'Raw'](`DATE(${column}) BETWEEN ? AND ?`, [
                            value.from,
                            value.to,
                        ])
                    } else {
                        builder[condition + 'Between'](column, [value.from, value.to])
                    }
                }
                break

            case 'greater_than':
                builder[condition](column, '>', value)
                break

            case 'less_than':
                builder[condition](column, '<', value)
                break

            case 'greater_than_or_equal':
                builder[condition](column, '>=', value)
                break

            case 'less_than_or_equal':
                builder[condition](column, '<=', value)
                break
        }
    }

    /**
     * Diffuse un événement SSE pour les mises à jour de posts GMB
     */
    private async broadcastPostUpdate(post: GmbPost, action: string, userId: number) {
        try {
            const postData = {
                ...post.serialize(),
                action, // 'created', 'updated', 'deleted', 'status_changed'
                timestamp: new Date().toISOString(),
            }

            // Canal spécifique à l'utilisateur
            SSEController.broadcast(`gmb-posts/user/${userId}`, {
                type: 'post_update',
                data: postData,
            })

            // Canal spécifique au post
            SSEController.broadcast(`gmb-posts/post/${post.id}`, {
                type: 'post_update',
                data: postData,
            })

            console.log(
                `📻 SSE: Diffusion événement ${action} pour post ${post.id} (user ${userId})`
            )
        } catch (error) {
            console.error('Erreur diffusion SSE:', error)
        }
    }

    /**
     * Diffuse une notification système à l'utilisateur
     */
    private async broadcastNotification(userId: number, notification: any) {
        try {
            SSEController.broadcast(`notifications/user/${userId}`, {
                type: 'notification',
                data: {
                    ...notification,
                    timestamp: new Date().toISOString(),
                    id: Date.now().toString(),
                },
            })

            console.log(`🔔 SSE: Notification envoyée à l'utilisateur ${userId}`)
        } catch (error) {
            console.error('Erreur diffusion notification SSE:', error)
        }
    }
    /**
     * Récupère la configuration Notion pour l'utilisateur connecté
     */
    private async getUserNotionConfig(auth: any) {
        console.log('\n=== GMB POSTS - GET USER NOTION CONFIG DEBUG ===')

        try {
            // Récupérer l'utilisateur connecté depuis la session
            const user = auth.user

            if (!user) {
                console.log(
                    '⚠️ Aucun utilisateur connecté, utilisation de la configuration par défaut'
                )
                const defaultConfig = NotionService.getNotionConfigForUser(null)
                console.log('🔧 Configuration par défaut:', {
                    apiKey: defaultConfig.apiKey
                        ? defaultConfig.apiKey.substring(0, 20) + '...'
                        : 'NON DÉFINIE',
                    databaseId: defaultConfig.databaseId || 'NON DÉFINIE',
                    instance: defaultConfig.instance,
                })
                console.log('=== FIN GMB POSTS - GET USER NOTION CONFIG DEBUG ===\n')
                return defaultConfig
            }

            console.log(`👤 Utilisateur connecté:`)
            console.log('  - ID:', user.id)
            console.log('  - Username:', user.username)
            console.log('  - Email:', user.email)
            console.log('  - notionDatabaseId:', user.notionDatabaseId)
            console.log('  - Type notionDatabaseId:', typeof user.notionDatabaseId)

            console.log(
                '🔍 Appel NotionService.getNotionConfigForUser avec:',
                user.notionDatabaseId
            )
            const config = NotionService.getNotionConfigForUser(user.notionDatabaseId)
            console.log('🔧 Configuration obtenue:')
            console.log(
                '  - apiKey:',
                config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'NON DÉFINIE'
            )
            console.log('  - databaseId:', config.databaseId || 'NON DÉFINIE')
            console.log('  - instance:', config.instance)
            console.log('=== FIN GMB POSTS - GET USER NOTION CONFIG DEBUG ===\n')

            return config
        } catch (error) {
            console.error("❌ Erreur lors de la récupération de l'utilisateur connecté:", error)
            const defaultConfig = NotionService.getNotionConfigForUser(null)
            console.log('🔧 Configuration par défaut (erreur):', {
                apiKey: defaultConfig.apiKey
                    ? defaultConfig.apiKey.substring(0, 20) + '...'
                    : 'NON DÉFINIE',
                databaseId: defaultConfig.databaseId || 'NON DÉFINIE',
                instance: defaultConfig.instance,
            })
            console.log('=== FIN GMB POSTS - GET USER NOTION CONFIG DEBUG ===\n')
            return defaultConfig
        }
    }

    /**
     * Effectue un rechercher/remplacer sur les posts sélectionnés
     */
    async bulkSearchReplace({ request, response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const { replacements } = request.only(['replacements'])

            console.log('=== MÉTHODE BULK SEARCH REPLACE ===')  
            console.log('Utilisateur:', currentUser.id)
            console.log('Remplacements reçus:', replacements)
            console.log('=================================')

            if (!replacements || !Array.isArray(replacements) || replacements.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Aucun remplacement à effectuer.',
                })
                return response.redirect().back()
            }

            // Grouper les remplacements par post ID
            const replacementsByPost = replacements.reduce((acc, rep) => {
                if (!acc[rep.postId]) {
                    acc[rep.postId] = []
                }
                acc[rep.postId].push(rep)
                return acc
            }, {} as Record<number, Array<{ field: string; newValue: string }>>)

            let updatedCount = 0
            let errorCount = 0

            // Traiter chaque post
            for (const [postId, postReplacements] of Object.entries(replacementsByPost)) {
                try {
                    // Récupérer le post et vérifier la propriété
                    const post = await GmbPost.query()
                        .where('id', parseInt(postId))
                        .where('user_id', currentUser.id)
                        .first()

                    if (!post) {
                        console.log(`Post ${postId} non trouvé ou non autorisé`)
                        errorCount++
                        continue
                    }

                    // Appliquer tous les remplacements pour ce post
                    let hasChanges = false
                    postReplacements.forEach(({ field, newValue }) => {
                        if (post[field] !== newValue) {
                            post[field] = newValue
                            hasChanges = true
                        }
                    })

                    if (hasChanges) {
                        await post.save()
                        updatedCount++

                        // Diffuser l'événement SSE
                        await this.broadcastPostUpdate(post, 'updated', currentUser.id)
                    }
                } catch (error) {
                    console.error(`Erreur remplacement pour post ${postId}:`, error)
                    errorCount++
                }
            }

            // Diffuser une notification globale
            await this.broadcastNotification(currentUser.id, {
                type: 'success',
                title: 'Remplacements effectués',
                message: `${updatedCount} post(s) modifié(s) avec succès !${errorCount > 0 ? ` (${errorCount} erreur(s))` : ''}`,
            })

            console.log(`${updatedCount} posts mis à jour, ${errorCount} erreurs`)

            session.flash('notification', {
                type: 'success',
                message: `${updatedCount} post(s) modifié(s) avec succès !${errorCount > 0 ? ` (${errorCount} erreur(s))` : ''}`,
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            console.error('Erreur rechercher/remplacer en masse:', error)
            console.error('Stack trace:', error.stack)

            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors du rechercher/remplacer en masse.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Applique la mise en majuscule de la première lettre du champ texte
     */
    async capitalizeFirstLetter({ request, response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const { ids } = request.only(['ids'])

            console.log('=== MÉTHODE CAPITALIZE FIRST LETTER ===')
            console.log('Utilisateur:', currentUser.id)
            console.log('IDs reçus:', ids)
            console.log('========================================')

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Aucun post sélectionné pour le traitement.',
                })
                return response.redirect().back()
            }

            // Récupérer les posts sélectionnés (seulement ceux de l'utilisateur)
            const selectedPosts = await GmbPost.query()
                .whereIn('id', ids)
                .where('user_id', currentUser.id)
                .orderBy('id')

            if (selectedPosts.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: "Aucun post trouvé ou vous n'avez pas l'autorisation.",
                })
                return response.redirect().back()
            }

            console.log(`${selectedPosts.length} posts trouvés sur ${ids.length} demandés`)

            let updatedCount = 0
            let skippedCount = 0

            // Traiter chaque post pour mettre en majuscule la première lettre
            for (const post of selectedPosts) {
                try {
                    // Vérifier si le post a du texte
                    if (!post.text || typeof post.text !== 'string' || post.text.trim() === '') {
                        console.log(`Post ${post.id} ignoré - pas de texte`)
                        skippedCount++
                        continue
                    }

                    // Appliquer la mise en majuscule de la première lettre
                    const originalText = post.text
                    const capitalizedText = originalText.charAt(0).toUpperCase() + originalText.slice(1)

                    // Vérifier si le texte a réellement changé
                    if (originalText === capitalizedText) {
                        console.log(`Post ${post.id} ignoré - première lettre déjà en majuscule`)
                        skippedCount++
                        continue
                    }

                    post.text = capitalizedText
                    await post.save()
                    updatedCount++

                    // Diffuser l'événement SSE
                    await this.broadcastPostUpdate(post, 'updated', currentUser.id)

                    console.log(`Post ${post.id} traité: "${originalText.substring(0, 30)}..." -> "${capitalizedText.substring(0, 30)}..."`)
                } catch (error) {
                    console.error(`Erreur traitement post ${post.id}:`, error)
                    skippedCount++
                }
            }

            // Diffuser une notification globale
            await this.broadcastNotification(currentUser.id, {
                type: 'success',
                title: 'Traitement terminé',
                message: `${updatedCount} post(s) traité(s) avec succès !${skippedCount > 0 ? ` (${skippedCount} ignoré(s))` : ''}`,
            })

            console.log(`${updatedCount} posts traités, ${skippedCount} ignorés`)

            session.flash('notification', {
                type: 'success',
                message: `${updatedCount} post(s) traité(s) avec succès !${skippedCount > 0 ? ` (${skippedCount} posts ignorés)` : ''}`,
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            console.error('Erreur mise en majuscule première lettre:', error)
            console.error('Stack trace:', error.stack)

            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors du traitement des posts.',
            })

            return response.redirect().back()
        }
    }

    /**
     * Attribue des images en masse aux posts sélectionnés
     */
    async bulkImages({ request, response, session, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const { ids, images, overwriteExisting } = request.only([
                'ids',
                'images',
                'overwriteExisting',
            ])

            console.log('=== MÉTHODE BULK IMAGES ===')
            console.log('Utilisateur:', currentUser.id)
            console.log('IDs reçus:', ids)
            console.log('Images reçues:', images)
            console.log('Écraser existantes:', overwriteExisting)
            console.log('=========================')

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: "Aucun post sélectionné pour l'attribution d'images.",
                })
                return response.redirect().back()
            }

            if (!images || !Array.isArray(images) || images.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: 'Aucune image fournie.',
                })
                return response.redirect().back()
            }

            // Récupérer les posts sélectionnés (seulement ceux de l'utilisateur)
            const selectedPosts = await GmbPost.query()
                .whereIn('id', ids)
                .where('user_id', currentUser.id)
                .orderBy('id')

            if (selectedPosts.length === 0) {
                session.flash('notification', {
                    type: 'error',
                    message: "Aucun post trouvé ou vous n'avez pas l'autorisation.",
                })
                return response.redirect().back()
            }

            console.log(`${selectedPosts.length} posts trouvés sur ${ids.length} demandés`)

            let updatedCount = 0
            let skippedCount = 0
            const maxImagesToAssign = Math.min(selectedPosts.length, images.length)

            // Attribuer les images aux posts (une image par post)
            for (let i = 0; i < maxImagesToAssign; i++) {
                const post = selectedPosts[i]
                const imageUrl = images[i]

                try {
                    // Vérifier si on doit écraser ou non
                    if (!overwriteExisting && post.image_url && post.image_url.trim() !== '') {
                        console.log(`Post ${post.id} ignoré - image existante: ${post.image_url}`)
                        skippedCount++
                        continue
                    }

                    const oldImageUrl = post.image_url
                    post.image_url = imageUrl
                    await post.save()
                    updatedCount++

                    // Diffuser l'événement SSE pour chaque post mis à jour
                    await this.broadcastPostUpdate(post, 'updated', currentUser.id)

                    console.log(
                        `Image attribuée au post ${post.id}: ${imageUrl} (ancienne: ${oldImageUrl || 'aucune'})`
                    )
                } catch (error) {
                    console.error(`Erreur attribution image au post ${post.id}:`, error)
                }
            }

            // Diffuser une notification globale
            await this.broadcastNotification(currentUser.id, {
                type: 'success',
                title: 'Images attribuées',
                message: `${updatedCount} image(s) attribuée(s) avec succès !${skippedCount > 0 ? ` (${skippedCount} ignorées car image existante)` : ''}`,
            })

            console.log(`${updatedCount} posts mis à jour avec des images, ${skippedCount} ignorés`)

            session.flash('notification', {
                type: 'success',
                message: `${updatedCount} image(s) attribuée(s) avec succès !${skippedCount > 0 ? ` (${skippedCount} posts ignorés car ayant déjà une image)` : ''}`,
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            console.error('Erreur attribution images en masse:', error)
            console.error('Stack trace:', error.stack)

            session.flash('notification', {
                type: 'error',
                message: "Erreur lors de l'attribution des images en masse.",
            })

            return response.redirect().back()
        }
    }
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
        const limit = request.input('limit', 50) // Changé à 50 pour le scroll infini
        const search = request.input('search', '')
        const status = request.input('status', '')
        const client = request.input('client', '')
        const project = request.input('project', '')
        const sortBy = request.input('sortBy', 'date')
        const sortOrder = request.input('sortOrder', 'desc')
        const dateFrom = request.input('dateFrom', '')
        const dateTo = request.input('dateTo', '')
        const loadMore = request.input('loadMore', false) // Nouveau paramètre pour le scroll infini
        const advancedFilters = request.input('advanced_filters', '') // Nouveaux filtres avancés

        console.log('=== FILTRES REÇUS ===')
        console.log('Utilisateur connecté:', auth.user?.id)
        console.log('Page:', page, 'Limit:', limit)
        console.log('Load More:', loadMore)
        console.log('Recherche:', search)
        console.log('Statut:', status)
        console.log('Client:', client)
        console.log('Projet:', project)
        console.log('Date du:', dateFrom)
        console.log('Date au:', dateTo)
        console.log('Tri:', sortBy, sortOrder)
        console.log('Filtres avancés:', advancedFilters)
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
                    .orWhereRaw('LOWER(city) LIKE ?', [`%${searchLower}%`])
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

        // Filtres de date
        if (dateFrom) {
            query.whereRaw('DATE(date) >= ?', [dateFrom])
        }

        if (dateTo) {
            query.whereRaw('DATE(date) <= ?', [dateTo])
        }

        // Appliquer les filtres avancés
        if (advancedFilters) {
            try {
                const parsedFilters = JSON.parse(advancedFilters)
                this.applyAdvancedFilters(query, parsedFilters)
            } catch (error) {
                console.error('Erreur parsing filtres avancés:', error)
            }
        }

        // Mapping des noms de colonnes pour le tri (frontend camelCase -> database snake_case)
        const sortColumnMap: Record<string, string> = {
            id: 'id',
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            date: 'date',
            status: 'status',
            text: 'text',
            client: 'client',
            project_name: 'project_name',
            city: 'city',
            keyword: 'keyword',
            location_id: 'location_id',
            account_id: 'account_id',
            notion_id: 'notion_id',
            image_url: 'image_url',
            link_url: 'link_url',
        }

        // Utiliser le vrai nom de colonne pour le tri
        const actualSortColumn = sortColumnMap[sortBy] || sortBy

        // Tri
        query.orderBy(actualSortColumn, sortOrder)

        console.log('Requête SQL générée:', query.toQuery())

        // Pagination
        const posts = await query.paginate(page, limit)

        // Pour le scroll infini, retourner seulement les données en JSON
        if (loadMore) {
            const serializedPosts = posts.serialize()
            console.log(`Load More - Page ${page}: ${serializedPosts.data.length} posts chargés`)

            return {
                posts: serializedPosts,
                hasMore: page < serializedPosts.meta.last_page,
            }
        }

        // Debug : vérifier la sérialisation avec naming strategy
        const serializedPosts = posts.serialize()
        console.log(
            'Posts sérialisés pour utilisateur',
            currentUser.id,
            ':',
            serializedPosts.data.length
        )

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
                dateFrom,
                dateTo,
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
                notion_id: currentUser.notionId, // Convertir notionId en notion_id pour le frontend
            },
            postsToGenerateCount: postsToGenerate,
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
                notion_id: currentUser.notionId, // Convertir notionId en notion_id pour le frontend
            },
        })
    }

    /**
     * Stocke un nouveau post en base de données
     */
    async store({ request, response, session, auth }: HttpContext) {
        try {
            console.log('=== MÉTHODE STORE APPELÉE ===')
            console.log('Données reçues:', request.all())

            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            console.log('Utilisateur connecté:', currentUser.id)

            // Valider les données sans utiliser le validateur strict
            const payload = request.all()

            // Validation manuelle plus flexible
            if (
                !payload.status ||
                !payload.text ||
                !payload.client ||
                !payload.project_name ||
                !payload.location_id ||
                !payload.account_id
            ) {
                console.log('Validation échouée - champs manquants')
                session.flash('notification', {
                    type: 'error',
                    message: 'Veuillez remplir tous les champs requis.',
                })
                return response.redirect().back()
            }

            // Conversion de la date
            let dateValue
            try {
                if (payload.date) {
                    // Essayer de parser la date depuis datetime-local
                    dateValue = DateTime.fromISO(payload.date)
                    if (!dateValue.isValid) {
                        dateValue = DateTime.fromJSDate(new Date(payload.date))
                    }
                } else {
                    dateValue = DateTime.now()
                }
            } catch (error) {
                console.error('Erreur parsing date:', error)
                dateValue = DateTime.now()
            }

            const postData = {
                user_id: currentUser.id,
                status: payload.status,
                text: payload.text,
                date: dateValue,
                image_url: payload.image_url || null,
                link_url: payload.link_url || null,
                keyword: payload.keyword || null,
                client: payload.client,
                project_name: payload.project_name,
                city: payload.city || null,
                location_id: payload.location_id,
                account_id: payload.account_id,
                notion_id: payload.notion_id || null,
                informations: payload.informations || null,
                input_tokens: payload.input_tokens || null,
                output_tokens: payload.output_tokens || null,
                model: payload.model || null,
                price: payload.price || null,
            }

            console.log('Données à insérer:', postData)

            const newPost = await GmbPost.create(postData)

            console.log('Post créé avec succès:', newPost.id)

            // Diffuser l'événement SSE
            await this.broadcastPostUpdate(newPost, 'created', currentUser.id)
            await this.broadcastNotification(currentUser.id, {
                type: 'success',
                title: 'Post créé',
                message: 'Post GMB créé avec succès !',
            })

            session.flash('notification', {
                type: 'success',
                message: 'Post GMB créé avec succès !',
            })

            return response.redirect().toRoute('gmbPosts.index')
        } catch (error) {
            console.error('Erreur lors de la création du post:', error)
            console.error('Stack trace:', error.stack)

            session.flash('notification', {
                type: 'error',
                message: 'Erreur lors de la création du post: ' + error.message,
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
     * Met à jour un post existant - Version optimisée pour l'édition inline
     */
    async update({ params, request, response, session, auth }: HttpContext) {
        console.log('=== MÉTHODE UPDATE APPELÉE ===')
        console.log("Paramètres de l'URL:", params)
        console.log('Méthode HTTP:', request.method())
        console.log('URL complète:', request.url())
        console.log('Content-Type:', request.header('content-type'))
        console.log('Accept:', request.header('accept'))
        console.log('================================')

        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const post = await GmbPost.findOrFail(params.id)

            // Vérifier que le post appartient à l'utilisateur connecté
            if (post.user_id !== currentUser.id) {
                return response.status(403).json({
                    success: false,
                    message: "Vous n'avez pas l'autorisation de modifier ce post."
                })
            }

            const payload = request.all()
            console.log('Payload reçu:', payload)
            
            // NOUVEAU : Gestion des conflits basée sur timestamp (sans migration)
            const clientLastModified = payload.last_modified
            const forceUpdate = payload.force_update
            
            if (clientLastModified && !forceUpdate) {
                // Vérifier si le post a été modifié depuis que le client l'a chargé
                const clientTime = DateTime.fromISO(clientLastModified)
                if (post.updatedAt > clientTime) {
                    console.log(`⚠️ Conflit de modification détecté:`)
                    console.log(`  - Client timestamp: ${clientLastModified}`)
                    console.log(`  - Serveur updated_at: ${post.updatedAt.toISO()}`)
                    
                    return response.status(409).json({
                        success: false,
                        message: 'Ce post a été modifié par quelqu\'un d\'autre.',
                        version_conflict: {
                            current_post: {
                                ...post.serialize(),
                                last_modified: post.updatedAt.toISO(),
                                version_timestamp: post.updatedAt.toMillis(),
                            },
                            client_timestamp: clientLastModified,
                            server_timestamp: post.updatedAt.toISO(),
                            conflict_detected_at: DateTime.now().toISO()
                        }
                    })
                }
            }
            
            console.log('Post avant modification:', post.toJSON())

            // Détecter si c'est une requête AJAX/API (pour l'édition inline) vs Modal Inertia
            const isApiRequest = request.header('accept')?.includes('application/json') && 
                                request.header('x-requested-with') === 'XMLHttpRequest'
            
            // Les modals Inertia n'envoient pas ces headers spécifiques
            const isInertiaModal = !isApiRequest && request.header('x-inertia')

            console.log('Type de requête détecté:', {
                isApiRequest,
                isInertiaModal,
                accept: request.header('accept'),
                xRequestedWith: request.header('x-requested-with'),
                xInertia: request.header('x-inertia')
            })

            // Mise à jour directe et efficace pour l'édition inline
            Object.keys(payload).forEach((key) => {
                // Ignorer les champs méta et de contrôle - AMÉLIORÉ
                if (['last_modified', 'force_update', 'client_timestamp', 'version_timestamp'].includes(key)) {
                    return
                }
                
                if (payload[key] !== undefined) {
                    // Gestion spéciale pour la date
                    if (key === 'date' && payload[key]) {
                        try {
                            post[key] = DateTime.fromISO(payload[key])
                        } catch (error) {
                            console.error('Erreur parsing date:', error)
                            // Garder la date originale en cas d'erreur
                        }
                    } else {
                        post[key] = payload[key] || null
                    }
                }
            })

            await post.save()

            // Diffuser l'événement SSE pour synchronisation temps réel
            await this.broadcastPostUpdate(post, 'updated', currentUser.id)

            console.log('Post après modification:', post.toJSON())

            // Réponse adaptée selon le type de requête
            if (isApiRequest) {
                // Réponse JSON pour les requêtes AJAX (inline edit)
                console.log('🚀 Réponse JSON pour édition inline')
                return response.json({
                    success: true,
                    message: 'Post mis à jour avec succès',
                    post: {
                        ...post.serialize(),
                        last_modified: post.updatedAt.toISO(), // Inclure timestamp mis à jour
                        version_timestamp: post.updatedAt.toMillis(),
                    },
                    timestamp: new Date().toISOString()
                })
            } else {
                // Réponse Inertia pour les modals et formulaires
                console.log('🚀 Réponse Inertia pour modal/formulaire')
                
                await this.broadcastNotification(currentUser.id, {
                    type: 'success',
                    title: 'Post modifié',
                    message: 'Post GMB mis à jour avec succès !',
                })

                session.flash('notification', {
                    type: 'success',
                    message: 'Post GMB mis à jour avec succès !',
                })

                return response.redirect().toRoute('gmbPosts.index')
            }
        } catch (error) {
            console.error('Erreur mise à jour:', error)
            console.error('Stack trace:', error.stack)

            // Réponse d'erreur adaptée
            const isApiRequest = request.header('accept')?.includes('application/json') && 
                                request.header('x-requested-with') === 'XMLHttpRequest'

            if (isApiRequest) {
                return response.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour du post',
                    error: error.message
                })
            } else {
                session.flash('notification', {
                    type: 'error',
                    message: 'Erreur lors de la mise à jour du post.',
                })
                return response.redirect().back()
            }
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
                    message: "Vous n'avez pas l'autorisation de supprimer ce post.",
                })
                return response.redirect().toRoute('gmbPosts.index')
            }

            // Diffuser l'événement SSE avant suppression
            await this.broadcastPostUpdate(post, 'deleted', currentUser.id)

            await post.delete()

            await this.broadcastNotification(currentUser.id, {
                type: 'success',
                title: 'Post supprimé',
                message: 'Post GMB supprimé avec succès !',
            })

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
                    message: "Vous n'avez pas l'autorisation de dupliquer ce post.",
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
                city: originalPost.city,
                location_id: originalPost.location_id,
                account_id: originalPost.account_id,
                notion_id: originalPost.notion_id,
            }

            const duplicatedPost = await GmbPost.create(duplicatedData)

            // Diffuser l'événement SSE
            await this.broadcastPostUpdate(duplicatedPost, 'created', currentUser.id)
            await this.broadcastNotification(currentUser.id, {
                type: 'success',
                title: 'Post dupliqué',
                message: 'Post dupliqué avec succès !',
            })

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
     * Affiche les statistiques des posts avec les coûts IA
     */
    async stats({ inertia, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            // Statistiques générales
            const totalPosts = await GmbPost.query()
                .where('user_id', currentUser.id)
                .count('* as total')

            const postsByStatus = await GmbPost.query()
                .where('user_id', currentUser.id)
                .select('status')
                .count('* as count')
                .groupBy('status')

            // Statistiques IA et coûts
            const aiStats = await GmbPost.query()
                .where('user_id', currentUser.id)
                .whereNotNull('input_tokens')
                .select([
                    GmbPost.query().sum('input_tokens').as('total_input_tokens'),
                    GmbPost.query().sum('output_tokens').as('total_output_tokens'),
                    GmbPost.query().sum('price').as('total_cost'),
                    GmbPost.query().count('*').as('ai_posts_count'),
                    GmbPost.query().avg('price').as('avg_cost_per_post'),
                ])
                .first()

            // Coûts par modèle
            const costsByModel = await GmbPost.query()
                .where('user_id', currentUser.id)
                .whereNotNull('model')
                .select('model')
                .sum('price as total_cost')
                .count('* as posts_count')
                .avg('price as avg_cost')
                .groupBy('model')
                .orderBy('total_cost', 'desc')

            // Posts les plus coûteux
            const mostExpensivePosts = await GmbPost.query()
                .where('user_id', currentUser.id)
                .whereNotNull('price')
                .select(
                    'id',
                    'text',
                    'model',
                    'price',
                    'input_tokens',
                    'output_tokens',
                    'created_at'
                )
                .orderBy('price', 'desc')
                .limit(10)

            return inertia.render('gmbPosts/stats', {
                stats: {
                    total: Number(totalPosts[0].$extras.total),
                    byStatus: postsByStatus.map((s) => ({
                        status: s.status,
                        count: Number(s.$extras.count),
                    })),
                    ai: {
                        totalInputTokens: Number(aiStats?.total_input_tokens || 0),
                        totalOutputTokens: Number(aiStats?.total_output_tokens || 0),
                        totalCost: Number(aiStats?.total_cost || 0),
                        aiPostsCount: Number(aiStats?.ai_posts_count || 0),
                        avgCostPerPost: Number(aiStats?.avg_cost_per_post || 0),
                        costsByModel: costsByModel.map((m) => ({
                            model: m.model,
                            totalCost: Number(m.$extras.total_cost),
                            postsCount: Number(m.$extras.posts_count),
                            avgCost: Number(m.$extras.avg_cost),
                        })),
                        mostExpensivePosts: mostExpensivePosts.map((p) => p.serialize()),
                    },
                },
                currentUser: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    notion_id: currentUser.notionId,
                },
            })
        } catch (error) {
            console.error('Erreur récupération stats:', error)
            return inertia.render('gmbPosts/stats', {
                error: 'Erreur lors de la récupération des statistiques',
                currentUser: {
                    id: auth.user?.id,
                    username: auth.user?.username,
                    email: auth.user?.email,
                    notion_id: auth.user?.notionId,
                },
            })
        }
    }
    async export({ request, response, auth }: HttpContext) {
        try {
            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            const { format = 'csv' } = request.qs()

            // Récupérer les filtres depuis la requête
            const search = request.input('search', '')
            const status = request.input('status', '')
            const client = request.input('client', '')
            const project = request.input('project', '')
            const sortBy = request.input('sortBy', 'date')
            const sortOrder = request.input('sortOrder', 'desc')
            const dateFrom = request.input('dateFrom', '')
            const dateTo = request.input('dateTo', '')
            const advancedFilters = request.input('advanced_filters', '')

            // Construire la requête avec les mêmes filtres que l'index
            const query = GmbPost.query().where('user_id', currentUser.id)

            // Appliquer les filtres (même logique que dans index)
            if (search) {
                const searchLower = search.toLowerCase()
                query.where((builder) => {
                    builder
                        .whereRaw('LOWER(text) LIKE ?', [`%${searchLower}%`])
                        .orWhereRaw('LOWER(keyword) LIKE ?', [`%${searchLower}%`])
                        .orWhereRaw('LOWER(client) LIKE ?', [`%${searchLower}%`])
                        .orWhereRaw('LOWER(project_name) LIKE ?', [`%${searchLower}%`])
                        .orWhereRaw('LOWER(city) LIKE ?', [`%${searchLower}%`])
                })
            }

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

            if (dateFrom) {
                query.whereRaw('DATE(date) >= ?', [dateFrom])
            }

            if (dateTo) {
                query.whereRaw('DATE(date) <= ?', [dateTo])
            }

            // Appliquer les filtres avancés
            if (advancedFilters) {
                try {
                    const parsedFilters = JSON.parse(advancedFilters)
                    this.applyAdvancedFilters(query, parsedFilters)
                } catch (error) {
                    console.error('Erreur parsing filtres avancés pour export:', error)
                }
            }

            // Mapping des noms de colonnes pour le tri
            const sortColumnMap: Record<string, string> = {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                date: 'date',
                status: 'status',
                text: 'text',
                client: 'client',
                project_name: 'project_name',
                city: 'city',
                keyword: 'keyword',
                location_id: 'location_id',
                account_id: 'account_id',
                notion_id: 'notion_id',
                image_url: 'image_url',
                link_url: 'link_url',
            }

            const actualSortColumn = sortColumnMap[sortBy] || sortBy
            query.orderBy(actualSortColumn, sortOrder)

            // Récupérer tous les posts (sans pagination pour l'export)
            const posts = await query

            if (format === 'csv') {
                // Générer le CSV
                const csvHeaders = [
                    'ID',
                    'Statut',
                    'Texte',
                    'Date',
                    'Client',
                    'Projet',
                    'Ville',
                    'Mot-clé',
                    'URL Image',
                    'URL Lien',
                    'Location ID',
                    'Account ID',
                    'Notion ID',
                    'Informations',
                    'Prix IA',
                    'Tokens Entrée',
                    'Tokens Sortie',
                    'Modèle IA',
                    'Date Création',
                    'Date Modification',
                ]

                const csvRows = posts.map((post) => [
                    post.id,
                    `"${(post.status || '').replace(/"/g, '""')}"`,
                    `"${(post.text || '').replace(/"/g, '""')}"`,
                    post.date?.toFormat('yyyy-MM-dd HH:mm:ss') || '',
                    `"${(post.client || '').replace(/"/g, '""')}"`,
                    `"${(post.project_name || '').replace(/"/g, '""')}"`,
                    `"${(post.city || '').replace(/"/g, '""')}"`,
                    `"${(post.keyword || '').replace(/"/g, '""')}"`,
                    `"${(post.image_url || '').replace(/"/g, '""')}"`,
                    `"${(post.link_url || '').replace(/"/g, '""')}"`,
                    `"${(post.location_id || '').replace(/"/g, '""')}"`,
                    `"${(post.account_id || '').replace(/"/g, '""')}"`,
                    `"${(post.notion_id || '').replace(/"/g, '""')}"`,
                    `"${(post.informations || '').replace(/"/g, '""')}"`,
                    post.price || '',
                    post.input_tokens || '',
                    post.output_tokens || '',
                    `"${(post.model || '').replace(/"/g, '""')}"`,
                    post.createdAt?.toFormat('yyyy-MM-dd HH:mm:ss') || '',
                    post.updatedAt?.toFormat('yyyy-MM-dd HH:mm:ss') || '',
                ])

                const csvContent = [
                    csvHeaders.join(','),
                    ...csvRows.map((row) => row.join(',')),
                ].join('\n')

                const filename = `posts-gmb-${new Date().toISOString().slice(0, 10)}.csv`

                response.header('Content-Type', 'text/csv; charset=utf-8')
                response.header('Content-Disposition', `attachment; filename="${filename}"`)

                // Ajouter le BOM UTF-8 pour Excel
                return response.send('\ufeff' + csvContent)
            }

            if (format === 'json') {
                const serializedPosts = posts.map((post) => post.serialize())

                response.header('Content-Type', 'application/json')
                response.header('Content-Disposition', 'attachment; filename="gmb-posts.json"')

                return response.send(JSON.stringify(serializedPosts, null, 2))
            }

            // Format non supporté
            return response.badRequest({
                message: "Format d'export non supporté. Utilisez 'csv' ou 'json'.",
            })
        } catch (error) {
            console.error("Erreur lors de l'export:", error)
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
                    message:
                        "Votre compte n'est pas lié à Notion. Veuillez configurer votre ID Notion.",
                })
                return response.redirect().back()
            }

            console.log(
                `Synchronisation Notion pour l'utilisateur ${currentUser.username} (Notion ID: ${currentUser.notionId})`
            )

            // Utiliser la configuration de l'utilisateur connecté
            const notionService = new NotionService(currentUser.notionDatabaseId)

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
                        await existingPost
                            .merge({
                                text: notionPage.title || existingPost.text,
                                // Conserver les autres champs existants
                            })
                            .save()
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
                    error: "Votre compte n'est pas lié à Notion.",
                    pages: [],
                    currentUser: {
                        id: currentUser.id,
                        username: currentUser.username,
                        email: currentUser.email,
                        notion_id: currentUser.notionId, // Convertir pour le frontend
                    },
                })
            }

            const notionService = new NotionService(currentUser.notionDatabaseId)
            const notionPages = await notionService.getPagesForUser(currentUser.notionId)

            return inertia.render('gmbPosts/notion-preview', {
                pages: notionPages,
                currentUser: {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email,
                    notion_id: currentUser.notionId, // Convertir pour le frontend
                },
                stats: {
                    totalPages: notionPages.length,
                    toGenerate: notionPages.filter((p) => p.status === 'À générer').length,
                },
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
                    notion_id: auth.user?.notionId, // Convertir pour le frontend
                },
            })
        }
    }

    /**
     * Envoie un post GMB individuel vers le webhook n8n
     */
    async sendSinglePostToN8n({ params, response, auth }: HttpContext) {
        try {
            console.log('🚀 SEND SINGLE GMB POST TO N8N - Post ID:', params.id)
            console.log('Utilisateur connecté:', {
                id: auth.user?.id,
                email: auth.user?.email,
                username: auth.user?.username,
            })

            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            // Récupération de la configuration Notion de l'utilisateur connecté
            const notionConfig = await this.getUserNotionConfig(auth)

            // Récupérer le post spécifique
            const post = await GmbPost.query()
                .where('id', params.id)
                .where('user_id', currentUser.id) // Sécurité : seulement les posts de l'utilisateur
                .first()

            if (!post) {
                return response.status(404).json({
                    success: false,
                    message: "Post non trouvé ou vous n'avez pas l'autorisation de l'accéder.",
                })
            }

            console.log(
                `📝 Post trouvé: "${post.text?.substring(0, 50)}..." (Status: ${post.status})`
            )

            // Vérifier que le post est dans le bon statut
            if (post.status !== 'Post à générer') {
                return response.status(400).json({
                    success: false,
                    message: `Ce post ne peut pas être envoyé. Statut actuel: "${post.status}". Seuls les posts "Post à générer" peuvent être envoyés.`,
                    current_status: post.status,
                    required_status: 'Post à générer',
                })
            }

            // Préparer les données du post individuel en utilisant la fonction utilitaire
            const gmbPostData = this.formatPostForN8n(post, currentUser)

            // URL du webhook n8n
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
                console.log("🔐 Token d'authentification ajouté")
            }

            // 🎯 Utiliser la fonction unifiée pour créer les données webhook (format tableau)
            const webhookData = this.createN8nWebhookData([gmbPostData], currentUser, notionConfig, true)

            console.log('🎆 Envoi post individuel vers n8n:', {
                url: n8nWebhookUrl,
                post_id: post.id,
                client: post.client,
                user: currentUser.username,
                notion_instance: notionConfig.instance,
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
                        message: 'Envoi du post GMB réussi (réponse non-JSON)',
                        raw_response: responseText.substring(0, 300),
                        content_type: contentType,
                        notice: 'Ajoutez un nœud "Respond to Webhook" à votre workflow n8n pour une réponse JSON.',
                    }
                }
            } catch (parseError) {
                n8nResult = {
                    success: false,
                    message: 'Envoi du post GMB effectué mais réponse non parsable',
                    error: parseError.message,
                    raw_response: responseText.substring(0, 300),
                }
            }

            console.log('✅ Réponse n8n pour post GMB individuel:', n8nResult)

            return response.json({
                success: true,
                data: n8nResult,
                message: `Post GMB "${post.text?.substring(0, 30)}..." envoyé avec succès vers n8n`,
                post: {
                    id: post.id,
                    title: post.text?.substring(0, 50) + '...',
                    client: post.client,
                    status: post.status,
                },
                notion_config: {
                    instance: notionConfig.instance,
                    database_id: notionConfig.databaseId?.substring(0, 8) + '...',
                },
                debug: {
                    webhook_url: n8nWebhookUrl,
                    response_status: n8nResponse.status,
                    content_type: contentType,
                },
            })
        } catch (error) {
            console.error('🚨 Erreur envoi post GMB individuel vers n8n:', error)

            return response.status(500).json({
                success: false,
                message: "Erreur lors de l'envoi du post GMB vers n8n",
                error: error.message,
                debug: {
                    webhook_url: process.env.N8N_WEBHOOK_URL || 'Non configurée',
                    timestamp: new Date().toISOString(),
                    post_id: params.id,
                },
            })
        }
    }
    async sendPostsToN8n({ response, auth }: HttpContext) {
        try {
            console.log('🚀 SEND GMB POSTS TO N8N - Utilisateur connecté:', {
                id: auth.user?.id,
                email: auth.user?.email,
                username: auth.user?.username,
            })

            // S'assurer qu'un utilisateur est connecté
            await auth.check()
            const currentUser = auth.user!

            // Récupération de la configuration Notion de l'utilisateur connecté
            const notionConfig = await this.getUserNotionConfig(auth)

            // Vérifier que l'utilisateur a un notion_id
            if (!currentUser.notionId) {
                return response.status(400).json({
                    success: false,
                    message:
                        "Votre compte n'est pas lié à Notion. Veuillez configurer votre notion_id.",
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

            console.log(
                `🚀 Envoi de ${postsToGenerate.length} posts GMB vers n8n pour l'utilisateur ${currentUser.username}`
            )

            // Préparer les données en utilisant la fonction utilitaire unifiée
            const gmbPostsData = postsToGenerate.map((post) => this.formatPostForN8n(post, currentUser))

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
                console.log("🔐 Token d'authentification ajouté")
            }

            // 🎯 Utiliser la fonction unifiée pour créer les données webhook (format tableau)
            const webhookData = this.createN8nWebhookData(gmbPostsData, currentUser, notionConfig, false)

            console.log('🎆 Envoi vers n8n:', {
                url: n8nWebhookUrl,
                total_posts: webhookData.total_posts,
                user: currentUser.username,
                notion_instance: notionConfig.instance,
                summary: webhookData.summary,
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
                user_notion_id: currentUser.notionId, // Utiliser notionId
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
                message: "Erreur lors de l'envoi des posts GMB vers n8n",
                error: error.message,
                debug: {
                    webhook_url: process.env.N8N_WEBHOOK_URL || 'Non configurée',
                    timestamp: new Date().toISOString(),
                },
            })
        }
    }
}
