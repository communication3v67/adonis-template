// Gestion du tri
const handleSort = (sortBy: string, sortOrder: string) => {
    console.log('=== CHANGEMENT DE TRI ===')
    console.log('Nouveau tri:', sortBy, sortOrder)
    console.log('=========================')

    setLocalFilters((prev) => ({
        ...prev,
        sortBy,
        sortOrder,
    }))
} // Composant pour les en-têtes de colonnes avec tri
function SortableHeader({
    label,
    sortKey,
    currentSortBy,
    currentSortOrder,
    onSort,
}: {
    label: string
    sortKey: string
    currentSortBy: string
    currentSortOrder: string
    onSort: (sortBy: string, sortOrder: string) => void
}) {
    const isActive = currentSortBy === sortKey
    const isAsc = isActive && currentSortOrder === 'asc'
    const isDesc = isActive && currentSortOrder === 'desc'

    const handleClick = () => {
        if (!isActive) {
            // Si la colonne n'est pas active, commencer par desc
            onSort(sortKey, 'desc')
        } else if (isDesc) {
            // Si desc, passer à asc
            onSort(sortKey, 'asc')
        } else {
            // Si asc, passer à desc
            onSort(sortKey, 'desc')
        }
    }

    return (
        <Group gap={4} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleClick}>
            <Text fw={500} size="sm">
                {label}
            </Text>
            <Box>
                {isActive ? (
                    isDesc ? (
                        <LuArrowDown size={14} style={{ color: '#228be6' }} />
                    ) : (
                        <LuArrowUp size={14} style={{ color: '#228be6' }} />
                    )
                ) : (
                    <LuMoveHorizontal size={14} style={{ color: '#adb5bd', opacity: 0.6 }} />
                )}
            </Box>
        </Group>
    )
}
import { Head, Link, router, useForm } from '@inertiajs/react'
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Code,
    Flex,
    Group,
    Modal,
    Pagination,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Textarea,
    Title,
    Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
    LuArrowDown,
    LuArrowUp,
    LuCheck,
    LuCopy,
    LuDownload,
    LuMoveHorizontal,
    LuPlus,
    LuSave,
    LuSearch,
    LuSend,
    LuSettings,
    LuTrash,
    LuX,
} from 'react-icons/lu'

interface GmbPost {
    id: number
    status: string
    text: string
    date: string
    image_url?: string
    link_url?: string
    keyword?: string
    client: string
    project_name: string
    location_id: string
    account_id: string
    notion_id?: string
    createdAt: string
    updatedAt: string
}

