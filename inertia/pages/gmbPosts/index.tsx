import { useState } from 'react'
import * as React from 'react'
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
import {
    LuMoveHorizontal,
    LuSettings,
    LuEye,
    LuPlus,
    LuSearch,
    LuTrash,
    LuCopy,
    LuDownload,
    LuTrendingUp,
    LuSave,
    LuX,
} from 'react-icons/lu'
import { notifications } from '@mantine/notifications'
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
                                { value: 'draft', label: 'Brouillon' },
                                { value: 'published', label: 'Publié' },
                                { value: 'scheduled', label: 'Programmé' },
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

    // Badge de statut
    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'gray',
            published: 'green',
            scheduled: 'blue',
            failed: 'red',
        }
        const labels: Record<string, string> = {
            draft: 'Brouillon',
            published: 'Publié',
            scheduled: 'Programmé',
            failed: 'Échec',
        }
        return (
            <Badge color={colors[status] || 'gray'} variant="light">
                {labels[status] || status}
            </Badge>
        )
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

    // Tronquer le texte
    const truncateText = (text: string, maxLength: number = 50) => {
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
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
                                            {getStatusBadge(post.status)}
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label={post.text}>
                                                <Text size="sm">
                                                    {truncateText(post.text)}
                                                </Text>
                                            </Tooltip>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>
                                                {post.client}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">
                                                {post.project_name}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">
                                                {formatDate(post.date)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {post.keyword && (
                                                <Badge variant="outline" size="sm">
                                                    {post.keyword}
                                                </Badge>
                                            )}
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
