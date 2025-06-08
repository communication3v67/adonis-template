import { HttpContext } from '@adonisjs/core/http'

export default class WebhooksController {
  /**
   * Teste la connexion au webhook n8n
   */
  async testN8nConnection({ response }: HttpContext) {
    try {
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
      const n8nAuthToken = process.env.N8N_AUTH_TOKEN
      
      if (!n8nWebhookUrl) {
        return response.status(400).json({
          success: false,
          message: 'URL du webhook n8n non configurée',
          help: 'Ajoutez N8N_WEBHOOK_URL dans votre fichier .env',
        })
      }

      // Test simple avec données de test
      const testData = {
        source: 'adonis-gmb-test',
        test: true,
        timestamp: new Date().toISOString(),
      }

      console.log('Test de connexion n8n:', n8nWebhookUrl)

      // Headers avec authentification optionnelle
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      if (n8nAuthToken) {
        headers['Authorization'] = `Bearer ${n8nAuthToken}`
        console.log('🔐 Test avec authentification')
      } else {
        console.log('🔓 Test sans authentification')
      }

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testData),
      })

      const contentType = n8nResponse.headers.get('content-type')
      const status = n8nResponse.status
      
      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        return response.status(400).json({
          success: false,
          message: `Webhook n8n inaccessible (${status})`,
          error: errorText.substring(0, 500),
          debug: {
            url: n8nWebhookUrl,
            status,
            content_type: contentType,
          },
        })
      }

      // Tentative de lecture JSON
      let result
      try {
        result = await n8nResponse.json()
      } catch (e) {
        const text = await n8nResponse.text()
        return response.json({
          success: false,
          message: 'Webhook n8n accessible mais retourne du HTML/XML au lieu de JSON',
          help: 'Vérifiez que votre workflow n8n retourne du JSON avec un nœud "Respond to Webhook"',
          debug: {
            url: n8nWebhookUrl,
            status,
            content_type: contentType,
            response_preview: text.substring(0, 300),
          },
        })
      }

      return response.json({
        success: true,
        message: 'Connexion n8n OK',
        data: result,
        debug: {
          url: n8nWebhookUrl,
          status,
          content_type: contentType,
        },
      })

    } catch (error) {
      console.error('Erreur test n8n:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors du test de connexion n8n',
        error: error.message,
      })
    }
  }

  /**
   * Envoie des données vers n8n et retourne la réponse de Notion
   */
  async sendToN8n({ request, response }: HttpContext) {
    try {
      const operationData = request.only(['id', 'title', 'url', 'created_time', 'last_edited_time', 'properties'])
      
      // URL de votre webhook n8n
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
      const n8nAuthToken = process.env.N8N_AUTH_TOKEN
      
      if (!n8nWebhookUrl) {
        throw new Error('URL du webhook n8n non configurée (N8N_WEBHOOK_URL)')
      }
      
      console.log('📤 Envoi vers n8n:', { url: n8nWebhookUrl, data: operationData })

      // Headers d'authentification
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }

      // Ajouter le token d'authentification si configuré
      if (n8nAuthToken) {
        headers['Authorization'] = `Bearer ${n8nAuthToken}`
        console.log('🔐 Token d\'authentification ajouté')
      } else {
        console.warn('⚠️ Aucun token d\'authentification configuré (N8N_AUTH_TOKEN)')
      }

      // Préparer les données optimisées pour n8n
      const optimizedData = {
        // Métadonnées de la requête
        source: 'adonis-gmb',
        timestamp: new Date().toISOString(),
        
        // Données principales de la page Notion
        notion_page: {
          id: operationData.id,
          title: operationData.title,
          url: operationData.url,
          created_time: operationData.created_time,
          last_edited_time: operationData.last_edited_time,
        },
        
        // Propriétés Notion complètes (format brut pour flexibilité)
        notion_properties: operationData.properties,
        
        // Données extraites et simplifiées pour faciliter l'usage dans n8n
        extracted_data: {
          entreprise: operationData.properties?.['Nom de l\'entreprise']?.formula?.string || null,
          etat: operationData.properties?.['État']?.status?.name || null,
          referenceurs: operationData.properties?.['Référenceurs']?.relation || [],
          spreadsheet_id: operationData.properties?.['ID Spreadsheet (GMB)']?.formula?.string || null,
          nombre_posts: operationData.properties?.['Nombre de posts à générer']?.number || null,
          mot_cle_objectif: operationData.properties?.['Mot-clé objectif']?.formula?.string || null,
          location_id: operationData.properties?.['LocationID (GMB)']?.rollup?.array || [],
          // Ajoutez d'autres champs selon vos besoins
        }
      }

      console.log('🎯 Données optimisées envoyées vers n8n:', {
        ...optimizedData,
        notion_properties: '[OBJECT_COMPLET]' // Log simplifié pour éviter trop de verbosité
      })

      // Envoi vers n8n
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(optimizedData),
      })

      console.log('📡 Statut réponse n8n:', n8nResponse.status)
      console.log('📡 Headers réponse:', Object.fromEntries(n8nResponse.headers.entries()))

      if (!n8nResponse.ok) {
        // Lire le contenu de la réponse pour plus d'infos
        const errorText = await n8nResponse.text()
        console.error('❌ Erreur n8n (texte):', errorText.substring(0, 500))
        throw new Error(`Erreur n8n: ${n8nResponse.status} - ${n8nResponse.statusText}`)
      }

      // Vérifier le Content-Type de la réponse
      const contentType = n8nResponse.headers.get('content-type')
      console.log('📄 Content-Type de la réponse:', contentType)
      
      // Lecture de la réponse
      const responseText = await n8nResponse.text()
      console.log('📥 Réponse brute de n8n:', responseText.substring(0, 500))
      
      let n8nResult
      try {
        // Tentative de parsing JSON
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          n8nResult = JSON.parse(responseText)
        } else {
          // Si ce n'est pas du JSON, on considère que c'est un succès mais on retourne le texte
          console.warn('⚠️ Réponse n8n non-JSON, traitement comme texte')
          n8nResult = {
            success: true,
            message: 'Réponse reçue de n8n (format non-JSON)',
            raw_response: responseText,
            content_type: contentType,
            notice: 'Cette réponse n\'est pas au format JSON. Ajoutez un nœud "Respond to Webhook" à votre workflow n8n.',
          }
        }
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError)
        // Si le parsing JSON échoue, on retourne quand même une réponse
        n8nResult = {
          success: false,
          message: 'Réponse n8n non parsable en JSON',
          error: parseError.message,
          raw_response: responseText.substring(0, 500),
          help: 'Vérifiez que votre workflow n8n retourne du JSON valide avec un nœud "Respond to Webhook"',
        }
      }
      
      console.log('✅ Réponse reçue de n8n/Notion:', n8nResult)
      
      // Retourner la réponse de n8n (qui contient les données de Notion)
      return response.json({
        success: true,
        data: n8nResult,
        message: 'Données envoyées avec succès vers n8n et traitées par Notion',
        debug: {
          webhook_url: n8nWebhookUrl,
          response_status: n8nResponse.status,
          content_type: contentType,
        },
      })

    } catch (error) {
      console.error('🚨 Erreur webhook n8n:', error)
      
      // Retourner une erreur plus détaillée
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi vers n8n',
        error: error.message,
        debug: {
          webhook_url: process.env.N8N_WEBHOOK_URL || 'Non configurée',
          timestamp: new Date().toISOString(),
        },
      })
    }
  }
}