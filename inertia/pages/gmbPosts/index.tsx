import { Head, Link, router, useForm } from '@inertiajs/react'
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Flex,
    Group,
    Menu,
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
    rem,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
    LuCheck,
    LuCopy,
    LuDownload,
    LuEye,
    LuMoveHorizontal,
    LuPlus,
    LuSave,
    LuSearch,
    LuSettings,
    LuTrash,
    LuTrendingUp,
    LuX
} from 'react-icons/lu'
import AppLayout from '../../layouts/app-layout/app-layout'

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
}

// Composant pour l'édition inline d'une cellule
function InlineEditCell({ 
    value, 
    field, 
    post, 
    type = 'text',
    options = [],
    filterOptions,
    onSave 
}: {
    value: string
    field: string
    post: GmbPost
    type?: 'text' | 'textarea' | 'select' | 'datetime-local'
    options?: { value: string, label: string }[]
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
                return filterOptions?.clients.map(client => ({ value: client, label: client })) || []
            case 'project_name':
                return filterOptions?.projects.map(project => ({ value: project, label: project })) || []
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
                        <Badge variant="outline" size="sm">{value}</Badge>
                    ) : field === 'text' ? (
                        <Tooltip label={value}>
                            <Text size="sm">{truncateTextInline(value)}</Text>
                        </Tooltip>
                    ) : field === 'date' ? (
                        <Text size="sm">{formatDateInline(value)}</Text>
                    ) : (
                        <Text size="sm">{value || '-'}</Text>
                    )}
                </Box>
                <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => setIsEditing(true)}
                    title={`Modifier ${field}`}
                >
                    <LuSettings size={12} />
                </ActionIcon>
            </Group>
        )
    }

    return (
        <Group gap={4} wrap="nowrap">
            <Box flex={1}>
                {type === 'select' ? (
                    <Select
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(val) => setEditValue(val || '')}
                        data={getSelectOptions()}
                        size="xs"
                        searchable={field === 'client' || field === 'project_name'}
                        onKeyDown={handleKeyDown}
                    />
                ) : type === 'textarea' ? (
                    <Textarea
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="xs"
                        autosize
                        minRows={1}
                        maxRows={3}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <TextInput
                        ref={inputRef as any}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="xs"
                        type={type}
                        onKeyDown={handleKeyDown}
                    />
                )}
            </Box>
            <ActionIcon
                size="xs"
                variant="subtle"
                color="green"
                onClick={handleSave}
                loading={isSaving}
                title="Sauvegarder"
            >
                <LuCheck size={12} />
            </ActionIcon>
            <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={handleCancel}
                title="Annuler"
            >
                <LuX size={12} />
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
function EditPostModal({ post, opened, onClose, filterOptions }: { 
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
    const changedFieldsCount = Object.keys(data).filter(key => isFieldChanged(key)).length

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!post) return

        // Comparer les données actuelles avec les originales
        const changedFields: any = {}
        Object.keys(data).forEach(key => {
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
            }
        })
    }

    if (!post) return null

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={(
                <Group>
                    <Text>Modifier le post</Text>
                    {changedFieldsCount > 0 && (
                        <Badge color="orange" variant="light">
                            {changedFieldsCount} champ(s) modifié(s)
                        </Badge>
                    )}
                </Group>
            )}
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
                                    backgroundColor: isFieldChanged('status') ? '#fff4e6' : undefined
                                }
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
                                    backgroundColor: isFieldChanged('date') ? '#fff4e6' : undefined
                                }
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
                                backgroundColor: isFieldChanged('text') ? '#fff4e6' : undefined
                            }
                        }}
                    />

                    <Group grow>
                        <Select
                            label="Client"
                            placeholder="Sélectionner un client"
                            data={filterOptions.clients.map(client => ({ value: client, label: client }))}
                            value={data.client}
                            onChange={(value) => setData('client', value || '')}
                            error={errors.client}
                            searchable
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('client') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('client') ? '#fff4e6' : undefined
                                }
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
                                    borderColor: isFieldChanged('project_name') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('project_name') ? '#fff4e6' : undefined
                                }
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
                                    backgroundColor: isFieldChanged('keyword') ? '#fff4e6' : undefined
                                }
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
                                    borderColor: isFieldChanged('image_url') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('image_url') ? '#fff4e6' : undefined
                                }
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
                                    backgroundColor: isFieldChanged('link_url') ? '#fff4e6' : undefined
                                }
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
                                    borderColor: isFieldChanged('location_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('location_id') ? '#fff4e6' : undefined
                                }
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
                                    borderColor: isFieldChanged('account_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('account_id') ? '#fff4e6' : undefined
                                }
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
                                    borderColor: isFieldChanged('notion_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('notion_id') ? '#fff4e6' : undefined
                                }
                            }}
                        />
                    </Group>

                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="light"
                            onClick={onClose}
                            leftSection={<LuX size={16} />}
                        >
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

