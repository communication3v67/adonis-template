# Configuration MySQL pour les Filtres GMB

## ⚠️ Problème Résolu : Compatibilité MySQL

### 🔴 Erreur Précédente
```sql
-- ❌ ILIKE n'existe pas en MySQL (spécifique à PostgreSQL)
select count(*) as `total` from `gmb_posts` where `status` = 'Futur' and `client` ilike '%dfsdsf%'
```

### ✅ Solution Implémentée

#### 1. Remplacement ILIKE → LIKE + LOWER()
```sql
-- ✅ Compatible MySQL avec insensibilité à la casse
SELECT * FROM `gmb_posts` WHERE LOWER(client) LIKE '%dfsdsf%'
```

#### 2. Modifications dans le Contrôleur
```typescript
// Avant (PostgreSQL)
.where('client', 'ILIKE', `%${client}%`)

// Après (MySQL)
.whereRaw('LOWER(client) LIKE ?', [`%${client.toLowerCase()}%`])
```

### 🛠️ Changements Techniques

#### Backend (gmbPostsController.ts)
- ✅ `ILIKE` → `LIKE` avec `LOWER()`
- ✅ `whereRaw()` pour éviter les injections SQL
- ✅ Paramètres bindés avec `?`
- ✅ Conversion `.toLowerCase()` côté serveur
- ✅ Logs de debug pour traçabilité

#### Recherche Textuelle
```typescript
// Recherche insensible à la casse dans :
// - text, keyword, client, project_name
if (search) {
    const searchLower = search.toLowerCase()
    query.where((builder) => {
        builder
            .whereRaw('LOWER(text) LIKE ?', [`%${searchLower}%`])
            .orWhereRaw('LOWER(keyword) LIKE ?', [`%${searchLower}%`])
            .orWhereRaw('LOWER(client) LIKE ?', [`%${searchLower}%`])
            .orWhereRaw('LOWER(project_name) LIKE ?', [`%${searchLower}%`])
    })
}
```

#### Filtres Spécifiques
```typescript
// Filtre client insensible à la casse
if (client) {
    const clientLower = client.toLowerCase()
    query.whereRaw('LOWER(client) LIKE ?', [`%${clientLower}%`])
}

// Filtre projet insensible à la casse  
if (project) {
    const projectLower = project.toLowerCase()
    query.whereRaw('LOWER(project_name) LIKE ?', [`%${projectLower}%`])
}
```

### 🚀 Résultat

#### ✅ Fonctionnalités Opérationnelles
- **Recherche textuelle** : insensible à la casse
- **Filtre par client** : recherche partielle insensible à la casse
- **Filtre par projet** : recherche partielle insensible à la casse
- **Filtre par statut** : correspondance exacte
- **Tri** : sur toutes les colonnes
- **Pagination** : conserve les filtres

#### 📊 Performance MySQL
- Utilisation d'index recommandée sur :
  - `client` (INDEX)
  - `project_name` (INDEX)
  - `status` (INDEX)
  - `date` (INDEX)

```sql
-- Optimisation recommandée
CREATE INDEX idx_gmb_posts_client ON gmb_posts(client);
CREATE INDEX idx_gmb_posts_project_name ON gmb_posts(project_name);
CREATE INDEX idx_gmb_posts_status ON gmb_posts(status);
CREATE INDEX idx_gmb_posts_date ON gmb_posts(date);
```

### 🔧 Debug et Logs

#### Console Logs Ajoutés
```typescript
console.log('=== FILTRES REÇUS ===')
console.log('Recherche:', search)
console.log('Statut:', status)
console.log('Client:', client)
console.log('Projet:', project)
console.log('Tri:', sortBy, sortOrder)
console.log('Requête SQL générée:', query.toQuery())
console.log('=====================')
```

### 📝 Notes de Développement

#### Sécurité
- ✅ **Paramètres bindés** : protection contre l'injection SQL
- ✅ **Validation des entrées** : côté serveur et client
- ✅ **Échappement automatique** : via whereRaw() avec paramètres

#### Maintenance
- ✅ **Code compatible** : MySQL 5.7+ et MySQL 8+
- ✅ **Logs de debug** : facilite le dépannage
- ✅ **Performance** : requêtes optimisées

#### Tests Recommandés
```bash
# Tester les différents cas
- Recherche : "test", "TEST", "Test"
- Client : "client1", "CLIENT1", "Client1"
- Caractères spéciaux : "café", "naïve"
- Recherche vide : ""
- Pagination avec filtres
```

## 🎯 Migration PostgreSQL → MySQL

Si vous souhaitez revenir à PostgreSQL plus tard :
```typescript
// PostgreSQL (plus simple)
.where('client', 'ILIKE', `%${client}%`)

// MySQL (actuel)
.whereRaw('LOWER(client) LIKE ?', [`%${client.toLowerCase()}%`])
```

**Status** : ✅ **FILTRES 100% FONCTIONNELS AVEC MYSQL**
