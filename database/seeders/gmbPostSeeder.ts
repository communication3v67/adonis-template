import GmbPost from '#models/gmbPost'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // S'assurer qu'il y a au moins un utilisateur
    let user = await User.first()
    
    if (!user) {
      console.log('🔧 Aucun utilisateur trouvé, création d\'un utilisateur par défaut...')
      
      user = await User.create({
        username: 'Admin Default',
        email: 'admin@default.com',
        password: 'password123',
        avatar: null,
        notionId: null,
      })
      
      console.log(`✅ Utilisateur créé: ${user.email} (ID: ${user.id})`)
    } else {
      console.log(`👤 Utilisateur trouvé: ${user.username} (ID: ${user.id})`)
    }

    console.log(`📝 Assignation des posts à: ${user.username} (ID: ${user.id})`)

    const postsData = [
      {
        status: 'published',
        text: 'Découvrez notre nouveau produit innovant !',
        date: DateTime.now().minus({ days: 1 }),
        image_url: 'https://example.com/image1.png',
        link_url: 'https://example.com/produit1',
        keyword: 'lancement',
        client: 'Société X',
        project_name: 'Projet Alpha',
        location_id: 'loc_123456789',
        account_id: 'acc_987654321',
        notion_id: 'notion_456789123',
      },
      {
        status: 'scheduled',
        text: 'Notre équipe vous prépare quelque chose d\'exceptionnel...',
        date: DateTime.now().plus({ days: 1 }),
        image_url: 'https://example.com/image2.png',
        link_url: 'https://example.com/produit2',
        keyword: 'teasing',
        client: 'Entreprise Y',
        project_name: 'Projet Beta',
        location_id: 'loc_234567890',
        account_id: 'acc_876543210',
        notion_id: 'notion_567890234',
      },
      {
        status: 'published',
        text: 'Retour sur notre événement de la semaine dernière',
        date: DateTime.now().minus({ days: 7 }),
        image_url: 'https://example.com/image3.png',
        link_url: 'https://example.com/evenement',
        keyword: 'evenement',
        client: 'Association Z',
        project_name: 'Projet Gamma',
        location_id: 'loc_345678901',
        account_id: 'acc_765432109',
        notion_id: 'notion_678901345',
      },
      {
        status: 'draft',
        text: 'Annonce spéciale prévue pour le mois prochain',
        date: DateTime.now().plus({ month: 1 }),
        image_url: null,
        link_url: null,
        keyword: 'annonce',
        client: 'Startup ABC',
        project_name: 'Projet Delta',
        location_id: 'loc_456789012',
        account_id: 'acc_654321098',
        notion_id: 'notion_789012456',
      },
      {
        status: 'draft',
        text: 'Contenu à développer pour la campagne de Noël',
        date: DateTime.now().plus({ months: 2 }),
        image_url: null,
        link_url: null,
        keyword: 'noel',
        client: 'Boutique XYZ',
        project_name: 'Campagne Noël',
        location_id: 'loc_567890123',
        account_id: 'acc_543210987',
        notion_id: 'notion_890123567',
      }
    ]

    // CRÉER LES POSTS
    let processedCount = 0
    
    for (const postData of postsData) {
      // Vérifier si le post existe déjà
      const existingPost = await GmbPost.query()
        .where('text', postData.text)
        .where('client', postData.client)
        .first()
      
      let post
      if (existingPost) {
        // Mettre à jour le post existant
        post = await existingPost.merge({
          ...postData,
          user_id: user.id
        }).save()
        console.log(`🔄 Post mis à jour: "${post.text.substring(0, 40)}..." (${post.status})`)
      } else {
        // Créer un nouveau post
        post = await GmbPost.create({
          ...postData,
          user_id: user.id
        })
        console.log(`✅ Post créé: "${post.text.substring(0, 40)}..." (${post.status})`)
      }
      
      processedCount++
    }

    // Vérifier et corriger les posts orphelins (sans user_id)
    const orphanPosts = await GmbPost.query().whereNull('user_id')
    if (orphanPosts.length > 0) {
      await GmbPost.query()
        .whereNull('user_id')
        .update({ user_id: user.id })
      
      console.log(`🔧 ${orphanPosts.length} posts orphelins assignés à ${user.username}`)
    }

    // Afficher les statistiques finales
    const totalPosts = await user.getPostsCount()
    const stats = await user.getStats()
    
    console.log(`\n✅ Seeding des posts terminé !`)
    console.log(`📊 Posts traités: ${processedCount}`)
    console.log(`📊 Total posts pour ${user.username}: ${totalPosts}`)
    console.log(`📊 Répartition: ${stats.publishedPosts} publiés, ${stats.draftPosts} brouillons, ${stats.scheduledPosts} programmés`)
  }
}