export default function GmbPostsIndex({ posts, filters, filterOptions }: Props) {
    const [selectedPosts, setSelectedPosts] = useState<number[]>([])
    const [localFilters, setLocalFilters] = useState(filters)
    const [editingPost, setEditingPost] = useState<GmbPost | null>(null)
    const [editModalOpened, setEditModalOpened] = useState(false)
    
    // Hook pour gérer l'hydratation
    const [isClient, setIsClient] = useState(false)
    
    React.useEffect(() => {
        setIsClient(true)
        
        // Debug temporaire
        console.log('=== DEBUG FRONTEND ===')
        console.log('Posts reçus:', posts)
        if (posts.data && posts.data.length > 0) {
            console.log('Premier post:', posts.data[0])
            console.log('Clés du premier post:', Object.keys(posts.data[0]))
        }
        console.log('=====================')
    }, [])

    // Gestion de la sélection multiple
    const toggleSelectAll = () => {
        if (selectedPosts.length === posts.data.length) {
            setSelectedPosts([])
        } else {
            setSelectedPosts(posts.data.map(post => post.id))
        }
    }

    const toggleSelectPost = (postId: number) => {
        setSelectedPosts(prev =>
            prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
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
        router.get('/gmb-posts', localFilters, {
        preserveState: true,
        replace: true,
        })
    }

    const resetFilters = () => {
        const resetFilters = {
            search: '',
            status: '',
            client: '',
            project: '',
            sortBy: 'date',
            sortOrder: 'desc',
        }
        setLocalFilters(resetFilters)
        router.get('/gmb-posts', resetFilters, {
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

    // Actions individuelles
    const handleDelete = (postId: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
            router.delete(`/gmb-posts/${postId}`, {
                onSuccess: () => {
                    notifications.show({
                        title: 'Succès',
                        message: 'Post supprimé avec succès',
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

    const handleDuplicate = (postId: number) => {
        router.post(`/gmb-posts/${postId}/duplicate`, {}, {
            onSuccess: () => {
                notifications.show({
                    title: 'Succès',
                    message: 'Post dupliqué avec succès',
                    color: 'green',
                })
            },
        })
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
        <AppLayout>
            <Head title="Posts GMB" />

            <Stack gap="md">
                {/* En-tête */}
                <Flex justify="space-between" align="center">
                    <Title order={2}>Posts GMB</Title>
                    <Group>
                        <Button
                            component={Link}
                            href="/gmb-posts/stats"
                            variant="light"
                            leftSection={<LuTrendingUp size={16} />}
                        >
                            Statistiques
                        </Button>
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
                        <Text fw={500}>Filtres</Text>
                        <Group grow>
                            <TextInput
                                placeholder="Rechercher..."
                                leftSection={<LuSearch size={16} />}
                                value={localFilters.search}
                                onChange={(e) => setLocalFilters(prev => ({
                                    ...prev,
                                    search: e.target.value
                                }))}
                            />
                            <Select
                                placeholder="Statut"
                                data={[
                                    { value: '', label: 'Tous les statuts' },
                                    ...filterOptions.statuses.map(status => ({
                                        value: status,
                                        label: status
                                    }))
                                ]}
                                value={localFilters.status}
                                onChange={(value) => setLocalFilters(prev => ({
                                    ...prev,
                                    status: value || ''
                                }))}
                            />
                            <Select
                                placeholder="Client"
                                data={[
                                    { value: '', label: 'Tous les clients' },
                                    ...filterOptions.clients.map(client => ({
                                        value: client,
                                        label: client
                                    }))
                                ]}
                                value={localFilters.client}
                                onChange={(value) => setLocalFilters(prev => ({
                                    ...prev,
                                    client: value || ''
                                }))}
                            />
                            <Select
                                placeholder="Projet"
                                data={[
                                    { value: '', label: 'Tous les projets' },
                                    ...filterOptions.projects.map(project => ({
                                        value: project,
                                        label: project
                                    }))
                                ]}
                                value={localFilters.project}
                                onChange={(value) => setLocalFilters(prev => ({
                                    ...prev,
                                    project: value || ''
                                }))}
                            />
                        </Group>
                        <Group>
                            <Button onClick={applyFilters}>Appliquer</Button>
                            <Button variant="light" onClick={resetFilters}>
                                Réinitialiser
                            </Button>
                        </Group>
                    </Stack>
                </Card>

                {/* Actions en masse */}
                {selectedPosts.length > 0 && (
                    <Card withBorder p="md" bg="blue.0">
                        <Group justify="space-between">
                            <Text>
                                {selectedPosts.length} post(s) sélectionné(s)
                            </Text>
                            <Button
                                color="red"
                                variant="light"
                                size="sm"
                                onClick={handleBulkDelete}
                            >
                                Supprimer la sélection
                            </Button>
                        </Group>
                    </Card>
                )}

                {/* Tableau */}
                <Card withBorder>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={40}>
                                    <Checkbox
                                        checked={selectedPosts.length === posts.data.length && posts.data.length > 0}
                                        indeterminate={selectedPosts.length > 0 && selectedPosts.length < posts.data.length}
                                        onChange={toggleSelectAll}
                                    />
                                </Table.Th>
                                <Table.Th>Statut</Table.Th>
                                <Table.Th>Texte</Table.Th>
                                <Table.Th>Client</Table.Th>
                                <Table.Th>Projet</Table.Th>
                                <Table.Th>Date</Table.Th>
                                <Table.Th>Mot-clé</Table.Th>
                                <Table.Th w={120}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {posts.data.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={8}>
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
                                            <Group gap={4}>
                                                <Tooltip label="Voir">
                                                    <ActionIcon
                                                        component={Link}
                                                        href={`/gmb-posts/${post.id}`}
                                                        variant="light"
                                                        size="sm"
                                                    >
                                                        <LuEye size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Modifier">
                                                    <ActionIcon
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => handleEdit(post)}
                                                    >
                                                        <LuSettings size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Menu position="bottom-end">
                                                    <Menu.Target>
                                                        <ActionIcon variant="light" size="sm">
                                                            <LuMoveHorizontal size={16} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item
                                                            leftSection={<LuCopy style={{ width: rem(14), height: rem(14) }} />}
                                                            onClick={() => handleDuplicate(post.id)}
                                                        >
                                                            Dupliquer
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            color="red"
                                                            leftSection={<LuTrash style={{ width: rem(14), height: rem(14) }} />}
                                                            onClick={() => handleDelete(post.id)}
                                                        >
                                                            Supprimer
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            )}
                        </Table.Tbody>
                    </Table>

                    {/* Pagination */}
                    {posts.meta.last_page > 1 && (
                        <Box mt="md">
                            <Flex justify="space-between" align="center">
                                <Text size="sm" c="dimmed">
                                    Affichage de {((posts.meta.current_page - 1) * posts.meta.per_page) + 1} à{' '}
                                    {Math.min(posts.meta.current_page * posts.meta.per_page, posts.meta.total)} sur{' '}
                                    {posts.meta.total} résultats
                                </Text>
                                <Pagination
                                    total={posts.meta.last_page}
                                    value={posts.meta.current_page}
                                    onChange={(page) => {
                                        router.get('/gmb-posts', {
                                        ...localFilters,
                                        page
                                        }, {
                                        preserveState: true,
                                        replace: true,
                                        })
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
        </AppLayout>
    )
}
