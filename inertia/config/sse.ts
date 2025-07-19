/**
 * Configuration des délais SSE côté client avec gestion adaptative
 */

export const SSE_CLIENT_CONFIG = {
  // Délais adaptatifs selon le type d'action SSE - OPTIMISÉS pour édition fluide
  REFRESH_DELAYS: {
    created: 0,      // Nouveau post - immédiat avec mise à jour optimiste
    updated: 0,      // Post modifié - immédiat avec SSE uniquement
    deleted: 100,    // Post supprimé - délai minimal pour animation
    status_changed: 0, // Changement de statut - immédiat
  },
  
  // Délai de reconnexion SSE en cas d'erreur (délai initial en millisecondes)
  RECONNECT_DELAY: 1000, // 1 seconde
  
  // Nombre maximum de tentatives de reconnexion - RENFORCÉ
  MAX_RECONNECT_ATTEMPTS: 15, // Augmenté de 10 à 15 pour plus de résilience
  
  // Délai de protection contre les conflits utilisateur/SSE - RENFORCÉ
  USER_ACTION_PROTECTION: 10000, // 10 secondes pour protection ultra-robuste (augmenté de 8000)
  
  // Délai de protection pour l'édition inline - RENFORCÉ
  INLINE_EDIT_PROTECTION: 6000, // 6 secondes pour éviter tous conflits (augmenté de 3000)
  
  // Délai de protection pour scroll infini - RENFORCÉ
  SCROLL_PROTECTION: 5000, // 5 secondes (augmenté de 3000)
  
  // Délai de stabilisation après action utilisateur - RENFORCÉ
  STABILIZATION_DELAY: 3000, // 3 secondes pour réseau lent (augmenté de 2000)
  
  // NOUVEAU : Protection adaptative selon conditions réseau - AMÉLIORÉE
  ADAPTIVE_PROTECTION: {
    FAST_NETWORK: 2000,    // Réseau rapide (augmenté de 1500)
    NORMAL_NETWORK: 5000,  // Réseau normal (augmenté de 3000)
    SLOW_NETWORK: 10000,   // Réseau lent (augmenté de 5000)
  },
  
  // NOUVEAU : Gestion des erreurs réseau avec retry automatique
  NETWORK_RECOVERY: {
    MAX_RETRIES: 3,
    RETRY_DELAYS: [1000, 2000, 4000], // Backoff exponentiel : 1s, 2s, 4s
    TIMEOUT: 15000, // 15 secondes de timeout
    ABORT_AFTER: 30000, // Abandon après 30 secondes
  },
  
  // NOUVEAU : Seuils de détection performance
  PERFORMANCE_THRESHOLDS: {
    FAST_REQUEST: 200,     // < 200ms = réseau rapide
    NORMAL_REQUEST: 1000,  // < 1s = réseau normal
    SLOW_REQUEST: 2000,    // > 2s = réseau lent
  }
} as const

console.log('⚙️ Configuration SSE Client Optimisée:', SSE_CLIENT_CONFIG)

// Types globaux pour la protection d'édition
declare global {
  interface Window {
    _isInlineEditing: boolean
    lastSSEUpdate: number
    lastUserAction: number
  }
}
