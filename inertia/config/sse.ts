/**
 * Configuration des délais SSE côté client
 */

export const SSE_CLIENT_CONFIG = {
  // Délai avant rafraîchissement après réception d'un événement SSE (en millisecondes)  
  REFRESH_DELAY: 100, // 100ms pour un rafraîchissement quasi-instantané
  
  // Délai de reconnexion SSE en cas d'erreur (délai initial en millisecondes)
  RECONNECT_DELAY: 1000, // 1 seconde
  
  // Nombre maximum de tentatives de reconnexion
  MAX_RECONNECT_ATTEMPTS: 5,
} as const

console.log('⚙️ Configuration SSE Client:', SSE_CLIENT_CONFIG)
