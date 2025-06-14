// Script de debug pour tester la configuration Notion
require('dotenv').config();

console.log('🔍 Test de la configuration Notion...\n');

// Vérifier les variables d'environnement
console.log('=== VARIABLES D\'ENVIRONNEMENT ===');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? process.env.NOTION_API_KEY.substring(0, 20) + '...' : 'NON DÉFINIE');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID || 'NON DÉFINIE');
console.log('NOTION_API_KEY_2:', process.env.NOTION_API_KEY_2 ? process.env.NOTION_API_KEY_2.substring(0, 20) + '...' : 'NON DÉFINIE');
console.log('NOTION_DATABASE_ID_2:', process.env.NOTION_DATABASE_ID_2 || 'NON DÉFINIE');

// Test direct de la logique
console.log('\n=== TEST LOGIQUE DIRECTE ===');

function testGetNotionConfigForUser(userDatabaseId) {
    console.log(`\n🧪 Test avec userDatabaseId: "${userDatabaseId}"`);
    
    if (userDatabaseId === 'database_2') {
        const config = {
            apiKey: process.env.NOTION_API_KEY_2,
            databaseId: process.env.NOTION_DATABASE_ID_2,
            instance: 2,
        };

        console.log('  ✅ Condition database_2 respectée');
        console.log('  📝 Config générée:', {
            apiKey: config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'NON DÉFINIE',
            databaseId: config.databaseId || 'NON DÉFINIE',
            instance: config.instance
        });

        if (!config.apiKey || !config.databaseId) {
            console.log('  ❌ Variables manquantes pour database_2, retour à database_1');
            return {
                apiKey: process.env.NOTION_API_KEY,
                databaseId: process.env.NOTION_DATABASE_ID,
                instance: 1,
            };
        }

        return config;
    }

    // Par défaut, utiliser la première instance
    console.log('  ⚠️ Utilisation de la configuration par défaut (database_1)');
    return {
        apiKey: process.env.NOTION_API_KEY,
        databaseId: process.env.NOTION_DATABASE_ID,
        instance: 1,
    };
}

// Tests
const test1 = testGetNotionConfigForUser('database_1');
const test2 = testGetNotionConfigForUser('database_2');
const test3 = testGetNotionConfigForUser(null);
const test4 = testGetNotionConfigForUser('unknown');

console.log('\n=== RÉSULTATS FINAUX ===');
console.log('database_1:', test1);
console.log('database_2:', test2);
console.log('null:', test3);
console.log('unknown:', test4);
