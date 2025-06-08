# Intégration Webhook n8n

## 🚨 Problème courant : "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"

**Cette erreur signifie que votre webhook n8n retourne du HTML au lieu de JSON.**

### Solutions :

1. **Vérifiez votre URL n8n** : Assurez-vous qu'elle pointe vers un webhook actif
2. **Ajoutez un nœud "Respond to Webhook"** dans votre workflow n8n
3. **Configurez la réponse JSON** dans ce nœud

### Configuration n8n obligatoire :

📝 **Votre workflow n8n DOIT contenir un nœud "Respond to Webhook" à la fin avec :**

```json
{
  "success": true,
  "message": "Données traitées par Notion",
  "notion_data": "{{ $json.your_notion_response }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

## Configuration

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
N8N_WEBHOOK_URL=https://votre-n8n-instance.com/webhook/votre-webhook-id
```

### 2. Workflow n8n

Votre workflow n8n doit être configuré pour :

1. **Recevoir les données** depuis AdonisJS via webhook
2. **Traiter les données** avec Notion
3. **Retourner une réponse** avec les données traitées

#### Format des données envoyées vers n8n :

```json
{
  "source": "adonis-gmb",
  "operation": {
    "id": "page-id",
    "title": "Page Title",
    "url": "https://notion.so/page-url",
    "created_time": "2025-06-08T10:00:00.000Z",
    "last_edited_time": "2025-06-08T10:00:00.000Z",
    "properties": {}
  },
  "timestamp": "2025-06-08T10:00:00.000Z"
}
```

#### Format de réponse attendu de n8n :

```json
{
  "success": true,
  "notion_response": {
    // Données retournées par Notion
  },
  "processed_at": "2025-06-08T10:00:00.000Z"
}
```

## Utilisation

### Test de connexion

1. **Bouton "Tester n8n"** sur la page d'accueil pour vérifier la connexion
2. **Messages explicites** en cas de problème avec votre configuration

### Dans l'interface

1. Allez sur la page d'accueil (`/`)
2. Dans le tableau "Opérations en attente de génération"
3. Cliquez sur le bouton bleu avec l'icône d'envoi pour chaque ligne
4. Une modal s'ouvrira avec la réponse de Notion

### Fonctionnement

1. **Clic sur le bouton** → Envoi des données de la page Notion vers le webhook n8n
2. **n8n traite** → Votre workflow n8n reçoit les données et les traite avec Notion
3. **Réponse affichée** → La réponse de Notion est affichée dans une modal

## Routes ajoutées

- `POST /webhook/n8n` - Endpoint pour envoyer des données vers n8n
- `GET /webhook/test-n8n` - Endpoint pour tester la connexion n8n

## Fichiers modifiés

- `app/controllers/webhooks_controller.ts` - Nouveau contrôleur pour les webhooks
- `start/routes/web.ts` - Ajout des routes webhook
- `inertia/pages/home.tsx` - Ajout du bouton et de la modal
- `.env.example` - Ajout de la variable N8N_WEBHOOK_URL

## Sécurité

- Les routes webhook sont protégées par le middleware d'authentification
- Gestion des erreurs avec messages explicites
- Token CSRF vérifié pour les requêtes

## Debug

Les logs de debug sont visibles dans la console du navigateur et dans les logs AdonisJS :

```bash
# Voir les logs AdonisJS
node ace serve --watch
```
