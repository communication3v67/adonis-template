import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { SnakeCaseNamingStrategy } from '../naming_strategies/snake_case_naming_strategy.js'
import User from './user.js'

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
}
