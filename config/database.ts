import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
    connection: 'mysql',
    connections: {
        mysql: {
            client: 'mysql2',
            connection: {
                host: env.get('DB_HOST'),
                port: env.get('DB_PORT'),
                user: env.get('DB_USER'),
                password: env.get('DB_PASSWORD'),
                database: env.get('DB_DATABASE'),
            },
            migrations: {
                naturalSort: true,
                paths: ['database/migrations'],
            },
        },
    },
    // Configuration globale pour préserver les noms de colonnes
    prettyPrintDebugQueries: true,
})

export default dbConfig
