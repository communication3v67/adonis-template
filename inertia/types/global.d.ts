/**
 * Extensions globales pour l'application
 */

declare global {
    interface Window {
        /**
         * Timestamp de la dernière mise à jour SSE reçue
         * Utilisé pour la synchronisation et la protection contre les conflits
         */
        lastSSEUpdate: number
    }
}

export {}
