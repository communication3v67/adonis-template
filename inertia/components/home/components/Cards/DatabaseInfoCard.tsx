import { Box, Button, Card, Group, SimpleGrid, Text, Title } from '@mantine/core'
import { LuExternalLink } from 'react-icons/lu'
import { DatabaseInfo } from '../../types'

interface DatabaseInfoCardProps {
    databaseInfo: DatabaseInfo | null
}

export const DatabaseInfoCard = ({ databaseInfo }: DatabaseInfoCardProps) => {
    if (!databaseInfo) return null

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
    )
}
