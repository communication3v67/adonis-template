/**
 * Démarrage du service de polling pour détecter les changements en base
 */

import { PostPollingService } from '#services/post_polling_service'

console.log('🚀 Initialisation du service de polling des posts GMB')

// Démarrer le polling avec un intervalle de 10 secondes (très réactif pour développement)
const pollingService = PostPollingService.getInstance()
pollingService.start(10000) // 10 secondes pour développement (attention à la charge)

// Arrêter proprement le service à la fermeture de l'application
process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du service de polling')
    pollingService.stop()
})

process.on('SIGINT', () => {
    console.log('🛑 Arrêt du service de polling')
    pollingService.stop()
})
