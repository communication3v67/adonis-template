import { ActionIcon, Badge, Box, Group, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { useState, useEffect, useRef, useCallback } from 'react'
import { LuCheck, LuSettings, LuX, LuImage, LuLink, LuRotateCcw } from 'react-icons/lu'
import { notifications } from '@mantine/notifications'
import { GmbPost, FilterOptions } from '../../types'
import { STATUS_COLORS } from '../../utils/constants'
import { truncateText, formatDateForEdit } from '../../utils/formatters'
import { SSE_CLIENT_CONFIG } from '../../../../config/sse'
import { InlineCreatableSelect } from '../CreatableSelect'
import { ImageHoverPreview } from '../ImageHoverPreview'
import { useOptimisticUpdates } from '../../hooks/useOptimisticUpdates'

interface InlineEditCellProps {
    value: string
    field: string
    post: GmbPost
    type?: 'text' | 'textarea' | 'select' | 'datetime-local' | 'number'
    options?: { value: string; label: string }[]
    filterOptions?: FilterOptions
    displayValue?: string // Valeur à afficher (différente de la valeur d'édition)
    onSave: (postId: number, field: string, value: string) => Promise<void>
    onOptimisticUpdate?: (postId: number, updates: Partial<GmbPost>) => void // NOUVEAU: mise à jour optimiste
}

export const InlineEditCell = ({
    value,
    field,
    post,
    type = 'text',
    options = [],
    filterOptions,
    displayValue,
    onSave,
    onOptimisticUpdate, // NOUVEAU
}: InlineEditCellProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(() => {
        // Formatage spécial pour les dates en mode édition
        if (field === 'date' && value) {
            return formatDateForEdit(value)
        }
        return value || ''
    })
    const [isSaving, setIsSaving] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const [isRetrying, setIsRetrying] = useState(false)
    const [customOptions, setCustomOptions] = useState<{ [key: string]: { value: string; label: string }[] }>({})
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
    
    // Protection contre les mises à jour SSE pendant l'édition
    const editStartTimeRef = useRef<number>(0)
    const lastSSEProtectionRef = useRef<number>(0)
    const originalValueRef = useRef(value) // NOUVEAU : Stocker la valeur originale pour rollback correct
    
    // NOUVEAU : Référence pour forcer la mise à jour de editValue
    const valueUpdateRef = useRef<string | null>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            if (type === 'text' || type === 'textarea') {
                inputRef.current.select()
            }
        }
    }, [isEditing, type])

    // NOUVEAU : Mise à jour FORCÉE de editValue quand la valeur change (correctif SSE)
    useEffect(() => {
        // Toujours mettre à jour originalValueRef avec la nouvelle valeur
        originalValueRef.current = value
        
        // Si on n'est PAS en cours d'édition, mettre à jour editValue immédiatement
        if (!isEditing) {
            if (field === 'date' && value) {
                const formattedDate = formatDateForEdit(value)
                setEditValue(formattedDate)
                console.log(`🔄 Date ${field} mise à jour pour post ${post.id}: "${value}" -> "${formattedDate}"`)
            } else {
                setEditValue(value || '')
                console.log(`🔄 Valeur ${field} mise à jour pour post ${post.id}: "${value}"`)
            }
        } else {
            // Si on est en édition, stocker la nouvelle valeur pour l'utiliser après annulation
            valueUpdateRef.current = value
            console.log(`🚫 Édition en cours pour ${field} post ${post.id} - nouvelle valeur en attente: "${value}"`)
        }
    }, [value, field, post.id, isEditing])

    // NOUVEAU : Détection des erreurs réseau
    const isNetworkError = (error: any): boolean => {
        return error.code === 'NETWORK_ERROR' || 
               error.message?.includes('fetch') ||
               error.message?.includes('timeout') ||
               error.name === 'AbortError' ||
               !navigator.onLine
    }
    
    // NOUVEAU : Gestion d'erreurs avec retry automatique
    const handleSaveWithRetry = async (attemptCount = 0): Promise<void> => {
        const maxRetries = SSE_CLIENT_CONFIG.NETWORK_RECOVERY?.MAX_RETRIES || 3
        const retryDelays = SSE_CLIENT_CONFIG.NETWORK_RECOVERY?.RETRY_DELAYS || [1000, 2000, 4000]
        
        if (editValue === value && attemptCount === 0) {
            setIsEditing(false)
            editStartTimeRef.current = 0
            return
        }

        try {
            setIsSaving(true)
            setIsRetrying(attemptCount > 0)
            setRetryCount(attemptCount)
            
            // Marquer le début pour métriques
            const startTime = Date.now()
            
            // ✨ MISE À JOUR OPTIMISTE IMMÉDIATE (seulement au premier essai)
            if (attemptCount === 0 && onOptimisticUpdate) {
                let optimisticUpdate
                if (field === 'date' && editValue) {
                    const date = new Date(editValue)
                    optimisticUpdate = { [field]: date.toISOString() }
                } else {
                    optimisticUpdate = { [field]: editValue }
                }
                
                console.log(`✨ Mise à jour optimiste ${field} pour post ${post.id}:`, optimisticUpdate)
                onOptimisticUpdate(post.id, optimisticUpdate)
            }
            
            // Formatage spécial pour les dates
            let valueToSave = editValue
            if (field === 'date' && editValue) {
                // CORRECTION : Créer une date en respectant le fuseau horaire local
                // puis convertir en ISO pour le serveur
                const localDate = new Date(editValue)
                if (!isNaN(localDate.getTime())) {
                    // Le serveur attend une date ISO, mais on s'assure qu'elle représente
                    // la bonne date/heure locale choisie par l'utilisateur
                    valueToSave = localDate.toISOString()
                    console.log(`📅 Date à sauvegarder: "${editValue}" (local) -> "${valueToSave}" (ISO)`)
                } else {
                    console.error('Date invalide lors de la sauvegarde:', editValue)
                    throw new Error('Format de date invalide')
                }
            }

            await onSave(post.id, field, valueToSave)
            
            // Mesurer performance réseau si disponible
            const responseTime = Date.now() - startTime
            console.log(`✅ Sauvegarde réussie ${field} pour post ${post.id} (${responseTime}ms, tentative ${attemptCount + 1})`)
            
            // Succès !
            setIsEditing(false)
            setRetryCount(0)
            setIsRetrying(false)
            editStartTimeRef.current = 0
            
        } catch (error) {
            console.error(`❌ Erreur sauvegarde ${field} (tentative ${attemptCount + 1}/${maxRetries + 1}):`, error)
            
            // ❌ ROLLBACK CORRECT vers la valeur originale (pas 'value' qui peut avoir changé)
            if (onOptimisticUpdate) {
                const originalValue = originalValueRef.current
                console.log(`🔄 Rollback vers valeur originale pour post ${post.id}:`, originalValue)
                onOptimisticUpdate(post.id, { [field]: originalValue })
            }
            
            // Retry automatique pour erreurs réseau
            if (attemptCount < maxRetries && isNetworkError(error)) {
                const delay = retryDelays[attemptCount] || retryDelays[retryDelays.length - 1]
                console.log(`⏰ Retry dans ${delay}ms (tentative ${attemptCount + 2}/${maxRetries + 1})`)
                
                setTimeout(() => {
                    handleSaveWithRetry(attemptCount + 1)
                }, delay)
            } else {
                // Échec définitif
                setIsRetrying(false)
                setRetryCount(0)
                
                // Afficher erreur utilisateur avec détails
                const errorMessage = isNetworkError(error) 
                    ? `Problème de connexion lors de la sauvegarde de ${field}. Vérifiez votre réseau.`
                    : `Erreur lors de la sauvegarde de ${field}. ${error.message || ''}`
                    
                notifications.show({
                    title: 'Erreur de sauvegarde',
                    message: errorMessage,
                    color: 'red',
                    autoClose: 5000,
                })
                
                // Reset interface vers valeur originale
                const originalValue = originalValueRef.current
                if (field === 'date' && originalValue) {
                    setEditValue(formatDateForEdit(originalValue))
                } else {
                    setEditValue(originalValue || '')
                }
            }
        } finally {
            if (attemptCount === 0 || retryCount === 0) {
                setIsSaving(false)
            }
        }
    }
    
    // Fonction wrapper pour compatibilité
    const handleSave = () => handleSaveWithRetry(0)

    const handleCancel = () => {
        // Vérifier si une nouvelle valeur est en attente (mise à jour SSE pendant édition)
        const pendingValue = valueUpdateRef.current
        if (pendingValue !== null) {
            // Appliquer la valeur mise à jour par SSE
            if (field === 'date' && pendingValue) {
                setEditValue(formatDateForEdit(pendingValue))
            } else {
                setEditValue(pendingValue || '')
            }
            valueUpdateRef.current = null
            console.log(`✨ Valeur SSE appliquée après annulation ${field} pour post ${post.id}: "${pendingValue}"`)
        } else {
            // Remettre la valeur originale avec formatage pour les dates
            if (field === 'date' && value) {
                setEditValue(formatDateForEdit(value))
            } else {
                setEditValue(value || '')
            }
        }
        
        setIsEditing(false)
        editStartTimeRef.current = 0 // Reset protection
        console.log(`❌ Édition annulée ${field} pour post ${post.id}`)
    }
    
    // Fonction pour démarrer l'édition avec mise à jour forcée
    const handleStartEdit = useCallback(() => {
        // NOUVEAU : Appliquer immédiatement toute valeur en attente avant de commencer l'édition
        const pendingValue = valueUpdateRef.current
        if (pendingValue !== null) {
            console.log(`✨ Application valeur SSE avant édition ${field} pour post ${post.id}: "${pendingValue}"`)
            if (field === 'date' && pendingValue) {
                const formattedDate = formatDateForEdit(pendingValue)
                setEditValue(formattedDate)
                console.log(`📅 Date formatée: "${pendingValue}" -> "${formattedDate}"`)
            } else {
                setEditValue(pendingValue || '')
            }
            originalValueRef.current = pendingValue
            valueUpdateRef.current = null
        } else {
            // S'assurer que editValue est à jour avec la valeur actuelle
            if (field === 'date' && value) {
                const formattedDate = formatDateForEdit(value)
                setEditValue(formattedDate)
                console.log(`📅 Date formatée au démarrage: "${value}" -> "${formattedDate}"`)
            } else {
                setEditValue(value || '')
            }
            originalValueRef.current = value
        }
        
        setIsEditing(true)
        editStartTimeRef.current = Date.now()
        lastSSEProtectionRef.current = Date.now()
        console.log(`✏️ Début édition ${field} pour post ${post.id} - protection activée`)
    }, [field, post.id, value])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSave()
        } else if (e.key === 'Escape') {
            handleCancel()
        }
    }

    // Fonction pour obtenir les options selon le champ
    const getSelectOptions = () => {
        let baseOptions: { value: string; label: string }[] = []
        
        switch (field) {
            case 'status':
                baseOptions = [
                    { value: 'Titre généré', label: 'Titre généré' },
                    { value: 'Post à générer', label: 'Post à générer' },
                    { value: 'Post généré', label: 'Post généré' },
                    { value: 'Post à publier', label: 'Post à publier' },
                    { value: 'Publié', label: 'Publié' },
                    { value: 'failed', label: 'Échec' },
                ]
                break
            case 'client':
                baseOptions = filterOptions?.clients.map((client) => ({ value: client, label: client })) || []
                break
            case 'project_name':
                baseOptions = filterOptions?.projects.map((project) => ({
                    value: project,
                    label: project,
                })) || []
                break
            default:
                baseOptions = options
        }
        
        // Ajouter les options personnalisées pour ce champ
        const customFieldOptions = customOptions[field] || []
        
        // Combiner les options de base avec les options personnalisées (en évitant les doublons)
        const allOptions = [...baseOptions]
        customFieldOptions.forEach(customOption => {
            if (!allOptions.find(option => option.value === customOption.value)) {
                allOptions.push(customOption)
            }
        })
        
        return allOptions
    }

    // Fonction pour obtenir le badge de statut
    const getStatusBadge = (status: string) => {
        return (
            <Badge color={STATUS_COLORS[status] || 'gray'} variant="light" size="sm">
                {status}
            </Badge>
        )
    }

    if (!isEditing) {
        return (
            <Group gap={8} wrap="nowrap" style={{ paddingRight: '4px', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
                <Box flex={1} style={{ minWidth: 0, maxWidth: '100%' }}>
                    {field === 'status' ? (
                        getStatusBadge(value)
                    ) : field === 'keyword' && value ? (
                        <Badge variant="outline" size="sm">
                            {value}
                        </Badge>
                    ) : field === 'text' ? (
                        <Tooltip
                            label={value}
                            multiline
                            styles={{
                                tooltip: {
                                    'maxWidth': '90vw',
                                    'wordWrap': 'break-word',
                                    'whiteSpace': 'pre-wrap',
                                    '@media (min-width: 768px)': {
                                        maxWidth: '50vw',
                                    },
                                    '@media (min-width: 1024px)': {
                                        maxWidth: '33vw',
                                    },
                                },
                            }}
                        >
                            <Text size="sm" style={{ 
                            lineHeight: '1.4',
                            maxHeight: '3.5em', 
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {value}
                        </Text>
                        </Tooltip>
                    ) : field === 'informations' ? (
                        <Tooltip
                            label={value}
                            multiline
                            styles={{
                                tooltip: {
                                    'maxWidth': '90vw',
                                    'wordWrap': 'break-word',
                                    'whiteSpace': 'pre-wrap',
                                    '@media (min-width: 768px)': {
                                        maxWidth: '50vw',
                                    },
                                    '@media (min-width: 1024px)': {
                                        maxWidth: '33vw',
                                    },
                                },
                            }}
                        >
                            <Text size="sm" style={{ 
                            lineHeight: '1.4',
                            maxHeight: '3.5em', 
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {value}
                        </Text>
                        </Tooltip>
                    ) : field === 'date' ? (
                        <Text size="sm">{value ? new Date(value).toLocaleDateString('fr-FR') : '-'}</Text>
                    ) : (field === 'image_url' || field === 'link_url') && value ? (
                        field === 'image_url' ? (
                            <ImageHoverPreview imageUrl={value}>
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        textDecoration: 'none',
                                        color: '#228be6',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                    title={value}
                                >
                                    <LuImage size={16} />
                                </a>
                            </ImageHoverPreview>
                        ) : (
                            <Tooltip label={value}>
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        textDecoration: 'none',
                                        color: '#228be6',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <LuLink size={16} />
                                </a>
                            </Tooltip>
                        )
                    ) : (
                        <Text size="sm">{displayValue || value || '-'}</Text>
                    )}
                </Box>
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={handleStartEdit}
                    title={`Modifier ${field}`}
                >
                    <LuSettings size={14} />
                </ActionIcon>
            </Group>
        )
    }

    return (
        <Group gap={8} wrap="nowrap" style={{ width: '100%', paddingRight: '4px', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
            <Box flex={1} style={{ minWidth: 0, maxWidth: '100%' }}>
                {type === 'select' ? (
                    <InlineCreatableSelect
                        data={getSelectOptions()}
                        value={editValue}
                        onChange={(val) => setEditValue(val || '')}
                        onCreate={(query) => {
                            const newOption = { value: query, label: query }
                            setCustomOptions(prev => ({
                                ...prev,
                                [field]: [...(prev[field] || []), newOption]
                            }))
                            setEditValue(query)
                        }}
                        onKeyDown={handleKeyDown}
                        size="sm"
                    />
                ) : type === 'textarea' ? (
                    <Textarea
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="sm"
                        autosize
                        minRows={2}
                        maxRows={4}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%' }}
                    />
                ) : (
                    <TextInput
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="sm"
                        type={type}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%' }}
                    />
                )}
            </Box>
            <ActionIcon
            size="sm"
            variant="subtle"
            color={isRetrying ? "orange" : "green"}
            onClick={handleSave}
            loading={isSaving}
            title={isRetrying ? `Retry en cours (${retryCount + 1})` : "Sauvegarder"}
            >
            {isRetrying ? <LuRotateCcw size={14} /> : <LuCheck size={14} />}
            </ActionIcon>
            <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={handleCancel}
                title="Annuler"
            >
                <LuX size={14} />
            </ActionIcon>
        </Group>
    )
}
