# 🔄 Configuration Multi-instances Notion

## 📋 Modifications apportées

Votre application supporte maintenant **deux instances Notion distinctes** basées sur l'utilisateur connecté.

## ⚙️ Configuration .env

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration Notion - Instance 1 (par défaut)
NOTION_API_KEY=secret_your_first_notion_api_key
NOTION_DATABASE_ID=your_first_database_id

# Configuration Notion - Instance 2
NOTION_API_KEY_2=secret_your_second_notion_api_key
NOTION_DATABASE_ID_2=your_second_database_id
```

## 🗄️ Modèle User mis à jour

Le modèle `User` a maintenant une propriété `notionDatabaseId` qui détermine quelle instance utiliser :

- `database_1` → Utilise `NOTION_API_KEY` + `NOTION_DATABASE_ID`
- `database_2` → Utilise `NOTION_API_KEY_2` + `NOTION_DATABASE_ID_2`

## 🌱 Seeder mis à jour

Le seeder assigne automatiquement :

- **admin@test.com** → `database_1`
- **user@test.com** → `database_2`
- **Utilisateurs existants** → Assignation automatique alternée

## 🔧 Comment ça fonctionne

### 1. **Connexion utilisateur**
```typescript
// L'utilisateur se connecte
const user = auth.user!
console.log(user.notionDatabaseId) // "database_1" ou "database_2"
```

### 2. **Service Notion dynamique**
```typescript
// Le service s'initialise avec la bonne configuration
const notionService = new NotionService(user.notionDatabaseId)
// Utilise automatiquement la bonne API key et database ID
```

### 3. **Logs de débogage**
```bash
📡 NotionService initialisé avec:
  databaseType: database_2
  databaseId: 12345678...
  hasApiKey: true

👤 Utilisateur connecté: user@test.com (Database: database_2)
Pages Notion récupérées: 5 pour la base database_2
```

## 🚀 Déployment

### 1. **Mettre à jour la base de données**
```bash
# Exécuter le seeder pour ajouter les notionDatabaseId
node ace db:seed --files="user_seeder.ts"
```

### 2. **Vérifier les variables d'environnement**
```bash
# Assurez-vous que ces variables sont définies
echo $NOTION_API_KEY
echo $NOTION_DATABASE_ID
echo $NOTION_API_KEY_2
echo $NOTION_DATABASE_ID_2
```

### 3. **Redémarrer l'application**
```bash
node ace serve --watch
```

## 🧪 Test

### Test utilisateur 1 (database_1)
1. Connectez-vous avec `admin@test.com`
2. Vérifiez les logs : `Database: database_1`
3. Les pages affichées viennent de la première instance Notion

### Test utilisateur 2 (database_2) 
1. Connectez-vous avec `user@test.com`
2. Vérifiez les logs : `Database: database_2`
3. Les pages affichées viennent de la seconde instance Notion

## 🔍 Debug

Les logs vous indiqueront :
- Quel utilisateur est connecté
- Quelle base de données Notion est utilisée
- Combien de pages sont récupérées

```bash
👤 Utilisateur connecté: admin@test.com (Database: database_1)
📡 NotionService initialisé avec: database_1
Pages Notion récupérées: 3 pour la base database_1
```

## ⚠️ Points importants

1. **Pas de migration** : Utilise les colonnes existantes
2. **Rétrocompatibilité** : Les utilisateurs sans `notionDatabaseId` utilisent `database_1`
3. **Sécurité** : Chaque utilisateur ne voit que sa base de données
4. **Performance** : Une seule instance du service par requête

Votre application fonctionne maintenant avec **deux instances Notion distinctes** ! 🎉
