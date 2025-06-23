import { Alert, Box, Loader, Portal, Text } from '@mantine/core'
import { useEffect, useRef, useState, useCallback } from 'react'
import { LuExternalLink, LuTriangleAlert } from 'react-icons/lu'

interface ImageHoverPreviewProps {
    imageUrl: string
    children: React.ReactNode
    disabled?: boolean
}

// Static ref to track the currently active preview ID across all instances
const activePreviewId = { current: null as string | null }

export const ImageHoverPreview = ({
    imageUrl,
    children,
    disabled = false,
}: ImageHoverPreviewProps) => {
    // Generate a unique ID for this component instance
    const instanceId = useRef(`preview-${Math.random().toString(36).slice(2)}`).current

    const [showPreview, setShowPreview] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [imageLoaded, setImageLoaded] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isMouseStable, setIsMouseStable] = useState(false)

    // Refs pour les timeouts et la gestion du mouvement
    const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastMousePositionRef = useRef({ x: 0, y: 0 })
    const mouseMoveCountRef = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isMouseInsideRef = useRef(false)

    // Configuration pour la détection de stabilité
    const STABILITY_DELAY = 400 // Temps d'attente pour considérer la souris comme stable
    const SHOW_DELAY = 600 // Délai avant d'afficher la preview
    const HIDE_DELAY = 150 // Délai avant de cacher la preview
    const MOUSE_MOVE_THRESHOLD = 3 // Seuil de mouvement en pixels pour considérer un "vrai" mouvement

    // Nettoyer tous les timeouts au démontage
    useEffect(() => {
        return () => {
            [showTimeoutRef, hideTimeoutRef, stabilityTimeoutRef].forEach(ref => {
                if (ref.current) {
                    clearTimeout(ref.current)
                    ref.current = null
                }
            })
            
            // Clear activePreviewId if this instance is the active one
            if (activePreviewId.current === instanceId) {
                activePreviewId.current = null
            }
        }
    }, [instanceId])

    // Fonction pour calculer la distance entre deux points
    const calculateDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    }, [])

    // Fonction pour détecter la stabilité de la souris
    const checkMouseStability = useCallback((currentPos: { x: number; y: number }) => {
        const lastPos = lastMousePositionRef.current
        const distance = calculateDistance(lastPos, currentPos)
        
        // Si le mouvement est significatif, reset la stabilité
        if (distance > MOUSE_MOVE_THRESHOLD) {
            setIsMouseStable(false)
            mouseMoveCountRef.current++
            
            // Clear le timeout de stabilité précédent
            if (stabilityTimeoutRef.current) {
                clearTimeout(stabilityTimeoutRef.current)
            }
            
            // Démarrer un nouveau timeout de stabilité
            stabilityTimeoutRef.current = setTimeout(() => {
                if (isMouseInsideRef.current) {
                    setIsMouseStable(true)
                }
            }, STABILITY_DELAY)
        }
        
        lastMousePositionRef.current = currentPos
    }, [calculateDistance])

    // Gestion du mouvement de la souris
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (disabled || !imageUrl || !imageUrl.trim()) return

        const rect = e.currentTarget.getBoundingClientRect()
        const newPosition = {
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
        }
        
        setMousePosition(newPosition)
        checkMouseStability({ x: e.clientX, y: e.clientY })
    }, [disabled, imageUrl, checkMouseStability])

    // Gestion de l'entrée de la souris
    const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        if (disabled || !imageUrl || !imageUrl.trim()) return

        isMouseInsideRef.current = true
        mouseMoveCountRef.current = 0

        try {
            // Capturer la position initiale de la souris
            const rect = e.currentTarget.getBoundingClientRect()
            const initialPosition = {
                x: rect.left + rect.width / 2,
                y: rect.bottom + 8,
            }
            
            setMousePosition(initialPosition)
            lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
            
            // Clear les timeouts existants
            if (showTimeoutRef.current) {
                clearTimeout(showTimeoutRef.current)
            }
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current)
            }

            // Démarrer le processus de détection de stabilité
            setIsMouseStable(false)
            stabilityTimeoutRef.current = setTimeout(() => {
                if (isMouseInsideRef.current) {
                    setIsMouseStable(true)
                }
            }, STABILITY_DELAY)

        } catch (error) {
            console.error('Erreur dans handleMouseEnter:', error)
        }
    }, [disabled, imageUrl])

    // Gestion de la sortie de la souris
    const handleMouseLeave = useCallback(() => {
        isMouseInsideRef.current = false
        
        try {
            // Clear tous les timeouts
            [showTimeoutRef, hideTimeoutRef, stabilityTimeoutRef].forEach(ref => {
                if (ref.current) {
                    clearTimeout(ref.current)
                    ref.current = null
                }
            })

            // Reset les états
            setIsMouseStable(false)
            mouseMoveCountRef.current = 0

            // Cacher la preview avec un léger délai pour éviter les clignotements
            hideTimeoutRef.current = setTimeout(() => {
                setShowPreview(false)
                
                // Clear activePreviewId if this instance is the active one
                if (activePreviewId.current === instanceId) {
                    activePreviewId.current = null
                }
            }, HIDE_DELAY)

        } catch (error) {
            console.error('Erreur dans handleMouseLeave:', error)
            setShowPreview(false)
        }
    }, [instanceId])

    // Effect pour gérer l'affichage de la preview quand la souris devient stable
    useEffect(() => {
        if (isMouseStable && isMouseInsideRef.current && !showPreview) {
            // Clear le timeout de hide si il existe
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current)
                hideTimeoutRef.current = null
            }

            showTimeoutRef.current = setTimeout(() => {
                if (isMouseInsideRef.current && isMouseStable) {
                    // Vérifier si une autre preview est active
                    if (activePreviewId.current && activePreviewId.current !== instanceId) {
                        return // Ne pas afficher si une autre preview est active
                    }

                    // Set this instance as the active preview
                    activePreviewId.current = instanceId
                    setShowPreview(true)
                    setIsLoading(true)
                    setHasError(false)
                    setImageLoaded(false)
                    setErrorMessage('')

                    // Timeout de sécurité pour les images qui ne chargent pas
                    setTimeout(() => {
                        if (isLoading && !imageLoaded && !hasError) {
                            handleImageError()
                        }
                    }, 10000)
                }
            }, SHOW_DELAY)
        }
    }, [isMouseStable, showPreview, instanceId, isLoading, imageLoaded, hasError])

    const handleImageLoad = useCallback(() => {
        try {
            setIsLoading(false)
            setImageLoaded(true)
            setHasError(false)
        } catch (error) {
            console.error("Erreur lors du chargement de l'image:", error)
            handleImageError()
        }
    }, [])

    const handleImageError = useCallback(() => {
        try {
            setIsLoading(false)
            setImageLoaded(false)
            setHasError(true)

            // Déterminer le type d'erreur basé sur l'URL
            if (!imageUrl || !imageUrl.trim()) {
                setErrorMessage('URL vide')
            } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                setErrorMessage('URL invalide - doit commencer par http:// ou https://')
            } else {
                setErrorMessage('Image inaccessible ou introuvable')
            }
        } catch (error) {
            console.error('Erreur dans handleImageError:', error)
            setErrorMessage('Erreur inconnue')
        }
    }, [imageUrl])

    const handleOpenInNewTab = useCallback((e: React.MouseEvent) => {
        try {
            e.stopPropagation()
            e.preventDefault()
            if (imageUrl) {
                window.open(imageUrl, '_blank', 'noopener,noreferrer')
            }
        } catch (error) {
            console.error("Erreur lors de l'ouverture de l'onglet:", error)
        }
    }, [imageUrl])

    return (
        <>
            <Box
                ref={containerRef}
                style={{ position: 'relative', display: 'inline-block' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
            >
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{ display: 'inline-block' }}
                >
                    {children}
                </div>
            </Box>

            {/* Utiliser un Portal pour afficher la prévisualisation au niveau de la page */}
            {showPreview && activePreviewId.current === instanceId && (
                <Portal>
                    <Box
                        style={{
                            position: 'fixed',
                            left: mousePosition.x,
                            top: mousePosition.y,
                            zIndex: 9999,
                            backgroundColor: 'white',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                            minWidth: '200px',
                            maxWidth: '400px',
                            pointerEvents: 'none',
                            // Animations fluides améliorées
                            opacity: showPreview ? 1 : 0,
                            transform: showPreview
                                ? 'translateX(-50%) translateY(0) scale(1)'
                                : 'translateX(-50%) translateY(-10px) scale(0.9)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            // Amélioration visuelle
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    >
                        {/* Flèche pointant vers l'icône - avec shadow améliorée */}
                        <Box
                            style={{
                                position: 'absolute',
                                top: '-6px',
                                left: '50%',
                                width: '12px',
                                height: '12px',
                                backgroundColor: 'white',
                                border: '1px solid #e9ecef',
                                borderBottom: 'none',
                                borderRight: 'none',
                                transform: 'translateX(-50%) rotate(45deg)',
                                filter: 'drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1))',
                            }}
                        />

                        {isLoading && (
                            <Box style={{ textAlign: 'center', padding: '20px' }}>
                                <Loader size="sm" />
                                <Text size="xs" c="dimmed" mt="xs">
                                    Chargement...
                                </Text>
                            </Box>
                        )}

                        {hasError && (
                            <Alert
                                icon={<LuTriangleAlert size={16} />}
                                color="orange"
                                variant="light"
                                styles={{
                                    root: {
                                        padding: '8px 12px',
                                        border: 'none',
                                        backgroundColor: '#fff7ed',
                                    },
                                    message: { fontSize: '12px' },
                                }}
                            >
                                <Text size="xs" fw={500} c="orange.8">
                                    Erreur de chargement
                                </Text>
                                <Text size="xs" c="orange.6">
                                    {errorMessage}
                                </Text>
                                <Text
                                    size="xs"
                                    c="blue.6"
                                    style={{
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        marginTop: '4px',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onClick={handleOpenInNewTab}
                                >
                                    <LuExternalLink
                                        size={12}
                                        style={{ marginRight: '4px', verticalAlign: 'middle' }}
                                    />
                                    Ouvrir dans un nouvel onglet
                                </Text>
                            </Alert>
                        )}

                        {imageLoaded && (
                            <Box>
                                <img
                                    src={imageUrl}
                                    alt="Prévisualisation"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        width: 'auto',
                                        height: 'auto',
                                        borderRadius: '4px',
                                        display: 'block',
                                        margin: '0 auto',
                                        // Amélioration visuelle
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                                <Text
                                    size="xs"
                                    c="blue"
                                    style={{
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        marginTop: '8px',
                                        textAlign: 'center',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onClick={handleOpenInNewTab}
                                >
                                    <LuExternalLink
                                        size={12}
                                        style={{ marginRight: '4px', verticalAlign: 'middle' }}
                                    />
                                    Ouvrir dans un nouvel onglet
                                </Text>
                            </Box>
                        )}

                        {/* Image cachée pour le chargement */}
                        {showPreview && imageUrl && (
                            <img
                                src={imageUrl}
                                alt=""
                                style={{ display: 'none' }}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                        )}
                    </Box>
                </Portal>
            )}
        </>
    )
}
