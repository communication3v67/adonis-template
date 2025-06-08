#!/bin/bash

echo "🔄 Résolution du problème user_id manquant"
echo "=========================================="

# 1. Vérifier l'état des migrations
echo "📋 1. État actuel des migrations:"
node ace migration:status

echo ""
echo "🚀 2. Exécution des migrations..."

# 2. Exécuter toutes les migrations
node ace migration:run

echo ""
echo "🔍 3. Vérification de la structure de la table gmb_posts..."

# 3. Vérifier que user_id existe maintenant
node ace repl -e "
const { default: Database } = await import('@adonisjs/lucid/database')
const result = await Database.rawQuery('DESCRIBE gmb_posts')
console.log('Colonnes de gmb_posts:')
result[0].forEach(col => console.log(\`- \${col.Field} (\${col.Type})\`))
process.exit(0)
"

echo ""
echo "✅ Migrations terminées. Vous pouvez maintenant exécuter les seeders."
