#!/bin/bash

echo "🔄 Migration et test des relations User <-> GmbPost"

# 1. Exécuter les migrations
echo "🚀 Exécution des migrations..."
node ace migration:run

# 2. Créer des données de test
echo "🌱 Création des données de test..."
node ace db:seed

# 3. Tester les relations
echo "🧪 Test des relations..."
node ace test:relations

echo "✅ Terminé ! Votre structure User <-> GmbPost est maintenant opérationnelle."
echo ""
echo "Vous pouvez maintenant utiliser :"
echo "  - User.query().preload('gmbPosts')"
echo "  - GmbPost.query().where('user_id', userId)"
echo "  - select count(*) as total from gmb_posts where user_id = 1"
