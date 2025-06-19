import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'gmb_posts'

    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('city').nullable()
        })
    }

    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('city')
        })
    }
}
