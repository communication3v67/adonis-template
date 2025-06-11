#!/bin/bash

echo "🔄 Recréation de la base de données avec la nouvelle colonne notion_database_id"

# 1. Supprimer et recréer les tables
echo "📋 Suppression des tables existantes..."
node ace migration:rollback --force

echo "📋 Application des migrations..."
node ace migration:run

echo "🌱 Exécution des seeders..."
node ace db:seed

echo "✅ Base de données mise à jour avec succès !"
echo ""
echo "🎯 La colonne notion_database_id a été ajoutée à la table users"
echo "👥 Les utilisateurs ont été créés avec leurs bases de données assignées"
echo ""
echo "Pour vérifier :"
echo "  - admin@test.com → database_1"
echo "  - user@test.com → database_2"
