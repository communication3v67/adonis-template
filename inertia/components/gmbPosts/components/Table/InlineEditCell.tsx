import { ActionIcon, Badge, Box, Group, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { useState, useEffect, useRef } from 'react'
import { LuCheck, LuSettings, LuX, LuImage, LuLink } from 'react-icons/lu'
import { GmbPost, FilterOptions } from '../../types'
import { STATUS_COLORS } from '../../utils/constants'
import { truncateText, formatDateForEdit } from '../../utils/formatters'
import { InlineCreatableSelect } from '../CreatableSelect'

interface InlineEditCellProps {
    value: string
    field: string
    post: GmbPost
    type?: 'text' | 'textarea' | 'select' | 'datetime-local' | 'number'
    options?: { value: string; label: string }[]
    filterOptions?: FilterOptions
    displayValue?: string // Valeur à afficher (différente de la valeur d'édition)
    onSave: (postId: number, field: string, value: string) => Promise<void>
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
    const [customOptions, setCustomOptions] = useState<{ [key: string]: { value: string; label: string }[] }>({})
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            if (type === 'text' || type === 'textarea') {
                inputRef.current.select()
            }
        }
    }, [isEditing, type])

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            // Formatage spécial pour les dates
            let valueToSave = editValue
            if (field === 'date' && editValue) {
                // Convertir la date au format ISO pour l'envoi au serveur
                const date = new Date(editValue)
                valueToSave = date.toISOString()
            }

            await onSave(post.id, field, valueToSave)
            setIsEditing(false)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        // Remettre la valeur originale avec formatage pour les dates
        if (field === 'date' && value) {
            setEditValue(formatDateForEdit(value))
        } else {
            setEditValue(value || '')
        }
        setIsEditing(false)
    }

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
                    ) : field === 'date' ? (
                        <Text size="sm">{value ? new Date(value).toLocaleDateString('fr-FR') : '-'}</Text>
                    ) : (field === 'image_url' || field === 'link_url') && value ? (
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
                                {field === 'image_url' ? (
                                    <LuImage size={16} />
                                ) : (
                                    <LuLink size={16} />
                                )}
                            </a>
                        </Tooltip>
                    ) : (
                        <Text size="sm">{displayValue || value || '-'}</Text>
                    )}
                </Box>
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => setIsEditing(true)}
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
                color="green"
                onClick={handleSave}
                loading={isSaving}
                title="Sauvegarder"
            >
                <LuCheck size={14} />
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
