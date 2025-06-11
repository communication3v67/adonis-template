#!/bin/bash

echo "🚀 Setup complet de l'application GMB avec relations User <-> GmbPost"
echo "===================================================================="
echo ""

# Étape 1: Nettoyer et migrer
echo "🧹 1. Nettoyage et migration de la base de données..."
node ace migration:fresh

echo ""
echo "✅ Migrations terminées. Vérification de la structure..."

# Vérifier que user_id existe dans gmb_posts
node ace repl -e "
try {
  const { default: Database } = await import('@adonisjs/lucid/database')
  const result = await Database.rawQuery('DESCRIBE gmb_posts')
  const userIdExists = result[0].some(col => col.Field === 'user_id')
  
  if (userIdExists) {
    console.log('✅ Colonne user_id trouvée dans gmb_posts')
  } else {
    console.log('❌ Colonne user_id MANQUANTE dans gmb_posts')
    console.log('Colonnes disponibles:')
    result[0].forEach(col => console.log(\`  - \${col.Field}\`))
  }
} catch (error) {
  console.log('❌ Erreur lors de la vérification:', error.message)
}
process.exit(0)
"

echo ""

# Étape 2: Créer les données de test
echo "🌱 2. Création des données de test..."

# D'abord créer un utilisateur
echo "👤 Création d'un utilisateur..."
node ace repl -e "
try {
  const { default: User } = await import('#models/user')
  const user = await User.firstOrCreate(
    { email: 'admin@test.com' },
    {
      username: 'Admin Test',
      email: 'admin@test.com', 
      password: 'password123',
      avatar: null,
      notionId: null
    }
  )
  console.log(\`✅ Utilisateur: \${user.username} (ID: \${user.id})\`)
} catch (error) {
  console.log('❌ Erreur création utilisateur:', error.message)
}
process.exit(0)
"

echo ""

# Ensuite créer des posts
echo "📝 Création des posts..."
node ace repl -e "
try {
  const { default: User } = await import('#models/user')
  const { default: GmbPost } = await import('#models/gmbPost')
  const { DateTime } = await import('luxon')
  
  const user = await User.first()
  if (!user) {
    console.log('❌ Aucun utilisateur trouvé')
    process.exit(1)
  }
  
  const posts = await GmbPost.createMany([
    {
      user_id: user.id,
      status: 'published',
      text: 'Premier post de test',
      date: DateTime.now(),
      keyword: 'test',
      client: 'Client Test',
      project_name: 'Projet Test'
    },
    {
      user_id: user.id,
      status: 'draft', 
      text: 'Deuxième post en brouillon',
      date: DateTime.now().plus({ days: 1 }),
      keyword: 'draft',
      client: 'Client Test',
      project_name: 'Projet Test'
    }
  ])
  
  console.log(\`✅ \${posts.length} posts créés\`)
} catch (error) {
  console.log('❌ Erreur création posts:', error.message)
  console.log(error.stack)
}
process.exit(0)
"

echo ""

# Étape 3: Tester les relations
echo "🧪 3. Test des relations..."
node ace test:relations

echo ""

# Étape 4: Test de la requête SQL problématique
echo "🔢 4. Test de la requête SQL qui posait problème..."
node ace repl -e "
try {
  const { default: Database } = await import('@adonisjs/lucid/database')
  const result = await Database.rawQuery('SELECT COUNT(*) as total FROM gmb_posts WHERE user_id = 1')
  console.log('✅ Requête SQL réussie:', result[0][0])
} catch (error) {
  console.log('❌ Erreur requête SQL:', error.message)
}
process.exit(0)
"

echo ""
echo "🎉 Setup terminé ! Votre système User <-> GmbPost est opérationnel."