interface PaginatedPosts {
    data: GmbPost[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

interface Props {
    posts: PaginatedPosts
    filters: {
        search: string
        status: string
        client: string
        project: string
        sortBy: string
        sortOrder: string
    }
    filterOptions: {
        clients: string[]
        projects: string[]
        statuses: string[]
    }
    currentUser: {
        id: number
        username: string
        email: string
        notion_id: string | null
    }
    postsToGenerateCount: number
}

// Composant pour l'édition inline d'une cellule
function InlineEditCell({
    value,
    field,
    post,
    type = 'text',
    options = [],
    filterOptions,
    onSave,
}: {
    value: string
    field: string
    post: GmbPost
    type?: 'text' | 'textarea' | 'select' | 'datetime-local'
    options?: { value: string; label: string }[]
    filterOptions?: Props['filterOptions']
    onSave: (postId: number, field: string, value: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(() => {
        // Formatage spécial pour les dates en mode édition
        if (field === 'date' && value) {
            const date = new Date(value)
            return date.toISOString().slice(0, 16) // Format YYYY-MM-DDTHH:MM
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
            const date = new Date(value)
            setEditValue(date.toISOString().slice(0, 16))
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
                    { value: 'Futur', label: 'Futur' },
                    { value: 'À générer', label: 'À générer' },
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

    if (!isEditing) {
        return (
            <Group gap={4} wrap="nowrap">
                <Box flex={1}>
                    {field === 'status' ? (
                        getStatusBadgeInline(value)
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
                                    'maxWidth': '90vw', // Mobile: 90% de l'écran
                                    'wordWrap': 'break-word',
                                    'whiteSpace': 'pre-wrap',
                                    '@media (min-width: 768px)': {
                                        maxWidth: '50vw', // Tablette: 50% de l'écran
                                    },
                                    '@media (min-width: 1024px)': {
                                        maxWidth: '33vw', // Desktop: 33% de l'écran
                                    },
                                },
                            }}
                        >
                            <Text size="sm">{truncateTextInline(value)}</Text>
                        </Tooltip>
                    ) : field === 'date' ? (
                        <Text size="sm">{formatDateInline(value)}</Text>
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
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#495057'
                                    e.target.style.borderColor = '#ced4da'
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#868e96'
                                    e.target.style.borderColor = '#e9ecef'
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
        <Group gap={4} wrap="nowrap" style={{ minWidth: '100%' }}>
            <Box flex={1} style={{ minWidth: '200px' }}>
                {type === 'select' ? (
                    <Select
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(val) => setEditValue(val || '')}
                        data={getSelectOptions()}
                        size="sm"
                        searchable={field === 'client' || field === 'project_name'}
                        onKeyDown={handleKeyDown}
                        style={{ minWidth: '180px' }}
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
                        style={{ minWidth: '300px' }}
                    />
                ) : (
                    <TextInput
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="sm"
                        type={type}
                        onKeyDown={handleKeyDown}
                        style={{ minWidth: '150px' }}
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

// Fonctions utilitaires pour l'édition inline
const getStatusBadgeInline = (status: string) => {
    const colors: Record<string, string> = {
        'Futur': 'gray',
        'À générer': 'yellow',
        'Titre généré': 'orange',
        'Post à générer': 'blue',
        'Post généré': 'cyan',
        'Post à publier': 'violet',
        'Publié': 'green',
        'failed': 'red',
    }
    return (
        <Badge color={colors[status] || 'gray'} variant="light" size="sm">
            {status}
        </Badge>
    )
}

const truncateTextInline = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

const formatDateInline = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Composant pour l'édition en modal
function EditPostModal({
    post,
    opened,
    onClose,
    filterOptions,
}: {
    post: GmbPost | null
    opened: boolean
    onClose: () => void
    filterOptions: Props['filterOptions']
}) {
    const { data, setData, put, processing, errors, reset } = useForm({
        status: '',
        text: '',
        date: '',
        image_url: '',
        link_url: '',
        keyword: '',
        client: '',
        project_name: '',
        location_id: '',
        account_id: '',
        notion_id: '',
    })

    // Garder une référence des valeurs originales
    const [originalData, setOriginalData] = React.useState<any>({})

    // Mettre à jour le formulaire quand le post change
    React.useEffect(() => {
        if (post && opened) {
            console.log('=== DEBUG MODAL ===')
            console.log('Post reçu dans modal:', post)
            console.log('Clés disponibles:', Object.keys(post))

            const initialData = {
                status: post.status || '',
                text: post.text || '',
                date: post.date ? new Date(post.date).toISOString().slice(0, 16) : '',
                image_url: post.image_url || '',
                link_url: post.link_url || '',
                keyword: post.keyword || '',
                client: post.client || '',
                project_name: post.project_name || '',
                location_id: post.location_id || '',
                account_id: post.account_id || '',
                notion_id: post.notion_id || '',
            }

            console.log('Données form initiales:', initialData)
            console.log('====================')

            setData(initialData)
            setOriginalData(initialData) // Sauvegarder les valeurs originales
        } else if (!opened) {
            // Réinitialiser le formulaire quand le modal se ferme
            reset()
            setOriginalData({})
        }
    }, [post, opened])

    // Fonction pour vérifier si un champ a été modifié
    const isFieldChanged = (fieldName: string) => {
        return data[fieldName] !== originalData[fieldName]
    }

    // Compter le nombre de champs modifiés
    const changedFieldsCount = Object.keys(data).filter((key) => isFieldChanged(key)).length

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!post) return

        // Comparer les données actuelles avec les originales
        const changedFields: any = {}
        Object.keys(data).forEach((key) => {
            if (data[key] !== originalData[key]) {
                changedFields[key] = data[key]
            }
        })

        // Vérifier s'il y a des modifications
        if (Object.keys(changedFields).length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucune modification détectée',
                color: 'blue',
            })
            return
        }

        console.log('=== DÉBUT SOUMISSION ===')
        console.log('URL:', `/gmb-posts/${post.id}`)
        console.log('Méthode:', 'PUT')
        console.log('Champs modifiés:', changedFields)
        console.log('==========================')

        put(`/gmb-posts/${post.id}`, changedFields, {
            onSuccess: (page) => {
                console.log('=== SUCCÈS ===')
                console.log('Page reçue:', page)
                console.log('===============')
                notifications.show({
                    title: 'Succès',
                    message: `${Object.keys(changedFields).length} champ(s) mis à jour avec succès !`,
                    color: 'green',
                })
                onClose()
                reset()
                setOriginalData({})
            },
            onError: (errors) => {
                console.log('=== ERREUR ===')
                console.log('Erreurs reçues:', errors)
                console.log('===============')
                notifications.show({
                    title: 'Erreur',
                    message: 'Erreur lors de la mise à jour',
                    color: 'red',
                })
            },
            onStart: () => {
                console.log('=== DÉMARRAGE REQUÊTE ===')
            },
            onFinish: () => {
                console.log('=== FIN REQUÊTE ===')
            },
        })
    }

    if (!post) return null

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group>
                    <Text>Modifier le post</Text>
                    {changedFieldsCount > 0 && (
                        <Badge color="orange" variant="light">
                            {changedFieldsCount} champ(s) modifié(s)
                        </Badge>
                    )}
                </Group>
            }
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Group grow>
                        <Select
                            label="Statut"
                            placeholder="Sélectionner un statut"
                            data={[
                                { value: 'Futur', label: 'Futur' },
                                { value: 'À générer', label: 'À générer' },
                                { value: 'Titre généré', label: 'Titre généré' },
                                { value: 'Post à générer', label: 'Post à générer' },
                                { value: 'Post généré', label: 'Post généré' },
                                { value: 'Post à publier', label: 'Post à publier' },
                                { value: 'Publié', label: 'Publié' },
                                { value: 'failed', label: 'Échec' },
                            ]}
                            value={data.status}
                            onChange={(value) => setData('status', value || '')}
                            error={errors.status}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('status') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('status')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Date"
                            type="datetime-local"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            error={errors.date}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('date') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('date') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Textarea
                        label="Texte du post"
                        placeholder="Contenu du post..."
                        resize="vertical"
                        value={data.text}
                        onChange={(e) => setData('text', e.target.value)}
                        error={errors.text}
                        minRows={3}
                        styles={{
                            input: {
                                borderColor: isFieldChanged('text') ? '#fd7e14' : undefined,
                                backgroundColor: isFieldChanged('text') ? '#fff4e6' : undefined,
                            },
                        }}
                    />

                    <Group grow>
                        <Select
                            label="Client"
                            placeholder="Sélectionner un client"
                            data={filterOptions.clients.map((client) => ({
                                value: client,
                                label: client,
                            }))}
                            value={data.client}
                            onChange={(value) => setData('client', value || '')}
                            error={errors.client}
                            searchable
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('client') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('client')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Nom du projet"
                            placeholder="Nom du projet"
                            value={data.project_name}
                            onChange={(e) => setData('project_name', e.target.value)}
                            error={errors.project_name}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('project_name')
                                        ? '#fd7e14'
                                        : undefined,
                                    backgroundColor: isFieldChanged('project_name')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="Mot-clé"
                            placeholder="Mot-clé principal"
                            value={data.keyword}
                            onChange={(e) => setData('keyword', e.target.value)}
                            error={errors.keyword}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('keyword') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('keyword')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="URL de l'image"
                            placeholder="https://..."
                            value={data.image_url}
                            onChange={(e) => setData('image_url', e.target.value)}
                            error={errors.image_url}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('image_url')
                                        ? '#fd7e14'
                                        : undefined,
                                    backgroundColor: isFieldChanged('image_url')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="URL du lien"
                            placeholder="https://..."
                            value={data.link_url}
                            onChange={(e) => setData('link_url', e.target.value)}
                            error={errors.link_url}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('link_url') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('link_url')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Location ID"
                            placeholder="ID de la localisation"
                            value={data.location_id}
                            onChange={(e) => setData('location_id', e.target.value)}
                            error={errors.location_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('location_id')
                                        ? '#fd7e14'
                                        : undefined,
                                    backgroundColor: isFieldChanged('location_id')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="Account ID"
                            placeholder="ID du compte"
                            value={data.account_id}
                            onChange={(e) => setData('account_id', e.target.value)}
                            error={errors.account_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('account_id')
                                        ? '#fd7e14'
                                        : undefined,
                                    backgroundColor: isFieldChanged('account_id')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Notion ID"
                            placeholder="ID Notion (optionnel)"
                            value={data.notion_id}
                            onChange={(e) => setData('notion_id', e.target.value)}
                            error={errors.notion_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('notion_id')
                                        ? '#fd7e14'
                                        : undefined,
                                    backgroundColor: isFieldChanged('notion_id')
                                        ? '#fff4e6'
                                        : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose} leftSection={<LuX size={16} />}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            loading={processing}
                            disabled={changedFieldsCount === 0}
                            leftSection={<LuSave size={16} />}
                        >
                            Enregistrer {changedFieldsCount > 0 && `(${changedFieldsCount})`}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    )
}

export default function GmbPostsIndex({
    posts,
    filters,
    filterOptions,
    currentUser,
    postsToGenerateCount,
}: Props) {
    const [selectedPosts, setSelectedPosts] = useState<number[]>([])
    const [localFilters, setLocalFilters] = useState(filters)
    const [editingPost, setEditingPost] = useState<GmbPost | null>(null)
    const [editModalOpened, setEditModalOpened] = useState(false)
    const [isApplyingFilters, setIsApplyingFilters] = useState(false)

    // État pour l'édition en masse
    const [bulkEditData, setBulkEditData] = useState({
        status: '',
        client: '',
        project_name: '',
        location_id: '',
        account_id: '',
        notion_id: '',
    })

    // États pour le webhook n8n
    const [sendingToN8n, setSendingToN8n] = useState(false)
    const [webhookResponse, setWebhookResponse] = useState<any>(null)
    const [showWebhookModal, setShowWebhookModal] = useState(false)

    // Hook pour gérer l'hydratation
    const [isClient, setIsClient] = useState(false)

    React.useEffect(() => {
        setIsClient(true)

        // Debug temporaire
        console.log('=== DEBUG FRONTEND ===')
        console.log('Posts reçus:', posts)
        console.log('postsToGenerateCount reçu:', postsToGenerateCount)
        console.log('currentUser.notion_id:', currentUser.notion_id)
        console.log('Condition bouton:', postsToGenerateCount > 0 && currentUser.notion_id)
        if (posts.data && posts.data.length > 0) {
            console.log('Premier post:', posts.data[0])
            console.log('Clés du premier post:', Object.keys(posts.data[0]))
        }
        console.log('=====================')
    }, [])

    // Synchroniser les filtres locaux avec les filtres props quand ils changent
    React.useEffect(() => {
        console.log('=== SYNCHRONISATION FILTRES ===')
        console.log('Filtres props:', filters)
        console.log('Filtres locaux avant:', localFilters)

        setLocalFilters(filters)

        console.log('Filtres locaux après:', filters)
        console.log('================================')
    }, [filters])

    // Application automatique des filtres avec debounce pour la recherche
    React.useEffect(() => {
        // Si c'est juste un changement de texte de recherche, on debounce
        if (localFilters.search !== filters.search && localFilters.search.length > 0) {
            const timeoutId = setTimeout(() => {
                console.log('=== AUTO-APPLICATION FILTRES (SEARCH) ===')
                console.log('Recherche auto-appliquée:', localFilters.search)
                console.log('==========================================')
                applyFilters()
            }, 800) // Délai de 800ms pour la recherche

            return () => clearTimeout(timeoutId)
        }
        // Pour les autres filtres, application immédiate si différents des props
        else if (
            localFilters.status !== filters.status ||
            localFilters.client !== filters.client ||
            localFilters.project !== filters.project ||
            localFilters.sortBy !== filters.sortBy ||
            localFilters.sortOrder !== filters.sortOrder
        ) {
            console.log('=== AUTO-APPLICATION FILTRES ===')
            console.log('Filtres auto-appliqués:', localFilters)
            console.log('================================')
            applyFilters()
        }
    }, [
        localFilters.search,
        localFilters.status,
        localFilters.client,
        localFilters.project,
        localFilters.sortBy,
        localFilters.sortOrder,
    ])

    // Gestion de la sélection multiple
    const toggleSelectAll = () => {
        if (selectedPosts.length === posts.data.length) {
            setSelectedPosts([])
        } else {
            setSelectedPosts(posts.data.map((post) => post.id))
        }
    }

    const toggleSelectPost = (postId: number) => {
        setSelectedPosts((prev) =>
            prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
        )
    }

    // Gestion de l'édition
    const handleEdit = (post: GmbPost) => {
        setEditingPost(post)
        setEditModalOpened(true)
    }

    const closeEditModal = () => {
        setEditModalOpened(false)
        setEditingPost(null)
    }

    // Gestion de l'édition inline
    const handleInlineEdit = async (postId: number, field: string, value: string) => {
        return new Promise((resolve, reject) => {
            const updateData = { [field]: value }

            console.log('=== ÉDITION INLINE ===')
            console.log('Post ID:', postId)
            console.log('Champ:', field)
            console.log('Nouvelle valeur:', value)
            console.log('========================')

            router.put(`/gmb-posts/${postId}`, updateData, {
                onSuccess: (page) => {
                    console.log('=== SUCCÈS INLINE ===')
                    console.log('Page reçue:', page)
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: `${field} mis à jour avec succès !`,
                        color: 'green',
                    })
                    resolve(page)
                },
                onError: (errors) => {
                    console.log('=== ERREUR INLINE ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: `Erreur lors de la mise à jour de ${field}`,
                        color: 'red',
                    })
                    reject(errors)
                },
            })
        })
    }

    // Gestion des filtres
    const applyFilters = () => {
        console.log('=== APPLICATION DES FILTRES ===')
        console.log('Filtres locaux:', localFilters)
        console.log('================================')

        setIsApplyingFilters(true)

        router.get('/gmb-posts', localFilters, {
            preserveState: true,
            replace: true,
            onFinish: () => {
                setIsApplyingFilters(false)
            },
        })
    }

    const resetFilters = () => {
        const resetFiltersData = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
        }
        console.log('=== RÉINITIALISATION DES FILTRES ===')
        console.log('Données de réinitialisation:', resetFiltersData)
        console.log('======================================')

        setLocalFilters(resetFiltersData)
        router.get('/gmb-posts', resetFiltersData, {
            preserveState: true,
            replace: true,
        })
    }

    // Actions en masse
    const handleBulkDelete = () => {
        if (selectedPosts.length === 0) return

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPosts.length} post(s) ?`)) {
            router.delete('/gmb-posts', {
                data: { ids: selectedPosts },
                onSuccess: () => {
                    setSelectedPosts([])
                    notifications.show({
                        title: 'Succès',
                        message: 'Posts supprimés avec succès',
                        color: 'green',
                    })
                },
                onError: () => {
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la suppression',
                        color: 'red',
                    })
                },
            })
        }
    }

    // Vérifier s'il y a des modifications en masse
    const hasAnyBulkChanges = () => {
        return Object.values(bulkEditData).some((value) => value.trim() !== '')
    }

    // Réinitialiser les données d'édition en masse
    const resetBulkEdit = () => {
        setBulkEditData({
            status: '',
            client: '',
            project_name: '',
            location_id: '',
            account_id: '',
            notion_id: '',
        })
    }

    // Gérer l'édition en masse
    const handleBulkEdit = () => {
        if (selectedPosts.length === 0) return
        if (!hasAnyBulkChanges()) {
            notifications.show({
                title: 'Information',
                message: 'Aucune modification sélectionnée',
                color: 'blue',
            })
            return
        }

        // Préparer les données à envoyer (seulement les champs modifiés)
        const updateData: any = {}
        Object.entries(bulkEditData).forEach(([key, value]) => {
            if (value.trim() !== '') {
                updateData[key] = value
            }
        })

        const fieldsToUpdate = Object.keys(updateData)
        const confirmMessage = `Êtes-vous sûr de vouloir modifier ${fieldsToUpdate.join(', ')} pour ${selectedPosts.length} post(s) ?`

        if (confirm(confirmMessage)) {
            console.log('=== ÉDITION EN MASSE ===')
            console.log('Posts sélectionnés:', selectedPosts)
            console.log('Données à mettre à jour:', updateData)
            console.log('========================')

            router.post(
                '/gmb-posts/bulk-update',
                {
                    ids: selectedPosts,
                    updateData: updateData,
                },
                {
                    onSuccess: () => {
                        console.log('=== SUCCÈS ÉDITION MASSE ===')
                        console.log('Modifications appliquées avec succès')
                        console.log('========================')
                        setSelectedPosts([])
                        resetBulkEdit()
                        notifications.show({
                            title: 'Succès',
                            message: `${selectedPosts.length} post(s) modifié(s) avec succès !`,
                            color: 'green',
                        })
                    },
                    onError: (errors) => {
                        console.log('=== ERREUR ÉDITION MASSE ===')
                        console.log('Erreurs reçues:', errors)
                        console.log('========================')
                        notifications.show({
                            title: 'Erreur',
                            message: 'Erreur lors de la modification en masse',
                            color: 'red',
                        })
                    },
                }
            )
        }
    }

    // Actions individuelles
    const handleDelete = (postId: number) => {
        if (
            confirm('Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.')
        ) {
            console.log('=== SUPPRESSION POST ===')
            console.log('Post ID:', postId)
            console.log('========================')

            router.delete(`/gmb-posts/${postId}`, {
                onSuccess: () => {
                    console.log('=== SUCCÈS SUPPRESSION ===')
                    console.log('Post supprimé avec succès')
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: 'Post supprimé avec succès',
                        color: 'green',
                    })
                },
                onError: (errors) => {
                    console.log('=== ERREUR SUPPRESSION ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la suppression du post',
                        color: 'red',
                    })
                },
            })
        }
    }

    const handleDuplicate = (postId: number) => {
        console.log('=== DUPLICATION POST ===')
        console.log('Post ID:', postId)
        console.log('========================')

        router.post(
            `/gmb-posts/${postId}/duplicate`,
            {},
            {
                onSuccess: () => {
                    console.log('=== SUCCÈS DUPLICATION ===')
                    console.log('Post dupliqué avec succès')
                    console.log('========================')
                    notifications.show({
                        title: 'Succès',
                        message: 'Post dupliqué avec succès',
                        color: 'green',
                    })
                    // La redirection est gérée par le backend
                },
                onError: (errors) => {
                    console.log('=== ERREUR DUPLICATION ===')
                    console.log('Erreurs reçues:', errors)
                    console.log('========================')
                    notifications.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la duplication du post',
                        color: 'red',
                    })
                },
            }
        )
    }

    // Fonction pour envoyer les posts GMB vers n8n
    const sendPostsToN8n = async () => {
        if (postsToGenerateCount === 0) {
            alert('❌ Aucun post "Post à générer" à envoyer')
            return
        }

        setSendingToN8n(true)
        setWebhookResponse(null)

        try {
            console.log(`🚀 Envoi de ${postsToGenerateCount} posts GMB vers n8n`)

            // Récupération du token CSRF
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content')
            console.log('🔐 CSRF Token trouvé:', csrfToken ? 'OUI' : 'NON')

            if (!csrfToken) {
                throw new Error('Token CSRF manquant. Actualisez la page.')
            }

            const response = await fetch('/gmb-posts/send-to-n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            })

            console.log('📡 Statut réponse:', response.status, response.statusText)

            // Vérifier si c'est une redirection ou erreur HTTP
            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Erreur HTTP:', response.status, errorText.substring(0, 300))
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
            }

            // Lire et parser la réponse
            const responseText = await response.text()
            console.log('📥 Réponse brute (100 premiers chars):', responseText.substring(0, 100))

            // Vérifier si c'est du HTML (redirection vers accueil)
            if (responseText.trim().startsWith('<!DOCTYPE')) {
                throw new Error(
                    "La requête a été redirigée vers la page d'accueil. Problème d'authentification ou de route."
                )
            }

            let result
            try {
                result = JSON.parse(responseText)
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError)
                throw new Error('Réponse serveur invalide (JSON attendu)')
            }

            console.log('✅ Résultat parsé:', result)

            // Afficher la réponse
            setWebhookResponse(result.data || result)
            setShowWebhookModal(true)

            // Message de succès
            alert(`✅ ${postsToGenerateCount} posts GMB envoyés avec succès vers n8n !`)
        } catch (error) {
            console.error('🚨 Erreur complète webhook:', error)

            let errorMessage = 'Erreur inconnue'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            alert(`❌ Erreur: ${errorMessage}`)
        } finally {
            setSendingToN8n(false)
        }
    }

    // Formatage de la date (compatible SSR/Client)
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)

        // Pendant l'hydratation, utiliser un format déterministe
        if (!isClient) {
            // Format ISO simplifié pour éviter les différences de fuseau horaire
            const isoString = date.toISOString()
            const datePart = isoString.split('T')[0]
            const timePart = isoString.split('T')[1].substring(0, 5)

            // Convertir au format DD/MM/YYYY HH:MM
            const [year, month, day] = datePart.split('-')
            return `${day}/${month}/${year} ${timePart}`
        }

        // Après hydratation, utiliser le format localisé
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <>
            <Head title="Posts GMB" />

            <Stack gap="md">
                {/* En-tête */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Title order={2}>Posts GMB</Title>
                        <Group gap="xs" mt="xs">
                            <Text size="sm" c="dimmed">
                                {posts.meta.total} post{posts.meta.total > 1 ? 's' : ''} trouvé
                                {posts.meta.total > 1 ? 's' : ''}
                            </Text>
                            <Text size="sm" c="dimmed">
                                •
                            </Text>
                            <Badge variant="outline" color="blue" size="sm">
                                👤 {currentUser.username}
                            </Badge>
                            {currentUser.notion_id && (
                                <Badge variant="outline" color="violet" size="sm">
                                    🔗 Notion
                                </Badge>
                            )}
                            {/* Indicateurs de filtres actifs */}
                            {(localFilters.search ||
                                localFilters.status ||
                                localFilters.client ||
                                localFilters.project) && (
                                <>
                                    <Text size="sm" c="dimmed">
                                        •
                                    </Text>
                                    <Group gap={4}>
                                        {localFilters.search && (
                                            <Badge
                                                variant="outline"
                                                size="xs"
                                                color="blue"
                                                style={{ cursor: 'pointer' }}
                                                rightSection={
                                                    <LuX
                                                        size={10}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setLocalFilters((prev) => ({
                                                                ...prev,
                                                                search: '',
                                                            }))
                                                        }}
                                                    />
                                                }
                                                onClick={() => {
                                                    setLocalFilters((prev) => ({
                                                        ...prev,
                                                        search: '',
                                                    }))
                                                }}
                                            >
                                                📝 "
                                                {localFilters.search.length > 15
                                                    ? localFilters.search.substring(0, 15) + '...'
                                                    : localFilters.search}
                                                "
                                            </Badge>
                                        )}
                                        {localFilters.status && (
                                            <Badge
                                                variant="outline"
                                                size="xs"
                                                color="green"
                                                style={{ cursor: 'pointer' }}
                                                rightSection={
                                                    <LuX
                                                        size={10}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setLocalFilters((prev) => ({
                                                                ...prev,
                                                                status: '',
                                                            }))
                                                        }}
                                                    />
                                                }
                                                onClick={() => {
                                                    setLocalFilters((prev) => ({
                                                        ...prev,
                                                        status: '',
                                                    }))
                                                }}
                                            >
                                                🔄 {localFilters.status}
                                            </Badge>
                                        )}
                                        {localFilters.client && (
                                            <Badge
                                                variant="outline"
                                                size="xs"
                                                color="orange"
                                                style={{ cursor: 'pointer' }}
                                                rightSection={
                                                    <LuX
                                                        size={10}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setLocalFilters((prev) => ({
                                                                ...prev,
                                                                client: '',
                                                            }))
                                                        }}
                                                    />
                                                }
                                                onClick={() => {
                                                    setLocalFilters((prev) => ({
                                                        ...prev,
                                                        client: '',
                                                    }))
                                                }}
                                            >
                                                👤 {localFilters.client}
                                            </Badge>
                                        )}
                                        {localFilters.project && (
                                            <Badge
                                                variant="outline"
                                                size="xs"
                                                color="violet"
                                                style={{ cursor: 'pointer' }}
                                                rightSection={
                                                    <LuX
                                                        size={10}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setLocalFilters((prev) => ({
                                                                ...prev,
                                                                project: '',
                                                            }))
                                                        }}
                                                    />
                                                }
                                                onClick={() => {
                                                    setLocalFilters((prev) => ({
                                                        ...prev,
                                                        project: '',
                                                    }))
                                                }}
                                            >
                                                📁 {localFilters.project}
                                            </Badge>
                                        )}
                                    </Group>
                                </>
                            )}
                            {isApplyingFilters && (
                                <>
                                    <Text size="sm" c="dimmed">
                                        •
                                    </Text>
                                    <Text size="sm" c="blue">
                                        Filtrage en cours...
                                    </Text>
                                </>
                            )}
                        </Group>
                    </Box>
                    <Group>
                        {/* DEBUG: Affichage des valeurs
                        <Badge variant="outline" color="red">
                            Debug: Count={postsToGenerateCount}, NotionId={currentUser.notion_id ? 'OUI' : 'NON'}
                        </Badge>
                         */}
                        {/* Bouton pour envoyer les posts vers n8n */}
                        {postsToGenerateCount > 0 && currentUser.notion_id && (
                            <Button
                                variant="filled"
                                onClick={sendPostsToN8n}
                                loading={sendingToN8n}
                                disabled={sendingToN8n}
                                leftSection={<LuSend size={16} />}
                            >
                                {sendingToN8n
                                    ? 'Envoi en cours...'
                                    : `Envoyer vers n8n (${postsToGenerateCount})`}
                            </Button>
                        )}

                        <Button
                            component={Link}
                            href="/gmb-posts/export"
                            variant="light"
                            leftSection={<LuDownload size={16} />}
                        >
                            Exporter
                        </Button>
                        <Button
                            component={Link}
                            href="/gmb-posts/create"
                            leftSection={<LuPlus size={16} />}
                        >
                            Nouveau post
                        </Button>
                    </Group>
                </Flex>

                {/* Filtres */}
                <Card withBorder p="md">
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text fw={500}>Filtres</Text>
                            <Group gap="xs">
                                {/* Badges des filtres actifs */}
                                {localFilters.search && (
                                    <Badge variant="light" color="blue" size="sm">
                                        Recherche: "
                                        {localFilters.search.length > 20
                                            ? localFilters.search.substring(0, 20) + '...'
                                            : localFilters.search}
                                        "
                                    </Badge>
                                )}
                                {localFilters.status && (
                                    <Badge variant="light" color="green" size="sm">
                                        Statut: {localFilters.status}
                                    </Badge>
                                )}
                                {localFilters.client && (
                                    <Badge variant="light" color="orange" size="sm">
                                        Client: {localFilters.client}
                                    </Badge>
                                )}
                                {localFilters.project && (
                                    <Badge variant="light" color="violet" size="sm">
                                        Projet: {localFilters.project}
                                    </Badge>
                                )}
                                {(localFilters.sortBy !== 'date' ||
                                    localFilters.sortOrder !== 'desc') && (
                                    <Badge variant="light" color="gray" size="sm">
                                        📊 Tri: {getSortLabel(localFilters.sortBy)} (
                                        {localFilters.sortOrder === 'desc' ? '↓' : '↑'})
                                    </Badge>
                                )}
                            </Group>
                        </Group>
                        <Group grow>
                            <TextInput
                                placeholder="Rechercher dans le texte, mots-clés, clients, projets..."
                                leftSection={<LuSearch size={16} />}
                                value={localFilters.search}
                                onChange={(e) => {
                                    const newValue = e.target.value
                                    console.log('Recherche changée:', newValue)
                                    setLocalFilters((prev) => ({
                                        ...prev,
                                        search: newValue,
                                    }))
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilters()
                                    }
                                }}
                            />
                            <Select
                                placeholder="Filtrer par statut"
                                data={[
                                    { value: '', label: 'Tous les statuts' },
                                    ...filterOptions.statuses.map((status) => ({
                                        value: status,
                                        label: status,
                                    })),
                                ]}
                                value={localFilters.status}
                                onChange={(value) => {
                                    console.log('Statut changé:', value)
                                    setLocalFilters((prev) => ({
                                        ...prev,
                                        status: value || '',
                                    }))
                                }}
                                clearable
                            />
                            <Select
                                placeholder="Filtrer par client"
                                data={[
                                    { value: '', label: 'Tous les clients' },
                                    ...filterOptions.clients.map((client) => ({
                                        value: client,
                                        label: client,
                                    })),
                                ]}
                                value={localFilters.client}
                                onChange={(value) => {
                                    console.log('Client changé:', value)
                                    setLocalFilters((prev) => ({
                                        ...prev,
                                        client: value || '',
                                    }))
                                }}
                                searchable
                                clearable
                            />
                            <Select
                                placeholder="Filtrer par projet"
                                data={[
                                    { value: '', label: 'Tous les projets' },
                                    ...filterOptions.projects.map((project) => ({
                                        value: project,
                                        label: project,
                                    })),
                                ]}
                                value={localFilters.project}
                                onChange={(value) => {
                                    console.log('Projet changé:', value)
                                    setLocalFilters((prev) => ({
                                        ...prev,
                                        project: value || '',
                                    }))
                                }}
                                searchable
                                clearable
                            />
                        </Group>

                        {/* Options de tri - Remplacées par les en-têtes cliquables */}
                        <Group>
                            <Text size="sm" c="dimmed">
                                {posts.meta.total} résultat{posts.meta.total > 1 ? 's' : ''}
                            </Text>
                            <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                💡 Cliquez sur les en-têtes de colonnes pour trier
                            </Text>
                        </Group>

                        <Group>
                            <Button
                                onClick={applyFilters}
                                leftSection={<LuSearch size={16} />}
                                variant="filled"
                                loading={isApplyingFilters}
                            >
                                {isApplyingFilters ? 'Application...' : 'Appliquer manuellement'}
                            </Button>
                            <Button
                                variant="light"
                                onClick={resetFilters}
                                leftSection={<LuX size={16} />}
                            >
                                Réinitialiser
                            </Button>

                            {/* Filtres rapides */}
                            <Flex justify="space-between" align="center" wrap="wrap" gap="md">
                                <Group gap="xs">
                                    <Text size="sm" fw={500} c="dimmed">
                                        Filtres rapides :
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="grey"
                                        onClick={() => {
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                status: 'Futur',
                                            }))
                                        }}
                                    >
                                        Futur
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="yellow"
                                        onClick={() => {
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                status: 'À générer',
                                            }))
                                        }}
                                    >
                                        À générer
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="blue"
                                        onClick={() => {
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                status: 'Titres générés',
                                            }))
                                        }}
                                    >
                                        Titre généré
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="yellow"
                                        onClick={() => {
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                status: 'Post à générer',
                                            }))
                                        }}
                                    >
                                        Post à générer
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="violet"
                                        onClick={() => {
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                status: 'Post à publier',
                                            }))
                                        }}
                                    >
                                        Post à publier
                                    </Button>

                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="green"
                                        onClick={() => {
                                            setLocalFilters((prev) => ({
                                                ...prev,
                                                status: 'Publié',
                                            }))
                                        }}
                                    >
                                        Publié
                                    </Button>
                                </Group>

                                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                    💡 Les filtres s'appliquent automatiquement (recherche : 0.8s)
                                </Text>
                            </Flex>
                        </Group>
                    </Stack>
                </Card>

                {/* Actions en masse */}
                {selectedPosts.length > 0 && (
                    <Card withBorder p="md" bg="blue.0">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={500}>{selectedPosts.length} post(s) sélectionné(s)</Text>
                                <Button
                                    color="red"
                                    variant="light"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                >
                                    Supprimer la sélection
                                </Button>
                            </Group>

                            <Text size="sm" fw={500}>
                                Modifier en masse :
                            </Text>

                            <Group grow>
                                <Select
                                    placeholder="Nouveau statut"
                                    data={[
                                        { value: '', label: 'Conserver le statut actuel' },
                                        { value: 'Futur', label: 'Futur' },
                                        { value: 'À générer', label: 'À générer' },
                                        { value: 'Titre généré', label: 'Titre généré' },
                                        { value: 'Post à générer', label: 'Post à générer' },
                                        { value: 'Post généré', label: 'Post généré' },
                                        { value: 'Post à publier', label: 'Post à publier' },
                                        { value: 'Publié', label: 'Publié' },
                                        { value: 'failed', label: 'Échec' },
                                    ]}
                                    value={bulkEditData.status}
                                    onChange={(value) =>
                                        setBulkEditData((prev) => ({
                                            ...prev,
                                            status: value || '',
                                        }))
                                    }
                                    size="sm"
                                />
                                <Select
                                    placeholder="Nouveau client"
                                    data={[
                                        { value: '', label: 'Conserver le client actuel' },
                                        ...filterOptions.clients.map((client) => ({
                                            value: client,
                                            label: client,
                                        })),
                                    ]}
                                    value={bulkEditData.client}
                                    onChange={(value) =>
                                        setBulkEditData((prev) => ({
                                            ...prev,
                                            client: value || '',
                                        }))
                                    }
                                    size="sm"
                                    searchable
                                />
                                <Select
                                    placeholder="Nouveau projet"
                                    data={[
                                        { value: '', label: 'Conserver le projet actuel' },
                                        ...filterOptions.projects.map((project) => ({
                                            value: project,
                                            label: project,
                                        })),
                                    ]}
                                    value={bulkEditData.project_name}
                                    onChange={(value) =>
                                        setBulkEditData((prev) => ({
                                            ...prev,
                                            project_name: value || '',
                                        }))
                                    }
                                    size="sm"
                                    searchable
                                />
                            </Group>

                            <Group grow>
                                <TextInput
                                    placeholder="Nouveau Location ID"
                                    value={bulkEditData.location_id}
                                    onChange={(e) =>
                                        setBulkEditData((prev) => ({
                                            ...prev,
                                            location_id: e.target.value,
                                        }))
                                    }
                                    size="sm"
                                />
                                <TextInput
                                    placeholder="Nouveau Account ID"
                                    value={bulkEditData.account_id}
                                    onChange={(e) =>
                                        setBulkEditData((prev) => ({
                                            ...prev,
                                            account_id: e.target.value,
                                        }))
                                    }
                                    size="sm"
                                />
                                <TextInput
                                    placeholder="Nouveau Notion ID"
                                    value={bulkEditData.notion_id}
                                    onChange={(e) =>
                                        setBulkEditData((prev) => ({
                                            ...prev,
                                            notion_id: e.target.value,
                                        }))
                                    }
                                    size="sm"
                                />
                            </Group>

                            <Group>
                                <Button
                                    onClick={handleBulkEdit}
                                    size="sm"
                                    disabled={!hasAnyBulkChanges()}
                                >
                                    Appliquer les modifications
                                </Button>
                                <Button variant="light" onClick={resetBulkEdit} size="sm">
                                    Réinitialiser
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                )}

                {/* Tableau */}
                <Card withBorder>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table striped highlightOnHover style={{ minWidth: '2200px' }}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th w={40}>
                                        <Checkbox
                                            checked={
                                                selectedPosts.length === posts.data.length &&
                                                posts.data.length > 0
                                            }
                                            indeterminate={
                                                selectedPosts.length > 0 &&
                                                selectedPosts.length < posts.data.length
                                            }
                                            onChange={toggleSelectAll}
                                        />
                                    </Table.Th>
                                    <Table.Th w={160}>
                                        <SortableHeader
                                            label="Statut"
                                            sortKey="status"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={400}>
                                        <SortableHeader
                                            label="Texte"
                                            sortKey="text"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={180}>
                                        <SortableHeader
                                            label="Client"
                                            sortKey="client"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={180}>
                                        <SortableHeader
                                            label="Projet"
                                            sortKey="project_name"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={160}>
                                        <SortableHeader
                                            label="Date"
                                            sortKey="date"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={160}>
                                        <SortableHeader
                                            label="Mot-clé"
                                            sortKey="keyword"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={140}>
                                        <Text fw={500} size="sm">
                                            URL Image
                                        </Text>
                                    </Table.Th>
                                    <Table.Th w={140}>
                                        <Text fw={500} size="sm">
                                            URL Lien
                                        </Text>
                                    </Table.Th>
                                    <Table.Th w={160}>
                                        <SortableHeader
                                            label="Location ID"
                                            sortKey="location_id"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={160}>
                                        <SortableHeader
                                            label="Account ID"
                                            sortKey="account_id"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={140}>
                                        <SortableHeader
                                            label="Notion ID"
                                            sortKey="notion_id"
                                            currentSortBy={localFilters.sortBy}
                                            currentSortOrder={localFilters.sortOrder}
                                            onSort={handleSort}
                                        />
                                    </Table.Th>
                                    <Table.Th w={140}>
                                        <Text fw={500} size="sm">
                                            Actions
                                        </Text>
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {posts.data.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={13}>
                                            <Text ta="center" py="xl" c="dimmed">
                                                Aucun post trouvé
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    posts.data.map((post) => (
                                        <Table.Tr key={post.id}>
                                            <Table.Td>
                                                <Checkbox
                                                    checked={selectedPosts.includes(post.id)}
                                                    onChange={() => toggleSelectPost(post.id)}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.status}
                                                    field="status"
                                                    post={post}
                                                    type="select"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.text}
                                                    field="text"
                                                    post={post}
                                                    type="textarea"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.client}
                                                    field="client"
                                                    post={post}
                                                    type="select"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.project_name}
                                                    field="project_name"
                                                    post={post}
                                                    type="select"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.date}
                                                    field="date"
                                                    post={post}
                                                    type="datetime-local"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.keyword || ''}
                                                    field="keyword"
                                                    post={post}
                                                    type="text"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.image_url || ''}
                                                    field="image_url"
                                                    post={post}
                                                    type="text"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.link_url || ''}
                                                    field="link_url"
                                                    post={post}
                                                    type="text"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.location_id || ''}
                                                    field="location_id"
                                                    post={post}
                                                    type="text"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.account_id || ''}
                                                    field="account_id"
                                                    post={post}
                                                    type="text"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <InlineEditCell
                                                    value={post.notion_id || ''}
                                                    field="notion_id"
                                                    post={post}
                                                    type="text"
                                                    filterOptions={filterOptions}
                                                    onSave={handleInlineEdit}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    <Tooltip label="Modifier">
                                                        <ActionIcon
                                                            variant="light"
                                                            size="sm"
                                                            onClick={() => handleEdit(post)}
                                                        >
                                                            <LuSettings size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Dupliquer">
                                                        <ActionIcon
                                                            variant="light"
                                                            size="sm"
                                                            color="blue"
                                                            onClick={() => handleDuplicate(post.id)}
                                                        >
                                                            <LuCopy size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Supprimer">
                                                        <ActionIcon
                                                            variant="light"
                                                            size="sm"
                                                            color="red"
                                                            onClick={() => handleDelete(post.id)}
                                                        >
                                                            <LuTrash size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.Tbody>
                        </Table>
                    </Box>

                    {/* Pagination */}
                    {posts.meta.last_page > 1 && (
                        <Box mt="md">
                            <Flex justify="space-between" align="center">
                                <Text size="sm" c="dimmed">
                                    Affichage de{' '}
                                    {(posts.meta.current_page - 1) * posts.meta.per_page + 1} à{' '}
                                    {Math.min(
                                        posts.meta.current_page * posts.meta.per_page,
                                        posts.meta.total
                                    )}{' '}
                                    sur {posts.meta.total} résultats
                                </Text>
                                <Pagination
                                    total={posts.meta.last_page}
                                    value={posts.meta.current_page}
                                    onChange={(page) => {
                                        console.log('=== CHANGEMENT DE PAGE ===')
                                        console.log('Nouvelle page:', page)
                                        console.log('Filtres actuels:', localFilters)
                                        console.log('==========================')

                                        router.get(
                                            '/gmb-posts',
                                            {
                                                ...localFilters,
                                                page,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            }
                                        )
                                    }}
                                />
                            </Flex>
                        </Box>
                    )}
                </Card>
            </Stack>

            {/* Modal d'édition */}
            <EditPostModal
                post={editingPost}
                opened={editModalOpened}
                onClose={closeEditModal}
                filterOptions={filterOptions}
            />

            {/* Modal pour afficher la réponse du webhook n8n */}
            <Modal
                opened={showWebhookModal}
                onClose={() => setShowWebhookModal(false)}
                title="Réponse du webhook n8n"
                size="lg"
            >
                {webhookResponse && (
                    <Stack gap="md">
                        <Alert icon={<LuCheck size={16} />} title="Réponse reçue" color="blue">
                            Posts GMB traités par le webhook n8n
                        </Alert>

                        <Box>
                            <Text size="sm" fw={500} mb="xs">
                                Réponse complète :
                            </Text>
                            <Code block>{JSON.stringify(webhookResponse, null, 2)}</Code>
                        </Box>

                        <Group justify="flex-end">
                            <Button variant="light" onClick={() => setShowWebhookModal(false)}>
                                Fermer
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </>
    )
}
