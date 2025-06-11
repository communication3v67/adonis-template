# 📤 Format JSON optimisé transmis vers n8n

## ✅ Réponse à votre question : OUI !

**Les données Notion sont bien transmises au format JSON optimisé vers votre workflow n8n.**

## 🎯 Format JSON envoyé vers n8n

Voici exactement ce qui est envoyé depuis votre application AdonisJS vers n8n :

```json
{
  "source": "adonis-gmb",
  "timestamp": "2025-06-09T15:30:00.000Z",
  
  "notion_page": {
    "id": "20c9cf91-3d59-8082-85bd-ff093681638c",
    "title": "Sans titre",
    "url": "https://www.notion.so/20c9cf913d59808285bdff093681638c",
    "created_time": "2025-06-08T21:27:00.000Z",
    "last_edited_time": "2025-06-08T21:27:00.000Z"
  },
  
  "notion_properties": {
    "locationID (GMB)": {
      "id": "G}gN",
      "type": "formula",
      "formula": { "type": "string", "string": null }
    },
    "Référenceurs": {
      "id": "I?jM",
      "type": "relation",
      "relation": [{"id": "01734bf3-2bab-4b20-9b5f-dfe697342be8"}],
      "has_more": false
    },
    "État": {
      "id": "lapV",
      "type": "status",
      "status": {
        "id": "MvUr",
        "name": "À générer",
        "color": "gray"
      }
    },
    "ID Spreadsheet (GMB)": {
      "id": "_IzQ",
      "type": "formula",
      "formula": {
        "type": "string",
        "string": "14RyLEwdvVMWrBLK4E4qrzs1ztsNPhpWGc5qRBBZZ3rU"
      }
    }
    // ... toutes les autres propriétés Notion
  },
  
  "extracted_data": {
    "entreprise": null,
    "etat": "À générer",
    "referenceurs": [{"id": "01734bf3-2bab-4b20-9b5f-dfe697342be8"}],
    "spreadsheet_id": "14RyLEwdvVMWrBLK4E4qrzs1ztsNPhpWGc5qRBBZZ3rU",
    "nombre_posts": null,
    "mot_cle_objectif": null,
    "location_id": []
  }
}
```

## 🎉 Avantages de ce format optimisé

### 1. **Triple accès aux données**
- **`notion_page`** : Infos de base faciles d'accès
- **`notion_properties`** : Propriétés complètes pour traitement avancé
- **`extracted_data`** : Données pré-extraites prêtes à l'emploi

### 2. **Usage facile dans n8n**
```javascript
// Dans votre workflow n8n, vous pouvez utiliser :
{{ $json.extracted_data.etat }}              // "À générer"
{{ $json.extracted_data.spreadsheet_id }}    // "14RyLEwdvVMWrBLK4E4qrzs1ztsNPhpWGc5qRBBZZ3rU"
{{ $json.notion_page.title }}                // "Sans titre"
{{ $json.notion_page.url }}                  // URL directe vers Notion
```

### 3. **Flexibilité maximale**
- Accès direct aux valeurs simples via `extracted_data`
- Accès aux propriétés complètes pour traitement complexe
- Métadonnées de traçabilité

## 🔧 Personnalisation du format

Pour ajouter d'autres champs extraits, modifiez la section `extracted_data` dans le contrôleur :

```typescript
extracted_data: {
  // Champs existants
  entreprise: operationData.properties?.['Nom de l\'entreprise']?.formula?.string || null,
  etat: operationData.properties?.['État']?.status?.name || null,
  
  // Ajoutez vos nouveaux champs ici
  date_creation: operationData.properties?.['Date']?.date?.start || null,
  url_liee: operationData.properties?.['URL liée']?.rollup?.array?.[0]?.url || null,
  // etc...
}
```

## 📊 Logs de débogage

Quand vous envoyez un webhook, vous verrez dans vos logs AdonisJS :

```bash
📤 Envoi vers n8n: { url: "https://votre-n8n...", data: {...} }
🎯 Données optimisées envoyées vers n8n: { source: "adonis-gmb", ... }
📡 Statut réponse n8n: 200
📥 Réponse brute de n8n: { "success": true, ... }
✅ Réponse reçue de n8n/Notion: { ... }
```

## 🎯 Dans votre workflow n8n

Vous recevrez ces données dans le premier nœud de votre workflow. Utilisez les expressions n8n pour y accéder :

- `{{ $json.extracted_data.etat }}` → État de la page
- `{{ $json.extracted_data.spreadsheet_id }}` → ID du spreadsheet
- `{{ $json.notion_page.url }}` → URL de la page Notion
- `{{ $json.notion_properties['État'].status.name }}` → Accès direct aux propriétés

## ✅ Confirmation

**OUI, les données Notion sont parfaitement transmises au format JSON optimisé vers votre workflow n8n !** 🎉

Elles sont même **mieux organisées** qu'avant avec trois niveaux d'accès selon vos besoins dans n8n.
