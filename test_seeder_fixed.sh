#!/bin/bash

echo "🧪 Test du seeder corrigé"
echo "========================"

# 1. Fresh migration
echo "🧹 1. Fresh migration..."
node ace migration:fresh

echo ""

# 2. Test du seeder des posts
echo "📝 2. Test du seeder posts..."
node ace db:seed --files=database/seeders/gmbPostSeeder.ts

echo ""

# 3. Vérification des résultats
echo "🔍 3. Vérification..."
node ace repl -e "
try {
  const { default: User } = await import('#models/user')
  const { default: GmbPost } = await import('#models/gmbPost')
  
  const userCount = await User.query().count('* as total')
  const postCount = await GmbPost.query().count('* as total')
  const postsWithUser = await GmbPost.query().whereNotNull('user_id').count('* as total')
  
  console.log('📊 Résultats:')
  console.log(\`  👥 Utilisateurs: \${userCount[0].total}\`)
  console.log(\`  📝 Posts totaux: \${postCount[0].total}\`)
  console.log(\`  ✅ Posts avec user_id: \${postsWithUser[0].total}\`)
  
  // Test de la requête qui posait problème
  const result = await GmbPost.query().where('user_id', 1).count('* as total')
  console.log(\`  🔢 Posts pour user_id=1: \${result[0].total}\`)
  
  console.log('\\n🎉 Succès ! Le seeder fonctionne correctement.')
} catch (error) {
  console.log('❌ Erreur:', error.message)
}
process.exit(0)
"

echo ""
echo "✅ Test terminé !"
