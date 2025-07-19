import { useCallback, useRef } from 'react'

/**
 * Hook pour debouncer les mises à jour optimistes rapides
 */
export const useDebouncedOptimisticUpdates = () => {
    const pendingUpdatesRef = useRef<Map<number, any>>(new Map())
    const timeoutRef = useRef<NodeJS.Timeout>()

    const debouncedUpdate = useCallback((postId: number, updateData: any, applyUpdate: (data: any) => void) => {
        // Stocker la mise à jour en attente
        pendingUpdatesRef.current.set(postId, updateData)

        // Annuler le timeout précédent
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Programmer l'application des mises à jour
        timeoutRef.current = setTimeout(() => {
            const updates = Array.from(pendingUpdatesRef.current.entries())
            pendingUpdatesRef.current.clear()

            // Appliquer toutes les mises à jour en une fois
            updates.forEach(([id, data]) => {
                applyUpdate(data)
            })

            console.log(`🔄 ${updates.length} mises à jour debouncées appliquées`)
        }, 100) // 100ms de debounce

    }, [])

    return { debouncedUpdate }
}
