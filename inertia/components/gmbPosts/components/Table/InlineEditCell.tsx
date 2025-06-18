import { ActionIcon, Badge, Box, Group, Select, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import { useState, useEffect, useRef } from 'react'
import { LuCheck, LuSettings, LuX } from 'react-icons/lu'
import { GmbPost, FilterOptions } from '../../types'
import { STATUS_COLORS } from '../../utils/constants'
import { truncateText, formatDateForEdit } from '../../utils/formatters'

interface InlineEditCellProps {
    value: string
    field: string
    post: GmbPost
    type?: 'text' | 'textarea' | 'select' | 'datetime-local'
    options?: { value: string; label: string }[]
    filterOptions?: FilterOptions
    onSave: (postId: number, field: string, value: string) => Promise<void>
}

export const InlineEditCell = ({
    value,
    field,
    post,
    type = 'text',
    options = [],
    filterOptions,
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
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

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
        switch (field) {
            case 'status':
                return [
                    { value: 'Titre généré', label: 'Titre généré' },
                    { value: 'Post à générer', label: 'Post à générer' },
                    { value: 'Post généré', label: 'Post généré' },
                    { value: 'Post à publier', label: 'Post à publier' },
                    { value: 'Publié', label: 'Publié' },
                    { value: 'failed', label: 'Échec' },
                ]
            case 'client':
                return (
                    filterOptions?.clients.map((client) => ({ value: client, label: client })) || []
                )
            case 'project_name':
                return (
                    filterOptions?.projects.map((project) => ({
                        value: project,
                        label: project,
                    })) || []
                )
            default:
                return options
        }
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
                            <Text
                                size="sm"
                                component="a"
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: 'none',
                                    color: '#868e96',
                                    backgroundColor: '#f8f9fa',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #e9ecef',
                                    display: 'inline-block',
                                    transition: 'all 0.15s ease',
                                    fontSize: '11px',
                                    fontWeight: 400,
                                }}
                            >
                                {field === 'image_url' ? '📷' : '🔗'}
                            </Text>
                        </Tooltip>
                    ) : (
                        <Text size="sm">{value || '-'}</Text>
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
                    <Select
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(val) => setEditValue(val || '')}
                        data={getSelectOptions()}
                        size="sm"
                        searchable={field === 'client' || field === 'project_name'}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%' }}
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
