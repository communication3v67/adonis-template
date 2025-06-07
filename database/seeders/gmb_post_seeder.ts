import GmbPost from '#models/gmb_post'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
    async run() {
        await GmbPost.create({
            status: 'Publié', // Statut
            text: 'Découvrez notre nouveau produit !', // Text
            date: DateTime.now(), // Date
            image_url: 'https://example.com/image.png', // URL de l'image
            link_url: 'https://example.com', // URL du lien
            keyword: 'lancement', // Mot-clé
            client: 'Société X', // Client
            project_name: 'Projet Alpha', // Nom du projet
            location_id: 'loc_123456789', // Location ID
            account_id: 'acc_987654321', // Account ID
            notion_id: 'notion_456789123', // Notion ID
        })
    }
}
