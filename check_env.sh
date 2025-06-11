#!/bin/bash

echo "🔍 Vérification des variables d'environnement Notion"
echo "=================================================="

echo ""
echo "📋 Instance 1 (database_1):"
echo "  NOTION_API_KEY: ${NOTION_API_KEY:0:20}..." 
echo "  NOTION_DATABASE_ID: $NOTION_DATABASE_ID"

echo ""
echo "📋 Instance 2 (database_2):"
echo "  NOTION_API_KEY_2: ${NOTION_API_KEY_2:0:20}..." 
echo "  NOTION_DATABASE_ID_2: $NOTION_DATABASE_ID_2"

echo ""
echo "🔧 Vérifications:"

# Vérifier si les variables sont définies
if [ -z "$NOTION_API_KEY" ]; then
    echo "  ❌ NOTION_API_KEY est manquante"
else
    echo "  ✅ NOTION_API_KEY est définie"
fi

if [ -z "$NOTION_DATABASE_ID" ]; then
    echo "  ❌ NOTION_DATABASE_ID est manquante"
else
    echo "  ✅ NOTION_DATABASE_ID est définie"
fi

if [ -z "$NOTION_API_KEY_2" ]; then
    echo "  ❌ NOTION_API_KEY_2 est manquante"
else
    echo "  ✅ NOTION_API_KEY_2 est définie"
fi

if [ -z "$NOTION_DATABASE_ID_2" ]; then
    echo "  ❌ NOTION_DATABASE_ID_2 est manquante"
else
    echo "  ✅ NOTION_DATABASE_ID_2 est définie"
fi

# Vérifier le format des API keys
if [[ $NOTION_API_KEY == secret_* ]]; then
    echo "  ✅ NOTION_API_KEY a le bon format (commence par 'secret_')"
else
    echo "  ❌ NOTION_API_KEY n'a pas le bon format (doit commencer par 'secret_')"
fi

if [[ $NOTION_API_KEY_2 == secret_* ]]; then
    echo "  ✅ NOTION_API_KEY_2 a le bon format (commence par 'secret_')"
else
    echo "  ❌ NOTION_API_KEY_2 n'a pas le bon format (doit commencer par 'secret_')"
fi

echo ""
echo "🚀 Pour redémarrer l'application avec les nouvelles variables:"
echo "   node ace serve --watch"
