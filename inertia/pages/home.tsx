import { Head } from '@inertiajs/react'
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Code,
    Flex,
    Group,
    Loader,
    Modal,
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
    LuCheck,
    LuDatabase,
    LuExternalLink,
    LuRefreshCw,
    LuSend,
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
    userDatabase?: string
    userNotionId?: string | null
    hasNotionId?: boolean
    error?: {
        message: string
        details: string
    }
}

export default function Home({
    notionPages,
    databaseInfo,
    stats,
    userDatabase,
    userNotionId,
    hasNotionId,
    error,
}: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [localPages, setLocalPages] = useState(notionPages)
    const [localStats, setLocalStats] = useState(stats)
    const [sendingWebhook, setSendingWebhook] = useState<string | null>(null)
    const [webhookResponse, setWebhookResponse] = useState<any>(null)
    const [showResponseModal, setShowResponseModal] = useState(false)
    const [processingCount, setProcessingCount] = useState(0)
    const [sendingBulk, setSendingBulk] = useState(false)

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

    // Fonction pour envoyer UNE page vers n8n
    const sendToN8n = async (page: NotionPage) => {
        setSendingWebhook(page.id)
        setWebhookResponse(null)

        try {
            console.log('🚀 Envoi webhook pour:', page.title)

            // Récupération du token CSRF
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content')
            console.log('🔐 CSRF Token trouvé:', csrfToken ? 'OUI' : 'NON')

            if (!csrfToken) {
                throw new Error('Token CSRF manquant. Actualisez la page.')
            }

            const response = await fetch('/webhook/n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    id: page.id,
                    title: page.title,
                    url: page.url,
                    created_time: page.created_time,
                    last_edited_time: page.last_edited_time,
                    properties: page.properties,
                }),
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
            setShowResponseModal(true)
        } catch (error) {
            console.error('🚨 Erreur complète webhook:', error)

            let errorMessage = 'Erreur inconnue'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            alert(`❌ Erreur: ${errorMessage}`)
        } finally {
            setSendingWebhook(null)
        }
    }

    // Fonction pour envoyer TOUTES les pages vers n8n
    const sendAllToN8n = async () => {
        if (localPages.length === 0) {
            alert('❌ Aucune page à envoyer')
            return
        }

        setSendingBulk(true)
        setWebhookResponse(null)
        setProcessingCount(0)

        try {
            console.log(`🚀 Envoi de ${localPages.length} pages vers n8n`)

            // Récupération du token CSRF
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content')
            console.log('🔐 CSRF Token trouvé:', csrfToken ? 'OUI' : 'NON')

            if (!csrfToken) {
                throw new Error('Token CSRF manquant. Actualisez la page.')
            }

            // Préparation des données pour l'envoi groupé
            const allPagesData = localPages.map((page) => ({
                id: page.id,
                title: page.title,
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time,
                properties: page.properties,
            }))

            const response = await fetch('/webhook/n8n-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    pages: allPagesData,
                    total_count: allPagesData.length,
                }),
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
            setShowResponseModal(true)

            // Message de succès
            alert(`✅ ${localPages.length} pages envoyées avec succès vers n8n !`)
        } catch (error) {
            console.error('🚨 Erreur complète webhook:', error)

            let errorMessage = 'Erreur inconnue'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            alert(`❌ Erreur lors de l'envoi global: ${errorMessage}`)
        } finally {
            setSendingBulk(false)
            setProcessingCount(0)
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
                </Flex>

                {/* Alerte si l'utilisateur n'a pas de notionId */}
                {!hasNotionId && (
                    <Alert
                        icon={<LuBadgeAlert size={16} />}
                        title="Configuration Notion manquante"
                        color="orange"
                    >
                        <Text size="sm">
                            Votre compte n'est pas encore lié à un référenceur Notion. Contactez
                            l'administrateur pour configurer votre accès.
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                            Base de données utilisée : {userDatabase} | Notion ID :{' '}
                            {userNotionId || 'Non défini'}
                        </Text>
                    </Alert>
                )}

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

                {/* Liste des pages Notion */}
                <Card withBorder>
                    <Group justify="space-between" mb="md">
                        <Title order={3}>Opérations en attente de génération</Title>
                        <Group>
                            <Button
                                variant="filled"
                                size="sm"
                                onClick={sendAllToN8n}
                                loading={sendingBulk}
                                disabled={
                                    localPages.length === 0 ||
                                    sendingBulk ||
                                    sendingWebhook !== null
                                }
                                leftSection={<LuSend size={16} />}
                            >
                                {sendingBulk
                                    ? `Envoi en cours...`
                                    : `Envoyer tout vers n8n (${localPages.length})`}
                            </Button>
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
                                                <Group gap="xs">
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
                                                    <ActionIcon
                                                        onClick={() => sendToN8n(page)}
                                                        loading={sendingWebhook === page.id}
                                                        variant="light"
                                                        color="blue"
                                                        size="sm"
                                                        title="Envoyer vers n8n"
                                                        disabled={
                                                            sendingWebhook !== null || sendingBulk
                                                        }
                                                    >
                                                        <LuSend size={14} />
                                                    </ActionIcon>
                                                </Group>
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

                {/* Modal pour afficher la réponse de Notion */}
                <Modal
                    opened={showResponseModal}
                    onClose={() => setShowResponseModal(false)}
                    title="Réponse de n8n/Notion"
                    size="lg"
                >
                    {webhookResponse && (
                        <Stack gap="md">
                            <Alert icon={<LuCheck size={16} />} title="Réponse reçue" color="blue">
                                Données traitées par le webhook n8n
                            </Alert>

                            <Box>
                                <Text size="sm" fw={500} mb="xs">
                                    Réponse complète :
                                </Text>
                                <Code block>{JSON.stringify(webhookResponse, null, 2)}</Code>
                            </Box>

                            <Group justify="flex-end">
                                <Button variant="light" onClick={() => setShowResponseModal(false)}>
                                    Fermer
                                </Button>
                            </Group>
                        </Stack>
                    )}
                </Modal>
            </Stack>
        </>
    )
}
