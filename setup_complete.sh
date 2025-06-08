#!/bin/bash

echo "🔄 Starting complete migration and setup process..."

# 1. Vérifier l'état actuel des migrations
echo "📋 Checking current migration status..."
node ace migration:status

# 2. Exécuter toutes les migrations
echo "🚀 Running migrations..."
node ace migration:run

# 3. Vérifier que la structure est correcte
echo "🔍 Checking database structure..."
node ace repl --allow-console-output

# 4. Si nécessaire, assigner les posts existants à un utilisateur
echo "👤 Checking if posts need user assignment..."
node ace assign:posts

# 5. Tester une requête simple
echo "✅ Testing user posts query..."
node ace repl --allow-console-output

echo "🎉 Setup complete!"
