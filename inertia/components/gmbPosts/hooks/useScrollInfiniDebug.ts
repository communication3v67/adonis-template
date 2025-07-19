import { useEffect, useRef } from 'react'

/**
 * Hook de debug pour monitor les re-renders et changements d'état
 */
export const useScrollInfiniDebug = (
    posts: any[],
    hasMore: boolean,
    isLoading: boolean,
    filters: any
) => {
    const renderCountRef = useRef(0)
    const lastPropsRef = useRef<any>({})

    useEffect(() => {
        renderCountRef.current += 1
        const currentProps = {
            postsLength: posts.length,
            hasMore,
            isLoading,
            filtersHash: JSON.stringify(filters)
        }

        const changed = Object.keys(currentProps).filter(key => 
            currentProps[key] !== lastPropsRef.current[key]
        )

        if (changed.length > 0) {
            console.group(`🔍 [Render #${renderCountRef.current}] Scroll Infini Debug`)
            console.log('Props changées:', changed)
            console.log('Détails des changements:')
            changed.forEach(key => {
                console.log(`  ${key}:`, lastPropsRef.current[key], '→', currentProps[key])
            })
            console.log('État actuel:')
            console.log('  Posts:', posts.length)
            console.log('  HasMore:', hasMore)
            console.log('  IsLoading:', isLoading)
            console.groupEnd()
        }

        lastPropsRef.current = currentProps
    })

    return {
        renderCount: renderCountRef.current,
        triggerDebugLog: () => {
            console.log('📊 État Scroll Infini:', {
                renderCount: renderCountRef.current,
                postsLength: posts.length,
                hasMore,
                isLoading,
                filters
            })
        }
    }
}
