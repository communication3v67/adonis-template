import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Flex,
    Group,
    Loader,
    Table,
    Text,
    Title,
} from '@mantine/core'
import { LuExternalLink, LuRefreshCw, LuSend } from 'react-icons/lu'
import { NotionPage } from '../../types'

interface NotionPagesTableProps {
    pages: NotionPage[]
    isRefreshing: boolean
    sendingWebhook: string | null
    sendingBulk: boolean
    error?: { message: string; details: string }
    onRefresh: () => void
    onSendAll: () => void
    onSendSingle: (page: NotionPage) => void
}

export const NotionPagesTable = ({
    pages,
    isRefreshing,
    sendingWebhook,
    sendingBulk,
    error,
    onRefresh,
    onSendAll,
    onSendSingle,
}: NotionPagesTableProps) => {
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
        <Card withBorder>
            <Group justify="space-between" mb="md">
                <Title order={3}>Opérations en attente de génération</Title>
                <Group>
                    <Button
                        variant="filled"
                        size="sm"
                        onClick={onSendAll}
                        loading={sendingBulk}
                        disabled={pages.length === 0 || sendingBulk || sendingWebhook !== null}
                        leftSection={<LuSend size={16} />}
                    >
                        {sendingBulk
                            ? `Envoi en cours...`
                            : `Envoyer tout vers n8n (${pages.length})`}
                    </Button>
                    <ActionIcon
                        variant="light"
                        onClick={onRefresh}
                        loading={isRefreshing}
                        title="Actualiser"
                    >
                        <LuRefreshCw size={16} />
                    </ActionIcon>
                    <Badge variant="light">
                        {pages.length} page{pages.length > 1 ? 's' : ''}
                    </Badge>
                </Group>
            </Group>

            {isRefreshing ? (
                <Flex justify="center" align="center" py="xl">
                    <Loader size="md" />
                    <Text ml="md">Chargement des donnees Notion...</Text>
                </Flex>
            ) : pages.length === 0 ? (
                <Text ta="center" py="xl" c="dimmed">
                    {error ? 'Impossible de charger les pages Notion' : 'Aucune page trouvée'}
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
                            {pages.slice(0, 10).map((page) => (
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
                                                onClick={() => onSendSingle(page)}
                                                loading={sendingWebhook === page.id}
                                                variant="light"
                                                color="blue"
                                                size="sm"
                                                title="Envoyer vers n8n"
                                                disabled={sendingWebhook !== null || sendingBulk}
                                            >
                                                <LuSend size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    {pages.length > 10 && (
                        <Text ta="center" mt="md" size="sm" c="dimmed">
                            ... et {pages.length - 10} autres pages
                        </Text>
                    )}
                </Box>
            )}
        </Card>
    )
}
