import { Head, Link } from '@inertiajs/react'
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Flex,
    Group,
    Loader,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core'
import { useState } from 'react'
import {
    LuBadgeAlert,
    LuCalendar,
    LuDatabase,
    LuExternalLink,
    LuFileText,
    LuPlus,
    LuRefreshCw,
    LuTrendingUp,
} from 'react-icons/lu'
interface NotionPage {
    id: string
    title: string
    url: string
    created_time: string
    last_edited_time: string
    properties: any
}
interface DatabaseInfo {
    title: string
    id: string
    url: string
    created_time: string
    last_edited_time: string
}
interface Stats {
    totalPages: number
    recentPages: number
}
interface Props {
    notionPages: NotionPage[]
    databaseInfo: DatabaseInfo | null
    stats: Stats
    error?: {
        message: string
        details: string
    }
}
export default function Home({ notionPages, databaseInfo, stats, error }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [localPages, setLocalPages] = useState(notionPages)
    const [localStats, setLocalStats] = useState(stats)

    // Fonction pour rafraichir les donnees Notion
    const refreshNotionData = async () => {
        setIsRefreshing(true)
        try {
            const response = await fetch('/api/notion-pages')
            const data = await response.json()

            if (data.success) {
                setLocalPages(data.data)
                setLocalStats({
                    totalPages: data.data.length,
                    recentPages: data.data.filter((page: NotionPage) => {
                        const createdDate = new Date(page.created_time)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return createdDate > weekAgo
                    }).length,
                })
            }
        } catch (error) {
            console.error('Erreur lors du rafraichissement:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Formatage des dates
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <>
            <Head title="Accueil - GMB & Notion" />

            <Stack gap="xl">
                {/* En-tete */}
                <Flex justify="space-between" align="center">
                    <Box>
                        <Title order={1}>Tableau de bord GMB & Notion</Title>
                        <Text size="lg" c="dimmed" mt="xs">
                            Gestion des posts GMB et synchronisation avec Notion
                        </Text>
                    </Box>
                    <Group>
                        <Button
                            component={Link}
                            href="/gmb-posts"
                            leftSection={<LuFileText size={16} />}
                        >
                            Posts GMB
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

                {/* Erreur Notion */}
                {error && (
                    <Alert
                        icon={<LuBadgeAlert size={16} />}
                        title="Erreur de connexion a Notion"
                        color="red"
                    >
                        <Text size="sm">{error.message}</Text>
                        <Text size="xs" c="dimmed" mt="xs">
                            {error.details}
                        </Text>
                    </Alert>
                )}

                {/* Statistiques */}
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                    <Card withBorder p="md">
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                                    Pages Notion
                                </Text>
                                <Text size="xl" fw={700}>
                                    {localStats.totalPages}
                                </Text>
                            </Box>
                            <LuDatabase size={24} style={{ color: '#228be6' }} />
                        </Group>
                    </Card>

                    <Card withBorder p="md">
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                                    Recentes (7j)
                                </Text>
                                <Text size="xl" fw={700}>
                                    {localStats.recentPages}
                                </Text>
                            </Box>
                            <LuCalendar size={24} style={{ color: '#40c057' }} />
                        </Group>
                    </Card>

                    <Card withBorder p="md">
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                                    Base de donnees
                                </Text>
                                <Text size="sm" fw={500}>
                                    {databaseInfo?.title || 'Non connectee'}
                                </Text>
                            </Box>
                            <LuTrendingUp size={24} style={{ color: '#fd7e14' }} />
                        </Group>
                    </Card>

                    <Card withBorder p="md">
                        <Group justify="space-between">
                            <Box>
                                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                                    Derniere sync
                                </Text>
                                <Text size="sm" fw={500}>
                                    {databaseInfo
                                        ? formatDate(databaseInfo.last_edited_time)
                                        : 'N/A'}
                                </Text>
                            </Box>
                            <ActionIcon
                                variant="light"
                                size="lg"
                                onClick={refreshNotionData}
                                loading={isRefreshing}
                            >
                                <LuRefreshCw size={16} />
                            </ActionIcon>
                        </Group>
                    </Card>
                </SimpleGrid>
                {/* Liste des pages Notion */}
                <Card withBorder>
                    <Group justify="space-between" mb="md">
                        <Title order={3}>Opérations en attente de génération</Title>
                        <Group>
                            <ActionIcon
                                variant="light"
                                onClick={refreshNotionData}
                                loading={isRefreshing}
                                title="Actualiser"
                            >
                                <LuRefreshCw size={16} />
                            </ActionIcon>
                            <Badge variant="light">
                                {localPages.length} page{localPages.length > 1 ? 's' : ''}
                            </Badge>
                        </Group>
                    </Group>

                    {isRefreshing ? (
                        <Flex justify="center" align="center" py="xl">
                            <Loader size="md" />
                            <Text ml="md">Chargement des donnees Notion...</Text>
                        </Flex>
                    ) : localPages.length === 0 ? (
                        <Text ta="center" py="xl" c="dimmed">
                            {error
                                ? 'Impossible de charger les pages Notion'
                                : 'Aucune page trouvee'}
                        </Text>
                    ) : (
                        <Box style={{ overflowX: 'auto' }}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Titre</Table.Th>
                                        <Table.Th>Creee le</Table.Th>
                                        <Table.Th>Modifiee le</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {localPages.slice(0, 10).map((page) => (
                                        <Table.Tr key={page.id}>
                                            <Table.Td>
                                                <Text fw={500}>{page.title}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {formatDate(page.created_time)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {formatDate(page.last_edited_time)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <ActionIcon
                                                    component="a"
                                                    href={page.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="light"
                                                    size="sm"
                                                    title="Ouvrir dans Notion"
                                                >
                                                    <LuExternalLink size={14} />
                                                </ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>

                            {localPages.length > 10 && (
                                <Text ta="center" mt="md" size="sm" c="dimmed">
                                    ... et {localPages.length - 10} autres pages
                                </Text>
                            )}
                        </Box>
                    )}
                </Card>

                {/* Informations de la base de donnees Notion */}
                {databaseInfo && (
                    <Card withBorder p="md">
                        <Group justify="space-between" mb="md">
                            <Title order={3}>Base de donnees Notion</Title>
                            <Button
                                component="a"
                                href={databaseInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="light"
                                size="sm"
                                rightSection={<LuExternalLink size={14} />}
                            >
                                Ouvrir dans Notion
                            </Button>
                        </Group>
                        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                            <Box>
                                <Text size="sm" fw={500} c="dimmed">
                                    Titre
                                </Text>
                                <Text size="sm">{databaseInfo.title}</Text>
                            </Box>
                            <Box>
                                <Text size="sm" fw={500} c="dimmed">
                                    Creee le
                                </Text>
                                <Text size="sm">{formatDate(databaseInfo.created_time)}</Text>
                            </Box>
                            <Box>
                                <Text size="sm" fw={500} c="dimmed">
                                    Modifiee le
                                </Text>
                                <Text size="sm">{formatDate(databaseInfo.last_edited_time)}</Text>
                            </Box>
                        </SimpleGrid>
                    </Card>
                )}
            </Stack>
        </>
    )
}
