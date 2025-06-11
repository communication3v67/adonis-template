#!/bin/bash

echo "🔍 Test avec logs détaillés pour debug des filtres Notion corrigés"
echo "================================================================="

# Test avec l'ID utilisateur réel que vous avez montré
echo "📝 Test avec l'ID utilisateur Notion réel: 01734bf3-2bab-4b20-9b5f-dfe697342be8"
node ace repl -e "
try {
  const { NotionService } = await import('#services/notion_service')
  
  console.log('🔧 Initialisation du service Notion...')
  const notionService = new NotionService()
  
  console.log('\\n=== TEST 1: Debug de la base de données ===')
  await notionService.getDatabaseInfo()
  
  console.log('\\n=== TEST 2: Sans filtre utilisateur ===')
  const allPages = await notionService.getPages()
  console.log(\`\\n📊 Résultat: \${allPages.length} pages trouvées\\n\`)
  
  console.log('\\n=== TEST 3: Avec filtre utilisateur ===')
  const userNotionId = '01734bf3-2bab-4b20-9b5f-dfe697342be8'
  const userPages = await notionService.getPagesForUser(userNotionId)
  console.log(\`\\n📊 Résultat pour utilisateur \${userNotionId}: \${userPages.length} pages\\n\`)
  
  console.log('\\n=== ANALYSE COMPARATIVE ===')
  console.log(\`Pages sans filtre: \${allPages.length}\`)
  console.log(\`Pages avec filtre utilisateur: \${userPages.length}\`)
  
  if (allPages.length > 0 && userPages.length === 0) {
    console.log('\\n⚠️ PROBLÈME DÉTECTÉ:')
    console.log('Il y a des pages \"À générer\" mais aucune n\\'est assignée à cet utilisateur')
    
    console.log('\\n🔍 VÉRIFICATION DES RÉFÉRENCEURS:')
    allPages.forEach((page, index) => {
      console.log(\`Page \${index + 1}: \${page.title}\`)
      console.log(\`  Référenceur: \${page.referenceur || 'Aucun'}\`)
      console.log(\`  Status: \${page.status}\`)
    })
  }
  
  if (userPages.length > 0) {
    console.log('\\n✅ SUCCÈS: Pages trouvées pour l\\'utilisateur')
    userPages.forEach((page, index) => {
      console.log(\`Page \${index + 1}: \${page.title}\`)
      console.log(\`  Référenceur: \${page.referenceur}\`)
      console.log(\`  Status: \${page.status}\`)
    })
  }
  
} catch (error) {
  console.log('❌ Erreur générale:', error.message)
  console.log('Stack:', error.stack)
}
process.exit(0)
"

echo ""
echo "✅ Test terminé !"
