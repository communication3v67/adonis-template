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
        
        /**
         * Flag pour indiquer qu'une édition inline est en cours
         * Utilisé pour éviter les conflits avec les mises à jour SSE
         */
        _isInlineEditing: boolean
        
        /**
         * Flag pour indiquer qu'une édition via modal est en cours
         * Utilisé pour éviter les conflits avec les mises à jour SSE
         */
        _isModalEditing: boolean
    }
}

export {}
