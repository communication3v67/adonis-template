import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'gmb_posts'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')

            // Relation avec l'utilisateur
            table.integer('user_id').unsigned().notNullable()
            table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')

            table.string('status').notNullable()
            table.text('text').notNullable()
            table.timestamp('date').notNullable()
            table.string('image_url').nullable()
            table.string('link_url').nullable()
            table.string('keyword').nullable()
            table.string('client').nullable()
            table.string('project_name').nullable()
            table.string('location_id').nullable()
            table.string('account_id').nullable()
            table.string('notion_id').nullable()

            // Timestamps
            table.timestamp('created_at', { useTz: true }).notNullable()
            table.timestamp('updated_at', { useTz: true }).notNullable()

            // Index pour optimiser les requêtes
            table.index(['user_id'])
            table.index(['status'])
            table.index(['created_at'])
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
