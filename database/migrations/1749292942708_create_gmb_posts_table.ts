import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'gmb_posts'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id')
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
            table.timestamp('created_at', { useTz: true }).notNullable()
            table.timestamp('updated_at', { useTz: true }).notNullable()
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
