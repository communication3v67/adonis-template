# Guide de Debug pour l'erreur webhook

## 🐛 Diagnostic de l'erreur `home.tsx:152`

Cette erreur provient généralement de l'une de ces causes :

### 1. **Problème de CSRF Token**
```javascript
// Vérifiez que le token CSRF est présent
console.log('CSRF Token:', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'))
```

### 2. **URL de route incorrecte**
```javascript
// Vérifiez que la route `/webhook/n8n` est accessible
fetch('/webhook/n8n', { method: 'GET' }) // Devrait retourner 405 Method Not Allowed
```

### 3. **Problème d'authentification**
La route webhook nécessite une authentification. Assurez-vous d'être connecté.

### 4. **Erreur serveur**
Vérifiez les logs AdonisJS dans votre terminal.

## 🔧 Étapes de debug

### Étape 1 : Test simple
```bash
# Dans votre terminal AdonisJS, vérifiez les logs quand vous cliquez sur le bouton
node ace serve --watch
```

### Étape 2 : Test direct de la route
Ouvrez la console de votre navigateur et testez :

```javascript
// Test de base
fetch('/webhook/test-n8n')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Étape 3 : Vérification des variables d'environnement
Dans votre fichier `.env`, vérifiez :
```env
N8N_WEBHOOK_URL=https://votre-vraie-url-n8n.com/webhook/votre-id
# N8N_AUTH_TOKEN=optionnel
```

### Étape 4 : Test complet
```javascript
// Test complet dans la console du navigateur
const testWebhook = async () => {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    console.log('CSRF Token:', csrfToken)
    
    const response = await fetch('/webhook/n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken || ''
      },
      body: JSON.stringify({
        id: 'test-page-id',
        title: 'Test Page',
        url: 'https://test.com',
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString(),
        properties: {}
      })
    })
    
    console.log('Statut:', response.status)
    const result = await response.text()
    console.log('Réponse:', result)
    
    try {
      const json = JSON.parse(result)
      console.log('JSON parsé:', json)
    } catch (e) {
      console.log('Pas du JSON, réponse brute:', result)
    }
    
  } catch (error) {
    console.error('Erreur complète:', error)
  }
}

// Exécuter le test
testWebhook()
```

## 📝 Solutions courantes

### Si erreur 401 (Unauthorized)
```bash
# Vérifiez que vous êtes connecté à votre application
# Redémarrez votre serveur AdonisJS
```

### Si erreur 404 (Not Found)
```bash
# Vérifiez vos routes dans start/routes/web.ts
# Redémarrez votre serveur AdonisJS
```

### Si erreur 500 (Server Error)
```bash
# Vérifiez les logs AdonisJS
# Vérifiez que N8N_WEBHOOK_URL est configuré dans .env
```

### Si erreur de parsing JSON
```bash
# Votre serveur retourne du HTML au lieu de JSON
# Vérifiez vos logs AdonisJS pour voir l'erreur exacte
```

## 🚀 Test rapide

Exécutez ceci dans la console de votre navigateur :

```javascript
console.log('=== DIAGNOSTIC WEBHOOK ===')
console.log('URL actuelle:', window.location.href)
console.log('CSRF Token:', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 'MANQUANT')
console.log('User agent:', navigator.userAgent)

// Test de base
fetch('/webhook/test-n8n')
  .then(async response => {
    console.log('Statut test n8n:', response.status)
    const text = await response.text()
    console.log('Réponse test n8n:', text)
    return text
  })
  .catch(error => {
    console.error('Erreur test n8n:', error)
  })
```

Cette commande vous donnera des informations précises sur ce qui ne fonctionne pas.
