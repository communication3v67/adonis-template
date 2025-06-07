import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class GmbPost extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare status: string // Statut du post

    @column()
    declare text: string // Texte du post

    @column.dateTime()
    declare date: DateTime // Date du post (attention: pas createdAt !)

    @column()
    declare image_url: string // URL de l'image

    @column()
    declare link_url: string // URL du lien

    @column()
    declare keyword: string // Mot-clé

    @column()
    declare client: string // Client

    @column()
    declare project_name: string // Nom du projet

    @column()
    declare location_id: string // ou number si c'est un entier

    @column()
    declare account_id: string // ou number si c'est un entier

    @column()
    declare notion_id: string // Notion ID

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}
