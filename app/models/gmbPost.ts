import { BaseModel, column, belongsTo, afterCreate, afterUpdate, afterDelete, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { SnakeCaseNamingStrategy } from '../naming_strategies/snake_case_naming_strategy.js'
import User from './user.js'
import { calculatePrice } from '../utils/pricing_calculator.js'

export default class GmbPost extends BaseModel {
    // Spécifier explicitement le nom de la table
    public static table = 'gmb_posts'

    // Utiliser notre naming strategy personnalisée
    public static namingStrategy = new SnakeCaseNamingStrategy()

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare user_id: number

    @column()
    declare status: string

    @column()
    declare text: string

    @column.dateTime()
    declare date: DateTime

    @column()
    declare image_url: string

    @column()
    declare link_url: string

    @column()
    declare keyword: string

    @column()
    declare client: string

    @column()
    declare project_name: string

    @column()
    declare city: string

    @column()
    declare location_id: string

    @column()
    declare account_id: string

    @column()
    declare notion_id: string

    // Colonnes IA et coûts
    @column()
    declare input_tokens: number | null

    @column()
    declare output_tokens: number | null

    @column()
    declare model: string | null

    @column()
    declare price: number | null

    @column.dateTime({ autoCreate: true, columnName: 'created_at' })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
    declare updatedAt: DateTime

    @belongsTo(() => User, {
        foreignKey: 'user_id'
    })
    declare user: BelongsTo<typeof User>

    // Méthodes utilitaires
    public async getAuthor() {
        await this.load('user')
        return this.user
    }

    public get isPublished() {
        return this.status === 'published'
    }

    public get isDraft() {
        return this.status === 'draft'
    }

    public get isScheduled() {
        return this.status === 'scheduled'
    }

    // Méthode pour obtenir un extrait du texte
    public getExcerpt(length: number = 100) {
        if (this.text.length <= length) {
            return this.text
        }
        return this.text.substring(0, length) + '...'
    }

    // Méthode pour vérifier si le post a une image
    public get hasImage() {
        return !!this.image_url
    }

    // Méthode pour vérifier si le post a un lien
    public get hasLink() {
        return !!this.link_url
    }

    // Méthodes utilitaires pour l'IA et les coûts
    public get hasAiData() {
        return !!(this.input_tokens || this.output_tokens || this.model || this.price)
    }

    public get totalTokens() {
        return (this.input_tokens || 0) + (this.output_tokens || 0)
    }

    public get tokenRatio() {
        if (!this.input_tokens || !this.output_tokens) return null
        return this.output_tokens / this.input_tokens
    }

    public getFormattedPrice(currency: string = 'EUR') {
        if (!this.price) return null
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 6
        }).format(this.price)
    }

    public get costPerToken() {
        if (!this.price || !this.totalTokens) return null
        return this.price / this.totalTokens
    }

    // Hook pour calculer automatiquement le prix avant la sauvegarde
    @beforeSave()
    public static async calculatePriceBeforeSave(post: GmbPost) {
        // Si on a toutes les données nécessaires, calculer le prix
        if (post.model && post.input_tokens && post.output_tokens) {
            const calculatedPrice = calculatePrice(
                post.model,
                post.input_tokens,
                post.output_tokens
            )
            
            if (calculatedPrice !== null) {
                post.price = calculatedPrice
                console.log(`💰 Prix calculé automatiquement: ${calculatedPrice.toFixed(6)}$ pour le modèle ${post.model}`)
            } else {
                // Modèle non supporté
                post.price = null
                console.log(`⚠️ Modèle non supporté pour le pricing: ${post.model}`)
            }
        } else {
            // Si l'une des données nécessaires manque, mettre le prix à null
            post.price = null
            if (post.model || post.input_tokens || post.output_tokens) {
                console.log(`ℹ️ Données incomplètes pour le calcul du prix - prix mis à null (model: ${post.model}, input: ${post.input_tokens}, output: ${post.output_tokens})`)
            }
        }
    }

    // Hooks pour déclencher des événements SSE
    @afterCreate()
    public static async notifyCreated(post: GmbPost) {
        await GmbPost.broadcastPostEvent(post, 'created')
    }

    @afterUpdate()
    public static async notifyUpdated(post: GmbPost) {
        await GmbPost.broadcastPostEvent(post, 'updated')
    }

    @afterDelete()
    public static async notifyDeleted(post: GmbPost) {
        await GmbPost.broadcastPostEvent(post, 'deleted')
    }

    // Méthode statique pour diffuser les événements SSE
    private static async broadcastPostEvent(post: GmbPost, action: string) {
        try {
            // Import dynamique pour éviter les dépendances circulaires
            const { default: SSEController } = await import('#controllers/sse_controller')
            
            const postData = {
                ...post.serialize(),
                action,
                timestamp: new Date().toISOString()
            }
            
            // Diffuser vers le canal utilisateur
            SSEController.broadcast(`gmb-posts/user/${post.user_id}`, {
                type: 'post_update',
                data: postData
            })
            
            // Diffuser vers le canal post spécifique
            SSEController.broadcast(`gmb-posts/post/${post.id}`, {
                type: 'post_update',
                data: postData
            })
            
            console.log(`📻 SSE Model Hook: ${action} pour post ${post.id} (user ${post.user_id})`)
        } catch (error) {
            console.error('❌ Erreur diffusion SSE depuis model hook:', error)
        }
    }
}
