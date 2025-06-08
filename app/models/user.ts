import GmbPost from '#models/gmbPost'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email', 'username'],
    passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
    static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare username: string

    @column()
    declare email: string

    @column({ serializeAs: null })
    declare password: string

    @column()
    declare avatar: string | null

    @column()
    declare notionId: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime | null

    // Relations
    @hasMany(() => GmbPost, {
        foreignKey: 'user_id'
    })
    declare gmbPosts: HasMany<typeof GmbPost>

    // Méthodes utilitaires
    public get fullName() {
        return this.username
    }

    public get initials() {
        return this.username
            .split(' ')
            .map((name) => name.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
    }

    // Méthode pour obtenir l'avatar ou les initiales
    public getAvatarOrInitials() {
        return this.avatar || this.initials
    }

    // Méthode pour compter les posts de l'utilisateur
    public async getPostsCount() {
        const result = await GmbPost.query().where('user_id', this.id).count('* as total')
        return Number(result[0].total)
    }

    // Méthode pour obtenir les posts récents
    public async getRecentPosts(limit: number = 5) {
        return await this.related('gmbPosts').query().orderBy('created_at', 'desc').limit(limit)
    }

    // Méthode pour obtenir les statistiques de l'utilisateur
    public async getStats() {
        const postsQuery = this.related('gmbPosts').query()

        const [totalPosts, publishedPosts, draftPosts, scheduledPosts] = await Promise.all([
            postsQuery.clone().count('* as total'),
            postsQuery.clone().where('status', 'published').count('* as total'),
            postsQuery.clone().where('status', 'draft').count('* as total'),
            postsQuery.clone().where('status', 'scheduled').count('* as total'),
        ])

        return {
            totalPosts: Number(totalPosts[0].total),
            publishedPosts: Number(publishedPosts[0].total),
            draftPosts: Number(draftPosts[0].total),
            scheduledPosts: Number(scheduledPosts[0].total),
        }
    }
}
