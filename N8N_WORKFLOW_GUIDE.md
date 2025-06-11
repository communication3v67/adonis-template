# Configuration n8n pour l'intégration avec AdonisJS

## 🎯 Objectif

Créer un workflow n8n qui :
1. **Reçoit** les données depuis votre application AdonisJS
2. **Traite** ces données avec Notion
3. **Retourne** une réponse JSON structurée

## 📋 Structure recommandée du workflow n8n

### 1. Nœud "Webhook" (déclencheur)
- **URL** : Copiez l'URL générée et ajoutez-la dans votre `.env`
- **Method** : POST
- **Response** : Immediately
- **Options** : Activez "Raw Body"

### 2. Nœud "Set" (optionnel, pour traitement des données)
```javascript
// Extraire et formater les données reçues
{
  "notion_page_id": "{{ $json.operation.id }}",
  "page_title": "{{ $json.operation.title }}",
  "source": "{{ $json.source }}",
  "timestamp": "{{ $json.timestamp }}"
}
```

### 3. Nœud "Notion" (traitement principal)
- **Operation** : Selon vos besoins (Get Page, Update Page, etc.)
- **Configuration** : Utilisez les données du nœud précédent

### 4. **OBLIGATOIRE** : Nœud "Respond to Webhook"
C'est LE nœud crucial qui manque probablement dans votre configuration !

#### Configuration du nœud "Respond to Webhook" :

**Response Mode** : "Text"
**Response Body** :
```json
{
  "success": true,
  "message": "Page Notion traitée avec succès",
  "original_data": {
    "page_id": "{{ $('Webhook').first().json.operation.id }}",
    "page_title": "{{ $('Webhook').first().json.operation.title }}"
  },
  "notion_response": {
    "id": "{{ $('Notion').first().json.id }}",
    "last_edited_time": "{{ $('Notion').first().json.last_edited_time }}",
    "properties": "{{ JSON.stringify($('Notion').first().json.properties) }}"
  },
  "processed_at": "{{ new Date().toISOString() }}"
}
```

**Headers** :
```json
{
  "Content-Type": "application/json"
}
```

## 🔧 Exemple complet de workflow

```
[Webhook] → [Set Data] → [Notion] → [Respond to Webhook]
```

### Données reçues par le webhook :
```json
{
  "source": "adonis-gmb",
  "operation": {
    "id": "page-notion-id",
    "title": "Titre de la page",
    "url": "https://notion.so/...",
    "created_time": "2025-06-08T...",
    "last_edited_time": "2025-06-08T...",
    "properties": {}
  },
  "timestamp": "2025-06-08T..."
}
```

### Réponse attendue (depuis "Respond to Webhook") :
```json
{
  "success": true,
  "message": "Page Notion traitée avec succès",
  "original_data": {
    "page_id": "page-notion-id",
    "page_title": "Titre de la page"
  },
  "notion_response": {
    "id": "page-notion-id",
    "last_edited_time": "2025-06-08T...",
    "properties": "..."
  },
  "processed_at": "2025-06-08T..."
}
```

## ⚠️ Points importants

1. **Le nœud "Respond to Webhook" est OBLIGATOIRE** - sans lui, n8n retourne du HTML
2. **Headers Content-Type** : Définissez `application/json` dans les headers de la réponse
3. **Structure JSON** : Respectez la syntaxe JSON (guillemets doubles, pas de virgules finales)
4. **Gestion d'erreurs** : Ajoutez un nœud "Respond to Webhook" même en cas d'erreur

## 🐛 Debugging

### Si vous recevez encore du HTML :
1. Vérifiez que le nœud "Respond to Webhook" est bien connecté
2. Assurez-vous qu'il n'y a pas d'erreur dans le workflow qui l'empêche d'être atteint
3. Testez le workflow directement dans n8n

### Logs utiles :
- Consultez les logs de votre workflow n8n
- Regardez les logs dans votre console AdonisJS
- Utilisez le bouton "Tester n8n" dans votre interface

## 🚀 Test

Une fois configuré :
1. **Activez** votre workflow n8n
2. **Testez** avec le bouton "Tester n8n" dans votre application
3. **Vérifiez** les logs des deux côtés

Si le test passe, vos webhooks fonctionneront parfaitement !
