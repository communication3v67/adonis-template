import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { SnakeCaseNamingStrategy } from '../naming_strategies/snake_case_naming_strategy.js'

export default class GmbPost extends BaseModel {
    // Spécifier explicitement le nom de la table
    public static table = 'gmb_posts'

    // Utiliser notre naming strategy personnalisée
    public static namingStrategy = new SnakeCaseNamingStrategy()

    @column({ isPrimary: true })
    declare id: number

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
    declare location_id: string

    @column()
    declare account_id: string

    @column()
    declare notion_id: string

    @column.dateTime({ autoCreate: true, columnName: 'created_at' })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
    declare updatedAt: DateTime
}
